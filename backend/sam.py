# # # # # sam.py
# # # # import requests
# # # # import numpy as np
# # # # from PIL import Image
# # # # from io import BytesIO
# # # # import cv2
# # # # from segment_anything import sam_model_registry, SamPredictor
# # # # import cloudinary.uploader
# # # # import logging
# # # # import os

# # # # logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# # # # logger = logging.getLogger(__name__)

# # # # sam_checkpoint = "sam_vit_b_01ec64.pth"
# # # # model_type = "vit_b"
# # # # sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
# # # # predictor = SamPredictor(sam)

# # # # def segment_with_boxes(image_url: str, regions: list) -> list:
# # # #     response = requests.get(image_url)
# # # #     response.raise_for_status()
# # # #     img = Image.open(BytesIO(response.content))
# # # #     img_np = np.array(img)
# # # #     img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
# # # #     predictor.set_image(img_np)
# # # #     results = []
# # # #     for region in regions:
# # # #         input_box = np.array([region['x'], region['y'], region['x'] + region['width'], region['y'] + region['height']])
# # # #         masks, _, _ = predictor.predict(box=input_box, multimask_output=False)
# # # #         mask = masks[0].astype(np.uint8) * 255
# # # #         mask_img = Image.fromarray(mask)
# # # #         mask_buffer = BytesIO()
# # # #         mask_img.save(mask_buffer, format="PNG")
# # # #         mask_response = cloudinary.uploader.upload(mask_buffer.getvalue(), resource_type="image")
# # # #         contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
# # # #         outline_img = np.zeros_like(img_np)
# # # #         cv2.drawContours(outline_img, contours, -1, (0, 255, 255), 2)
# # # #         outline_pil = Image.fromarray(cv2.cvtColor(outline_img, cv2.COLOR_BGR2RGB))
# # # #         outline_buffer = BytesIO()
# # # #         outline_pil.save(outline_buffer, format="PNG")
# # # #         outline_response = cloudinary.uploader.upload(outline_buffer.getvalue(), resource_type="image")
# # # #         results.append({
# # # #             "cutout": mask_response['secure_url'],
# # # #             "outline": outline_response['secure_url'],
# # # #             "position": {"x": region['x'], "y": region['y'], "width": region['width'], "height": region['height']},
# # # #             "type": "bounding_box"
# # # #         })
# # # #     return results

# # # # def segment_with_points(image_url: str, regions: list) -> list:
# # # #     response = requests.get(image_url)
# # # #     response.raise_for_status()
# # # #     img = Image.open(BytesIO(response.content))
# # # #     img_np = np.array(img)
# # # #     img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
# # # #     predictor.set_image(img_np)
# # # #     results = []
# # # #     for region in regions:
# # # #         points = np.array([[p['x'], p['y']] for p in region['points']])
# # # #         labels = np.array([1] * len(region['points']))
# # # #         exclude_points = region.get('excludePoints', [])
# # # #         if exclude_points:
# # # #             exclude_coords = np.array([[p['x'], p['y']] for p in exclude_points])
# # # #             exclude_labels = np.array([0] * len(exclude_points))
# # # #             points = np.concatenate([points, exclude_coords])
# # # #             labels = np.concatenate([labels, exclude_labels])
# # # #         masks, _, _ = predictor.predict(point_coords=points, point_labels=labels, multimask_output=False)
# # # #         mask = masks[0].astype(np.uint8) * 255
# # # #         mask_img = Image.fromarray(mask)
# # # #         mask_buffer = BytesIO()
# # # #         mask_img.save(mask_buffer, format="PNG")
# # # #         mask_response = cloudinary.uploader.upload(mask_buffer.getvalue(), resource_type="image")
# # # #         contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
# # # #         outline_img = np.zeros_like(img_np)
# # # #         cv2.drawContours(outline_img, contours, -1, (0, 255, 255), 2)
# # # #         outline_pil = Image.fromarray(cv2.cvtColor(outline_img, cv2.COLOR_BGR2RGB))
# # # #         outline_buffer = BytesIO()
# # # #         outline_pil.save(outline_buffer, format="PNG")
# # # #         outline_response = cloudinary.uploader.upload(outline_buffer.getvalue(), resource_type="image")
# # # #         results.append({
# # # #             "cutout": mask_response['secure_url'],
# # # #             "outline": outline_response['secure_url'],
# # # #             "position": region.get('position', {}),
# # # #             "type": "point_based"
# # # #         })
# # # #     return results

