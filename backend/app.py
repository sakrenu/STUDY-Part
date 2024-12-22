# from flask import Flask, jsonify, request
# from flask_cors import CORS

# app = Flask(__name__)
# CORS(app)

# @app.route('/')
# def home():
#     return jsonify({"message": "Welcome to Study-Part!"})

# if __name__ == '__main__':
#     app.run(debug=True)
# backend/app.py
# 

#----------from chatgpt behwo---------
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from sam import segment_image
import os
import numpy as np
from PIL import Image
import io
from pycocotools import mask as mask_utils

# app = Flask(__name__)
app = Flask(__name__, static_folder='segmented')

CORS(app)

UPLOAD_FOLDER = 'uploads'
SEGMENTED_FOLDER = 'segmented'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SEGMENTED_FOLDER, exist_ok=True)

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
        # Sanitize and save image
        filename = os.path.basename(file.filename)
        image_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(image_path)
        return jsonify({"image_path": image_path}), 200

# @app.route('/segment', methods=['POST'])
# def segment():
#     try:
#         data = request.json
#         image_path = data.get('image_path')
#         bounding_box = data.get('bounding_box')

#         if not os.path.exists(image_path):
#             return jsonify({"error": "Image not found"}), 404

#         rle_masks, confidences = segment_image(image_path, bounding_box)
        
#         # Load the original image
#         segmented_image = Image.open(image_path).convert('RGBA')
        
#         for mask in rle_masks:
#             decoded_mask = mask_utils.decode(mask)
#             mask_image = np.stack((decoded_mask,) * 4, axis=-1) * 255
#             mask_image = Image.fromarray(mask_image.astype(np.uint8))
#             segmented_image.paste(mask_image, (0, 0), mask_image)

#         # Save the segmented image
#         segmented_image_path = os.path.join(SEGMENTED_FOLDER, os.path.basename(image_path))
#         segmented_image.save(segmented_image_path)

#         return jsonify({'segmented_image_path': segmented_image_path}), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.route('/segment', methods=['POST'])
def segment():
    data = request.json
    image_path = data.get('image_path')
    bounding_box = data.get('bounding_box')

    try:
        rle_masks, confidences = segment_image(image_path, bounding_box)
        segmented_image_path = os.path.join('segmented', os.path.basename(image_path))
        os.makedirs('segmented', exist_ok=True)

        # Process and save the segmented image
        segmented_image = Image.open(image_path).convert('RGBA')
        for mask in rle_masks:
            mask_image = mask_utils.decode(mask)
            mask_image = np.stack((mask_image,) * 3, axis=-1) * 255
            mask_image = Image.fromarray(mask_image.astype(np.uint8))
            segmented_image.paste(mask_image, (0, 0), mask_image)
        segmented_image.save(segmented_image_path)

        # Return the correct URL to access the static file
        segmented_image_url = f"http://localhost:5000/segmented/{os.path.basename(image_path)}"
        return jsonify({'segmented_image_path': segmented_image_url}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/uploads/<filename>', methods=['GET'])
def serve_uploaded_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/segmented/<filename>', methods=['GET'])
def serve_segmented_image(filename):
    return send_from_directory(SEGMENTED_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)
