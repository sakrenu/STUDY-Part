import os
import cv2
import numpy as np
import torch
from ultralytics import SAM

# Check if CUDA is available and set the device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Initialize ultralytics SAM model with GPU support
ultra_model = SAM("mobile_sam.pt")
ultra_model.to(device)  # Move model to GPU if available
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
    Processes an image for quiz creation segmentation using ultralytics SAM model,
    and also processes the image to remove areas covered by masks to create a puzzle outline.
    
    Parameters:
      image_path (str): The path to the input image.
    
    Returns:
      A tuple (cutouts, puzzle_outline) where:
         - cutouts is a list of cutout images (as RGBA numpy arrays) representing segmented parts.
         - puzzle_outline is a BGRA numpy array of the original image with masks removed.
    """
    # Load image using OpenCV (BGR) and convert to RGB.
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image from {image_path}")
    image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Run segmentation using the ultralytics SAM model with GPU
    with torch.cuda.amp.autocast() if torch.cuda.is_available() else torch.no_grad():
        results = ultra_model(image_path)
    
    # Get the masks from the first result (assumes a single-image batch)
    masks_tensor = results[0].masks.data
    if torch.cuda.is_available():
        masks_tensor = masks_tensor.cpu()  # Move to CPU for numpy operations
    masks_bool = masks_tensor.numpy().astype(bool)
    
    # Filter to keep only the top masks by area with minimal overlap.
    filtered_masks = filter_top_masks_by_area(masks_bool, top_n=10, iou_threshold=0.5)
    
    cutouts = []
    positions = []
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

        positions.append({
            'x': x,
            'y': y,
            'width': w,
            'height': h,
            'original_width': img.shape[1],
            'original_height': img.shape[0]
        })
        
        cutouts.append(img_crop_rgba)
    
    # Also get the puzzle outline by removing masks using the same SAM results.
    puzzle_outline = get_image_without_masks(image_path, sam_results=results)
    
    return cutouts, puzzle_outline, positions

def get_image_without_masks(image_path, sam_results=None):
    """
    Processes the image to remove areas covered by the filtered masks—creating transparent holes.
    If `sam_results` is provided, it will be used instead of running SAM again.
    """
    print(f"[DEBUG] get_image_without_masks called with path: {image_path}")
    
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image from {image_path}")
    print(f"[DEBUG] Original image shape: {img.shape}")
    
    image_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    print(f"[DEBUG] Converted to RGB. Shape: {image_rgb.shape}")
    
    if sam_results is None:
        print(f"[DEBUG] Running SAM model on device: {device}")
        with torch.cuda.amp.autocast() if torch.cuda.is_available() else torch.no_grad():
            results = ultra_model(image_path)
    else:
        results = sam_results
        print("[DEBUG] Using provided SAM results")
    
    masks_tensor = results[0].masks.data
    print(f"[DEBUG] Got masks tensor. Shape: {masks_tensor.shape}")
    
    if torch.cuda.is_available():
        masks_tensor = masks_tensor.cpu()
    masks_bool = masks_tensor.numpy().astype(bool)
    print(f"[DEBUG] Converted to boolean masks. Shape: {masks_bool.shape}")
    
    filtered_masks = filter_top_masks_by_area(masks_bool, top_n=10, iou_threshold=0.5)
    print(f"[DEBUG] Filtered masks count: {len(filtered_masks)}")
    
    combined_mask = np.zeros(image_rgb.shape[:2], dtype=bool)
    for i, mask in enumerate(filtered_masks):
        combined_mask = np.logical_or(combined_mask, mask)
        print(f"[DEBUG] Added mask {i+1}. Total true pixels: {np.sum(combined_mask)}")
    
    alpha_channel = np.where(combined_mask, 0, 255).astype(np.uint8)
    print(f"[DEBUG] Created alpha channel. Shape: {alpha_channel.shape}")
    
    r, g, b = cv2.split(image_rgb)
    image_rgba = cv2.merge([r, g, b, alpha_channel])
    image_bgra = cv2.cvtColor(image_rgba, cv2.COLOR_RGBA2BGRA)
    print(f"[DEBUG] Final BGRA image shape: {image_bgra.shape}")
    
    return image_bgra 