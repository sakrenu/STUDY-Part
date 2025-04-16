// // import React, { useState, useEffect, useRef } from 'react';
// // import { motion } from 'framer-motion';
// // import axios from 'axios';
// // import '../pages/teachers/TeachByParts.css';
// // import { toast } from 'react-toastify';
// // import { MdCrop, MdAddCircle, MdCheckCircle, MdUndo, MdRestartAlt, MdVisibility } from 'react-icons/md';

// // const SelectionComponent = ({ image, image_id, teacherEmail, onRegionsSegmented, onBack }) => {
// //   const [imageDimensions, setImageDimensions] = useState({ width: image?.width || 0, height: image?.height || 0 });
// //   const [isDrawingBox, setIsDrawingBox] = useState(false);
// //   const [boxStart, setBoxStart] = useState(null);
// //   const [currentBox, setCurrentBox] = useState(null);
// //   const [boxes, setBoxes] = useState([]);
// //   const [points, setPoints] = useState([]);
// //   const [pointMode, setPointMode] = useState(1); // 1 for include, 0 for exclude
// //   const [regions, setRegions] = useState([]);
// //   const [showMasks, setShowMasks] = useState(true);
// //   const [lessonId, setLessonId] = useState(null);
// //   const canvasRef = useRef(null);
// //   const imageRef = useRef(null);

// //   useEffect(() => {
// //     console.log('SelectionComponent received image_id:', image_id);
// //     if (image?.width && image?.height) {
// //       setImageDimensions({ width: image.width, height: image.height });
// //     }
// //   }, [image, image_id]);

// //   useEffect(() => {
// //     console.log('Current state:', { points, boxes, regions });
// //     const canvas = canvasRef.current;
// //     if (!canvas) return;
// //     const ctx = canvas.getContext('2d');
// //     ctx.clearRect(0, 0, canvas.width, canvas.height);

// //     // Draw boxes
// //     [...boxes, currentBox].forEach(box => {
// //       if (box) {
// //         ctx.strokeStyle = '#00ff00';
// //         ctx.lineWidth = 2;
// //         ctx.setLineDash([5, 5]);
// //         ctx.strokeRect(
// //           box[0] || box.x1,
// //           box[1] || box.y1,
// //           (box[2] || box.x2) - (box[0] || box.x1),
// //           (box[3] || box.y2) - (box[1] || box.y1)
// //         );
// //         ctx.setLineDash([]);
// //       }
// //     });

// //     // Draw points
// //     console.log('Rendering points:', points);
// //     points.forEach(point => {
// //       ctx.beginPath();
// //       ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
// //       ctx.fillStyle = point.label === 1 ? 'green' : 'red';
// //       ctx.fill();
// //     });
// //   }, [currentBox, boxes, points]);

// //   const handleMouseDown = (e) => {
// //     if (isDrawingBox) {
// //       const rect = canvasRef.current.getBoundingClientRect();
// //       const x = e.clientX - rect.left;
// //       const y = e.clientY - rect.top;
// //       setBoxStart({ x, y });
// //     }
// //   };

// //   const handleMouseMove = (e) => {
// //     if (isDrawingBox && boxStart) {
// //       const rect = canvasRef.current.getBoundingClientRect();
// //       const x = e.clientX - rect.left;
// //       const y = e.clientY - rect.top;
// //       setCurrentBox({
// //         x1: Math.min(boxStart.x, x),
// //         y1: Math.min(boxStart.y, y),
// //         x2: Math.max(boxStart.x, x),
// //         y2: Math.max(boxStart.y, y)
// //       });
// //     }
// //   };

// //   const handleMouseUp = () => {
// //     if (isDrawingBox && boxStart) {
// //       setIsDrawingBox(false);
// //     }
// //   };

// //   const handlePointClick = (e, label = pointMode) => {
// //     console.log('handlePointClick triggered, isDrawingBox:', isDrawingBox);
// //     if (isDrawingBox) return; // Prevent points during box drawing
// //     e.preventDefault();
// //     if (!canvasRef.current) {
// //       console.error('Canvas ref is null');
// //       return;
// //     }
// //     const rect = canvasRef.current.getBoundingClientRect();
// //     const x = e.clientX - rect.left;
// //     const y = e.clientY - rect.top;
// //     if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
// //       console.log('Click outside canvas:', { x, y });
// //       return;
// //     }
// //     const newPoint = { x, y, label };
// //     setPoints(prevPoints => [...prevPoints, newPoint]);
// //     console.log(`Added point: x=${x}, y=${y}, label=${label}`);

// //     // Handle exclude point region removal
// //     if (label === 0 && regions.length > 0) {
// //       const updatedRegions = regions.filter(region => {
// //         const { x1, y1, x2, y2 } = region.position;
// //         return !(x >= x1 && x <= x2 && y >= y1 && y <= y2);
// //       });
// //       setRegions(updatedRegions);
// //       console.log('Removed overlapping regions:', regions.length - updatedRegions.length);
// //     }
// //   };

// //   const handleSelectRegion = () => {
// //     if (currentBox) {
// //       setBoxes([...boxes, [
// //         currentBox.x1,
// //         currentBox.y1,
// //         currentBox.x2,
// //         currentBox.y2
// //       ]]);
// //       setCurrentBox(null);
// //       console.log('Added box:', boxes);
// //     }
// //   };

// //   const handleSegment = async () => {
// //     const pointCoords = points.map(p => [p.x, p.y]);
// //     const pointLabels = points.map(p => p.label);

// //     if (!image_id || typeof image_id !== 'string' || image_id.trim() === '') {
// //       console.error('Invalid image_id:', image_id);
// //       toast.error("Image is not uploaded properly. Please try uploading again.");
// //       return;
// //     }

// //     if (boxes.length === 0 && pointCoords.length === 0) {
// //       toast.error("Please select at least one bounding box or point.");
// //       return;
// //     }

// //     try {
// //       let newRegions = [...regions];
// //       for (const box of boxes) {
// //         const payload = {
// //           image_id,
// //           box,
// //           points: pointCoords.length > 0 ? pointCoords : null,
// //           labels: pointLabels.length > 0 ? pointLabels : null
// //         };
// //         console.log("Calling /segment with payload:", JSON.stringify(payload, null, 2));
// //         const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
// //         const response = await axios.post(`${API_URL}/segment`, payload, {
// //           headers: { 'Content-Type': 'application/json' }
// //         });

// //         console.log('Segmentation response:', response.data);
// //         newRegions = [...newRegions, ...response.data.regions];
// //         if (!lessonId) {
// //           setLessonId(response.data.lesson_id);
// //         }
// //       }

