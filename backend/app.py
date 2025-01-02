from flask import Flask, jsonify, request
from flask_cors import CORS
from sam import segment_image  # Import the segment_image function
import os
import numpy as np
from PIL import Image
import io
from pycocotools import mask as mask_utils
import cloudinary
import cloudinary.uploader
import cloudinary.api
import requests

# Initialize Cloudinary
cloudinary.config(
    cloud_name='duvdshhrz',
    api_key='784524479772363',
    api_secret='wVfzkP0KX1wSKdkP2sT2kY13SHs'
)

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

    try:
        # Download image from Cloudinary
        response = requests.get(image_url)
        image = Image.open(io.BytesIO(response.content))

        # Ensure bounding_box is in the correct format
        bounding_box_array = [
            float(bounding_box['left']),
            float(bounding_box['top']),
            float(bounding_box['width']),
            float(bounding_box['height'])
        ]

        # Save image temporarily
        temp_image_path = "temp_image.jpg"
        image.save(temp_image_path)

        # Perform segmentation
        rle_masks, confidences = segment_image(temp_image_path, bounding_box_array)
        segmented_urls = []
        for idx, mask in enumerate(rle_masks):
            mask_image = mask_utils.decode(mask)
            if mask_image.dtype != np.uint8:
                mask_image = mask_image.astype(np.uint8)

            # Convert the mask to a 3-channel image (RGB)
            mask_image_rgb = np.stack((mask_image,) * 3, axis=-1) * 255
            mask_image_rgb = Image.fromarray(mask_image_rgb.astype(np.uint8))

            # Create an RGBA base image
            segmented_image = Image.new('RGBA', image.size)

            # Use the single-channel mask as the transparency mask
            mask_image_alpha = Image.fromarray(mask_image * 255).convert('L')

            # Paste the mask onto the segmented image
            segmented_image.paste(mask_image_rgb, (0, 0), mask_image_alpha)

            # Save segmented image to Cloudinary
            segmented_image_buffer = io.BytesIO()
            # segmented_image.save(segmented_image_buffer, format='PNG')
            segmented_image.convert('RGB').save(segmented_image_buffer, format='JPEG')
            segmented_image_buffer.seek(0)
            upload_result = cloudinary.uploader.upload(segmented_image_buffer, public_id=f'segmented_part_{idx}')
            segmented_urls.append(upload_result['secure_url'])


        # Clean up
        os.remove(temp_image_path)

        return jsonify({'segmented_urls': segmented_urls, 'confidences': confidences}), 200

    except ValueError as ve:
        app.logger.error(f"Value error during segmentation: {str(ve)}")
        return jsonify({"error": "Value error in segmentation. Please check inputs."}), 400
    except Exception as e:
        app.logger.error(f"Unexpected error during segmentation: {str(e)}")
        return jsonify({"error": "Internal server error."}), 500

if __name__ == '__main__':
    app.run(debug=True)
