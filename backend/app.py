from fastapi import FastAPI, File, UploadFile, HTTPException, Form
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
import random
import logging
from typing import List, Optional, Dict
from sam import Segmenter
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import faiss
from gemini_service import generate_notes_with_gemini
from huggingface_hub import login
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

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
    prefix="",  # Empty prefix to respect the router's own prefix
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

try:
    checkpoint_path = os.path.join(os.path.dirname(__file__), "sam_vit_b_01ec64.pth")
    logger.info(f"Loading SAM model from {checkpoint_path}")
    segmenter = Segmenter(checkpoint=checkpoint_path)
    logger.info("SAM segmenter initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Segmenter: {str(e)}")
    raise

try:
    hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
    if hf_token:
        login(token=hf_token)
    os.environ["HF_HOME"] = os.path.expanduser("~/.cache/huggingface")
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("SentenceTransformer initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize SentenceTransformer: {str(e)}")
    raise

dimension = 384
faiss_index = faiss.IndexFlatL2(dimension)

image_storage = {}
rag_storage = {}

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
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
        image_np = np.array(image)

        image_id = str(uuid.uuid4())
        logger.info(f"Generating embeddings for image_id: {image_id}")
        segmenter.set_image(image_np)
        image_storage[image_id] = {
            "image": image_np,
            "embeddings": segmenter.get_embedding()
        }

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
        masks, scores = segmenter.predict(
            image=image_np,
            box=box,
            points=points,
            labels=labels
        )

        regions = []
        lesson_id = str(uuid.uuid4())
        for i, mask in enumerate(masks):
            colors = [
                (255, 0, 0),
                (0, 255, 0),
                (0, 0, 255),
                (255, 255, 0),
                (255, 0, 255),
                (0, 255, 255),
                (255, 165, 0),
                (128, 0, 128)
            ]
            
            
            color = random.choice(colors)


            rgba_mask = np.zeros((*mask.shape, 4), dtype=np.uint8)
            rgba_mask[:, :, 0] = mask.astype(np.uint8) * color[0]
            rgba_mask[:, :, 1] = mask.astype(np.uint8) * color[1]
            rgba_mask[:, :, 2] = mask.astype(np.uint8) * color[2]
            rgba_mask[:, :, 3] = mask.astype(np.uint8) * 255

            mask_img = Image.fromarray(rgba_mask, mode='RGBA')
            mask_buffer = BytesIO()
            mask_img.save(mask_buffer, format="PNG")
            mask_buffer.seek(0)

            mask_upload = cloudinary.uploader.upload(
                mask_buffer,
                public_id=f"lessons/{image_id}/masks/{lesson_id}_{i}",
                resource_type="image"
            )

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

@app.post("/upload_document")
async def upload_document(file: UploadFile = File(...), lesson_id: str = Form(...)):
    try:
        logger.info(f"Received document upload request for lesson_id: {lesson_id}")
        if file.content_type not in ['application/pdf', 'text/plain']:
            logger.error(f"Invalid file type: {file.content_type}")
            raise HTTPException(status_code=422, detail="Only PDF or TXT files are allowed")

        contents = await file.read()
        text = ""
        if file.content_type == 'application/pdf':
            try:
                pdf_reader = PyPDF2.PdfReader(BytesIO(contents))
                for page in pdf_reader.pages:
                    extracted_text = page.extract_text()
                    if extracted_text:
                        text += extracted_text
            except Exception as e:
                logger.error(f"Failed to extract text from PDF: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")
        else:
            try:
                text = contents.decode('utf-8')
            except Exception as e:
                logger.error(f"Failed to decode text file: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to process text file: {str(e)}")

        document_id = str(uuid.uuid4())
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "your_cloud_name"),
            api_key=os.getenv("CLOUDINARY_API_KEY", "your_api_key"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET", "your_api_secret")
        )
        file.file.seek(0)
        try:
            upload_result = cloudinary.uploader.upload(
                file.file,
                public_id=f"lessons/{lesson_id}/documents/{document_id}",
                resource_type="raw"
            )
        except Exception as e:
            logger.error(f"Failed to upload document to Cloudinary: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload document to Cloudinary: {str(e)}")

        sentences = [s.strip() for s in text.split('. ') if s.strip()]
        if not sentences:
            logger.warning(f"No sentences extracted from document for lesson_id: {lesson_id}")
        try:
            embeddings = embedder.encode(sentences)
            faiss_index.add(np.array(embeddings, dtype=np.float32))
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")

        if lesson_id not in rag_storage:
            rag_storage[lesson_id] = []
        rag_storage[lesson_id].append({
            "document_id": document_id,
            "sentences": sentences,
            "embeddings": embeddings,
            "url": upload_result["secure_url"]
        })

        logger.info(f"Document uploaded and processed for lesson_id: {lesson_id}")
        return {"document_id": document_id, "url": upload_result["secure_url"]}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Unexpected error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@app.post("/generate_notes")
