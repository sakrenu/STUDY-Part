from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from typing import Dict
import PyPDF2
import io
import pytesseract
from PIL import Image
from pptx import Presentation
import os
import tempfile
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_google_genai import ChatGoogleGenerativeAI
import shutil
import logging
from dotenv import load_dotenv
from pathlib import Path
from typing import Any, List, Optional, Mapping
import cloudinary
import cloudinary.uploader
import uuid

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from backend/.env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configure Cloudinary
try:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET")
    )
    logger.info("Cloudinary configured successfully.")
except Exception as e:
    logger.error(f"Failed to configure Cloudinary: {str(e)}")
    # Depending on the desired behavior, you might want to raise an error or handle it differently.
    # For now, we log the error and continue, endpoints requiring Cloudinary might fail.

router = APIRouter(
    prefix="/api/rag",
    tags=["RAG"],
    responses={404: {"description": "Not found"}},
)

# Initialize text splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)

# Initialize Google Gemini LLM
try:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-preview-04-17",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.7,
        convert_system_message_to_human=True
    )
    logger.info("Successfully initialized Google Gemini LLM")
except Exception as e:
    logger.error(f"Failed to initialize Google Gemini LLM: {str(e)}")
    raise

# Initialize embeddings using a smaller, non-gated model
cache_dir = os.path.join(os.path.dirname(__file__), '..', 'model_cache') # Adjusted cache path
os.makedirs(cache_dir, exist_ok=True)

# Replace the existing embeddings code with:
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",  # Public model, no auth required
    model_kwargs={'device': 'cpu'},
    encode_kwargs={
        'normalize_embeddings': True,
        'batch_size': 32
    },
    cache_folder=cache_dir
)

async def process_text_to_vectors(text: str, user_id: str) -> Dict:
    """Process text into chunks and create/update vector store for a user"""
    try:
        # Split text into chunks
        chunks = text_splitter.split_text(text)
        if not chunks:
             logger.warning(f"No text chunks generated for user_id: {user_id}")
             return {"status": "success", "message": "No text content found to process."}

        vector_store_dir = f"vector_stores/{user_id}"
        vector_store_path = os.path.join(vector_store_dir, "vectors")
        os.makedirs(vector_store_dir, exist_ok=True)

        # Create or update vector store
        if os.path.exists(vector_store_path):
             logger.info(f"Loading existing vector store for user_id: {user_id}")
             vectorstore = FAISS.load_local(vector_store_path, embeddings, allow_dangerous_deserialization=True)
             vectorstore.add_texts(chunks)
             logger.info(f"Added {len(chunks)} new chunks to existing vector store for user_id: {user_id}")
        else:
             logger.info(f"Creating new vector store for user_id: {user_id}")
             vectorstore = FAISS.from_texts(chunks, embeddings)
             logger.info(f"Created vector store with {len(chunks)} chunks for user_id: {user_id}")

        # Save the vector store
        vectorstore.save_local(vector_store_path)
        logger.info(f"Vector store saved successfully for user_id: {user_id} at {vector_store_path}")

        return {"status": "success", "chunks_processed": len(chunks)}
    except Exception as e:
        logger.error(f"Error processing text for user_id {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing text: {str(e)}")

async def upload_to_cloudinary(file_content: bytes, user_id: str, filename: str) -> str:
    """Uploads file content to Cloudinary"""
    try:
        public_id = f"notes/{user_id}/{uuid.uuid4()}_{filename}"
        logger.info(f"Uploading file to Cloudinary with public_id: {public_id}")
        upload_result = cloudinary.uploader.upload(
            file_content,
            public_id=public_id,
            resource_type="auto" # Automatically detect resource type
        )
        logger.info(f"File uploaded successfully to Cloudinary: {upload_result['secure_url']}")
        return upload_result["secure_url"]
    except Exception as e:
        logger.error(f"Cloudinary upload failed for user {user_id}, filename {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cloudinary upload error: {str(e)}")


