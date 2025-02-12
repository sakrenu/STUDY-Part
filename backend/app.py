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
from sam import segment_image
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
