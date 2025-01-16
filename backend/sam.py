from ultralytics import FastSAM
from pycocotools import mask as mask_utils
import numpy as np
import cv2

def segment_image(image_path, bounding_box):
    """
    Perform segmentation on the given image using the SAM model and return the cutout of the selected part.
    """
    # Load the FastSAM model
    model = FastSAM("FastSAM-s.pt")

    # Convert bounding box to the correct format
    # Ensure bounding_box is in the format [x_min, y_min, x_max, y_max]
    bounding_box = [
        int(bounding_box[0]),  # x_min
        int(bounding_box[1]),  # y_min
        int(bounding_box[0] + bounding_box[2]),  # x_max
        int(bounding_box[1] + bounding_box[3])   # y_max
    ]

    # Perform the segmentation
    results = model(image_path, bboxes=[bounding_box])

    # Extract the masks and confidence scores
    masks = results[0].masks.data.cpu().numpy().astype(np.uint8)
    confidences = results[0].boxes.conf.tolist()

    # Load the original image
    original_image = cv2.imread(image_path)
    original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)  # Convert to RGB

    # Prepare a list to store the cutouts
    cutouts = []

    # Process each mask
    for mask in masks:
        # Resize the mask to match the original image dimensions
        mask_resized = cv2.resize(mask, (original_image.shape[1], original_image.shape[0]))

        # Create a 3-channel mask
        mask_3channel = np.stack([mask_resized] * 3, axis=-1)

        # Apply the mask to the original image to get the cutout
        cutout = np.where(mask_3channel == 1, original_image, 0)

        # Crop the cutout to the bounding box dimensions
        x_min, y_min, x_max, y_max = bounding_box
        cutout_cropped = cutout[y_min:y_max, x_min:x_max]

        # Append the cutout to the list
        cutouts.append(cutout_cropped)

    return cutouts, confidences