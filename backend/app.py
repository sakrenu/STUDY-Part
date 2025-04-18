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
from typing import List, Optional
from sam import Segmenter
from dotenv import load_dotenv

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
            # Define color palette (you can extend this)
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


            # Create cutout (for future steps)
            cutout = image_np.copy()
            cutout[~mask] = 0
            cutout_img = Image.fromarray(cutout)
            cutout_buffer = BytesIO()
            cutout_img.save(cutout_buffer, format="PNG")
            cutout_buffer.seek(0)

            # Upload cutout to Cloudinary
            logger.info(f"Uploading cutout {i} for lesson_id: {lesson_id}")
            cutout_upload = cloudinary.uploader.upload(
                cutout_buffer,
                public_id=f"lessons/{image_id}/cutouts/{lesson_id}_{i}",
                resource_type="image"
            )

            # Calculate position
            if box:
                position = {"x1": box[0], "y1": box[1], "x2": box[2], "y2": box[3]}
            else:
                coords = np.where(mask)
                if len(coords[0]) > 0:
                    position = {
                        "x1": float(coords[1].min()),
                        "y1": float(coords[0].min()),
                        "x2": float(coords[1].max()),
                        "y2": float(coords[0].max())
                    }
                else:
                    position = {"x1": 0, "y1": 0, "x2": 0, "y2": 0}

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