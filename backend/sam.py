import torch
import numpy as np
import cv2
# from fastsam import FastSAM
from PIL import Image
from ultralytics.models.fastsam import FastSAM


def segment_image(image_path, bounding_box):
    # Check if GPU is available
    device = 'cuda' if torch.cuda.is_available() else 'cpu'

    # Load the FastSAM model
    model = FastSAM("FastSAM-s.pt").to(device)


    # Convert bounding box to correct format
    bounding_box = [
        int(bounding_box[0]),  # x_min
        int(bounding_box[1]),  # y_min
        int(bounding_box[0] + bounding_box[2]),  # x_max
        int(bounding_box[1] + bounding_box[3])   # y_max
    ]

    # Perform segmentation
    results = model(image_path, bboxes=[bounding_box])

    # Extract masks
    masks = results[0].masks.data.cpu().numpy().astype(np.uint8)
    
    # Load original image
    original_image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)  # Convert to RGB

    cutouts = []
    transparent_cutouts = []

    for mask in masks:
        mask_resized = cv2.resize(mask, (original_image.shape[1], original_image.shape[0]), interpolation=cv2.INTER_NEAREST)
        mask_resized = (mask_resized > 0).astype(np.uint8) * 255
        
        # Create a 4-channel image (RGBA)
        cutout_rgba = np.zeros((*original_image.shape[:2], 4), dtype=np.uint8)
        cutout_rgba[:, :, :3] = original_image  # Copy RGB channels
        cutout_rgba[:, :, 3] = mask_resized  # Set alpha channel
        
        # Crop to bounding box
        x_min, y_min, x_max, y_max = bounding_box
        cutout_cropped = cutout_rgba[y_min:y_max, x_min:x_max]

        # Add a visible outline to the cutout
        contours, _ = cv2.findContours(mask_resized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        outline_color = (0, 255, 0, 255)  # Green outline (RGBA)
        outline_thickness = 3
        for contour in contours:
            cv2.drawContours(cutout_cropped, [contour], -1, outline_color, outline_thickness)

        cutouts.append(cutout_cropped)

    return cutouts