@router.post("/process_pdf")
async def process_pdf(user_id: str = Body(...), file: UploadFile = File(...)):
    """Process PDF files: Upload to Cloudinary, extract text, create vectors"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        logger.info(f"Processing PDF file: {file.filename} for user: {user_id}")
        # Read PDF content
        pdf_content = await file.read()

        # Upload to Cloudinary first
        cloudinary_url = await upload_to_cloudinary(pdf_content, user_id, file.filename)

        # Extract text
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text: # Add check for None
                text += page_text + "\n"
        logger.info(f"Extracted {len(text)} characters from PDF: {file.filename}")

        # Process text to vectors
        vector_result = await process_text_to_vectors(text, user_id)

        return {
            "content": text, # Return extracted text
            "cloudinary_url": cloudinary_url,
            "filename": file.filename,
            "filetype": file.content_type,
            "vector_status": vector_result,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error processing PDF for user {user_id}: {str(e)}")
        # Don't re-raise generic Exception, let specific errors (like HTTPExceptions) propagate
        if not isinstance(e, HTTPException):
             raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
        else:
             raise # Re-raise HTTPException

@router.post("/process_ppt")
async def process_ppt(user_id: str = Body(...), file: UploadFile = File(...)):
    """Process PowerPoint files: Upload to Cloudinary, extract text, create vectors"""
    if not file.filename.endswith(('.ppt', '.pptx')):
        raise HTTPException(status_code=400, detail="File must be a PowerPoint presentation")

    temp_path = None # Initialize temp_path
    try:
        logger.info(f"Processing PowerPoint file: {file.filename} for user: {user_id}")
        # Read file content for upload
        file_content = await file.read()
        await file.seek(0) # Reset file pointer after reading

        # Upload to Cloudinary first
        cloudinary_url = await upload_to_cloudinary(file_content, user_id, file.filename)

        # Save the uploaded file temporarily for text extraction
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            # shutil.copyfileobj(file.file, temp_file) # Problematic after reading content
            temp_file.write(file_content) # Write the read content to temp file
            temp_path = temp_file.name
            logger.info(f"Saved PPT temporarily to: {temp_path}")

        # Process the PowerPoint
        prs = Presentation(temp_path)
        text = ""

        # Extract text from all slides
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
        logger.info(f"Extracted {len(text)} characters from PPT: {file.filename}")

        # Process text to vectors
        vector_result = await process_text_to_vectors(text, user_id)

        return {
            "content": text,
            "cloudinary_url": cloudinary_url,
            "filename": file.filename,
            "filetype": file.content_type,
            "vector_status": vector_result,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error processing PowerPoint for user {user_id}: {str(e)}")
        if not isinstance(e, HTTPException):
             raise HTTPException(status_code=500, detail=f"Error processing PowerPoint: {str(e)}")
        else:
             raise # Re-raise HTTPException
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
                logger.info(f"Successfully deleted temporary file: {temp_path}")
            except Exception as unlink_e:
                 logger.error(f"Error deleting temporary file {temp_path}: {unlink_e}")


@router.post("/process_image")
async def process_image(user_id: str = Body(...), file: UploadFile = File(...)):
    """Process image files using OCR: Upload to Cloudinary, extract text, create vectors"""
    allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif'}
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="File must be an image (PNG, JPG, JPEG, GIF)")

    try:
        logger.info(f"Processing image file: {file.filename} for user: {user_id}")
        # Read image content
        image_content = await file.read()

        # Upload to Cloudinary first
        cloudinary_url = await upload_to_cloudinary(image_content, user_id, file.filename)

        # Perform OCR
        image = Image.open(io.BytesIO(image_content))
        text = pytesseract.image_to_string(image)
        logger.info(f"Extracted {len(text)} characters via OCR from image: {file.filename}")

        # Process text to vectors
        vector_result = await process_text_to_vectors(text, user_id)

        return {
            "content": text,
            "cloudinary_url": cloudinary_url,
            "filename": file.filename,
            "filetype": file.content_type,
            "vector_status": vector_result,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error processing image for user {user_id}: {str(e)}")
        if not isinstance(e, HTTPException):
            raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
        else:
            raise # Re-raise HTTPException


@router.post("/query_notes")
async def query_notes(user_id: str = Body(...), query: str = Body(...)):
    """Query the vector store for relevant information using Google Gemini"""
    try:
        logger.info(f"Querying notes for user: {user_id} with Gemini. Query: '{query}'")
        # Define vector store path based on user_id
        vector_store_path = f"vector_stores/{user_id}/vectors"

        # Check if the vector store exists
        if not os.path.exists(vector_store_path):
             logger.warning(f"Vector store not found for user: {user_id} at {vector_store_path}")
             # It's better to inform the user clearly.
             raise HTTPException(status_code=404, detail="No notes found for this user. Please upload some notes first.")

        # Load the vector store
        logger.info(f"Loading vector store from: {vector_store_path}")
        try:
            vectorstore = FAISS.load_local(vector_store_path, embeddings, allow_dangerous_deserialization=True)
            logger.info(f"Successfully loaded vector store for user: {user_id}")
        except Exception as faiss_load_error:
             logger.error(f"Error loading FAISS index for user {user_id} from {vector_store_path}: {faiss_load_error}")
             # Provide a more specific error message for potential corruption or version issues
             raise HTTPException(status_code=500, detail=f"Error loading your notes' index. It might be corrupted or incompatible. Try re-uploading your notes. Original error: {str(faiss_load_error)}")

        # First get relevant documents
        logger.info(f"Performing similarity search for query: '{query}' for user: {user_id}")
        docs = vectorstore.similarity_search(query, k=3) # k=3 means retrieve top 3 relevant chunks

        # Check if any relevant documents were found
        if not docs:
             logger.info(f"No relevant documents found for query: '{query}' for user: {user_id}")
             return {
                "response": "Could not find relevant information in your notes for this query.",
                "sources": [],
                "status": "success"
            }
        logger.info(f"Found {len(docs)} relevant documents for query: '{query}' for user: {user_id}")

        # Combine the content of relevant documents to form the context
        context = "\n\n".join([doc.page_content for doc in docs])

        # Format a prompt for the LLM, instructing it to use only the provided context
        prompt = f"""Answer the following question based ONLY on the provided context. If the context doesn't contain the answer, say you couldn't find the information in the notes.

Context:
{context}

Question: {query}

Answer:"""

        # Get response from Gemini LLM
        logger.info(f"Sending prompt to Gemini for user: {user_id}")
        response = llm.invoke(prompt)
        logger.info(f"Received response from Gemini for user: {user_id}")

        # Return the LLM's response and the source document contents
        return {
            "response": response.content, # Access content attribute for the response string
            "sources": [doc.page_content for doc in docs], # Include the source text chunks
            "status": "success"
        }
    except HTTPException as http_exc:
         # Re-raise HTTPExceptions directly to maintain status codes and details
         raise http_exc
    except Exception as e:
        # Handle any other unexpected errors
        logger.error(f"Unexpected error querying notes with Gemini for user {user_id}: {str(e)}")
        # Check specifically for deserialization errors which might indicate version mismatch or corruption
        if "Pickle" in str(e) or "deserialization" in str(e):
             raise HTTPException(status_code=500, detail=f"Error processing your notes index. It might be due to library version changes or corruption. Please try re-uploading your notes. Original error: {str(e)}")
        # For other errors, return a generic 500 error
        raise HTTPException(status_code=500, detail=f"Error querying notes: {str(e)}") 