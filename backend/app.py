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
import cv2
from sam import segment_image
from sam_quiz import segment_quiz_image, get_image_without_masks
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import cv2
import json
from ultralytics import FastSAM
from ultralytics.models.fastsam import FastSAM
import uuid
import base64
import hashlib

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

# Define different colors for different regions
HIGHLIGHT_COLORS = [
    (0, 255, 0),    # Green
    (255, 0, 0),    # Red
    (0, 0, 255),    # Blue
    (255, 255, 0),  # Yellow
    (255, 0, 255),  # Magenta
    (0, 255, 255),  # Cyan
]

def get_image_without_masks(image_path, results):
    """
    Creates an image with transparent holes where segments were removed
    """
    # Read the original image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image from {image_path}")
    
    # Convert to RGBA
    rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    
    # Get the mask from results
    if results and len(results[0].masks.data) > 0:
        mask = results[0].masks.data[0].cpu().numpy()
        
        # Resize mask to match image size if needed
        if mask.shape[:2] != img.shape[:2]:
            mask = cv2.resize(mask, (img.shape[1], img.shape[0]), interpolation=cv2.INTER_NEAREST)
        
        # Convert to boolean mask
        mask = mask > 0
        
        # Make masked areas transparent
        rgba[mask] = [0, 0, 0, 0]
    
    return rgba

