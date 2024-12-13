from ultralytics import FastSAM
from pycocotools import mask as mask_utils
import numpy as np

def segment_image(image_path, bounding_box):
    """
    Segments an image using FastSAM within a given bounding box.

    Args:
        image_path (str): The path to the image.
        bounding_box (list): The bounding box coordinates [x1, y1, x2, y2].

    Returns:
        tuple: A tuple containing the RLE-encoded masks and confidence scores.
    """

    # Load the FastSAM model
    model = FastSAM("FastSAM-s.pt")

    # Perform the segmentation
    results = model(image_path, bboxes=np.array(bounding_box))

    # Extract the masks and confidence scores
    masks = results[0].masks.data.cpu().numpy().astype(np.uint8)
    confidences = results[0].boxes.conf.tolist()

    # Convert the masks to RLE format
    rle_masks = [mask_utils.encode(np.asfortranarray(m)) for m in masks]

    return rle_masks, confidences