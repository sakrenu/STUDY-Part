import os
import cv2
import numpy as np
import torch
from ultralytics import SAM

# Initialize ultralytics SAM model (using a lighter checkpoint suitable for small GPUs)
ultra_model = SAM("sam2.1_l.pt")
ultra_model.info()

def filter_top_masks_by_area(masks, top_n=10, iou_threshold=0.5):
    """
    Filters a set of boolean masks by:
      - Sorting them in descending order by area.
      - Iteratively adding a mask only if it does not overlap (above an IoU threshold)
        with any already selected mask.
    
    Parameters:
      masks: A numpy array of shape (num_masks, H, W) containing boolean masks.
      top_n: Maximum number of masks to select.
      iou_threshold: Overlap threshold. If the IoU between a candidate mask and any
                     already kept mask exceeds this value, the candidate is skipped.
    
    Returns:
      A list of filtered boolean masks.
    """
    # Compute area (number of True pixels) for each mask
    mask_areas = [mask.sum() for mask in masks]
    # Get indices that would sort the masks by area descending
    sorted_indices = np.argsort(mask_areas)[::-1]
    sorted_masks = [masks[i] for i in sorted_indices]

    filtered = []
    for mask in sorted_masks:
        keep = True
        for kept_mask in filtered:
            # Compute Intersection over Union (IoU)
            intersection = np.logical_and(mask, kept_mask).sum()
            union = np.logical_or(mask, kept_mask).sum()
            iou = intersection / union if union > 0 else 0
            if iou > iou_threshold:
                keep = False
                break
        if keep:
            filtered.append(mask)
        if len(filtered) >= top_n:
            break
    return filtered

def segment_quiz_image(image_path):
    """
    Processes an image for quiz creation segmentation using ultralytics SAM model.
    
    Parameters:
      image_path (str): The path to the input image.
    
    Returns:
      A list of cutout images (as RGBA numpy arrays) extracted from the original image.
    """
    # Load image using OpenCV (BGR) and convert to RGB.
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image from {image_path}")
    image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Run segmentation using the ultralytics SAM model.
    results = ultra_model(image_path)
    # Get the masks from the first result (assumes a single-image batch)
    masks_tensor = results[0].masks.data.cpu().numpy()  # shape: [num_masks, H, W]
    masks_bool = masks_tensor.astype(bool)
    
    # Filter to keep only the top masks by area with minimal overlap.
    filtered_masks = filter_top_masks_by_area(masks_bool, top_n=10, iou_threshold=0.5)
    
    cutouts = []
    for i, mask in enumerate(filtered_masks):
        # Convert the boolean mask to an 8-bit mask (0 or 255)
        mask_uint8 = mask.astype(np.uint8) * 255

        # Find the bounding box of the mask (skip if the mask is empty)
        coords = cv2.findNonZero(mask_uint8)
        if coords is None:
            continue
        x, y, w, h = cv2.boundingRect(coords)
        
        # Crop the original image and the corresponding mask
        img_crop = image_rgb[y:y+h, x:x+w]
        mask_crop = mask_uint8[y:y+h, x:x+w]
        
        # Convert the cropped RGB image to RGBA and use the mask as the alpha channel
        img_crop_rgba = cv2.cvtColor(img_crop, cv2.COLOR_RGB2RGBA)
        img_crop_rgba[:, :, 3] = mask_crop
        
        cutouts.append(img_crop_rgba)
    
    return cutouts

def get_image_without_masks(image_path):
    """
    Processes the image to remove areas covered by the filtered masks—creating transparent holes.
    
    Parameters:
      image_path (str): Path to the input image.
    
    Returns:
      image_bgra (numpy array): The processed image in BGRA format with holes where the masks were.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image from {image_path}")
    image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    results = ultra_model(image_path)
    masks_tensor = results[0].masks.data.cpu().numpy()
    masks_bool = masks_tensor.astype(bool)
    
    filtered_masks = filter_top_masks_by_area(masks_bool, top_n=10, iou_threshold=0.5)
    
    # Combine all filtered masks using logical OR.
    combined_mask = np.zeros(image_rgb.shape[:2], dtype=bool)
    for mask in filtered_masks:
        combined_mask = np.logical_or(combined_mask, mask)
    
    # Create an alpha channel: 0 for pixels inside the combined mask, 255 otherwise.
    alpha_channel = np.where(combined_mask, 0, 255).astype(np.uint8)
    
    # Merge with original R, G, B channels to form an RGBA image and convert to BGRA for OpenCV
    r, g, b = cv2.split(image_rgb)
    image_rgba = cv2.merge([r, g, b, alpha_channel])
    image_bgra = cv2.cvtColor(image_rgba, cv2.COLOR_RGBA2BGRA)
    
    return image_bgra 