# from ultralytics import FastSAM
# from pycocotools import mask as mask_utils
# import numpy as np

# def segment_image(image_path, bounding_box):
#     """
#     """

#     # Load the FastSAM model
#     model = FastSAM("FastSAM-s.pt")

#     # Perform the segmentation
#     results = model(image_path, bboxes=np.array(bounding_box))

#     # Extract the masks and confidence scores
#     masks = results[0].masks.data.cpu().numpy().astype(np.uint8)
#     confidences = results[0].boxes.conf.tolist()

#     # Convert the masks to RLE format
#     rle_masks = [mask_utils.encode(np.asfortranarray(m)) for m in masks]

#     return rle_masks, confidences
from ultralytics import FastSAM
from pycocotools import mask as mask_utils
import numpy as np

def segment_image(image_path, bounding_box):
    """
    Perform segmentation on the given image using the SAM model.
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
