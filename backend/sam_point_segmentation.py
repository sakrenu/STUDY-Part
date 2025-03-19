import onnxruntime as ort
import numpy as np
import cv2
import time
from PIL import Image
import torch
from segment_anything import SamPredictor, sam_model_registry

# Path to the ONNX model
ONNX_MODEL_PATH = r"D:\\abhin\\Comding\\ML\\Major Project\\StudyPart\\STUDY-Part\\backend\\onnx_models\\onnx_model.onnx"

# Initialize ONNX Runtime session
ort_session = ort.InferenceSession(ONNX_MODEL_PATH)

# Load SAM model for image embedding
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(device)
sam = sam_model_registry["vit_l"](checkpoint=r"backend\sam_vit_l_0b3195.pth").to(device)
predictor = SamPredictor(sam)

def get_image_embeddings(image_path):
    """
    Extract image embeddings using the SAM model's image encoder.
    """
    # Check if file exists
    import os
    if not os.path.isfile(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    # Load image in RGB format
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to load image: {image_path}")
    
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Set the image in the predictor and get embeddings
    predictor.set_image(image)
    image_embedding = predictor.get_image_embedding().cpu().numpy()
    return image_embedding

def generate_mask(image_embedding, points, labels, original_size):
    """
    Generate a segmentation mask using the ONNX model with point prompts.
    
    Args:
        image_embedding (np.ndarray): Image embeddings from the SAM encoder
        points (list): List of [x, y] coordinates in the original image space
        labels (list): List of labels (1 for positive, 0 for negative)
        original_size (tuple): Original image size (width, height)
    
    Returns:
        np.ndarray: Binary mask of shape (H, W) where H and W are the original height and width
    """
    # Convert points and labels to numpy arrays
    input_point = np.array(points)
    input_label = np.array(labels)

    # Prepare ONNX inputs
    onnx_coord = np.concatenate([input_point, np.array([[0.0, 0.0]])], axis=0)[None, :, :]
    onnx_label = np.concatenate([input_label, np.array([-1])], axis=0)[None, :].astype(np.float32)
    
    # Transform coordinates to the model's expected space
    onnx_coord = predictor.transform.apply_coords(onnx_coord, original_size[::-1]).astype(np.float32)  # Reverse to (height, width)
    
    # Dummy mask input and flag
    onnx_mask_input = np.zeros((1, 1, 256, 256), dtype=np.float32)
    onnx_has_mask_input = np.zeros(1, dtype=np.float32)

    # Prepare input dictionary for ONNX model
    ort_inputs = {
        "image_embeddings": image_embedding,
        "point_coords": onnx_coord,
        "point_labels": onnx_label,
        "mask_input": onnx_mask_input,
        "has_mask_input": onnx_has_mask_input,
        "orig_im_size": np.array(original_size[::-1], dtype=np.float32)  # (height, width)
    }

    # Run the ONNX model
    masks, _, _ = ort_session.run(None, ort_inputs)
    masks = masks > predictor.model.mask_threshold  # Apply threshold to get binary mask

    # Select the first mask and convert to uint8
    mask = masks[0, 0].astype(np.uint8) * 255  # Shape: (H, W)
    return mask

def segment_with_points(image_path, points, labels):
    """
    Perform point-based segmentation on an image using SAM with ONNX Runtime.
    
    Args:
        image_path (str): Path to the input image
        points (list): List of [x, y] coordinates in the original image space
        labels (list): List of labels (1 for positive, 0 for negative)
    
    Returns:
        np.ndarray: Binary mask of shape (H, W) where H and W are the original height and width
    """
    # Step 1: Get image embeddings
    image_embedding = get_image_embeddings(image_path)

    # Step 2: Get original image size
    image = Image.open(image_path)
    original_size = image.size  # (width, height)

    # Step 3: Generate the mask using points
    mask = generate_mask(image_embedding, points, labels, original_size)

    return mask

# Example usage
if __name__ == "__main__":
    # Example inputs
    start_time = time.time()
    image_path = r"D:\abhin\Comding\ML\Major Project\StudyPart\STUDY-Part\backend\output_segmented.png"
    points = [[500, 300], [600, 400], [700, 200]]  # [x, y] in original image coordinates
    labels = [1, 1, 0]  # 1 for positive (foreground), 0 for negative (background)

    # Generate mask
    mask = segment_with_points(image_path, points, labels)

    # Save the mask for visualization
    cv2.imwrite("output_mask.png", mask)
    end_time = time.time()
    execution_time = end_time - start_time
    print(f"Execution time: {execution_time} seconds")
    print("Mask saved as output_mask.png")