async def generate_notes(
    region_id: str = Form(...),
    mask_url: str = Form(...),
    base_image_url: str = Form(...),
    use_image: bool = Form(...),
    custom_prompt: Optional[str] = Form(None),
    document: Optional[UploadFile] = File(None)
):
    try:
        logger.info(f"Generating notes for region_id: {region_id}")
        
        # Validate inputs
        if not region_id or not isinstance(region_id, str) or region_id.strip() == '':
            logger.error("Invalid or missing region_id")
            raise HTTPException(status_code=422, detail="region_id must be a non-empty string")
        if not mask_url or not isinstance(mask_url, str):
            logger.error("Invalid or missing mask_url")
            raise HTTPException(status_code=422, detail="mask_url must be a valid URL")
        if not base_image_url or not isinstance(base_image_url, str):
            logger.error("Invalid or missing base_image_url")
            raise HTTPException(status_code=422, detail="base_image_url must be a valid URL")

        context = ""
        if document:
            lesson_id = region_id.split('_')[0]
            if not lesson_id:
                logger.error("Invalid region_id format, cannot extract lesson_id")
                raise HTTPException(status_code=422, detail="Invalid region_id format")
            try:
                await upload_document(document, lesson_id)
            except Exception as e:
                logger.error(f"Failed to upload document for lesson_id {lesson_id}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")
            
            if lesson_id in rag_storage and rag_storage[lesson_id]:
                try:
                    query_embedding = embedder.encode("Describe the segment in the context of the lesson")
                    D, I = faiss_index.search(np.array([query_embedding], dtype=np.float32), k=5)
                    context = ". ".join([
                        rag_storage[lesson_id][-1]["sentences"][i]
                        for i in I[0] if i < len(rag_storage[lesson_id][-1]["sentences"])
                    ])
                    logger.info(f"RAG context generated for lesson_id: {lesson_id}")
                except Exception as e:
                    logger.error(f"Failed to generate RAG context: {str(e)}")
                    raise HTTPException(status_code=500, detail=f"Failed to generate RAG context: {str(e)}")
            else:
                logger.warning(f"No RAG data available for lesson_id: {lesson_id}")
        
        try:
            notes, composite_image_url = await generate_notes_with_gemini(
                region_id=region_id,
                mask_url=mask_url,
                base_image_url=base_image_url,
                use_image=use_image,
                context=context,
                custom_prompt=custom_prompt
            )
        except Exception as e:
            logger.error(f"Failed to generate notes with Gemini: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to generate notes with Gemini: {str(e)}")

        logger.info(f"Notes generated successfully for region_id: {region_id}")
        return {
            "notes": notes,
            "composite_image_url": composite_image_url
        }
    except HTTPException as e:
        logger.error(f"HTTP error in generate_notes: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in generate_notes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate notes: {str(e)}")

@app.post("/upload_audio")
async def upload_audio(file: UploadFile = File(...)):
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
            api_key=os.getenv('CLOUDINARY_API_KEY'),
            api_secret=os.getenv('CLOUDINARY_API_SECRET')
        )

        if file.filename == '':
            raise HTTPException(status_code=400, detail="No selected file")

        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file.file,
            resource_type="auto",
            folder="audio_notes"
        )

        return {"success": True, "url": result['secure_url']}
    except Exception as e:
        logger.error(f"Error uploading audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading audio: {str(e)}")

