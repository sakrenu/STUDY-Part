from fastapi import APIRouter, UploadFile, File, HTTPException
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

# Load environment variables from backend/.env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging
logger = logging.getLogger(__name__)

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
        model="gemini-pro", 
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.7,
        convert_system_message_to_human=True
    )
    logger.info("Successfully initialized Google Gemini LLM")
except Exception as e:
    logger.error(f"Failed to initialize Google Gemini LLM: {str(e)}")
    raise

# Initialize embeddings using a smaller, non-gated model
cache_dir = os.path.join(os.path.dirname(__file__), 'model_cache')
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
        logger.error(f"Error processing text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing text: {str(e)}")

@router.post("/process_pdf")
async def process_pdf(file: UploadFile = File(...), user_id: str = None):
    """Process PDF files and extract text"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        logger.info(f"Processing PDF file: {file.filename}")
        # Read PDF content
        pdf_content = await file.read()
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text: # Add check for None
                text += page_text + "\n"
        
        # Process text to vectors
        if user_id:
            await process_text_to_vectors(text, user_id)
        
        return {"content": text, "status": "success"}
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@router.post("/process_ppt")
async def process_ppt(file: UploadFile = File(...), user_id: str = None):
    """Process PowerPoint files and extract text"""
    if not file.filename.endswith(('.ppt', '.pptx')):
        raise HTTPException(status_code=400, detail="File must be a PowerPoint presentation")
    
    try:
        logger.info(f"Processing PowerPoint file: {file.filename}")
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
        logger.error(f"Error processing PowerPoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PowerPoint: {str(e)}")

@router.post("/process_image")
async def process_image(file: UploadFile = File(...), user_id: str = None):
    """Process image files using OCR"""
    allowed_extensions = {'.png', '.jpg', '.jpeg', '.gif'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="File must be an image (PNG, JPG, JPEG, GIF)")
    
    try:
        logger.info(f"Processing image file: {file.filename}")
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
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@router.post("/query_notes")
async def query_notes(user_id: str, query: str):
    """Query the vector store for relevant information using Google Gemini"""
    try:
        logger.info(f"Querying notes for user: {user_id} with Gemini")
        # Load the vector store
        vector_store_path = f"vector_stores/{user_id}/vectors"
        if not os.path.exists(vector_store_path):
            raise HTTPException(status_code=404, detail="No notes found for this user. Please upload some notes first.")
        
        vectorstore = FAISS.load_local(vector_store_path, embeddings, allow_dangerous_deserialization=True)
        
        # First get relevant documents
        docs = vectorstore.similarity_search(query, k=3)
        if not docs:
             return {
                "response": "Could not find relevant information in your notes for this query.",
                "sources": [],
                "status": "success"
            }

        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Format a prompt for the LLM
        prompt = f"""Answer the following question based only on the provided context:

Context:
{context}

Question: {query}

Answer:"""
        
        # Get response from Gemini
        response = llm.invoke(prompt)
        
        return {
            "response": response.content, # Access content attribute for the response string
            "sources": [doc.page_content for doc in docs],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error querying notes with Gemini: {str(e)}")
        # Check if the error is related to FAISS deserialization
        if "Pickle" in str(e) or "deserialization" in str(e):
             raise HTTPException(status_code=500, detail=f"Error loading notes. It might be due to library version changes. Please try re-uploading your notes. Original error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error querying notes: {str(e)}") 