# # # # def segment_with_box_as_points(image_url: str, regions: list) -> list:
# # # #     response = requests.get(image_url)
# # # #     response.raise_for_status()
# # # #     img = Image.open(BytesIO(response.content))
# # # #     img_np = np.array(img)
# # # #     img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
# # # #     predictor.set_image(img_np)
# # # #     results = []
# # # #     for region in regions:
# # # #         mask = np.zeros_like(img_np[:, :, 0], dtype=np.uint8)
# # # #         x, y, w, h = region['x'], region['y'], region['width'], region['height']
# # # #         mask[y:y+h, x:x+w] = 255
# # # #         exclude_points = region.get('excludePoints', [])
# # # #         for point in exclude_points:
# # # #             cv2.circle(mask, (int(point['x']), int(point['y'])), 10, 0, -1)
# # # #         foreground_coords = np.where(mask > 0)
# # # #         if len(foreground_coords[0]) == 0:
# # # #             continue
# # # #         num_points = min(10, len(foreground_coords[0]))
# # # #         indices = np.random.choice(len(foreground_coords[0]), num_points, replace=False)
# # # #         points = np.array([[foreground_coords[1][i], foreground_coords[0][i]] for i in indices])
# # # #         labels = np.array([1] * num_points)
# # # #         if exclude_points:
# # # #             exclude_coords = np.array([[p['x'], p['y']] for p in exclude_points])
# # # #             exclude_labels = np.array([0] * len(exclude_points))
# # # #             points = np.concatenate([points, exclude_coords])
# # # #             labels = np.concatenate([labels, exclude_labels])
# # # #         masks, _, _ = predictor.predict(point_coords=points, point_labels=labels, multimask_output=False)
# # # #         mask = masks[0].astype(np.uint8) * 255
# # # #         mask_img = Image.fromarray(mask)
# # # #         mask_buffer = BytesIO()
# # # #         mask_img.save(mask_buffer, format="PNG")
# # # #         mask_response = cloudinary.uploader.upload(mask_buffer.getvalue(), resource_type="image")
# # # #         contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
# # # #         outline_img = np.zeros_like(img_np)
# # # #         cv2.drawContours(outline_img, contours, -1, (0, 255, 255), 2)
# # # #         outline_pil = Image.fromarray(cv2.cvtColor(outline_img, cv2.COLOR_BGR2RGB))
# # # #         outline_buffer = BytesIO()
# # # #         outline_pil.save(outline_buffer, format="PNG")
# # # #         outline_response = cloudinary.uploader.upload(outline_buffer.getvalue(), resource_type="image")
# # # #         results.append({
# # # #             "cutout": mask_response['secure_url'],
# # # #             "outline": outline_response['secure_url'],
# # # #             "position": {"x": region['x'], "y": region['y'], "width": region['width'], "height": region['height']},
# # # #             "type": "box_as_points"
# # # #         })
# # # #     return results

# # # # sam.py
# # # import requests
# # # import numpy as np
# # # from PIL import Image
# # # from io import BytesIO
# # # import cv2
# # # from segment_anything import sam_model_registry, SamPredictor
# # # import cloudinary.uploader
# # # import logging
# # # import os

# # # logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# # # logger = logging.getLogger(__name__)

# # # sam_checkpoint = "sam_vit_b_01ec64.pth"
# # # model_type = "vit_b"
# # # sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
# # # predictor = SamPredictor(sam)

