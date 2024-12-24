# # # from flask import Flask, jsonify, request
# # # from flask_cors import CORS

# # # app = Flask(__name__)
# # # CORS(app)

# # # @app.route('/')
# # # def home():
# # #     return jsonify({"message": "Welcome to Study-Part!"})

# # # if __name__ == '__main__':
# # #     app.run(debug=True)
# # # backend/app.py
# # # 

# # #----------from chatgpt behwo---------
# # from flask import Flask, jsonify, request, send_from_directory
# # from flask_cors import CORS
# # from sam import segment_image
# # import os
# # import numpy as np
# # from PIL import Image
# # import io
# # from pycocotools import mask as mask_utils

# # # app = Flask(__name__)
# # app = Flask(__name__, static_folder='segmented')

# # CORS(app)

# # UPLOAD_FOLDER = 'uploads'
# # SEGMENTED_FOLDER = 'segmented'

# # os.makedirs(UPLOAD_FOLDER, exist_ok=True)
# # os.makedirs(SEGMENTED_FOLDER, exist_ok=True)

# # @app.route('/')
# # def home():
# #     return jsonify({"message": "Welcome to Study-Part!"})

# # @app.route('/upload', methods=['POST'])
# # def upload_image():
# #     if 'image' not in request.files:
# #         return jsonify({"error": "No image part"}), 400
# #     file = request.files['image']
# #     if file.filename == '':
# #         return jsonify({"error": "No selected file"}), 400
# #     if file:
# #         # Sanitize and save image
# #         filename = os.path.basename(file.filename)
# #         image_path = os.path.join(UPLOAD_FOLDER, filename)
# #         file.save(image_path)
# #         return jsonify({"image_path": image_path}), 200


# # @app.route('/segment', methods=['POST'])
# # def segment():
# #     data = request.json
# #     image_path = data.get('image_path')
# #     bounding_box = data.get('bounding_box')

# #     try:
# #         rle_masks, confidences = segment_image(image_path, bounding_box)
# #         segmented_image_path = os.path.join('segmented', os.path.basename(image_path))
# #         os.makedirs('segmented', exist_ok=True)

# #         # Process and save the segmented image
# #         segmented_image = Image.open(image_path).convert('RGBA')
# #         for mask in rle_masks:
# #             mask_image = mask_utils.decode(mask)
# #             mask_image = np.stack((mask_image,) * 3, axis=-1) * 255
# #             mask_image = Image.fromarray(mask_image.astype(np.uint8))
# #             segmented_image.paste(mask_image, (0, 0), mask_image)
# #         segmented_image.save(segmented_image_path)

# #         # Return the correct URL to access the static file
# #         segmented_image_url = f"http://localhost:5000/segmented/{os.path.basename(image_path)}"
# #         return jsonify({'segmented_image_path': segmented_image_url}), 200

# #     except Exception as e:
# #         return jsonify({"error": str(e)}), 500


# # @app.route('/uploads/<filename>', methods=['GET'])
# # def serve_uploaded_image(filename):
# #     return send_from_directory(UPLOAD_FOLDER, filename)

# # @app.route('/segmented/<filename>', methods=['GET'])
# # def serve_segmented_image(filename):
# #     return send_from_directory(SEGMENTED_FOLDER, filename)

# # if __name__ == '__main__':
# #     app.run(debug=True)

# # # backend/app.py
# # # from flask import Flask, jsonify, request
# # # from flask_cors import CORS
# # # from sam import segment_image
# # # import os
# # # import numpy as np
# # # from PIL import Image
# # # import io
# # # from firebase_admin import credentials, firestore, initialize_app

# # # # Initialize Firebase Admin SDK
# # # cred = credentials.Certificate('path/to/your/serviceAccountKey.json')
# # # initialize_app(cred)
# # # db = firestore.client()

# # # app = Flask(__name__)
# # # CORS(app)

# # # @app.route('/')
# # # def home():
# # #     return jsonify({"message": "Welcome to Study-Part!"})

# # # @app.route('/api/upload', methods=['POST'])
# # # def upload_image():
# # #     if 'image' not in request.files:
# # #         return jsonify({"error": "No image part"}), 400
# # #     file = request.files['image']
# # #     if file.filename == '':
# # #         return jsonify({"error": "No selected file"}), 400
# # #     if file:
# # #         image_path = os.path.join('uploads', file.filename)
# # #         os.makedirs('uploads', exist_ok=True)
# # #         file.save(image_path)
# # #         return jsonify({"image_path": image_path}), 200