// //       // Handle points-only segmentation
// //       if (boxes.length === 0 && pointCoords.length > 0) {
// //         const payload = {
// //           image_id,
// //           box: null,
// //           points: pointCoords,
// //           labels: pointLabels
// //         };
// //         console.log("Calling /segment with payload:", JSON.stringify(payload, null, 2));
// //         const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
// //         const response = await axios.post(`${API_URL}/segment`, payload, {
// //           headers: { 'Content-Type': 'application/json' }
// //         });

// //         console.log('Segmentation response:', response.data);
// //         newRegions = [...newRegions, ...response.data.regions];
// //         if (!lessonId) {
// //           setLessonId(response.data.lesson_id);
// //         }
// //       }

// //       setRegions(newRegions);
// //       setBoxes([]);
// //       setPoints([]);
// //       setCurrentBox(null);
// //     } catch (error) {
// //       const errorDetail = error.response?.data?.detail
// //         ? typeof error.response.data.detail === 'string'
// //           ? error.response.data.detail
// //           : JSON.stringify(error.response.data.detail)
// //         : error.message || 'Unknown error';
// //       console.error('Error segmenting:', error, 'Response:', error.response?.data, 'Detail:', errorDetail);
// //       toast.error(`Segmentation failed: ${errorDetail}`);
// //     }
// //   };

// //   const handleAddPart = () => {
// //     setCurrentBox(null);
// //     console.log('Ready to add new part');
// //   };

// //   const handleDone = () => {
// //     onRegionsSegmented({
// //       lesson_id: lessonId,
// //       regions: regions.map(region => ({
// //         ...region,
// //         teacher_email: teacherEmail
// //       }))
// //     });
// //   };

// //   const handleUndo = () => {
// //     if (points.length > 0) {
// //       setPoints(points.slice(0, -1));
// //     } else if (boxes.length > 0) {
// //       setBoxes(boxes.slice(0, -1));
// //     } else if (currentBox) {
// //       setCurrentBox(null);
// //     } else if (regions.length > 0) {
// //       setRegions(regions.slice(0, -1));
// //     }
// //   };

// //   const handleReset = () => {
// //     setCurrentBox(null);
// //     setBoxes([]);
// //     setPoints([]);
// //     setRegions([]);
// //     setLessonId(null);
// //   };

// //   const toggleMasks = () => {
// //     setShowMasks(!showMasks);
// //   };

// //   return (
// //     <motion.div
// //       className="selection-container"
// //       initial={{ opacity: 0 }}
// //       animate={{ opacity: 1 }}
// //       transition={{ duration: 0.5 }}
// //     >
// //       <div className="controls">
// //         <motion.button
// //           className="control-button"
// //           onClick={() => setIsDrawingBox(true)}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdCrop size={20} /> Bounding Box
// //         </motion.button>
// //         <motion.button
// //           className={`control-button ${pointMode === 1 ? 'active-point-mode' : ''}`}
// //           onClick={() => setPointMode(1)}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdAddCircle size={20} /> Include Point
// //         </motion.button>
// //         <motion.button
// //           className={`control-button ${pointMode === 0 ? 'active-point-mode' : ''}`}
// //           onClick={() => setPointMode(0)}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdAddCircle size={20} /> Exclude Point
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleSelectRegion}
// //           disabled={!currentBox}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdCheckCircle size={20} /> Select Region
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleAddPart}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdAddCircle size={20} /> Add Part
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleSegment}
// //           disabled={!image_id || typeof image_id !== 'string' || image_id.trim() === '' || (boxes.length === 0 && points.length === 0)}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdCheckCircle size={20} /> Segment
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleDone}
// //           disabled={regions.length === 0}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdCheckCircle size={20} /> Done
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleUndo}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdUndo size={20} /> Undo
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleReset}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdRestartAlt size={20} /> Reset
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={toggleMasks}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdVisibility size={20} /> {showMasks ? 'Hide' : 'Show'} Masks
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={onBack}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           Back
// //         </motion.button>
// //       </div>
// //       <div className="image-container">
// //         <img
// //           ref={imageRef}
// //           src={image.url}
// //           alt="Uploaded"
// //           style={{
// //             maxWidth: '100%',
// //             maxHeight: '70vh',
// //             objectFit: 'contain'
// //           }}
// //           onLoad={() => {
// //             const img = imageRef.current;
// //             if (img && canvasRef.current) {
// //               canvasRef.current.width = img.width;
// //               canvasRef.current.height = img.height;
// //               console.log('Canvas resized:', { width: img.width, height: img.height });
// //             }
// //           }}
// //         />
// //         <canvas
// //           ref={canvasRef}
// //           className="overlay-canvas"
// //           onMouseDown={handleMouseDown}
// //           onMouseMove={handleMouseMove}
// //           onMouseUp={handleMouseUp}
// //           onClick={(e) => handlePointClick(e)}
// //           onContextMenu={(e) => {
// //             e.preventDefault();
// //             handlePointClick(e, 0);
// //           }}
// //         />
// //         {showMasks && regions.map(region => (
// //           <img
// //             key={region.region_id}
// //             src={region.mask_url}
// //             alt="Mask"
// //             className="mask-overlay"
// //             style={{
// //               position: 'absolute',
// //               top: 0,
// //               left: 0,
// //               width: imageRef.current?.width,
// //               height: imageRef.current?.height,
// //               opacity: 0.5
// //             }}
// //           />
// //         ))}
// //       </div>
// //     </motion.div>
// //   );
// // };

// // export default SelectionComponent;
// // import React, { useState, useEffect, useRef } from 'react';
// // import { motion } from 'framer-motion';
// // import axios from 'axios';
// // import '../pages/teachers/TeachByParts.css';
// // import { toast } from 'react-toastify';
// // import { MdCrop, MdAddCircle, MdCheckCircle, MdUndo, MdRestartAlt, MdVisibility } from 'react-icons/md';

// // const SelectionComponent = ({ image, image_id, teacherEmail, onRegionsSegmented, onBack }) => {
// //   const [imageDimensions, setImageDimensions] = useState({ width: image?.width || 0, height: image?.height || 0 });
// //   const [isDrawingBox, setIsDrawingBox] = useState(false);
// //   const [boxStart, setBoxStart] = useState(null);
// //   const [currentBox, setCurrentBox] = useState(null);
// //   const [boxes, setBoxes] = useState([]);
// //   const [points, setPoints] = useState([]);
// //   const [pointMode, setPointMode] = useState(1); // 1 for include, 0 for exclude
// //   const [regions, setRegions] = useState([]);
// //   const [showMasks, setShowMasks] = useState(true);
// //   const [lessonId, setLessonId] = useState(null);
// //   const [activeBox, setActiveBox] = useState(null); // Track box being refined
// //   const canvasRef = useRef(null);
// //   const imageRef = useRef(null);

