# app.py (partial - unchanged)
from fastapi import FastAPI, File, UploadFile, HTTPException
import cloudinary.uploader

app = FastAPI()

@app.post('/upload')
async def upload_file(image: UploadFile = File(...)):
    try:
        if not image:
            raise HTTPException(status_code=400, detail="No image file")
        response = cloudinary.uploader.upload(image.file)
        return {"image_url": response['secure_url']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))