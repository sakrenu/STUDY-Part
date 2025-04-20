import google.generativeai as genai
from io import BytesIO
from PIL import Image
import cloudinary
import cloudinary.uploader
import requests
import os
from dotenv import load_dotenv
import logging
import uuid

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_key = os.getenv("GEMINI_API_KEY")
logger.info(f"GEMINI_API_KEY loaded: {'YES' if api_key else 'NO'}")
genai.configure(api_key=api_key)

async def generate_notes_with_gemini(region_id: str, mask_url: str, base_image_url: str, use_image: bool, context: str = "", custom_prompt: str = None):
    try:
        logger.info(f"Starting note generation for region_id: {region_id}")

        # Validate inputs
        if not region_id or not isinstance(region_id, str):
            logger.error("Invalid region_id")
            raise ValueError("region_id must be a non-empty string")
        if not mask_url or not isinstance(mask_url, str):
            logger.error("Invalid mask_url")
            raise ValueError("mask_url must be a valid URL")
        if not base_image_url or not isinstance(base_image_url, str):
            logger.error("Invalid base_image_url")
            raise ValueError("base_image_url must be a valid URL")

        # Initialize composite_image_url
        composite_image_url = None

        base_prompt = custom_prompt.strip() if custom_prompt else "Generate educational notes about the selected segment in this image."
        base_prompt += "\n\nYour response should include:\n- A title: 'Segment Notes'\n- Bullet points or explanation\n"

        if context:
            base_prompt += f"\n\nStudy Material Context:\n{context.strip()}"

        if use_image:
            try:
                response = requests.get(base_image_url, timeout=10)
                response.raise_for_status()
                base_image = Image.open(BytesIO(response.content)).convert("RGBA")
            except Exception as e:
                logger.error(f"Failed to fetch or process base_image_url: {str(e)}")
                raise ValueError(f"Failed to fetch or process base image: {str(e)}")

            try:
                response = requests.get(mask_url, timeout=10)
                response.raise_for_status()
                mask_image = Image.open(BytesIO(response.content)).convert("RGBA")
            except Exception as e:
                logger.error(f"Failed to fetch or process mask_url: {str(e)}")
                raise ValueError(f"Failed to fetch or process mask image: {str(e)}")

            try:
                composite_image = Image.blend(base_image, mask_image, alpha=0.5)
                composite_buffer = BytesIO()
                composite_image.save(composite_buffer, format="PNG")
                composite_buffer.seek(0)
            except Exception as e:
                logger.error(f"Failed to create composite image: {str(e)}")
                raise ValueError(f"Failed to create composite image: {str(e)}")

            cloudinary.config(
                cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "your_cloud_name"),
                api_key=os.getenv("CLOUDINARY_API_KEY", "your_api_key"),
                api_secret=os.getenv("CLOUDINARY_API_SECRET", "your_api_secret")
            )
            try:
                upload_result = cloudinary.uploader.upload(
                    composite_buffer,
                    public_id=f"lessons/{region_id}/composites/{str(uuid.uuid4())}",
                    resource_type="image"
                )
                composite_image_url = upload_result["secure_url"]
                logger.info(f"Composite image uploaded to Cloudinary: {composite_image_url}")
            except Exception as e:
                logger.error(f"Failed to upload composite image to Cloudinary: {str(e)}")
                raise ValueError(f"Failed to upload composite image: {str(e)}")

            base_prompt = f"{custom_prompt or 'Generate a detailed description of the highlighted segment in the provided image'}. Include a heading 'Segment Description' followed by notes describing the highlighted area."
            if context:
                base_prompt += f" Use the following context from study materials: {context}"

        try:
            model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17')
            content = [{"text": base_prompt}]
            if composite_image_url:
                response = requests.get(composite_image_url, timeout=10)
                response.raise_for_status()
                content.append({
                    "inline_data": {
                        "data": response.content,
                        "mime_type": "image/png"
                    }
                })
        except Exception as e:
            logger.error(f"Failed to prepare Gemini request: {str(e)}")
            raise ValueError(f"Failed to prepare Gemini request: {str(e)}")

        try:
            response = model.generate_content(content, generation_config={"temperature": 0.7, "max_output_tokens": 500})
            if not response.text:
                logger.error("Gemini response is empty")
                raise ValueError("Gemini returned an empty response")
            notes = response.text
        except Exception as e:
            logger.error(f"Failed to generate content with Gemini: {str(e)}")
            raise ValueError(f"Failed to generate content with Gemini: {str(e)}")

        logger.info(f"Notes generated successfully for region_id: {region_id}")
        return notes, composite_image_url
    except Exception as e:
        logger.error(f"Error in generate_notes_with_gemini: {str(e)}")
        raise