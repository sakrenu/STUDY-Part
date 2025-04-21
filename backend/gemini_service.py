
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
            raise ValueError("region_id must be a non-empty string")
        if not mask_url or not isinstance(mask_url, str):
            raise ValueError("mask_url must be a valid URL")
        if not base_image_url or not isinstance(base_image_url, str):
            raise ValueError("base_image_url must be a valid URL")

        # Default prompt
        base_prompt = custom_prompt.strip() if custom_prompt else "Generate educational notes about the highlighted region in the image."
        base_prompt += "\n\nYour response should include:\n- A heading: 'Segment Notes'\n- Bullet points or explanation"

        if context:
            base_prompt += f"\n\nStudy Material Context:\n{context.strip()}"

        composite_image_url = None

        if use_image:
            try:
                # Get base image
                base_image = Image.open(BytesIO(requests.get(base_image_url, timeout=10).content)).convert("RGBA")
                # Get mask image
                mask_image = Image.open(BytesIO(requests.get(mask_url, timeout=10).content)).convert("RGBA")
                # Create composite image
                composite_image = Image.blend(base_image, mask_image, alpha=0.5)
                composite_buffer = BytesIO()
                composite_image.save(composite_buffer, format="PNG")
                composite_buffer.seek(0)
            except Exception as e:
                raise ValueError(f"Failed to create or fetch composite image: {str(e)}")

            try:
                # Upload to Cloudinary
                cloudinary.config(
                    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "your_cloud_name"),
                    api_key=os.getenv("CLOUDINARY_API_KEY", "your_api_key"),
                    api_secret=os.getenv("CLOUDINARY_API_SECRET", "your_api_secret")
                )
                upload_result = cloudinary.uploader.upload(
                    composite_buffer,
                    public_id=f"lessons/{region_id}/composites/{str(uuid.uuid4())}",
                    resource_type="image"
                )
                composite_image_url = upload_result["secure_url"]
                logger.info(f"Composite image uploaded: {composite_image_url}")
            except Exception as e:
                raise ValueError(f"Failed to upload composite image: {str(e)}")

        # Build Gemini content
        try:
            model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17')
            content = [{"text": base_prompt}]

            if composite_image_url:
                image_data = requests.get(composite_image_url, timeout=10).content
                content.append({
                    "inline_data": {
                        "data": image_data,
                        "mime_type": "image/png"
                    }
                })
        except Exception as e:
            logger.error(f"Failed to prepare Gemini request: {str(e)}")
            raise ValueError(f"Failed to prepare Gemini request: {str(e)}")

        # Generate from Gemini
        try:
            response = model.generate_content(
                content,
                generation_config={"temperature": 0.7, "max_output_tokens": 500}
            )
            if not response.text or not response.text.strip():
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
