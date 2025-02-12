import os
import cv2
import numpy as np
import torch
from segment_anything import SamAutomaticMaskGenerator, sam_model_registry

# Set up device (GPU if available)
DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# Configuration for the new SAM variant (adjust MODEL_TYPE and checkpoint as needed)
MODEL_TYPE = "vit_h"
CHECKPOINT_PATH = "sam_vit_h_4b8939.pth"

# Load SAM model and prepare mask generator
sam = sam_model_registry[MODEL_TYPE](checkpoint=CHECKPOINT_PATH)
sam.to(device=DEVICE)
mask_generator = SamAutomaticMaskGenerator(sam)


def get_cutout(image, seg_mask):
    """
    Create a cutout sticker from an image given a binary segmentation mask.
    - image: original image (RGB numpy array)
    - seg_mask: boolean mask with shape (H, W) indicating the segmented object.
    
    Returns an RGBA image cropped to the mask's bounding box.
    """
    mask_uint8 = (seg_mask.astype(np.uint8)) * 255

    # Split the RGB channels and merge with the alpha channel
    r, g, b = cv2.split(image)
    image_rgba = cv2.merge([r, g, b, mask_uint8])

    # Find the bounding box around the mask.
    coords = cv2.findNonZero(mask_uint8)
    if coords is None:
        return None  # No object detected
    x, y, w, h = cv2.boundingRect(coords)

    # Crop the RGBA image to the bounding box
    cutout = image_rgba[y:y+h, x:x+w]
    return cutout


def filter_overlapping_masks_by_accuracy(masks, iou_threshold=0.5):
    """
    Filters out masks with significant overlap by keeping only the one with the higher predicted_iou.
    
    Parameters:
      masks: List of dictionaries returned by SamAutomaticMaskGenerator. Expected keys include:
             - "segmentation": a boolean array (H, W)
             - "predicted_iou": a float indicating mask prediction quality.
      iou_threshold: Overlap threshold to determine if a candidate mask should be discarded.
    
    Returns:
      A filtered list of masks.
    """
    masks_sorted = sorted(masks, key=lambda x: x.get("predicted_iou", 0), reverse=True)
    filtered = []

    for mask in masks_sorted:
        seg = mask["segmentation"]
        keep = True
        for selected in filtered:
            sel_seg = selected["segmentation"]
            intersection = np.logical_and(seg, sel_seg).sum()
            union = np.logical_or(seg, sel_seg).sum()
            iou = intersection / union if union > 0 else 0

            if iou > iou_threshold:
                keep = False
                break

        if keep:
            filtered.append(mask)

    return filtered


def segment_quiz_image(image_path):
    """
    Processes an image for quiz creation segmentation using the new SAM model.
    
    - image_path: Path to the image file.
    
    Returns a list of cutouts (each as a numpy array).
    """
    # Load image using OpenCV (BGR) and convert to RGB
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Failed to load image at {image_path}")
    image_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # Generate masks using the automatic mask generator
    masks = mask_generator.generate(image_rgb)

    # Sort masks by area in descending order and take the top 10
    top_masks = sorted(masks, key=lambda x: x['area'], reverse=True)[:10]

    # Further filter overlapping masks if necessary
    filtered_masks = filter_overlapping_masks_by_accuracy(top_masks, iou_threshold=0.5)

    # Create cutouts
    cutouts = []
    for mask_dict in filtered_masks:
        seg_mask = mask_dict["segmentation"]
        cutout = get_cutout(image_rgb, seg_mask)
        if cutout is not None:
            cutouts.append(cutout)

    return cutouts


def get_image_without_masks(image_path):
    """
    Processes the image using quiz segmentation, combines all filtered masks,
    and returns the original image with masked areas removed (made transparent).

    Parameters:
      image_path (str): The path to the input image.

    Returns:
      image_bgra (np.array): The resulting image in BGRA format with holes where the masks were.
    """
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise ValueError(f"Failed to load image at {image_path}")
    image_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # Generate masks using the automatic mask generator
    masks = mask_generator.generate(image_rgb)
    # Sort masks by area in descending order and use top 10 masks
    top_masks = sorted(masks, key=lambda x: x['area'], reverse=True)[:10]
    filtered_masks = filter_overlapping_masks_by_accuracy(top_masks, iou_threshold=0.5)

    # Combine all filtered masks using logical OR to create a single mask
    combined_mask = np.zeros(image_rgb.shape[:2], dtype=bool)
    for mask in filtered_masks:
        combined_mask = np.logical_or(combined_mask, mask["segmentation"])

    # Create an alpha channel: set alpha to 0 for pixels inside the combined mask,
    # and 255 for pixels outside.
    alpha_channel = np.where(combined_mask, 0, 255).astype(np.uint8)
    # Split the original image into its R, G, and B channels.
    r, g, b = cv2.split(image_rgb)
    # Merge channels with the new alpha channel to create an RGBA image.
    image_rgba = cv2.merge([r, g, b, alpha_channel])
    # Convert RGBA to BGRA because OpenCV expects BGRA when writing PNGs.
    image_bgra = cv2.cvtColor(image_rgba, cv2.COLOR_RGBA2BGRA)
    return image_bgra 