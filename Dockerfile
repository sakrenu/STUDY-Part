# Use an official Python runtime as a parent image with specific tag
FROM python:3.10.12-slim-buster

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV DOCKER_BUILDKIT=1
ENV COMPOSE_DOCKER_CLI_BUILD=1

# Install system dependencies
# - Tesseract OCR for pytesseract
# - OpenCV dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1-mesa-glx \
    libglib2.0-0 \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file first to leverage Docker cache
COPY backend/requirements.txt ./requirements.txt

# Install Python dependencies with torch CPU-only version first to avoid CUDA issues
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend application code into the container
COPY ./backend /app

# --- IMPORTANT ---
# DO NOT copy sensitive files like .env or firebase-credentials-2.json directly!
# These should be passed as environment variables or secrets during deployment in Azure.

# Copy model files (ensure these paths are correct relative to the workspace root)
COPY ./backend/sam_vit_b_01ec64.pth /app/sam_vit_b_01ec64.pth
# If you have a model_cache directory you want to include:
# COPY ./backend/model_cache /app/model_cache

# Make port 8000 available to the world outside this container (FastAPI default)
EXPOSE 8000

# Define placeholder environment variables (Override these in Azure)
ENV PORT=8000
ENV CLOUDINARY_CLOUD_NAME="your_cloud_name_placeholder"
ENV CLOUDINARY_API_KEY="your_api_key_placeholder"
ENV CLOUDINARY_API_SECRET="your_api_secret_placeholder"
ENV HUGGINGFACEHUB_API_TOKEN="your_hf_token_placeholder"
ENV GOOGLE_API_KEY="your_google_api_key_placeholder"
# Add Firebase credential handling suggestion (e.g., GOOGLE_APPLICATION_CREDENTIALS)
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/firebase-credentials-2.json"
# Command to run the application using uvicorn
# Ensure 'app:app' matches your file (app.py) and FastAPI instance name (app)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
