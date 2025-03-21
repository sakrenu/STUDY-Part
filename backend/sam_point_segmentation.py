import numpy as np
import cv2
import time
from PIL import Image
import torch
from segment_anything import SamPredictor, sam_model_registry

# Load SAM model
device = 'cpu'  # or 'cuda' if available
print(device)
sam = sam_model_registry["vit_h"](checkpoint=r"sam_vit_h_4b8939.pth").to(device)
predictor = SamPredictor(sam)

def get_image_embeddings(image_path):
    """
    Extract image embeddings using the SAM model's image encoder.
    """
    start_time = time.time()
    import os
    if not os.path.isfile(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Failed to load image: {image_path}")
    
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    predictor.set_image(image)
    image_embedding = predictor.get_image_embedding().cpu().numpy()
    end_time = time.time()
    execution_time = end_time - start_time
    print(f"Embedding time: {execution_time} seconds")

    return image_embedding

def generate_mask(image_embedding, points, labels, original_size):
    """
    Generate a segmentation mask using PyTorch SAM with point prompts.
    """
    # Convert to tensor and move to device
    image_embedding_tensor = torch.from_numpy(image_embedding).to(device)
    
    # Set the image embedding in the predictor
    predictor.features = image_embedding_tensor
    predictor.original_size = original_size[::-1]  # (height, width)
    
    # Convert points for the predictor
    input_points = np.array(points)
    input_labels = np.array(labels)
    
    # Get the mask prediction
    masks, scores, logits = predictor.predict(
        point_coords=input_points,
        point_labels=input_labels,
        multimask_output=False
    )
    
    # Convert the mask to a binary image
    mask = masks[0].astype(np.uint8) * 255
    return mask

def segment_with_points(image_path, points, labels):
    """
    Perform point-based segmentation on an image using SAM.
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