# # # def segment_with_boxes(image_url: str, regions: list) -> list:
# # #     response = requests.get(image_url)
# # #     response.raise_for_status()
# # #     img = Image.open(BytesIO(response.content))
# # #     img_np = np.array(img)
# # #     img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
# # #     predictor.set_image(img_np)
# # #     results = []
# # #     for region in regions:
# # #         input_box = np.array([region['x'], region['y'], region['x'] + region['width'], region['y'] + region['height']])
# # #         masks, _, _ = predictor.predict(box=input_box, multimask_output=False)
# # #         mask = masks[0].astype(np.uint8) * 255
# # #         mask_img = Image.fromarray(mask)
# # #         mask_buffer = BytesIO()
# # #         mask_img.save(mask_buffer, format="PNG")
# # #         mask_response = cloudinary.uploader.upload(mask_buffer.getvalue(), resource_type="image")
# # #         results.append({
# # #             "mask_url": mask_response['secure_url'],
# # #             "position": {"x": region['x'], "y": region['y'], "width": region['width'], "height": region['height']},
# # #             "type": "bounding_box"
# # #         })
# # #     return results

# # # def segment_with_points(image_url: str, regions: list) -> list:
# # #     response = requests.get(image_url)
# # #     response.raise_for_status()
# # #     img = Image.open(BytesIO(response.content))
# # #     img_np = np.array(img)
# # #     img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
# # #     predictor.set_image(img_np)
# # #     results = []
# # #     for region in regions:
# # #         points = np.array([[p['x'], p['y']] for p in region['points']])
# # #         labels = np.array([1] * len(region['points']))
# # #         exclude_points = region.get('excludePoints', [])
# # #         if exclude_points:
# # #             exclude_coords = np.array([[p['x'], p['y']] for p in exclude_points])
# # #             exclude_labels = np.array([0] * len(exclude_points))
# # #             points = np.concatenate([points, exclude_coords])
# # #             labels = np.concatenate([labels, exclude_labels])
# # #         masks, _, _ = predictor.predict(point_coords=points, point_labels=labels, multimask_output=False)
# # #         mask = masks[0].astype(np.uint8) * 255
# # #         mask_img = Image.fromarray(mask)
# # #         mask_buffer = BytesIO()
# # #         mask_img.save(mask_buffer, format="PNG")
# # #         mask_response = cloudinary.uploader.upload(mask_buffer.getvalue(), resource_type="image")
# # #         results.append({
# # #             "mask_url": mask_response['secure_url'],
# # #             "position": region.get('position', {}),
# # #             "type": "point_based"
# # #         })
# # #     return results

# # # def segment_with_box_as_points(image_url: str, regions: list) -> list:
# # #     response = requests.get(image_url)
# # #     response.raise_for_status()
# # #     img = Image.open(BytesIO(response.content))
# # #     img_np = np.array(img)
# # #     img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
# # #     predictor.set_image(img_np)
# # #     results = []
# # #     for region in regions:
# # #         mask = np.zeros_like(img_np[:, :, 0], dtype=np.uint8)
# # #         x, y, w, h = region['x'], region['y'], region['width'], region['height']
# # #         mask[y:y+h, x:x+w] = 255
# # #         exclude_points = region.get('excludePoints', [])
# # #         for point in exclude_points:
# # #             cv2.circle(mask, (int(point['x']), int(point['y'])), 10, 0, -1)
# # #         foreground_coords = np.where(mask > 0)
# # #         if len(foreground_coords[0]) == 0:
# # #             continue
# # #         num_points = min(10, len(foreground_coords[0]))
# # #         indices = np.random.choice(len(foreground_coords[0]), num_points, replace=False)
# # #         points = np.array([[foreground_coords[1][i], foreground_coords[0][i]] for i in indices])
# # #         labels = np.array([1] * num_points)
# # #         if exclude_points:
# # #             exclude_coords = np.array([[p['x'], p['y']] for p in exclude_points])
# # #             exclude_labels = np.array([0] * len(exclude_points))
# # #             points = np.concatenate([points, exclude_coords])
# # #             labels = np.concatenate([labels, exclude_labels])
# # #         masks, _, _ = predictor.predict(point_coords=points, point_labels=labels, multimask_output=False)
# # #         mask = masks[0].astype(np.uint8) * 255
# # #         mask_img = Image.fromarray(mask)
# # #         mask_buffer = BytesIO()
# # #         mask_img.save(mask_buffer, format="PNG")
# # #         mask_response = cloudinary.uploader.upload(mask_buffer.getvalue(), resource_type="image")
# # #         results.append({
# # #             "mask_url": mask_response['secure_url'],
# # #             "position": {"x": region['x'], "y": region['y'], "width": region['width'], "height": region['height']},
# # #             "type": "box_as_points"
# # #         })
# # #     return results