// //   useEffect(() => {
// //     console.log('SelectionComponent received image_id:', image_id);
// //     if (image?.width && image?.height) {
// //       setImageDimensions({ width: image.width, height: image.height });
// //     }
// //   }, [image, image_id]);

// //   useEffect(() => {
// //     console.log('Current state:', { points, boxes, regions, activeBox });
// //     const canvas = canvasRef.current;
// //     if (!canvas) return;
// //     const ctx = canvas.getContext('2d');
// //     ctx.clearRect(0, 0, canvas.width, canvas.height);

// //     // Draw boxes
// //     [...boxes, currentBox].forEach(box => {
// //       if (box) {
// //         ctx.strokeStyle = '#00ff00';
// //         ctx.lineWidth = 2;
// //         ctx.setLineDash([5, 5]);
// //         ctx.strokeRect(
// //           box[0] || box.x1,
// //           box[1] || box.y1,
// //           (box[2] || box.x2) - (box[0] || box.x1),
// //           (box[3] || box.y2) - (box[1] || box.y1)
// //         );
// //         ctx.setLineDash([]);
// //       }
// //     });

// //     // Draw points
// //     console.log('Rendering points:', points);
// //     points.forEach(point => {
// //       ctx.beginPath();
// //       ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
// //       ctx.fillStyle = point.label === 1 ? 'green' : 'red';
// //       ctx.fill();
// //     });
// //   }, [currentBox, boxes, points]);

// //   const handleMouseDown = (e) => {
// //     if (isDrawingBox) {
// //       const rect = canvasRef.current.getBoundingClientRect();
// //       const x = e.clientX - rect.left;
// //       const y = e.clientY - rect.top;
// //       setBoxStart({ x, y });
// //     }
// //   };

// //   const handleMouseMove = (e) => {
// //     if (isDrawingBox && boxStart) {
// //       const rect = canvasRef.current.getBoundingClientRect();
// //       const x = e.clientX - rect.left;
// //       const y = e.clientY - rect.top;
// //       setCurrentBox({
// //         x1: Math.min(boxStart.x, x),
// //         y1: Math.min(boxStart.y, y),
// //         x2: Math.max(boxStart.x, x),
// //         y2: Math.max(boxStart.y, y)
// //       });
// //     }
// //   };

// //   const handleMouseUp = () => {
// //     if (isDrawingBox && boxStart) {
// //       setIsDrawingBox(false);
// //     }
// //   };

// //   const handlePointClick = (e, label = pointMode) => {
// //     console.log('handlePointClick triggered, isDrawingBox:', isDrawingBox);
// //     if (isDrawingBox) return;
// //     e.preventDefault();
// //     if (!canvasRef.current) {
// //       console.error('Canvas ref is null');
// //       return;
// //     }
// //     const rect = canvasRef.current.getBoundingClientRect();
// //     const x = e.clientX - rect.left;
// //     const y = e.clientY - rect.top;
// //     if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
// //       console.log('Click outside canvas:', { x, y });
// //       return;
// //     }
// //     const newPoint = { x, y, label };
// //     setPoints(prevPoints => [...prevPoints, newPoint]);
// //     console.log(`Added point: x=${x}, y=${y}, label=${label}`);
// //   };

// //   const handleSelectRegion = () => {
// //     if (currentBox) {
// //       const newBox = [
// //         currentBox.x1,
// //         currentBox.y1,
// //         currentBox.x2,
// //         currentBox.y2
// //       ];
// //       setBoxes([...boxes, newBox]);
// //       setActiveBox(newBox); // Set as active for refinement
// //       setCurrentBox(null);
// //       console.log('Added box:', newBox, 'Active box:', newBox);
// //     }
// //   };

// //   const handleSegment = async () => {
// //     const pointCoords = points.map(p => [p.x, p.y]);
// //     const pointLabels = points.map(p => p.label);

// //     if (!image_id || typeof image_id !== 'string' || image_id.trim() === '') {
// //       console.error('Invalid image_id:', image_id);
// //       toast.error("Image is not uploaded properly. Please try uploading again.");
// //       return;
// //     }

// //     if (boxes.length === 0 && pointCoords.length === 0 && !activeBox) {
// //       toast.error("Please select at least one bounding box or point.");
// //       return;
// //     }

// //     try {
// //       let newRegions = [...regions];
// //       let boxesToProcess = boxes;

// //       // Include activeBox for refinement if points exist
// //       if (activeBox && pointCoords.length > 0) {
// //         boxesToProcess = [...boxes, activeBox];
// //       }

// //       // Process boxes
// //       for (const box of boxesToProcess) {
// //         const payload = {
// //           image_id,
// //           box,
// //           points: pointCoords.length > 0 ? pointCoords : null,
// //           labels: pointLabels.length > 0 ? pointLabels : null
// //         };
// //         console.log("Calling /segment with payload:", JSON.stringify(payload, null, 2));
// //         const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
// //         const response = await axios.post(`${API_URL}/segment`, payload, {
// //           headers: { 'Content-Type': 'application/json' }
// //         });

// //         console.log('Segmentation response:', response.data);

// //         // Filter out duplicate regions by region_id
// //         const incomingRegions = response.data.regions.filter(
// //           newRegion => !newRegions.some(existing => existing.region_id === newRegion.region_id)
// //         );
// //         newRegions = [...newRegions, ...incomingRegions];

// //         if (!lessonId) {
// //           setLessonId(response.data.lesson_id);
// //         }
// //       }

// //       // Points-only segmentation
// //       if (boxesToProcess.length === 0 && pointCoords.length > 0) {
// //         const payload = {
// //           image_id,
// //           box: activeBox || null,
// //           points: pointCoords,
// //           labels: pointLabels
// //         };
// //         console.log("Calling /segment with payload:", JSON.stringify(payload, null, 2));
// //         const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
// //         const response = await axios.post(`${API_URL}/segment`, payload, {
// //           headers: { 'Content-Type': 'application/json' }
// //         });

// //         console.log('Segmentation response:', response.data);
// //         const incomingRegions = response.data.regions.filter(
// //           newRegion => !newRegions.some(existing => existing.region_id === newRegion.region_id)
// //         );
// //         newRegions = [...newRegions, ...incomingRegions];

// //         if (!lessonId) {
// //           setLessonId(response.data.lesson_id);
// //         }
// //       }

