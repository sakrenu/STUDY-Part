from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from io import BytesIO
from PIL import Image
import cloudinary
import cloudinary.uploader
import os
import uuid
import logging
from typing import List, Optional, Dict
from sam import Segmenter
from dotenv import load_dotenv
from routes.deprecated_app import deprecated_router
from routes.rag_routes import router as rag_router
import PyPDF2
import pytesseract
from pptx import Presentation
import tempfile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import shutil

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the deprecated router
app.include_router(
    deprecated_router,
    prefix="/v1",
    tags=["deprecated"],
    responses={404: {"description": "Not found"}}
)

# Include the RAG router with proper configuration
app.include_router(
    rag_router,
    tags=["RAG"],
    responses={
        404: {"description": "Not found"},
        500: {"description": "Internal server error"}
    }
)

# Add deprecation warning middleware
@app.middleware("http")
async def add_deprecation_header(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/v1/deprecated"):
        response.headers["Warning"] = '299 - "This endpoint is deprecated and will be removed in future versions"'
    return response

# Initialize SAM segmenter
try:
    checkpoint_path = os.path.join(os.path.dirname(__file__), "sam_vit_b_01ec64.pth")
    logger.info(f"Loading SAM model from {checkpoint_path}")
    segmenter = Segmenter(checkpoint=checkpoint_path)
    logger.info("SAM segmenter initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Segmenter: {str(e)}")
    raise

# In-memory storage for images (use a database in production)
image_storage = {}

# Pydantic model for /segment request body
class SegmentRequest(BaseModel):
    image_id: str
    box: Optional[List[float]] = None
    points: Optional[List[List[float]]] = None
    labels: Optional[List[int]] = None

# Initialize text splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)

# Initialize embeddings using HuggingFace
cache_dir = os.path.join(os.path.dirname(__file__), 'model_cache')
os.makedirs(cache_dir, exist_ok=True)

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={
        'normalize_embeddings': True,
        'batch_size': 32
    },
    cache_folder=cache_dir
)

@app.get("/health")
async def health_check():
    logger.info("Health check requested")
    return {"status": "healthy", "message": "Server is running"}

@app.post("/upload")
async def deprecated_upload():
    logger.warning("Received request to deprecated /upload endpoint")
    return RedirectResponse(url="/upload_image", status_code=307)

@app.post("/upload_image")
async def upload_image(file: UploadFile = File(...)):
    try:
        logger.info(f"Received upload request for file: {file.filename}")
        # Read and process image
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
        image_np = np.array(image)

        # Generate embeddings
        image_id = str(uuid.uuid4())
        logger.info(f"Generating embeddings for image_id: {image_id}")
        segmenter.set_image(image_np)
        image_storage[image_id] = {
            "image": image_np,
            "embeddings": segmenter.get_embedding()
        }

        # Configure Cloudinary
        try:
            cloudinary.config(
                cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "your_cloud_name"),
                api_key=os.getenv("CLOUDINARY_API_KEY", "your_api_key"),
                api_secret=os.getenv("CLOUDINARY_API_SECRET", "your_api_secret")
            )
            image_buffer = BytesIO()
            image.save(image_buffer, format="PNG")
            image_buffer.seek(0)
            logger.info(f"Uploading image to Cloudinary for image_id: {image_id}")
            upload_result = cloudinary.uploader.upload(
                image_buffer,
                public_id=f"lessons/{image_id}/original",
                resource_type="image"
            )
            logger.info(f"Image uploaded to Cloudinary: {upload_result['secure_url']}")
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Cloudinary error: {str(e)}")

        return {
            "image_id": image_id,
            "image_url": upload_result["secure_url"],
            "width": image_np.shape[1],
            "height": image_np.shape[0]
        }
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@app.post("/segment")
async def segment(request: SegmentRequest):
    try:
        image_id = request.image_id
        box = request.box
        points = request.points
        labels = request.labels
        logger.info(f"Received /segment request: {{ 'image_id': '{image_id}', 'box': {box}, 'points': {points}, 'labels': {labels} }}")
        if not image_id or not isinstance(image_id, str) or image_id.strip() == '':
            logger.error("Invalid or missing image_id")
            raise HTTPException(status_code=422, detail="image_id must be a non-empty string")
        if image_id not in image_storage:
            logger.error(f"Image not found: {image_id}")
            raise HTTPException(status_code=404, detail="Image not found")
        if box and (len(box) != 4 or not all(isinstance(x, (int, float)) for x in box)):
            logger.error(f"Invalid box format: {box}")
            raise HTTPException(status_code=422, detail="box must be a list of 4 numbers")
        if points and labels and len(points) != len(labels):
            logger.error(f"Mismatched points and labels: {len(points)} points, {len(labels)} labels")
            raise HTTPException(status_code=422, detail="points and labels must have the same length")
        if points and not all(len(p) == 2 and all(isinstance(x, (int, float)) for x in p) for p in points):
            logger.error(f"Invalid points format: {points}")
            raise HTTPException(status_code=422, detail="points must be a list of [x, y] coordinates")
        if labels and not all(isinstance(l, int) for l in labels):
            logger.error(f"Invalid labels format: {labels}")
            raise HTTPException(status_code=422, detail="labels must be a list of integers")

        image_np = image_storage[image_id]["image"]

        # Perform segmentation
        logger.info("Performing segmentation")
        masks, scores = segmenter.predict(
            image=image_np,
            box=box,
            points=points,
            labels=labels
        )

        # Process masks and cutouts
        regions = []
        lesson_id = str(uuid.uuid4())
        for i, mask in enumerate(masks):
            # Define color palette
            colors = [
                (255, 0, 0),     # Red
                (0, 255, 0),     # Green
                (0, 0, 255),     # Blue
                (255, 255, 0),   # Yellow
                (255, 0, 255),   # Magenta
                (0, 255, 255),   # Cyan
                (255, 165, 0),   # Orange
                (128, 0, 128)    # Purple
            ]
            color = colors[i % len(colors)]

            # Generate RGBA mask image
            rgba_mask = np.zeros((*mask.shape, 4), dtype=np.uint8)
            rgba_mask[:, :, 0] = mask.astype(np.uint8) * color[0]  # R
            rgba_mask[:, :, 1] = mask.astype(np.uint8) * color[1]  # G
            rgba_mask[:, :, 2] = mask.astype(np.uint8) * color[2]  # B
            rgba_mask[:, :, 3] = mask.astype(np.uint8) * 255       # A (fully opaque where mask=1)

            mask_img = Image.fromarray(rgba_mask, mode='RGBA')
            mask_buffer = BytesIO()
            mask_img.save(mask_buffer, format="PNG")
            mask_buffer.seek(0)

            mask_upload = cloudinary.uploader.upload(
                mask_buffer,
                public_id=f"lessons/{image_id}/masks/{lesson_id}_{i}",
                resource_type="image"
            )

            # Create cutout
            cutout = image_np.copy()
            cutout[~mask] = 0
            cutout_img = Image.fromarray(cutout)
            cutout_buffer = BytesIO()
            cutout_img.save(cutout_buffer, format="PNG")
            cutout_buffer.seek(0)

            cutout_upload = cloudinary.uploader.upload(
                cutout_buffer,
                public_id=f"lessons/{image_id}/cutouts/{lesson_id}_{i}",
                resource_type="image"
            )

            # Calculate position in expected format
            if box:
                position = {
                    "x": box[0],
                    "y": box[1],
                    "width": box[2] - box[0],
                    "height": box[3] - box[1]
                }
            else:
                coords = np.where(mask)
                if len(coords[0]) > 0:
                    position = {
                        "x": float(coords[1].min()),
                        "y": float(coords[0].min()),
                        "width": float(coords[1].max() - coords[1].min()),
                        "height": float(coords[0].max() - coords[0].min())
                    }
                else:
                    position = {"x": 0, "y": 0, "width": 0, "height": 0}

            regions.append({
                "region_id": f"{lesson_id}_{i}",
                "lesson_id": lesson_id,
                "mask_url": mask_upload["secure_url"],
                "cutout_url": cutout_upload["secure_url"],
                "position": position,
                "score": float(scores[i]),
                "teacher_email": None
            })

        logger.info(f"Segmentation completed for lesson_id: {lesson_id}")
        return {
            "image_id": image_id,
            "lesson_id": lesson_id,
            "regions": regions
        }
    except HTTPException as e:
        logger.error(f"HTTP error during segmentation: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during segmentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to segment: {str(e)}")