# # # sam.py
# # import requests
# # import numpy as np
# # from PIL import Image
# # from io import BytesIO
# # import cv2
# # from segment_anything import sam_model_registry, SamPredictor
# # import cloudinary.uploader
# # import logging
# # import os

# # logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# # logger = logging.getLogger(__name__)

# # sam_checkpoint = "sam_vit_b_01ec64.pth"
# # model_type = "vit_b"
# # sam = sam_model_registry[model_type](checkpoint=sam_checkpoint)
# # predictor = SamPredictor(sam)

# # def segment_with_boxes(image_url: str, regions: list) -> list:
# #     response = requests.get(image_url)
# #     response.raise_for_status()
# #     img = Image.open(BytesIO(response.content))
# #     img_np = np.array(img)
# #     img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
# #     predictor.set_image(img_np)
# #     results = []
# #     for region in regions:
# #         input_box = np.array([region['x'], region['y'], region['x'] + region['width'], region['y'] + region['height']])
# #         masks, _, _ = predictor.predict(box=input_box, multimask_output=False)
# #         mask = masks[0].astype(np.uint8) * 255
# #         mask_img = Image.fromarray(mask)
# #         mask_buffer = BytesIO()
# #         mask_img.save(mask_buffer, format="PNG")
# #         mask_response = cloudinary.uploader.upload(mask_buffer.getvalue(), resource_type="image")
# #         results.append({
# #             "mask_url": mask_response['secure_url'],
# #             "position": {"x": region['x'], "y": region['y'], "width": region['width'], "height": region['height']},
# #             "type": "bounding_box"
# #         })
# #     return results

# # def segment_with_points(image_url: str, regions: list) -> list:
# #     response = requests.get(image_url)
# #     response.raise_for_status()
# #     img = Image.open(BytesIO(response.content))
# #     img_np = np.array(img)
# #     img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
# #     predictor.set_image(img_np)
# #     results = []
# #     for region in regions:
# #         points = np.array([[p['x'], p['y']] for p in region['points']])
# #         labels = np.array([1] * len(region['points']))
# #         exclude_points = region.get('excludePoints', [])
# #         if exclude_points:
# #             exclude_coords = np.array([[p['x'], p['y']] for p in exclude_points])
# #             exclude_labels = np.array([0] * len(exclude_points))
# #             points = np.concatenate([points, exclude_coords])
# #             labels = np.concatenate([labels, exclude_labels])
# #         masks, _, _ = predictor.predict(point_coords=points, point_labels=labels, multimask_output=False)
# #         mask = masks[0].astype(np.uint8) * 255
# #         mask_img = Image.fromarray(mask)
# #         mask_buffer = BytesIO()
# #         mask_img.save(mask_buffer, format="PNG")
# #         mask_response = cloudinary.uploader.upload(mask_buffer.getvalue(), resource_type="image")
# #         results.append({
# #             "mask_url": mask_response['secure_url'],
# #             "position": region.get('position', {}),
# #             "type": "point_based"
# #         })
# #     return results

