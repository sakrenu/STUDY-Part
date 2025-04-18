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