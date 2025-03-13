import torch
import numpy as np
import cv2
from PIL import Image
from ultralytics import FastSAM
from ultralytics.models.fastsam import FastSAM
from segment_anything import sam_model_registry, SamPredictor

# Initialize SAM model globally
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = FastSAM('FastSAM-x.pt').to(device)

def generate_mask(bounding_box, image_path):
    """
    Generate mask using FastSAM model
    """
    bbox = [
        int(bounding_box['x']),
        int(bounding_box['y']),
        int(bounding_box['x'] + bounding_box['width']),
        int(bounding_box['y'] + bounding_box['height'])
    ]
    
    results = model(image_path, device=device, retina_masks=True, imgsz=1024, conf=0.4, iou=0.9,
                   bboxes=[bbox])
    
    if len(results[0].masks.data) == 0:
        raise Exception("No mask generated")
    
    mask = results[0].masks.data[0].cpu().numpy()
    return mask

def create_highlighted_outline(image, mask):
    """
    Create glowing outline effect around the mask
    """
    # Resize mask to match image size if needed
    if mask.shape[:2] != image.shape[:2]:
        mask = cv2.resize(mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)
    
    mask = mask > 0  # Convert to boolean mask
    
    # Get contours
    contours, _ = cv2.findContours(
        mask.astype(np.uint8), 
        cv2.RETR_EXTERNAL, 
        cv2.CHAIN_APPROX_SIMPLE
    )
    
    # Create outline image
    outline = image.copy()
    cv2.drawContours(outline, contours, -1, (0, 255, 0), 2)
    
    # Add glow effect
    blur = cv2.GaussianBlur(outline, (0, 0), sigmaX=2, sigmaY=2)
    outline = cv2.addWeighted(outline, 1.5, blur, -0.5, 0)
    
    return outline

def create_cutout(image, mask):
    """
    Create cutout with transparent background
    """
    # Resize mask to match image size if needed
    if mask.shape[:2] != image.shape[:2]:
        mask = cv2.resize(mask, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)
    
    mask = mask > 0  # Convert to boolean mask
    rgba = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
    rgba[~mask] = [0, 0, 0, 0]
    return rgba

def process_image(image_path, bounding_box):
    """
    Process image using SAM and create all necessary outputs
    """
    # Read and process image
    image = cv2.imread(image_path)
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Generate mask
    mask = generate_mask(bounding_box, image_path)
    
    # Create outputs
    cutout = create_cutout(image, mask)
    outline = create_highlighted_outline(image, mask)
    
    return {
        'mask': mask,
        'cutout': cutout,
        'outline': outline
    }

def segment_image(image_path, bounding_box):
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
        
        cutouts.append(cutout_rgba)

    return cutouts

def segment_all_regions(image_path, bounding_boxes):
    """
    Process multiple regions in an image and return the combined result
    """
    try:
        # Read the original image
        original_image = cv2.imread(image_path)
        if original_image is None:
            raise ValueError(f'Failed to load image from path: {image_path}')
        
        # Create a copy for drawing all segments
        combined_image = original_image.copy()
        
        # Define colors for different regions
        colors = [
            (0, 255, 0),    # Green
            (255, 0, 0),    # Blue
            (0, 0, 255),    # Red
            (255, 255, 0),  # Cyan
            (255, 0, 255),  # Magenta
            (0, 255, 255),  # Yellow
            (128, 0, 128),  # Purple
            (0, 128, 128),  # Teal
            (128, 128, 0),  # Olive
            (255, 165, 0)   # Orange
        ]
        
        if not bounding_boxes:
            raise ValueError('No bounding boxes provided')
            
        for i, bbox in enumerate(bounding_boxes):
            try:
                # Convert the bbox format
                bbox_array = [
                    int(float(bbox['x'])),
                    int(float(bbox['y'])),
                    int(float(bbox['x']) + float(bbox['width'])),
                    int(float(bbox['y']) + float(bbox['height']))
                ]
                
                # Use the model to generate a mask
                results = model(image_path, device=device, retina_masks=True, imgsz=1024, conf=0.4, iou=0.9,
                              bboxes=[bbox_array])
                
                if len(results[0].masks.data) > 0:
                    # Get the mask
                    mask = results[0].masks.data[0].cpu().numpy()
                    
                    # Resize mask to match image size if needed
                    if mask.shape[:2] != original_image.shape[:2]:
                        mask = cv2.resize(mask, 
                                        (original_image.shape[1], original_image.shape[0]), 
                                        interpolation=cv2.INTER_NEAREST)
                    
                    mask = (mask > 0).astype(np.uint8)  # Convert to binary mask
                    
                    # Get contours
                    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    
                    if contours:  # Only process if contours were found
                        # Draw contours with different colors for each region
                        color = colors[i % len(colors)]
                        cv2.drawContours(combined_image, contours, -1, color, 2)
            
            except Exception as e:
                print(f"Warning: Failed to process region {i+1}: {str(e)}")
                continue
        
        return combined_image
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise ValueError(f'Failed to process image: {str(e)}')