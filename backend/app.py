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
import cv2
from sam import segment_image
from sam_quiz import segment_quiz_image, get_image_without_masks
from dotenv import load_dotenv

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

@app.route('/')
def home():
    return jsonify({"message": "Welcome to Study-Part!"})

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image part"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        # Upload image to Cloudinary
        upload_result = cloudinary.uploader.upload(file)
        image_url = upload_result['secure_url']
        return jsonify({"image_url": image_url}), 200

@app.route('/segment', methods=['POST'])
def segment():
    data = request.json
    image_url = data.get('image_url')
    bounding_box = data.get('bounding_box')
    teacher_id = data.get('teacher_id')

    try:
        response = requests.get(image_url)
        image = Image.open(io.BytesIO(response.content))

        bounding_box_array = [
            float(bounding_box['left']),
            float(bounding_box['top']),
            float(bounding_box['width']),
            float(bounding_box['height'])
        ]

        temp_image_path = "temp_image.jpg"
        image.save(temp_image_path)

        cutouts = segment_image(temp_image_path, bounding_box_array)

        segmented_urls = []
        for idx, cutout in enumerate(cutouts):
            cutout_image = Image.fromarray(cutout.astype(np.uint8))

            # Save as PNG to preserve transparency
            segmented_image_buffer = io.BytesIO()
            cutout_image.save(segmented_image_buffer, format='PNG')
            segmented_image_buffer.seek(0)

            upload_result = cloudinary.uploader.upload(
                segmented_image_buffer, public_id=f'segmented_part_{idx}', format="png"
            )
            segmented_urls.append(upload_result['secure_url'])

        os.remove(temp_image_path)

        teacher_ref = db.collection('teachers').document(teacher_id)
        teacher_data = teacher_ref.get()

        if teacher_data.exists:
            segments = teacher_data.to_dict().get('segments', {})
            segments[image_url] = {'segments': segmented_urls, 'notes': {}}
            teacher_ref.update({'segments': segments})
        else:
            teacher_ref.set({'segments': {image_url: {'segments': segmented_urls, 'notes': {}}}})

        return jsonify({'segmented_urls': segmented_urls}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/segment_quiz', methods=['POST'])
def segment_quiz():
    """
    Endpoint to process images for quiz creation.
    """
    data = request.json
    image_url = data.get('image_url')
    teacher_id = data.get('teacher_id')

    breakpoint()

    try:
        # Download the image and save it locally
        response = requests.get(image_url)
        temp_image_path = "temp_quiz_image.jpg"
        with open(temp_image_path, 'wb') as f:
            f.write(response.content)

        # Use the new SAM quiz segmentation function
        cutouts = segment_quiz_image(temp_image_path)

        segmented_urls = []
        for idx, cutout in enumerate(cutouts):
            # Convert cutout numpy array to a PIL Image
            cutout_image = Image.fromarray(cutout.astype(np.uint8))

            # Save as PNG for transparency
            segmented_image_buffer = io.BytesIO()
            cutout_image.save(segmented_image_buffer, format='PNG')
            segmented_image_buffer.seek(0)

            upload_result = cloudinary.uploader.upload(
                segmented_image_buffer,
                public_id=f'segmented_quiz_{idx}',
                format="png"
            )
            segmented_urls.append(upload_result['secure_url'])

        os.remove(temp_image_path)

        # Optionally update teacher's quiz segments in the database
        teacher_ref = db.collection('teachers').document(teacher_id)
        teacher_data = teacher_ref.get()

        if teacher_data.exists:
            quiz_segments = teacher_data.to_dict().get('quiz_segments', {})
            quiz_segments[image_url] = {'segments': segmented_urls}
            teacher_ref.update({'quiz_segments': quiz_segments})
        else:
            teacher_ref.set({'quiz_segments': {image_url: {'segments': segmented_urls}}})

        return jsonify({'segmented_urls': segmented_urls}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/remove_masks', methods=['POST'])
def remove_masks():
    """
    Endpoint to get the original image with the segmented masks removed (as transparent holes).
    """
    data = request.json
    image_url = data.get('image_url')
    teacher_id = data.get('teacher_id')
    try:
        # Download the image and save it temporarily.
        response = requests.get(image_url)
        temp_image_path = "temp_without_masks.jpg"
        with open(temp_image_path, "wb") as f:
            f.write(response.content)
        
        # Process the image to remove the masks.
        processed_image_bgra = get_image_without_masks(temp_image_path)
        
        # Convert BGRA to RGBA for proper handling by PIL.
        image_rgba = cv2.cvtColor(processed_image_bgra, cv2.COLOR_BGRA2RGBA)
        pil_image = Image.fromarray(image_rgba)
        
        # Save the resulting image to an in-memory buffer.
        buffer = io.BytesIO()
        pil_image.save(buffer, format="PNG")
        buffer.seek(0)
        
        # Upload the processed image to Cloudinary.
        upload_result = cloudinary.uploader.upload(
            buffer,
            public_id=f"original_without_masks_{teacher_id}",
            format="png"
        )
        processed_image_url = upload_result['secure_url']
        
        os.remove(temp_image_path)
        
        # Optionally update the teacher's record in Firebase with this image.
        teacher_ref = db.collection('teachers').document(teacher_id)
        teacher_data = teacher_ref.get()
        if teacher_data.exists:
            teacher_ref.update({"original_without_masks": processed_image_url})
        else:
            teacher_ref.set({"original_without_masks": processed_image_url})
            
        return jsonify({"original_without_masks_url": processed_image_url}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