@app.post("/api/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    try:
        logger.info(f"Received audio upload request")
        if not file:
            logger.error("No file provided")
            raise HTTPException(status_code=400, detail="No file provided")

        # Configure Cloudinary
        cloudinary.config(
            cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
            api_key=os.getenv('CLOUDINARY_API_KEY'),
            api_secret=os.getenv('CLOUDINARY_API_SECRET')
        )

        # Read file contents
        contents = await file.read()
        
        # Upload to Cloudinary
        try:
            result = cloudinary.uploader.upload(
                contents,
                resource_type="video",  # Use video for audio files
                folder="audio_notes",
                public_id=f"audio_{uuid.uuid4()}",
                format="mp3"  # Convert to mp3 format
            )
            logger.info(f"Audio uploaded successfully to Cloudinary")
            return {"url": result['secure_url']}
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to upload to Cloudinary: {str(e)}")

    except Exception as e:
        logger.error(f"Error in upload_audio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint to save lesson to course with all features
class SaveLessonRequest(BaseModel):
    teacher_id: str
    course_id: str
    lesson_data: dict
    original_image_url: str
    image_id: str

@app.post("/save_lesson_to_course")
async def save_lesson_to_course(request: SaveLessonRequest):
    try:
        logger.info(f"Saving lesson to course for teacher: {request.teacher_id}, course: {request.course_id}")
        
        # Generate a unique lesson ID if not provided
        lesson_id = request.lesson_data.get('lessonId') or str(uuid.uuid4())
        
        # Create a thumbnail image for the library listing
        try:
            cloudinary.config(
                cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "your_cloud_name"),
                api_key=os.getenv("CLOUDINARY_API_KEY", "your_api_key"),
                api_secret=os.getenv("CLOUDINARY_API_SECRET", "your_api_secret")
            )
            
            # Create a thumbnail with highlighted segments overlaid
            transformation = [
                {"width": 400, "height": 300, "crop": "fill"},
                {"quality": "auto", "fetch_format": "auto"}
            ]
            
            thumbnail_result = cloudinary.uploader.upload(
                request.original_image_url,
                public_id=f"lessons/{lesson_id}/thumbnail",
                transformation=transformation
            )
            
            thumbnail_url = thumbnail_result["secure_url"]
            logger.info(f"Thumbnail created: {thumbnail_url}")
        except Exception as e:
            logger.error(f"Failed to create thumbnail: {str(e)}")
            thumbnail_url = request.original_image_url
        
        # Create a preview image that shows all segments for library display
        preview_url = request.original_image_url
        
        # Extract and format regions data
        regions = []
        for region in request.lesson_data.get("regions", []):
            region_data = {
                "region_id": region.get("region_id"),
                "segmentIndex": region.get("segmentIndex", 0),
                "mask_url": region.get("mask_url", ""),
                "cutout_url": region.get("cutout_url", ""),
                "position": region.get("position", {}),
                "notes": region.get("notes", ""),
                "audioUrl": region.get("audioUrl"),
                "label": region.get("label", ""),
                "annotation": region.get("annotation", {})
            }
            regions.append(region_data)
        
        # Format timestamp for Firestore
        import datetime
        current_time = datetime.datetime.now().isoformat()
        
        # Lesson document data
        lesson_doc = {
            "id": lesson_id,
            "teacher_id": request.teacher_id,
            "course_id": request.course_id,
            "title": f"Lesson {current_time.split('T')[0]}",
            "description": f"Interactive lesson created on {current_time.split('T')[0]}",
            "createdAt": current_time,
            "originalImageUrl": request.original_image_url,
            "previewUrl": preview_url,
            "thumbnailUrl": thumbnail_url,
            "imageId": request.image_id,
            "segmentCount": len(regions),
            "hasNotes": any(region.get("notes") for region in regions),
            "hasLabels": any(region.get("label") for region in regions),
            "hasAudio": any(region.get("audioUrl") for region in regions)
        }
        
        # Store in Firestore
        from firebase_admin import credentials, firestore, initialize_app
        import firebase_admin
        
        # Initialize Firebase if not already initialized
        if not firebase_admin._apps:
            cred_path = os.path.join(os.path.dirname(__file__), "firebase-credentials-2.json")
            cred = credentials.Certificate(cred_path)
            initialize_app(cred)
        
        db = firestore.client()
        
        # First, save the main lesson document
        lesson_ref = db.collection("Teachers").document(request.teacher_id).collection("Lessons").document(lesson_id)
        lesson_ref.set(lesson_doc)
        
        # Save each segment
        for region in regions:
            region_id = region["region_id"]
            region_ref = lesson_ref.collection("Segments").document(region_id)
            region_ref.set(region)
        
        # Add lesson to course
        course_ref = db.collection("Courses").document(request.course_id)
        course_ref.update({
            "lessons": firestore.ArrayUnion([lesson_id])
        })
        
        # Create a StudentView document that contains the lesson data for student viewing
        student_view = {
            "imageUrl": request.original_image_url,
            "regions": regions,
            "noteOrder": request.lesson_data.get("noteOrder", []),
            "createdAt": current_time
        }
        
        lesson_ref.collection("StudentView").document("config").set(student_view)
        
        logger.info(f"Lesson saved successfully with ID: {lesson_id}")
        return {"success": True, "lesson_id": lesson_id, "message": "Lesson saved successfully"}
    
    except Exception as e:
        logger.error(f"Error saving lesson: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save lesson: {str(e)}")