# # # @app.route('/api/segment', methods=['POST'])
# # # def segment():
# # #     data = request.json
# # #     image_path = data.get('image_path')
# # #     bounding_box = data.get('bounding_box')
# # #     rle_masks, confidences = segment_image(image_path, bounding_box)
# # #     segmented_image_path = os.path.join('segmented', os.path.basename(image_path))
# # #     os.makedirs('segmented', exist_ok=True)
# # #     segmented_image = Image.open(image_path).convert('RGBA')
# # #     for mask in rle_masks:
# # #         mask_image = mask_utils.decode(mask)
# # #         mask_image = np.stack((mask_image,) * 3, axis=-1) * 255
# # #         mask_image = Image.fromarray(mask_image.astype(np.uint8))
# # #         segmented_image.paste(mask_image, (0, 0), mask_image)
# # #     segmented_image.save(segmented_image_path)
# # #     return jsonify({'segmented_image_path': segmented_image_path}), 200

# # # @app.route('/api/students', methods=['GET'])
# # # def get_students():
# # #     students = []
# # #     users_ref = db.collection('users')
# # #     query_ref = users_ref.where('role', '==', 'student')
# # #     docs = query_ref.stream()
# # #     for doc in docs:
# # #         students.append(doc.to_dict())
# # #     return jsonify(students), 200

# # # if __name__ == '__main__':
# # #     app.run(debug=True)
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# from sam import segment_image
# import os
# import numpy as np
# from PIL import Image
# import io
# from pycocotools import mask as mask_utils
# import cloudinary
# import cloudinary.uploader
# import cloudinary.api

# # Initialize Cloudinary
# cloudinary.config(
#     cloud_name='duvdshhrz',
#     api_key='784524479772363',
#     api_secret='wVfzkP0KX1wSKdkP2sT2kY13SHs'
# )

# app = Flask(__name__)
# CORS(app)

# @app.route('/')
# def home():
#     return jsonify({"message": "Welcome to Study-Part!"})

# @app.route('/upload', methods=['POST'])
# def upload_image():
#     if 'image' not in request.files:
#         return jsonify({"error": "No image part"}), 400
#     file = request.files['image']
#     if file.filename == '':
#         return jsonify({"error": "No selected file"}), 400
#     if file:
#         # Upload image to Cloudinary
#         upload_result = cloudinary.uploader.upload(file)
#         image_url = upload_result['secure_url']
#         return jsonify({"image_url": image_url}), 200

# @app.route('/segment', methods=['POST'])
# def segment():
#     data = request.json
#     image_url = data.get('image_url')
#     bounding_box = data.get('bounding_box')

#     try:
#         # Download image from Cloudinary
#         response = requests.get(image_url)
#         image = Image.open(io.BytesIO(response.content))

#         # Perform segmentation
#         rle_masks, confidences = segment_image(image, bounding_box)

#         # Save segmented parts to Cloudinary
#         segmented_urls = []
#         for idx, mask in enumerate(rle_masks):
#             mask_image = mask_utils.decode(mask)
#             mask_image = np.stack((mask_image,) * 3, axis=-1) * 255
#             mask_image = Image.fromarray(mask_image.astype(np.uint8))
#             segmented_image = Image.new('RGBA', image.size)
#             segmented_image.paste(mask_image, (0, 0), mask_image)

#             # Save segmented image to Cloudinary
#             segmented_image_buffer = io.BytesIO()
#             segmented_image.save(segmented_image_buffer, format='PNG')
#             segmented_image_buffer.seek(0)
#             upload_result = cloudinary.uploader.upload(segmented_image_buffer, public_id=f'segmented_part_{idx}')
#             segmented_urls.append(upload_result['secure_url'])

#         return jsonify({'segmented_urls': segmented_urls, 'confidences': confidences}), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)
# -----------------------above works -------------
# from flask import Flask, jsonify, request
# from flask_cors import CORS
# from sam import segment_image
# import os
# import numpy as np
# from PIL import Image
# import io
# from pycocotools import mask as mask_utils
# import cloudinary
# import cloudinary.uploader
# import cloudinary.api
# import requests

# # Initialize Cloudinary
# cloudinary.config(
#     cloud_name='duvdshhrz',
#     api_key='784524479772363',
#     api_secret='wVfzkP0KX1wSKdkP2sT2kY13SHs'
# )

# app = Flask(__name__)
# CORS(app)

# @app.route('/')
# def home():
#     return jsonify({"message": "Welcome to Study-Part!"})

