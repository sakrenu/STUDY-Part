# app.py
from fastapi import FastAPI, HTTPException, File, UploadFile
import cloudinary
import cloudinary.uploader
import logging
import os
from  fastapi.middleware.cors import CORSMiddleware
from sam import segment_with_boxes, segment_with_points, segment_with_box_as_points
from dotenv import load_dotenv
load_dotenv()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Adjust if your frontend runs elsewhere
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configure Cloudinary
try:
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),  # Replace with your cloud name
        api_key=os.getenv("CLOUDINARY_API_KEY"),           # Replace with your API key
        api_secret=os.getenv("CLOUDINARY_API_SECRET")   # Replace with your API secret
    )
    
    logger.info("Cloudinary configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Cloudinary: {str(e)}")
    raise Exception(f"Cloudinary configuration failed: {str(e)}")

@app.post('/upload')
async def upload_file(image: UploadFile = File(...)):
    try:
        # Validate input
        if not image:
            logger.error("No image file provided")
            raise HTTPException(status_code=400, detail="No image file provided")
        if not image.content_type.startswith('image/'):
            logger.error(f"Invalid file type: {image.content_type}")
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read file
        logger.info(f"Received file: {image.filename}, size: {image.size} bytes")
        file_content = await image.read()
        if not file_content:
            logger.error("Empty file content")
            raise HTTPException(status_code=400, detail="Empty file content")

        # Upload to Cloudinary
        logger.info("Uploading to Cloudinary...")
        response = cloudinary.uploader.upload(
            file_content,
            resource_type="image",
            folder="teach_by_parts"
        )
        logger.info(f"Upload successful: {response['secure_url']}")
        return {"image_url": response['secure_url']}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post('/segment_with_boxes')
async def segment_boxes(image_url: str, teacher_id: str, regions: list):
    try:
        logger.info(f"Segmenting boxes for image: {image_url}")
        results = segment_with_boxes(image_url, regions)
        logger.info("Box segmentation completed successfully")
        return {"results": results}
    except Exception as e:
        logger.error(f"Box segmentation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Box segmentation failed: {str(e)}")

@app.post('/segment_with_points')
async def segment_points(image_url: str, teacher_id: str, regions: list):
    try:
        logger.info(f"Segmenting points for image: {image_url}")
        results = segment_with_points(image_url, regions)
        logger.info("Point segmentation completed successfully")
        return {"results": results}
    except Exception as e:
        logger.error(f"Point segmentation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Point segmentation failed: {str(e)}")

@app.post('/segment_with_box_as_points')
async def segment_box_as_points(image_url: str, teacher_id: str, regions: list):
    try:
        logger.info(f"Segmenting box as points for image: {image_url}")
        results = segment_with_box_as_points(image_url, regions)
        logger.info("Box-as-points segmentation completed successfully")
        return {"results": results}
    except Exception as e:
        logger.error(f"Box-as-points segmentation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Box-as-points segmentation failed: {str(e)}")