# RAG Functionality
async def process_text_to_vectors(text: str, user_id: str) -> Dict:
    """Process text into chunks and create vector store"""
    try:
        # Split text into chunks
        chunks = text_splitter.split_text(text)
        
        # Create vector store
        vectorstore = FAISS.from_texts(chunks, embeddings)
        
        # Save the vector store
        os.makedirs(f"vector_stores/{user_id}", exist_ok=True)
        vectorstore.save_local(f"vector_stores/{user_id}/vectors")
        
        return {"status": "success", "chunks": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing text: {str(e)}")

@app.post("/api/rag/process_pdf")
async def process_pdf(file: UploadFile = File(...), user_id: str = None):
    """Process PDF files and extract text"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        # Read PDF content
        pdf_content = await file.read()
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        # Process text to vectors
        if user_id:
            await process_text_to_vectors(text, user_id)
        
        return {"content": text, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.post("/api/rag/process_ppt")
async def process_ppt(file: UploadFile = File(...), user_id: str = None):
    """Process PowerPoint files and extract text"""
    if not file.filename.endswith(('.ppt', '.pptx')):
        raise HTTPException(status_code=400, detail="File must be a PowerPoint presentation")
    
    try:
        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename[-5:]) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name
        
        # Process the PowerPoint
        prs = Presentation(temp_path)
        text = ""
        
        # Extract text from all slides
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
        
        # Clean up temporary file
        os.unlink(temp_path)
        
        # Process text to vectors
        if user_id:
            await process_text_to_vectors(text, user_id)
        
        return {"content": text, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PowerPoint: {str(e)}")

@app.post("/api/rag/process_image")
async def process_image(file: UploadFile = File(...), user_id: str = None):
    """Process image files using OCR"""
    allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="File must be an image (PNG, JPG, JPEG, GIF)")
    
    try:
        # Read image content
        image_content = await file.read()
        image = Image.open(io.BytesIO(image_content))
        
        # Perform OCR
        text = pytesseract.image_to_string(image)
        
        # Process text to vectors
        if user_id:
            await process_text_to_vectors(text, user_id)
        
        return {"content": text, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/api/rag/query_notes")
async def query_notes(user_id: str, query: str):
    """Query the vector store for relevant information"""
    try:
        # Load the vector store
        if not os.path.exists(f"vector_stores/{user_id}/vectors"):
            raise HTTPException(status_code=404, detail="No notes found for this user")
        
        vectorstore = FAISS.load_local(f"vector_stores/{user_id}/vectors", embeddings)
        
        # Perform similarity search
        docs = vectorstore.similarity_search(query, k=3)
        
        # Format response
        response = "\n\n".join([doc.page_content for doc in docs])
        
        return {"response": response, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying notes: {str(e)}")