# @app.route('/upload', methods=['POST'])
# def upload_image():
#     if 'image' not in request.files:
#         return jsonify({"error": "No image part"}), 400
#     file = request.files['image']
#     if file.filename == '':
#         return jsonify({"error": "No selected file"}), 400
#     if file:
#         # Upload image to Cloudinary
#         upload_result = cloudinary.uploader.upload(file)
#         image_url = upload_result['secure_url']
#         return jsonify({"image_url": image_url}), 200

# @app.route('/segment', methods=['POST'])
# def segment():
#     data = request.json
#     image_url = data.get('image_url')
#     bounding_box = data.get('bounding_box')

#     try:
#         # Download image from Cloudinary
#         response = requests.get(image_url)
#         image = Image.open(io.BytesIO(response.content))

#         # Perform segmentation
#         rle_masks, confidences = segment_image(image, bounding_box)

#         # Save segmented parts to Cloudinary
#         segmented_urls = []
#         for idx, mask in enumerate(rle_masks):
#             mask_image = mask_utils.decode(mask)
#             mask_image = np.stack((mask_image,) * 3, axis=-1) * 255
#             mask_image = Image.fromarray(mask_image.astype(np.uint8))
#             segmented_image = Image.new('RGBA', image.size)
#             segmented_image.paste(mask_image, (0, 0), mask_image)

#             # Save segmented image to Cloudinary
#             segmented_image_buffer = io.BytesIO()
#             segmented_image.save(segmented_image_buffer, format='PNG')
#             segmented_image_buffer.seek(0)
#             upload_result = cloudinary.uploader.upload(segmented_image_buffer, public_id=f'segmented_part_{idx}')
#             segmented_urls.append(upload_result['secure_url'])

#         return jsonify({'segmented_urls': segmented_urls, 'confidences': confidences}), 200

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     app.run(debug=True)

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

        # Save segmented parts to Cloudinary
        # segmented_urls = []
        # for idx, mask in enumerate(rle_masks):
        #     mask_image = mask_utils.decode(mask)
        #     if mask_image.dtype != np.uint8:
        #         mask_image = mask_image.astype(np.uint8)
        #     mask_image = np.stack((mask_image,) * 3, axis=-1) * 255
        #     mask_image = Image.fromarray(mask_image.astype(np.uint8))
        #     segmented_image = Image.new('RGBA', image.size)
        #     segmented_image.paste(mask_image, (0, 0), mask_image)

        #     # Save segmented image to Cloudinary
        #     segmented_image_buffer = io.BytesIO()
        #     segmented_image.save(segmented_image_buffer, format='PNG')
        #     segmented_image_buffer.seek(0)
        #     upload_result = cloudinary.uploader.upload(segmented_image_buffer, public_id=f'segmented_part_{idx}')
        #     segmented_urls.append(upload_result['secure_url'])
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


# @app.route('/segment', methods=['POST'])
# def segment():
#     data = request.json
#     image_url = data.get('image_url')
#     bounding_box = data.get('bounding_box')

#     try:
#         # Download image from Cloudinary
#         response = requests.get(image_url)
#         image = Image.open(io.BytesIO(response.content))

#         # Ensure bounding_box is in the correct format
#         bounding_box = {
#             'left': int(bounding_box['left']),
#             'top': int(bounding_box['top']),
#             'width': int(bounding_box['width']),
#             'height': int(bounding_box['height'])
#         }

#         # Perform segmentation
#         rle_masks, confidences = segment_image(image, bounding_box)

#         # Save segmented parts to Cloudinary
#         segmented_urls = []
#         for idx, mask in enumerate(rle_masks):
#             mask_image = mask_utils.decode(mask)
#             mask_image = np.stack((mask_image,) * 3, axis=-1) * 255
#             mask_image = Image.fromarray(mask_image.astype(np.uint8))
#             segmented_image = Image.new('RGBA', image.size)
#             segmented_image.paste(mask_image, (0, 0), mask_image)

#             # Save segmented image to Cloudinary
#             segmented_image_buffer = io.BytesIO()
#             segmented_image.save(segmented_image_buffer, format='PNG')
#             segmented_image_buffer.seek(0)
#             upload_result = cloudinary.uploader.upload(segmented_image_buffer, public_id=f'segmented_part_{idx}')
#             segmented_urls.append(upload_result['secure_url'])

#         return jsonify({'segmented_urls': segmented_urls, 'confidences': confidences}), 200

#     except Exception as e:
#         app.logger.error(f"Error during segmentation: {str(e)}")
#         return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
