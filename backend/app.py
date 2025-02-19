import os
import io
import requests
import cloudinary
import cloudinary.uploader
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
import torch
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import cv2
import json
from ultralytics import FastSAM
from ultralytics.models.fastsam import FastSAM

load_dotenv()

# Initialize Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Initialize Firebase
cred = credentials.Certificate('./firebase-credentials-2.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Initialize FastSAM model - will auto-download if needed
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = FastSAM('FastSAM-s.pt')  # This will automatically download if not found
model.to(device)

def process_image_with_sam(image_path, bounding_box):
    # Read image
    image = cv2.imread(image_path)
    original_size = image.shape[:2]  # Store original image size
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Convert bounding box to the format FastSAM expects
    bbox = [
        int(bounding_box['x']),
        int(bounding_box['y']),
        int(bounding_box['x'] + bounding_box['width']),
        int(bounding_box['y'] + bounding_box['height'])
    ]
    
    # Perform segmentation
    results = model(image_path, device=device, retina_masks=True, imgsz=1024, conf=0.4, iou=0.9,
                   bboxes=[bbox])
    
    # Get the first mask
    masks = results[0].masks.data
    if len(masks) == 0:
        raise Exception("No mask generated")
    
    mask = masks[0].cpu().numpy()
    
    # Resize mask to match original image size
    mask = cv2.resize(mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)
    mask = mask > 0  # Convert to boolean mask
    
    # Create masked image (transparent background)
    rgba = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
    rgba[~mask] = [0, 0, 0, 0]
    
    # Create cutout maintaining original position
    cutout = np.zeros_like(rgba)  # Create empty RGBA image
    cutout[mask] = rgba[mask]  # Copy only the masked region
    
    # Store the bounding box coordinates for frontend positioning
    x, y, w, h = bbox
    
    # Create highlighted outline
    contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    outline = image.copy()
    
    # Draw glowing outline
    cv2.drawContours(outline, contours, -1, (0, 255, 0), 2)  # Green outline
    blur = cv2.GaussianBlur(outline, (0, 0), sigmaX=2, sigmaY=2)
    outline = cv2.addWeighted(outline, 1.5, blur, -0.5, 0)
    
    # Save temporary files
    temp_paths = {
        'masked': 'temp_masked.png',
        'cutout': 'temp_cutout.png',
        'outline': 'temp_outline.png'
    }
    
    cv2.imwrite(temp_paths['masked'], rgba)
    cv2.imwrite(temp_paths['cutout'], cutout)
    cv2.imwrite(temp_paths['outline'], outline)
    
    # Upload to Cloudinary and get URLs
    urls = {}
    for key, path in temp_paths.items():
        response = cloudinary.uploader.upload(path)
        urls[key] = response['secure_url']
        os.remove(path)  # Clean up temp files
    
    # Add position data to response
    return {
        **urls,
        'position': {
            'x': x,
            'y': y,
            'width': w,
            'height': h
        },
        'originalSize': {
            'width': image.shape[1],
            'height': image.shape[0]
        }
    }

@app.route('/')
def home():
    return jsonify({"message": "Welcome to Study-Part!"})

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Upload original image to Cloudinary
        response = cloudinary.uploader.upload(file)
        
        return jsonify({
            'image_url': response['secure_url']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/segment', methods=['POST'])
def segment_image():
    try:
        data = request.json
        image_url = data.get('image_url')
        bounding_box = data.get('bounding_box')
        teacher_id = data.get('teacher_id')
        
        if not all([image_url, bounding_box, teacher_id]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Download image from Cloudinary
        temp_path = 'temp_original.jpg'
        os.system(f"curl {image_url} > {temp_path}")
        
        # Process image with SAM
        processed_data = process_image_with_sam(temp_path, bounding_box)
        
        # Clean up
        os.remove(temp_path)
        
        return jsonify({
            'segmented_urls': [processed_data['cutout']],
            'masked_image': processed_data['masked'],
            'cutout': processed_data['cutout'],
            'highlighted_outline': processed_data['outline'],
            'original_with_highlight': processed_data['outline'],
            'position': processed_data['position'],
            'originalSize': processed_data['originalSize']
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/add_note', methods=['POST'])
def add_note():
    data = request.json
    image_url = data.get('image_url')
    segment_index = data.get('segment_index')
    note = data.get('note')
    teacher_id = data.get('teacher_id')

    try:
        teacher_ref = db.collection('teachers').document(teacher_id)
        teacher_data = teacher_ref.get()

        if teacher_data.exists:
            segments = teacher_data.to_dict().get('segments', {})
            if image_url in segments:
                segments[image_url]['notes'][segment_index] = note
                teacher_ref.update({'segments': segments})
                return jsonify({"message": "Note added successfully!"}), 200
            else:
                return jsonify({"error": "Image not found in teacher's segments."}), 404
        else:
            return jsonify({"error": "Teacher not found."}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
