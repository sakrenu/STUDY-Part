import torch
import numpy as np
import cv2
from PIL import Image
import os
import uuid

# Directory to save masks
OUTPUT_DIR = "static/masks"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def segment_image(image_path, bounding_box, model):
    """
    Segment the image and generate a cutout for the region.
    Used by the /segment endpoint (e.g., for Home.js).
    """
    # Convert bounding box to correct format
    bbox = [
        int(bounding_box[0]),  # x_min
        int(bounding_box[1]),  # y_min
        int(bounding_box[0] + bounding_box[2]),  # x_max
        int(bounding_box[1] + bounding_box[3])   # y_max
    ]

    # Perform segmentation
    results = model(image_path, bboxes=[bbox], device='cuda' if torch.cuda.is_available() else 'cpu',
                    retina_masks=True, imgsz=1024, conf=0.4, iou=0.9)

    # Extract masks
    masks = results[0].masks.data.cpu().numpy().astype(np.uint8)
    
    # Load original image
    original_image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)  # Convert to RGB

    cutouts = []

    for mask in masks:
        mask_resized = cv2.resize(mask, (original_image.shape[1], original_image.shape[0]), interpolation=cv2.INTER_NEAREST)
        mask_resized = (mask_resized > 0).astype(np.uint8) * 255
        
        # Create a 4-channel image (RGBA)
        cutout_rgba = np.zeros((*original_image.shape[:2], 4), dtype=np.uint8)
        cutout_rgba[:, :, :3] = original_image  # Copy RGB channels
        cutout_rgba[:, :, 3] = mask_resized  # Set alpha channel
        
        cutouts.append(cutout_rgba)

    return cutouts

def segment_image_for_label(image_path, bounding_box, model):
    """
    Segment the image and generate a translucent colored mask for the region.
    Used by the /segment_label endpoint (e.g., for Label.js).
    Returns the mask as a URL.
    """
    # Convert bounding box to correct format
    bbox = [
        int(bounding_box[0]),  # x_min
        int(bounding_box[1]),  # y_min
        int(bounding_box[0] + bounding_box[2]),  # x_max
        int(bounding_box[1] + bounding_box[3])   # y_max
    ]

    # Perform segmentation
    results = model(image_path, bboxes=[bbox], device='cuda' if torch.cuda.is_available() else 'cpu',
                    retina_masks=True, imgsz=1024, conf=0.4, iou=0.9)

    # Extract masks
    masks = results[0].masks.data.cpu().numpy().astype(np.uint8)
    
    # Load original image
    original_image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)  # Convert to RGB

    # Define colors for different regions (similar to the anatomical diagram)
    colors = [
        (255, 105, 180),  # Pink
        (0, 255, 255),    # Cyan
        (255, 255, 0),    # Yellow
        (0, 0, 255),      # Blue
    ]

    mask_urls = []

    for idx, mask in enumerate(masks):
        # Resize mask to match the original image dimensions
        mask_resized = cv2.resize(mask, (original_image.shape[1], original_image.shape[0]), interpolation=cv2.INTER_NEAREST)
        mask_resized = (mask_resized > 0).astype(np.uint8) * 255

        # Create a colored mask
        color = colors[idx % len(colors)]  # Cycle through colors
        colored_mask = np.zeros_like(original_image)
        for c in range(3):
            colored_mask[:, :, c] = np.where(mask_resized == 255, color[c], 0)

        # Create a 4-channel image (RGBA) for the mask
        mask_rgba = np.zeros((*original_image.shape[:2], 4), dtype=np.uint8)
        mask_rgba[:, :, :3] = colored_mask  # Set RGB channels
        mask_rgba[:, :, 3] = mask_resized  # Set alpha channel (255 where mask is present)

        # Save the mask as a PNG file
        mask_filename = f"mask_{uuid.uuid4()}.png"
        mask_path = os.path.join(OUTPUT_DIR, mask_filename)
        cv2.imwrite(mask_path, cv2.cvtColor(mask_rgba, cv2.COLOR_RGBA2BGRA))

        # Generate URL for the mask
        mask_url = f"/{mask_path}"
        mask_urls.append(mask_url)

    return mask_urls, {
        'x': int(bounding_box[0]),
        'y': int(bounding_box[1]),
        'width': int(bounding_box[2]),
        'height': int(bounding_box[3])
    }