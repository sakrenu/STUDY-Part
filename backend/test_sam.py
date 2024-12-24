from sam import segment_image  # Import the function from your sam.py
import cv2
import numpy as np
from pycocotools import mask as mask_utils  # FIX: Import mask_utils for RLE decoding

def test_fastsam():
    # Define the input image path and bounding box
    image_path = r"D:\study-part\backend\uploads\car_img.jpg"  # Replace with your image path
    bounding_box = [50, 50, 300, 300]  # Replace with your desired bounding box [x1, y1, x2, y2]

    # Call the segment_image function
    print("Segmenting the image...")
    rle_masks, confidences = segment_image(image_path, bounding_box)

    if not rle_masks or not confidences:
        print("No masks or confidence scores returned. Check the inputs or model.")
        return

    print("Segmentation successful!")
    print(f"Number of masks: {len(rle_masks)}")
    print(f"Confidence scores: {confidences}")

    # Visualize one of the masks on the original image
    image = cv2.imread(image_path)
    if image is None:
        print("Error loading the image for visualization.")
        return

    print("Displaying the first mask...")
    mask = rle_masks[0]
    # decoded_mask = mask_utils.decode(mask)  # Decode RLE mask to binary mask

    

    # # Overlay the mask on the image
    # colored_mask = np.zeros_like(image)
    # colored_mask[decoded_mask == 1] = [0, 255, 0]  # Green mask
    # blended_image = cv2.addWeighted(image, 0.7, colored_mask, 0.3, 0)

    # Decode the RLE mask to binary mask
    decoded_mask = mask_utils.decode(mask)

# Resize the mask to match the image dimensions
    decoded_mask_resized = cv2.resize(
    decoded_mask, 
    (image.shape[1], image.shape[0]),  # Resize to (width, height)
    interpolation=cv2.INTER_NEAREST
    )

# Overlay the mask on the image
    colored_mask = np.zeros_like(image)
    colored_mask[decoded_mask_resized == 1] = [0, 255, 0]  # Green mask
    blended_image = cv2.addWeighted(image, 0.7, colored_mask, 0.3, 0)


    # Save and display the output
    output_path = "output_segmented.png"
    cv2.imwrite(output_path, blended_image)
    print(f"Segmented output saved as: {output_path}")

if __name__ == "__main__":
    test_fastsam()