// //       setRegions(newRegions);
// //       if (!activeBox) {
// //         setBoxes([]); // Clear boxes only if not refining
// //       }
// //       setPoints([]); // Clear points after segmentation
// //       setCurrentBox(null);
// //     } catch (error) {
// //       const errorDetail = error.response?.data?.detail
// //         ? typeof error.response.data.detail === 'string'
// //           ? error.response.data.detail
// //           : JSON.stringify(error.response.data.detail)
// //         : error.message || 'Unknown error';
// //       console.error('Error segmenting:', error, 'Response:', error.response?.data, 'Detail:', errorDetail);
// //       toast.error(`Segmentation failed: ${errorDetail}`);
// //     }
// //   };

// //   const handleAddPart = () => {
// //     setCurrentBox(null);
// //     setActiveBox(null); // Clear active box for new part
// //     console.log('Ready to add new part');
// //   };

// //   const handleDone = () => {
// //     onRegionsSegmented({
// //       lesson_id: lessonId,
// //       regions: regions.map(region => ({
// //         ...region,
// //         teacher_email: teacherEmail
// //       }))
// //     });
// //   };

// //   const handleUndo = () => {
// //     if (points.length > 0) {
// //       setPoints(points.slice(0, -1));
// //     } else if (boxes.length > 0) {
// //       setBoxes(boxes.slice(0, -1));
// //     } else if (currentBox) {
// //       setCurrentBox(null);
// //     } else if (regions.length > 0) {
// //       setRegions(regions.slice(0, -1));
// //     }
// //   };

// //   const handleReset = () => {
// //     setCurrentBox(null);
// //     setBoxes([]);
// //     setPoints([]);
// //     setRegions([]);
// //     setLessonId(null);
// //     setActiveBox(null);
// //   };

// //   const toggleMasks = () => {
// //     setShowMasks(!showMasks);
// //   };

// //   return (
// //     <motion.div
// //       className="selection-container"
// //       initial={{ opacity: 0 }}
// //       animate={{ opacity: 1 }}
// //       transition={{ duration: 0.5 }}
// //     >
// //       <div className="controls">
// //         <motion.button
// //           className="control-button"
// //           onClick={() => setIsDrawingBox(true)}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdCrop size={20} /> Bounding Box
// //         </motion.button>
// //         <motion.button
// //           className={`control-button ${pointMode === 1 ? 'active-point-mode' : ''}`}
// //           onClick={() => setPointMode(1)}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdAddCircle size={20} /> Include Point
// //         </motion.button>
// //         <motion.button
// //           className={`control-button ${pointMode === 0 ? 'active-point-mode' : ''}`}
// //           onClick={() => setPointMode(0)}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdAddCircle size={20} /> Exclude Point
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleSelectRegion}
// //           disabled={!currentBox}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdCheckCircle size={20} /> Select Region
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleAddPart}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdAddCircle size={20} /> Add Part
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleSegment}
// //           disabled={!image_id || typeof image_id !== 'string' || image_id.trim() === '' || (boxes.length === 0 && points.length === 0 && !activeBox)}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdCheckCircle size={20} /> Segment
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleDone}
// //           disabled={regions.length === 0}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdCheckCircle size={20} /> Done
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleUndo}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdUndo size={20} /> Undo
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={handleReset}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdRestartAlt size={20} /> Reset
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={toggleMasks}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           <MdVisibility size={20} /> {showMasks ? 'Hide' : 'Show'} Masks
// //         </motion.button>
// //         <motion.button
// //           className="control-button"
// //           onClick={onBack}
// //           whileHover={{ scale: 1.1 }}
// //           whileTap={{ scale: 0.9 }}
// //         >
// //           Back
// //         </motion.button>
// //       </div>
// //       <div className="image-container">
// //         <img
// //           ref={imageRef}
// //           src={image.url}
// //           alt="Uploaded"
// //           style={{
// //             maxWidth: '100%',
// //             maxHeight: '70vh',
// //             objectFit: 'contain'
// //           }}
// //           onLoad={() => {
// //             const img = imageRef.current;
// //             if (img && canvasRef.current) {
// //               canvasRef.current.width = img.width;
// //               canvasRef.current.height = img.height;
// //               console.log('Canvas resized:', { width: img.width, height: img.height });
// //             }
// //           }}
// //         />
// //         <canvas
// //           ref={canvasRef}
// //           className="overlay-canvas"
// //           onMouseDown={handleMouseDown}
// //           onMouseMove={handleMouseMove}
// //           onMouseUp={handleMouseUp}
// //           onClick={(e) => handlePointClick(e)}
// //           onContextMenu={(e) => {
// //             e.preventDefault();
// //             handlePointClick(e, 0);
// //           }}
// //         />
// //         {showMasks && regions.map(region => (
// //           <img
// //             key={region.region_id}
// //             src={region.mask_url}
// //             alt="Mask"
// //             className="mask-overlay"
// //             style={{
// //               position: 'absolute',
// //               top: 0,
// //               left: 0,
// //               width: imageRef.current?.width,
// //               height: imageRef.current?.height,
// //               opacity: 0.5
// //             }}
// //           />
// //         ))}
// //       </div>
// //     </motion.div>
// //   );
// // };

// // export default SelectionComponent;


// --chatgpt - 
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import '../pages/teachers/TeachByParts.css';
import { toast } from 'react-toastify';
import { MdCrop, MdAddCircle, MdCheckCircle, MdUndo, MdRestartAlt, MdVisibility } from 'react-icons/md';