# # def segment_with_box_as_points(image_url: str, regions: list) -> list:
# #     response = requests.get(image_url)
# #     response.raise_for_status()
# #     img = Image.open(BytesIO(response.content))
# #     img_np = np.array(img)
# #     img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
# #     predictor.set_image(img_np)
# #     results = []
# #     for region in regions:
# #         mask = np.zeros_like(img_np[:, :, 0], dtype=np.uint8)
# #         x, y, w, h = region['x'], region['y'], region['width'], region['height']
# #         mask[y:y+h, x:x+w] = 255
# #         exclude_points = region.get('excludePoints', [])
# #         for point in exclude_points:
# #             cv2.circle(mask, (int(point['x']), int(point['y'])), 10, 0, -1)
# #         foreground_coords = np.where(mask > 0)
# #         if len(foreground_coords[0]) == 0:
# #             continue
# #         num_points = min(10, len(foreground_coords[0]))
# #         indices = np.random.choice(len(foreground_coords[0]), num_points, replace=False)
# #         points = np.array([[foreground_coords[1][i], foreground_coords[0][i]] for i in indices])
# #         labels = np.array([1] * num_points)
# #         if exclude_points:
# #             exclude_coords = np.array([[p['x'], p['y']] for p in exclude_points])
# #             exclude_labels = np.array([0] * len(exclude_points))
# #             points = np.concatenate([points, exclude_coords])
# #             labels = np.concatenate([labels, exclude_labels])
# #         masks, _, _ = predictor.predict(point_coords=points, point_labels=labels, multimask_output=False)
# #         mask = masks[0].astype(np.uint8) * 255
# #         mask_img = Image.fromarray(mask)
# #         mask_buffer = BytesIO()
# #         mask_img.save(mask_buffer, format="PNG")
# #         mask_response = cloudinary.uploader.upload(mask_buffer.getvalue(), resource_type="image")
# #         results.append({
# #             "mask_url": mask_response['secure_url'],
# #             "position": {"x": region['x'], "y": region['y'], "width": region['width'], "height": region['height']},
# #             "type": "box_as_points"
# #         })
# #     return results

# import numpy as np
# from segment_anything import SamPredictor, sam_model_registry
# from typing import Optional, List

# class Segmenter:
#     def __init__(self, checkpoint: str):
#         self.model_type = "vit_b"
#         self.sam = sam_model_registry[self.model_type](checkpoint=checkpoint)
#         self.predictor = SamPredictor(self.sam)
#         self.current_image = None

#     def set_image(self, image: np.ndarray):
#         self.current_image = image
#         self.predictor.set_image(image)

#     def get_embedding(self):
#         if self.current_image is None:
#             raise ValueError("No image set")
#         return self.predictor.get_image_embedding()

#     def predict(
#         self,
#         image: np.ndarray,
#         box: Optional[List[float]] = None,
#         points: Optional[List[List[float]]] = None,
#         labels: Optional[List[int]] = None
#     ):
#         if self.current_image is None or not np.array_equal(image, self.current_image):
#             self.set_image(image)

#         box_np = np.array(box) if box else None
#         points_np = np.array(points) if points else None
#         labels_np = np.array(labels) if labels else None

#         masks, scores, _ = self.predictor.predict(
#             point_coords=points_np,
#             point_labels=labels_np,
#             box=box_np,
#             multimask_output=False
#         )

#         return masks, scores

import numpy as np
from segment_anything import SamPredictor, sam_model_registry
from typing import Optional, List

class Segmenter:
    def __init__(self, checkpoint: str):
        self.model_type = "vit_b"
        self.sam = sam_model_registry[self.model_type](checkpoint=checkpoint)
        self.predictor = SamPredictor(self.sam)
        self.current_image = None

    def set_image(self, image: np.ndarray):
        self.current_image = image
        self.predictor.set_image(image)

    def get_embedding(self):
        if self.current_image is None:
            raise ValueError("No image set")
        return self.predictor.get_image_embedding()

    def predict(
        self,
        image: np.ndarray,
        box: Optional[List[float]] = None,
        points: Optional[List[List[float]]] = None,
        labels: Optional[List[int]] = None
    ):
        if self.current_image is None or not np.array_equal(image, self.current_image):
            self.set_image(image)

        box_np = np.array(box) if box else None
        points_np = np.array(points) if points else None
        labels_np = np.array(labels) if labels else None

        masks, scores, _ = self.predictor.predict(
            point_coords=points_np,
            point_labels=labels_np,
            box=box_np,
            multimask_output=False
        )

        return masks, scores