def process_image_with_sam(image_path, bounding_box, region_index=0):
    try:
        # Read image
        image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
        if image is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        # Ensure bounding box values are valid
        bbox = {
            'x': max(0, int(float(bounding_box.get('x', bounding_box.get('left', 0))))),
            'y': max(0, int(float(bounding_box.get('y', bounding_box.get('top', 0))))),
            'width': min(int(float(bounding_box.get('width', 0))), image.shape[1]),
            'height': min(int(float(bounding_box.get('height', 0))), image.shape[0])
        }
        
        print(f"Debug - Processed bbox: {bbox}")
        
        # Perform segmentation
        results = model(
            image_path,
            device=device,
            retina_masks=True,
            imgsz=1024,
            conf=0.4,
            iou=0.9,
            bboxes=[[bbox['x'], bbox['y'], bbox['x'] + bbox['width'], bbox['y'] + bbox['height']]]
        )
        
        if not results or len(results) == 0 or not hasattr(results[0], 'masks') or len(results[0].masks.data) == 0:
            raise ValueError("No masks generated by the model")
        
        # Create cutout with transparency
        mask = results[0].masks.data[0].cpu().numpy()
        mask = cv2.resize(mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)
        mask = mask > 0
        
        # Convert to RGBA
        rgba = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
        rgba[~mask] = [0, 0, 0, 0]  # Set non-masked areas to transparent
        
        # Create outline with different color for each region
        outline = image.copy()
        contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        color = HIGHLIGHT_COLORS[region_index % len(HIGHLIGHT_COLORS)]  # Cycle through colors
        cv2.drawContours(outline, contours, -1, color, 2)  # Draw colored outline
        
        # Save temporary files with unique names
        temp_id = str(uuid.uuid4())[:8]
        temp_paths = {
            'cutout': f'temp_cutout_{temp_id}.png',
            'outline': f'temp_outline_{temp_id}.png'
        }
        
        # Save the cutout and outline images
        cv2.imwrite(temp_paths['cutout'], rgba)
        cv2.imwrite(temp_paths['outline'], outline)
        
        # Upload to Cloudinary
        urls = {}
        for key, path in temp_paths.items():
            response = cloudinary.uploader.upload(
                path,
                resource_type="image",
                allowed_cors_origins=["http://localhost:3000"],
                access_mode="anonymous"
            )
            urls[key] = response['secure_url']
            os.remove(path)
        
        return {
            'cutout': urls['cutout'],
            'outline': urls['outline'],
            'position': {
                'x': float(bbox['x']),
                'y': float(bbox['y']),
                'width': float(bbox['width']),
                'height': float(bbox['height'])
            },
            'originalSize': {
                'width': image.shape[1],
                'height': image.shape[0]
            }
        }
        
    except Exception as e:
        print(f"Debug - Error in process_image_with_sam: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

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
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
            
        image_url = data.get('image_url')
        bounding_box = data.get('bounding_box')
        teacher_id = data.get('teacher_id')
        region_index = data.get('region_index', 0)  # Get region index
        
        if not image_url:
            return jsonify({'error': 'Missing image_url parameter'}), 400
        if not bounding_box:
            return jsonify({'error': 'Missing bounding_box parameter'}), 400
        if not teacher_id:
            return jsonify({'error': 'Missing teacher_id parameter'}), 400
        
        print(f"Debug - Received request with: image_url={image_url}, bounding_box={bounding_box}, teacher_id={teacher_id}, region_index={region_index}")
        
        # Download image from Cloudinary
        temp_path = f'temp_original_{str(uuid.uuid4())[:8]}.jpg'
        try:
            response = requests.get(image_url)
            response.raise_for_status()
            with open(temp_path, 'wb') as f:
                f.write(response.content)
            
            # Validate image was downloaded
            if not os.path.exists(temp_path):
                raise ValueError("Failed to save downloaded image")
                
            # Debug print image size
            image = cv2.imread(temp_path)
            if image is None:
                raise ValueError("Failed to read downloaded image")
            print(f"Debug - Image shape: {image.shape}")
            print(f"Debug - Bounding box: {bounding_box}")
            
            # Process image with SAM
            processed_data = process_image_with_sam(temp_path, bounding_box, region_index)
            
            if not processed_data:
                raise ValueError("Failed to process image")
                
            print(f"Debug - Processed data: {processed_data}")
            
            return jsonify({
                'segmented_urls': [processed_data['cutout']],
                'cutout': processed_data['cutout'],
                'highlighted_outline': processed_data['outline'],
                'original_with_highlight': processed_data['outline'],
                'position': processed_data['position'],
                'originalSize': processed_data['originalSize']
            })
            
        except requests.exceptions.RequestException as e:
            print(f"Debug - Download error: {str(e)}")
            return jsonify({'error': f'Failed to download image: {str(e)}'}), 500
        except Exception as e:
            print(f"Debug - Processing error: {str(e)}")
            return jsonify({'error': f'Failed to process image: {str(e)}'}), 500
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        print(f"Debug - General error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/save_quiz', methods=['POST'])
def save_quiz():
    """
    Endpoint to save quiz data to Firestore after metadata is provided.
    """
    data = request.json
    teacher_id = data.get('teacher_id')
    image_url = data.get('image_url')
    segmented_urls = data.get('segmented_urls')
    puzzle_outline_url = data.get('puzzle_outline_url')
    positions = data.get('positions')
    meta = data.get('meta')

    try:
        # Create quiz document in Firestore
        quiz_ref = db.collection('quizzes').document()
        quiz_data = {
            'teacher_id': teacher_id,
            'image_url': image_url,
            'segments': segmented_urls,
            'puzzle_outline': puzzle_outline_url,
            'positions': positions,
            'meta': meta,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        quiz_ref.set(quiz_data)

        # Update teacher's document with quiz reference
        teacher_ref = db.collection('teachers').document(teacher_id)
        teacher_ref.update({
            'quizzes': firestore.ArrayUnion([quiz_ref.id])
        })

        return jsonify({'quiz_id': quiz_ref.id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/segment_quiz', methods=['POST'])
def segment_quiz():
    """
    Endpoint to process images for quiz creation without saving to Firestore.
    """
    data = request.json
    image_url = data.get('image_url')
    teacher_id = data.get('teacher_id')

    try:
        # Download the image and save it locally
        response = requests.get(image_url)
        temp_image_path = "temp_quiz_image.jpg"
        with open(temp_image_path, 'wb') as f:
            f.write(response.content)

        # Get segmentation results with positions
        const_output = segment_quiz_image(temp_image_path)
        segmented_cutouts = const_output[0]
        puzzle_outline = const_output[1]
        positions = const_output[2]  # Get positions array

        segmented_urls = []
        for idx, cutout in enumerate(segmented_cutouts):
            cutout_image = Image.fromarray(cutout.astype(np.uint8))
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

        # Upload puzzle outline
        puzzle_outline_rgba = cv2.cvtColor(puzzle_outline, cv2.COLOR_BGRA2RGBA)
        pil_outline = Image.fromarray(puzzle_outline_rgba)
        outline_buffer = io.BytesIO()
        pil_outline.save(outline_buffer, format='PNG')
        outline_buffer.seek(0)

        upload_result_outline = cloudinary.uploader.upload(
            outline_buffer, 
            public_id=f'puzzle_outline_{uuid.uuid4().hex[:8]}', 
            format="png"
        )
        puzzle_outline_url = upload_result_outline['secure_url']

        # Return segmentation results without saving to Firestore
        return jsonify({
            'segmented_urls': segmented_urls,
            'puzzle_outline_url': puzzle_outline_url,
            'positions': positions
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_all_quizzes', methods=['GET'])
def get_all_quizzes():
    """
    Endpoint to get all available quizzes for students.
    """
    try:
        # Query Firestore to get all quizzes
        quizzes_ref = db.collection('quizzes')
        quizzes = []
        
        for doc in quizzes_ref.stream():
            quiz_data = doc.to_dict()
            quizzes.append({
                'id': doc.id,
                'meta': quiz_data.get('meta', {}),
                'created_at': quiz_data.get('created_at')
            })
        
        # Sort quizzes by creation date (newest first)
        quizzes.sort(key=lambda x: x.get('created_at', 0), reverse=True)
        
        return jsonify({'quizzes': quizzes}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_quiz/<quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    """
    Endpoint to get a specific quiz by ID.
    """
    try:
        quiz_ref = db.collection('quizzes').document(quiz_id)
        quiz_data = quiz_ref.get()
        
        if not quiz_data.exists:
            return jsonify({'error': 'Quiz not found'}), 404
            
        quiz_dict = quiz_data.to_dict()
        
        # Return only the necessary fields
        return jsonify({
            'meta': quiz_dict.get('meta', {}),
            'image_url': quiz_dict.get('image_url', ''),
            'segments': quiz_dict.get('segments', []),
            'puzzle_outline': quiz_dict.get('puzzle_outline', ''),
            'positions': quiz_dict.get('positions', []),
            'original_size': quiz_dict.get('original_size', {'width': 800, 'height': 600})
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/track_completion', methods=['POST'])
def track_completion():
    """
    Endpoint to track when a student completes a quiz.
    """
    try:
        data = request.json
        quiz_id = data.get('quiz_id')
        student_id = data.get('student_id', 'anonymous')
        completion_time = data.get('completion_time')
        
        # Save completion record to Firestore
        completion_ref = db.collection('quiz_completions').document()
        completion_data = {
            'quiz_id': quiz_id,
            'student_id': student_id,
            'completion_time': completion_time,
            'completed_at': firestore.SERVER_TIMESTAMP
        }
        completion_ref.set(completion_data)
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/validate_placement', methods=['POST'])
def validate_placement():
    try:
        data = request.json
        quiz_id = data['quiz_id']
        segment_index = data['segment_index']
        user_position = data['position']
        
        quiz_ref = db.collection('quizzes').document(quiz_id)
        quiz_data = quiz_ref.get().to_dict()
        original_pos = quiz_data['quiz_data']['positions'][segment_index]
        
        # Calculate acceptable bounds (10% tolerance)
        tolerance = 0.1
        is_correct = (
            abs(user_position['x'] - original_pos['x']) < original_pos['width'] * tolerance and
            abs(user_position['y'] - original_pos['y']) < original_pos['height'] * tolerance
        )
        
        return jsonify({'correct': is_correct}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/add_note', methods=['POST'])
def add_note():
    try:
        data = request.json
        image_url = data.get('image_url')
        segment_index = data.get('segment_index')
        note = data.get('note')
        teacher_id = data.get('teacher_id')
        lesson_id = data.get('lesson_id')  # New parameter

        if not all([image_url, segment_index is not None, note, teacher_id, lesson_id]):
            return jsonify({'error': 'Missing required parameters'}), 400

        # Reference to the specific segment document
        segment_ref = db.collection('Teachers').document(teacher_id) \
                       .collection('Lessons').document(lesson_id) \
                       .collection('Segments').document(f'segment_{segment_index}')

        # Check if the segment exists
        segment_doc = segment_ref.get()
        if not segment_doc.exists:
            # If segment doesn't exist, create it with minimal data (ideally this should already exist)
            segment_ref.set({
                'boundingBox': {},  # Placeholder, should be set earlier
                'segmentCoordinates': [],  # Placeholder
                'notes': note,
                'highlightedOutlineUrl': ''  # Placeholder
            })
        else:
            # Update only the notes field
            segment_ref.update({
                'notes': note
            })

        return jsonify({"message": "Note added successfully!"}), 200

    except Exception as e:
        print(f"Error in add_note: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/get_lessons', methods=['GET'])
def get_lessons():
    try:
        teacher_id = request.args.get('teacher_id')
        if not teacher_id:
            return jsonify({'error': 'Missing teacher_id parameter'}), 400

        # Fetch all lessons for the teacher
        lessons_ref = db.collection('Teachers').document(teacher_id).collection('Lessons')
        lessons_docs = lessons_ref.stream()

        lessons_list = []
        for lesson_doc in lessons_docs:
            lesson_data = lesson_doc.to_dict()
            lesson_id = lesson_doc.id

            # Fetch segments for this lesson
            segments_ref = lessons_ref.document(lesson_id).collection('Segments')
            segments_docs = segments_ref.stream()
            segments = [
                {
                    'id': seg_doc.id,
                    **seg_doc.to_dict()
                }
                for seg_doc in segments_docs
            ]

            lessons_list.append({
                'id': lesson_id,
                'originalImageUrl': lesson_data.get('originalImageUrl', ''),
                'title': lesson_data.get('title', f"Lesson {lesson_data.get('createdAt', '')}"),
                'createdAt': lesson_data.get('createdAt', ''),
                'segments': segments
            })

        return jsonify({'lessons': lessons_list}), 200

    except Exception as e:
        print(f"Error in get_lessons: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