const SelectionComponent = ({ image, image_id, teacherEmail, onRegionsSegmented, onBack }) => {
  // State for image dimensions, regions, etc.
  const [imageDimensions, setImageDimensions] = useState({ width: image?.width || 0, height: image?.height || 0 });
  // New state to track current tool: "box", "include", "exclude"
  const [activeTool, setActiveTool] = useState("box");

  // For drawing boxes
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [boxStart, setBoxStart] = useState(null);
  // currentBox is used while drawing a new box
  const [currentBox, setCurrentBox] = useState(null);
  const [boxes, setBoxes] = useState([]); // each box: { x1, y1, x2, y2 }
  // For dragging boxes
  const [draggingBoxIndex, setDraggingBoxIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // For points; points: { x, y, label } where label === 1 (include) or 0 (exclude)
  const [points, setPoints] = useState([]);
  const [regions, setRegions] = useState([]);
  const [showMasks, setShowMasks] = useState(true);
  const [lessonId, setLessonId] = useState(null);
  // Track box being refined (if needed)
  const [activeBox, setActiveBox] = useState(null);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    console.log('SelectionComponent received image_id:', image_id);
    if (image?.width && image?.height) {
      setImageDimensions({ width: image.width, height: image.height });
    }
  }, [image, image_id]);

  useEffect(() => {
    console.log('Current state:', { activeTool, points, boxes, regions, activeBox });
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing boxes
    boxes.forEach((box, index) => {
      ctx.strokeStyle = (index === draggingBoxIndex) ? '#ffcc00' : '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
      ctx.setLineDash([]);
    });

    // Draw currentBox if drawing a new one
    if (currentBox && activeTool === "box") {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(currentBox.x1, currentBox.y1, currentBox.x2 - currentBox.x1, currentBox.y2 - currentBox.y1);
      ctx.setLineDash([]);
    }

    // Draw points only when in include/exclude mode
    if (activeTool === "include" || activeTool === "exclude") {
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        // Green for include, red for exclude
        ctx.fillStyle = point.label === 1 ? 'green' : 'red';
        ctx.fill();
      });
    }
  }, [currentBox, boxes, points, activeTool, draggingBoxIndex]);

  // Utility to check if a point is inside a box
  const isPointInBox = (x, y, box) => {
    return x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2;
  };

  // Mouse down handler:
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "box") {
      // Check if click is inside an existing box to drag it.
      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        if (isPointInBox(x, y, box)) {
          setDraggingBoxIndex(i);
          setDragOffset({ x: x - box.x1, y: y - box.y1 });
          return;
        }
      }
      // If not clicking inside an existing box, start a new box.
      setIsDrawingBox(true);
      setBoxStart({ x, y });
      setCurrentBox({ x1: x, y1: y, x2: x, y2: y });
    }
  };

  // Mouse move handler: Either update new box or drag an existing one.
  const handleMouseMove = (e) => {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    if (activeTool === "box") {
      if (isDrawingBox && boxStart) {
        // Updating new box dimensions while drawing
        setCurrentBox({
          x1: Math.min(boxStart.x, x),
          y1: Math.min(boxStart.y, y),
          x2: Math.max(boxStart.x, x),
          y2: Math.max(boxStart.y, y)
        });
      } else if (draggingBoxIndex !== null) {
        // Move (drag) the selected box
        const newBoxes = [...boxes];
        const box = newBoxes[draggingBoxIndex];
        const boxWidth = box.x2 - box.x1;
        const boxHeight = box.y2 - box.y1;
        newBoxes[draggingBoxIndex] = {
          x1: x - dragOffset.x,
          y1: y - dragOffset.y,
          x2: (x - dragOffset.x) + boxWidth,
          y2: (y - dragOffset.y) + boxHeight
        };
        setBoxes(newBoxes);
      }
    }
  };

  // Mouse up handler: ends drawing or dragging.
  const handleMouseUp = (e) => {
    if (activeTool === "box") {
      if (isDrawingBox && boxStart) {
        setIsDrawingBox(false);
        // When finishing new box draw, add it if it has valid area
        if (currentBox && (currentBox.x2 - currentBox.x1 > 5) && (currentBox.y2 - currentBox.y1 > 5)) {
          setBoxes([...boxes, currentBox]);
          setActiveBox(currentBox); // Mark new box as active for refinement
        }
        setCurrentBox(null);
        setBoxStart(null);
      }
      if (draggingBoxIndex !== null) {
        // End dragging
        setDraggingBoxIndex(null);
      }
    }
  };

  // Canvas click handler: Only add points when in include/exclude mode.
  const handlePointClick = (e) => {
    if (activeTool !== "include" && activeTool !== "exclude") {
      return;
    }
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      return;
    }
    // Create a point; use label 1 for include, 0 for exclude.
    const newPoint = { x, y, label: activeTool === "include" ? 1 : 0 };
    setPoints(prevPoints => [...prevPoints, newPoint]);
  };

  // Triggered when user clicks the "Select Region" button (finalize current box)
  const handleSelectRegion = () => {
    if (currentBox) {
      // Already added when finished drawing
      setActiveBox(currentBox);
      setCurrentBox(null);
      console.log('Selected region:', currentBox);
    }
  };

  // The segmentation handler remains mostly the same.
  const handleSegment = async () => {
    const pointCoords = points.map(p => [p.x, p.y]);
    const pointLabels = points.map(p => p.label);

    if (!image_id || typeof image_id !== 'string' || image_id.trim() === '') {
      console.error('Invalid image_id:', image_id);
      toast.error("Image is not uploaded properly. Please try uploading again.");
      return;
    }

    if (boxes.length === 0 && pointCoords.length === 0 && !activeBox) {
      toast.error("Please select at least one bounding box or point.");
      return;
    }

    try {
      let newRegions = [...regions];
      let boxesToProcess = boxes;

      // If a box is currently active (being refined) and there are points, include it.
      if (activeBox && pointCoords.length > 0) {
        boxesToProcess = [...boxes, activeBox];
      }

      // Process each box
      for (const box of boxesToProcess) {
        const payload = {
          image_id,
          box: [box.x1, box.y1, box.x2, box.y2],
          points: pointCoords.length > 0 ? pointCoords : null,
          labels: pointLabels.length > 0 ? pointLabels : null
        };
        console.log("Calling /segment with payload:", JSON.stringify(payload, null, 2));
        const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
        const response = await axios.post(`${API_URL}/segment`, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Segmentation response:', response.data);

        const incomingRegions = response.data.regions.filter(
          newRegion => !newRegions.some(existing => existing.region_id === newRegion.region_id)
        );
        newRegions = [...newRegions, ...incomingRegions];
        if (!lessonId) {
          setLessonId(response.data.lesson_id);
        }
      }

      // If only points (not within a box) are provided:
      if (boxesToProcess.length === 0 && pointCoords.length > 0) {
        const payload = {
          image_id,
          box: activeBox || null,
          points: pointCoords,
          labels: pointLabels
        };
        console.log("Calling /segment with payload:", JSON.stringify(payload, null, 2));
        const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
        const response = await axios.post(`${API_URL}/segment`, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Segmentation response:', response.data);
        const incomingRegions = response.data.regions.filter(
          newRegion => !newRegions.some(existing => existing.region_id === newRegion.region_id)
        );
        newRegions = [...newRegions, ...incomingRegions];
        if (!lessonId) {
          setLessonId(response.data.lesson_id);
        }
      }

      setRegions(newRegions);
      if (!activeBox) {
        setBoxes([]); // clear boxes if not refining
      }
      setPoints([]); // clear points after segmentation
      setCurrentBox(null);
    } catch (error) {
      const errorDetail = error.response?.data?.detail
        ? (typeof error.response.data.detail === 'string'
           ? error.response.data.detail
           : JSON.stringify(error.response.data.detail))
        : error.message || 'Unknown error';
      console.error('Error segmenting:', error, 'Response:', error.response?.data, 'Detail:', errorDetail);
      toast.error(`Segmentation failed: ${errorDetail}`);
    }
  };

  const handleAddPart = () => {
    // Clear current active box so user can add a new part (box)
    setCurrentBox(null);
    setActiveBox(null);
    console.log('Ready to add new part');
  };

  const handleDone = () => {
    onRegionsSegmented({
      lesson_id: lessonId,
      regions: regions.map(region => ({
        ...region,
        teacher_email: teacherEmail
      }))
    });
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
    } else if (boxes.length > 0) {
      setBoxes(boxes.slice(0, -1));
    } else if (currentBox) {
      setCurrentBox(null);
    } else if (regions.length > 0) {
      setRegions(regions.slice(0, -1));
    }
  };

  const handleReset = () => {
    setCurrentBox(null);
    setBoxes([]);
    setPoints([]);
    setRegions([]);
    setLessonId(null);
    setActiveBox(null);
  };

  const toggleMasks = () => {
    setShowMasks(!showMasks);
  };

  return (
    <motion.div
      className="selection-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="controls">
        {/* Activate Box Mode */}
        <motion.button
          className="control-button"
          onClick={() => {
            setActiveTool("box");
            // Stop any drawing mode for points
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdCrop size={20} /> Bounding Box
        </motion.button>
        {/* Activate Include Points Mode */}
        <motion.button
          className={`control-button ${activeTool === "include" ? 'active-point-mode' : ''}`}
          onClick={() => setActiveTool("include")}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdAddCircle size={20} /> Include Point
        </motion.button>
        {/* Activate Exclude Points Mode */}
        <motion.button
          className={`control-button ${activeTool === "exclude" ? 'active-point-mode' : ''}`}
          onClick={() => setActiveTool("exclude")}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 1.0 }}
        >
          <MdAddCircle size={20} /> Exclude Point
        </motion.button>
        <motion.button
          className="control-button"
          onClick={handleSelectRegion}
          disabled={activeTool !== "box" || !currentBox}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdCheckCircle size={20} /> Select Region
        </motion.button>
        <motion.button
          className="control-button"
          onClick={handleAddPart}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdAddCircle size={20} /> Add Part
        </motion.button>
        <motion.button
          className="control-button"
          onClick={handleSegment}
          disabled={!image_id || typeof image_id !== 'string' || image_id.trim() === '' || (boxes.length === 0 && points.length === 0 && !activeBox)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdCheckCircle size={20} /> Segment
        </motion.button>
        <motion.button
          className="control-button"
          onClick={handleDone}
          disabled={regions.length === 0}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdCheckCircle size={20} /> Done
        </motion.button>
        <motion.button
          className="control-button"
          onClick={handleUndo}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdUndo size={20} /> Undo
        </motion.button>
        <motion.button
          className="control-button"
          onClick={handleReset}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdRestartAlt size={20} /> Reset
        </motion.button>
        <motion.button
          className="control-button"
          onClick={toggleMasks}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdVisibility size={20} /> {showMasks ? 'Hide' : 'Show'} Masks
        </motion.button>
        <motion.button
          className="control-button"
          onClick={onBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Back
        </motion.button>
      </div>
      <div className="image-container" style={{ position: 'relative' }}>
        <img
          ref={imageRef}
          src={image.url}
          alt="Uploaded"
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain'
          }}
          onLoad={() => {
            const img = imageRef.current;
            if (img && canvasRef.current) {
              canvasRef.current.width = img.width;
              canvasRef.current.height = img.height;
              console.log('Canvas resized:', { width: img.width, height: img.height });
            }
          }}
        />
        <canvas
          ref={canvasRef}
          className="overlay-canvas"
          style={{ position: 'absolute', top: 0, left: 0 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handlePointClick}
          onContextMenu={(e) => {
            e.preventDefault();
            // For right-click, treat as exclude point even if not in exclude mode
            if (activeTool !== "exclude") {
              setActiveTool("exclude");
            }
            handlePointClick(e);
          }}
        />
        {showMasks && regions.map(region => (
          <img
            key={region.region_id}
            src={region.mask_url}
            alt="Mask"
            className="mask-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: imageRef.current?.width,
              height: imageRef.current?.height,
              opacity: 0.5
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default SelectionComponent;



// // chat gpt -2 
// import React, { useState, useEffect, useRef } from 'react';
// import { motion } from 'framer-motion';
// import axios from 'axios';
// import '../pages/teachers/TeachByParts.css';
// import { toast } from 'react-toastify';
// import { MdCrop, MdAddCircle, MdCheckCircle, MdUndo, MdRestartAlt, MdVisibility } from 'react-icons/md';

// const SelectionComponent = ({ image, image_id, teacherEmail, onRegionsSegmented, onBack }) => {
//   const [imageDimensions, setImageDimensions] = useState({ width: image?.width || 0, height: image?.height || 0 });
//   const [activeTool, setActiveTool] = useState("box");
//   const [isDrawingBox, setIsDrawingBox] = useState(false);
//   const [boxStart, setBoxStart] = useState(null);
//   const [currentBox, setCurrentBox] = useState(null);
//   const [boxes, setBoxes] = useState([]); // Array of [x1, y1, x2, y2]
//   const [draggingBoxIndex, setDraggingBoxIndex] = useState(null);
//   const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
//   const [points, setPoints] = useState([]);
//   const [regions, setRegions] = useState([]);
//   const [showMasks, setShowMasks] = useState(true);
//   const [lessonId, setLessonId] = useState(null);
//   const [activeBox, setActiveBox] = useState(null); // [x1, y1, x2, y2]
//   const [finalView, setFinalView] = useState(false);
//   const canvasRef = useRef(null);
//   const maskCanvasRef = useRef(null);
//   const imageRef = useRef(null);

//   useEffect(() => {
//     console.log('SelectionComponent received image_id:', image_id);
//     if (image?.width && image?.height) {
//       setImageDimensions({ width: image.width, height: image.height });
//     }
//   }, [image, image_id]);

//   useEffect(() => {
//     console.log('Current state:', { activeTool, points, boxes, regions, activeBox, finalView });
//     const canvas = canvasRef.current;
//     const maskCanvas = maskCanvasRef.current;
//     if (!canvas || !maskCanvas) return;

//     const ctx = canvas.getContext('2d');
//     const maskCtx = maskCanvas.getContext('2d');
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

//     if (!finalView) {
//       // Draw boxes
//       boxes.forEach((box, index) => {
//         ctx.strokeStyle = index === draggingBoxIndex ? '#ffcc00' : '#00ff00';
//         ctx.lineWidth = 2;
//         ctx.setLineDash([5, 5]);
//         ctx.strokeRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
//         ctx.setLineDash([]);
//       });

//       if (currentBox && activeTool === "box") {
//         ctx.strokeStyle = '#00ff00';
//         ctx.lineWidth = 2;
//         ctx.setLineDash([5, 5]);
//         ctx.strokeRect(currentBox[0], currentBox[1], currentBox[2] - currentBox[0], currentBox[3] - currentBox[1]);
//         ctx.setLineDash([]);
//       }

//       // Draw points
//       if (activeTool === "include" || activeTool === "exclude") {
//         console.log('Rendering points:', points);
//         points.forEach(point => {
//           ctx.beginPath();
//           ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
//           ctx.fillStyle = point.label === 1 ? 'green' : 'red';
//           ctx.fill();
//         });
//       }

//       // Draw masks
//       if (showMasks) {
//         regions.forEach((region, index) => {
//           const img = new Image();
//           img.src = region.mask_url;
//           img.onload = () => {
//             maskCtx.globalAlpha = 0.5;
//             maskCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
//             maskCtx.globalAlpha = 1.0;
//           };
//         });
//       }
//     } else {
//       // Final view: colored regions
//       const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
//       regions.forEach((region, index) => {
//         const img = new Image();
//         img.src = region.mask_url;
//         img.onload = () => {
//           maskCtx.globalAlpha = 0.6;
//           maskCtx.fillStyle = colors[index % colors.length];
//           maskCtx.fillRect(0, 0, canvas.width, canvas.height);
//           maskCtx.globalCompositeOperation = 'destination-in';
//           maskCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
//           maskCtx.globalCompositeOperation = 'source-over';
//           maskCtx.globalAlpha = 1.0;
//         };
//       });
//     }
//   }, [currentBox, boxes, points, activeTool, draggingBoxIndex, regions, showMasks, finalView]);

//   const isPointInBox = (x, y, box) => {
//     return x >= box[0] && x <= box[2] && y >= box[1] && y <= box[3];
//   };

//   const handleMouseDown = (e) => {
//     const rect = canvasRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     if (activeTool === "box") {
//       for (let i = 0; i < boxes.length; i++) {
//         if (isPointInBox(x, y, boxes[i])) {
//           setDraggingBoxIndex(i);
//           setDragOffset({ x: x - boxes[i][0], y: y - boxes[i][1] });
//           return;
//         }
//       }
//       setIsDrawingBox(true);
//       setBoxStart({ x, y });
//       setCurrentBox([x, y, x, y]);
//     }
//   };

//   const handleMouseMove = (e) => {
//     const rect = canvasRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     if (activeTool === "box") {
//       if (isDrawingBox && boxStart) {
//         setCurrentBox([
//           Math.min(boxStart.x, x),
//           Math.min(boxStart.y, y),
//           Math.max(boxStart.x, x),
//           Math.max(boxStart.y, y)
//         ]);
//       } else if (draggingBoxIndex !== null) {
//         const newBoxes = [...boxes];
//         const box = newBoxes[draggingBoxIndex];
//         const width = box[2] - box[0];
//         const height = box[3] - box[1];
//         newBoxes[draggingBoxIndex] = [
//           x - dragOffset.x,
//           y - dragOffset.y,
//           x - dragOffset.x + width,
//           y - dragOffset.y + height
//         ];
//         setBoxes(newBoxes);
//       }
//     }
//   };

//   const handleMouseUp = (e) => {
//     if (activeTool === "box") {
//       if (isDrawingBox && boxStart) {
//         setIsDrawingBox(false);
//         // Don't add to boxes here; wait for Select Region
//         if (currentBox && (currentBox[2] - currentBox[0] <= 5 || currentBox[3] - currentBox[1] <= 5)) {
//           setCurrentBox(null); // Discard small boxes
//         }
//         setBoxStart(null);
//       }
//       if (draggingBoxIndex !== null) {
//         setDraggingBoxIndex(null);
//       }
//     }
//   };

//   const handlePointClick = (e) => {
//     if (activeTool !== "include" && activeTool !== "exclude") return;
//     e.preventDefault();
//     const rect = canvasRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
//       console.log('Click outside canvas:', { x, y });
//       return;
//     }
//     const newPoint = { x, y, label: activeTool === "include" ? 1 : 0 };
//     setPoints(prevPoints => [...prevPoints, newPoint]);
//     console.log(`Added point: x=${x}, y=${y}, label=${newPoint.label}`);
//   };

//   const handleSelectRegion = () => {
//     console.log('handleSelectRegion called', { currentBox, activeTool });
//     if (currentBox && activeTool === "box") {
//       const newBox = [...currentBox];
//       if (newBox[2] - newBox[0] > 5 && newBox[3] - newBox[1] > 5) {
//         setBoxes([...boxes, newBox]);
//         setActiveBox(newBox);
//         console.log('Added box:', newBox);
//       } else {
//         console.log('Box too small:', newBox);
//       }
//       setCurrentBox(null);
//     } else {
//       console.log('Select Region failed:', { currentBox, activeTool });
//     }
//   };

//   const handleSegment = async () => {
//     const pointCoords = points.map(p => [p.x, p.y]);
//     const pointLabels = points.map(p => p.label);

//     if (!image_id || typeof image_id !== 'string' || image_id.trim() === '') {
//       console.error('Invalid image_id:', image_id);
//       toast.error("Image is not uploaded properly. Please try uploading again.");
//       return;
//     }

//     if (boxes.length === 0 && pointCoords.length === 0 && !activeBox) {
//       toast.error("Please select at least one bounding box or point.");
//       return;
//     }

//     try {
//       let newRegions = [...regions];
//       let boxesToProcess = boxes.length > 0 ? boxes : activeBox ? [activeBox] : [];

//       for (const box of boxesToProcess) {
//         const payload = {
//           image_id,
//           box,
//           points: pointCoords.length > 0 ? pointCoords : null,
//           labels: pointLabels.length > 0 ? pointLabels : null
//         };
//         console.log("Sending /segment payload:", JSON.stringify(payload, null, 2));
//         const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
//         const response = await axios.post(`${API_URL}/segment`, payload, {
//           headers: { 'Content-Type': 'application/json' }
//         });
//         console.log('Segmentation response:', response.data);

//         const incomingRegions = response.data.regions.filter(
//           newRegion => !newRegions.some(existing => existing.region_id === newRegion.region_id)
//         );
//         newRegions = [...newRegions, ...incomingRegions];
//         if (!lessonId) {
//           setLessonId(response.data.lesson_id);
//         }
//       }

//       if (boxesToProcess.length === 0 && pointCoords.length > 0) {
//         const payload = {
//           image_id,
//           box: activeBox || null,
//           points: pointCoords,
//           labels: pointLabels
//         };
//         console.log("Sending /segment payload:", JSON.stringify(payload, null, 2));
//         const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
//         const response = await axios.post(`${API_URL}/segment`, payload, {
//           headers: { 'Content-Type': 'application/json' }
//         });
//         console.log('Segmentation response:', response.data);
//         const incomingRegions = response.data.regions.filter(
//           newRegion => !newRegions.some(existing => existing.region_id === newRegion.region_id)
//         );
//         newRegions = [...newRegions, ...incomingRegions];
//         if (!lessonId) {
//           setLessonId(response.data.lesson_id);
//         }
//       }

//       setRegions(newRegions);
//       if (!activeBox) {
//         setBoxes([]);
//       }
//       setPoints([]);
//       setCurrentBox(null);
//     } catch (error) {
//       const errorDetail = error.response?.data?.detail
//         ? typeof error.response.data.detail === 'string'
//           ? error.response.data.detail
//           : JSON.stringify(error.response.data.detail)
//         : error.message || 'Unknown error';
//       console.error('Segmentation error:', errorDetail, error);
//       toast.error(`Segmentation failed: ${errorDetail}`);
//     }
//   };

//   const handleAddPart = () => {
//     setCurrentBox(null);
//     setActiveBox(null);
//     console.log('Ready to add new part');
//   };

//   const handleDone = () => {
//     setFinalView(true);
//   };

//   const handleProceed = () => {
//     const coloredRegions = regions.map((region, index) => ({
//       ...region,
//       teacher_email: teacherEmail,
//       color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][index % 6]
//     }));
//     onRegionsSegmented({ lesson_id: lessonId, regions: coloredRegions });
//   };

//   const handleUndo = () => {
//     if (points.length > 0) {
//       setPoints(points.slice(0, -1));
//     } else if (boxes.length > 0) {
//       setBoxes(boxes.slice(0, -1));
//     } else if (currentBox) {
//       setCurrentBox(null);
//     } else if (regions.length > 0) {
//       setRegions(regions.slice(0, -1));
//     }
//   };

//   const handleReset = () => {
//     setCurrentBox(null);
//     setBoxes([]);
//     setPoints([]);
//     setRegions([]);
//     setLessonId(null);
//     setActiveBox(null);
//     setFinalView(false);
//   };

//   const toggleMasks = () => {
//     setShowMasks(!showMasks);
//   };

//   return (
//     <motion.div
//       className="selection-container"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//     >
//       <div className="controls">
//         <motion.button
//           className={`control-button ${activeTool === "box" ? 'active-point-mode' : ''}`}
//           onClick={() => setActiveTool("box")}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdCrop size={20} /> Bounding Box
//         </motion.button>
//         <motion.button
//           className={`control-button ${activeTool === "include" ? 'active-point-mode' : ''}`}
//           onClick={() => setActiveTool("include")}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdAddCircle size={20} /> Include Point
//         </motion.button>
//         <motion.button
//           className={`control-button ${activeTool === "exclude" ? 'active-point-mode' : ''}`}
//           onClick={() => setActiveTool("exclude")}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdAddCircle size={20} /> Exclude Point
//         </motion.button>
//         <motion.button
//           className="control-button"
//           onClick={handleSelectRegion}
//           disabled={activeTool !== "box" || !currentBox}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdCheckCircle size={20} /> Select Region
//         </motion.button>
//         <motion.button
//           className="control-button"
//           onClick={handleAddPart}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdAddCircle size={20} /> Add Part
//         </motion.button>
//         <motion.button
//           className="control-button"
//           onClick={handleSegment}
//           disabled={!image_id || (boxes.length === 0 && points.length === 0 && !activeBox)}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdCheckCircle size={20} /> Segment
//         </motion.button>
//         <motion.button
//           className="control-button"
//           onClick={handleDone}
//           disabled={regions.length === 0}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdCheckCircle size={20} /> Done
//         </motion.button>
//         <motion.button
//           className="control-button"
//           onClick={handleUndo}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdUndo size={20} /> Undo
//         </motion.button>
//         <motion.button
//           className="control-button"
//           onClick={handleReset}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdRestartAlt size={20} /> Reset
//         </motion.button>
//         <motion.button
//           className="control-button"
//           onClick={toggleMasks}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <MdVisibility size={20} /> {showMasks ? 'Hide' : 'Show'} Masks
//         </motion.button>
//         <motion.button
//           className="control-button"
//           onClick={onBack}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           Back
//         </motion.button>
//         {finalView && (
//           <motion.button
//             className="control-button proceed-button"
//             onClick={handleProceed}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//           >
//             <MdCheckCircle size={20} /> Go on and add features
//           </motion.button>
//         )}
//       </div>
//       <div className="image-container" style={{ position: 'relative' }}>
//         <img
//           ref={imageRef}
//           src={image.url}
//           alt="Uploaded"
//           style={{
//             maxWidth: '100%',
//             maxHeight: '70vh',
//             objectFit: 'contain',
//             opacity: 1
//           }}
//           onLoad={() => {
//             const img = imageRef.current;
//             if (img && canvasRef.current && maskCanvasRef.current) {
//               canvasRef.current.width = img.width;
//               canvasRef.current.height = img.height;
//               maskCanvasRef.current.width = img.width;
//               maskCanvasRef.current.height = img.height;
//               console.log('Canvas resized:', { width: img.width, height: img.height });
//             }
//           }}
//         />
//         <canvas
//           ref={maskCanvasRef}
//           className="mask-canvas"
//           style={{ position: 'absolute', top: 0, left: 0 }}
//         />
//         <canvas
//           ref={canvasRef}
//           className="overlay-canvas"
//           style={{ position: 'absolute', top: 0, left: 0 }}
//           onMouseDown={handleMouseDown}
//           onMouseMove={handleMouseMove}
//           onMouseUp={handleMouseUp}
//           onClick={handlePointClick}
//           onContextMenu={(e) => {
//             e.preventDefault();
//             if (activeTool !== "exclude") {
//               setActiveTool("exclude");
//             }
//             handlePointClick(e);
//           }}
//         />
//       </div>
//     </motion.div>
//   );
// };

// export default SelectionComponent;