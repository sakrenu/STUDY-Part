// // src/components/SelectionComponent.js
// import React, { useState, useRef, useEffect } from 'react';
// import Cropper from 'react-cropper';
// import 'cropperjs/dist/cropper.css';
// import axios from 'axios';
// import { motion, AnimatePresence } from 'framer-motion';
// import { MdArrowBack, MdRefresh, MdCheck, MdAddCircle, MdRemoveCircle, MdVisibility } from 'react-icons/md';
// import { Tooltip } from 'react-tooltip';
// import { toast } from 'react-toastify';
// import '../pages/teachers/TeachByParts.css';

// const SelectionComponent = ({ image, teacherEmail, onRegionsSegmented, onBack }) => {
//   const [mode, setMode] = useState('bounding_box');
//   const [pointMode, setPointMode] = useState('include');
//   const [regions, setRegions] = useState([]);
//   const [currentRegion, setCurrentRegion] = useState(null);
//   const [activeRegionIndex, setActiveRegionIndex] = useState(null);
//   const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
//   const [showMasks, setShowMasks] = useState(false);
//   const [segmentedRegions, setSegmentedRegions] = useState(null);
//   const [error, setError] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const cropperRef = useRef(null);
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     if (image?.url) {
//       const img = new Image();
//       img.src = image.url;
//       img.onload = () => {
//         let width = img.width;
//         let height = img.height;
//         const maxWidth = 800;
//         const maxHeight = 600;
//         if (width > height) {
//           height = (maxHeight / maxWidth) * width;
//           width = maxWidth;
//         } else {
//           width = (maxWidth / maxHeight) * height;
//           height = maxHeight;
//         }
//         setImageSize({ width, height });
//       };
//     }
//   }, [image]);

//   useEffect(() => {
//     drawCanvas();
//   }, [regions, currentRegion, mode, pointMode, activeRegionIndex, showMasks, segmentedRegions]);

//   const handleModeChange = (newMode) => {
//     setMode(newMode);
//     setPointMode('include');
//     setError(null);
//     setCurrentRegion(null);
//     setActiveRegionIndex(null);
//     if (cropperRef.current?.cropper) {
//       cropperRef.current.cropper.clear();
//     }
//   };

//   const handlePointModeChange = (newPointMode) => {
//     setPointMode(newPointMode);
//   };

//   const handleSelectRegion = () => {
//     if (mode === 'bounding_box') {
//       const cropper = cropperRef.current?.cropper;
//       if (cropper) {
//         const { x, y, width, height } = cropper.getData(true);
//         if (width > 0 && height > 0) {
//           setCurrentRegion({ type: 'bounding_box', x, y, width, height, excludePoints: [] });
//           cropper.clear();
//           toast.success('Region selected!', { theme: 'dark' });
//         } else {
//           setError('Draw a valid region.');
//           toast.error('Draw a valid region.', { theme: 'dark' });
//         }
//       }
//     } else if (mode === 'point_based') {
//       if (currentRegion?.points?.length > 0) {
//         toast.success('Points selected!', { theme: 'dark' });
//       } else {
//         setError('Add at least one point.');
//         toast.error('Add at least one point.', { theme: 'dark' });
//       }
//     }
//   };

//   const handleCanvasClick = (e) => {
//     if (mode !== 'point_based') return;
//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
//     const scaleX = imageSize.width / rect.width;
//     const scaleY = imageSize.height / rect.height;
//     const x = (e.clientX - rect.left) * scaleX;
//     const y = (e.clientY - rect.top) * scaleY;

//     if (pointMode === 'include') {
//       if (!currentRegion) {
//         setCurrentRegion({ type: 'point_based', points: [{ x, y }], excludePoints: [] });
//       } else {
//         setCurrentRegion({ ...currentRegion, points: [...currentRegion.points, { x, y }] });
//       }
//     } else if (pointMode === 'exclude') {
//       if (activeRegionIndex !== null) {
//         const updatedRegions = [...regions];
//         updatedRegions[activeRegionIndex].excludePoints.push({ x, y });
//         setRegions(updatedRegions);
//       } else if (currentRegion) {
//         setCurrentRegion({ ...currentRegion, excludePoints: [...currentRegion.excludePoints, { x, y }] });
//       }
//     }
//     drawCanvas();
//   };

//   const drawCanvas = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext('2d');
//     const img = new Image();
//     img.src = image.url;
//     img.onload = () => {
//       canvas.width = imageSize.width;
//       canvas.height = imageSize.height;
//       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

//       regions.forEach((region, index) => {
//         if (region.type === 'bounding_box') {
//           ctx.strokeStyle = index === activeRegionIndex ? '#FF9966' : '#E6E6E6';
//           ctx.lineWidth = 2;
//           ctx.strokeRect(region.x, region.y, region.width, region.height);
//           ctx.font = '16px Inter';
//           ctx.fillStyle = '#E6E6E6';
//           ctx.fillText(index + 1, region.x + 5, region.y + 20);
//         } else {
//           region.points.forEach((point, pointIndex) => {
//             ctx.beginPath();
//             ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
//             ctx.fillStyle = '#33FFCC';
//             ctx.fill();
//             ctx.strokeStyle = '#FFFFFF';
//             ctx.stroke();
//             ctx.font = '12px Inter';
//             ctx.fillStyle = '#FFFFFF';
//             ctx.fillText(pointIndex + 1, point.x + 8, point.y - 8);
//           });
//         }
//         region.excludePoints?.forEach((point, pointIndex) => {
//           ctx.beginPath();
//           ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
//           ctx.fillStyle = '#FF6666';
//           ctx.fill();
//           ctx.strokeStyle = '#FFFFFF';
//           ctx.stroke();
//           ctx.font = '12px Inter';
//           ctx.fillStyle = '#FFFFFF';
//           ctx.fillText(pointIndex + 1, point.x + 8, point.y - 8);
//         });
//       });

//       if (currentRegion) {
//         if (currentRegion.type === 'bounding_box') {
//           ctx.strokeStyle = '#FF9966';
//           ctx.lineWidth = 2;
//           ctx.strokeRect(currentRegion.x, currentRegion.y, currentRegion.width, currentRegion.height);
//         } else {
//           currentRegion.points.forEach((point, pointIndex) => {
//             ctx.beginPath();
//             ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
//             ctx.fillStyle = '#33FFCC';
//             ctx.fill();
//             ctx.strokeStyle = '#FFFFFF';
//             ctx.stroke();
//             ctx.font = '12px Inter';
//             ctx.fillStyle = '#FFFFFF';
//             ctx.fillText(pointIndex + 1, point.x + 8, point.y - 8);
//           });
//           currentRegion.excludePoints.forEach((point, pointIndex) => {
//             ctx.beginPath();
//             ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
//             ctx.fillStyle = '#FF6666';
//             ctx.fill();
//             ctx.strokeStyle = '#FFFFFF';
//             ctx.stroke();
//             ctx.font = '12px Inter';
//             ctx.fillStyle = '#FFFFFF';
//             ctx.fillText(pointIndex + 1, point.x + 8, point.y - 8);
//           });
//         }
//       }

//       if (showMasks && segmentedRegions) {
//         segmentedRegions.regions.forEach((region) => {
//           const maskImg = new Image();
//           maskImg.src = region.maskUrl;
//           maskImg.onload = () => {
//             ctx.globalAlpha = 0.5;
//             ctx.drawImage(maskImg, region.position.x || 0, region.position.y || 0, region.position.width || imageSize.width, region.position.height || imageSize.height);
//             ctx.globalAlpha = 1.0;
//           };
//         });
//       }
//     };
//   };

//   const handleAddRegion = () => {
//     if (currentRegion) {
//       setRegions([...regions, currentRegion]);
//       setCurrentRegion(null);
//       setMode(mode);
//       setPointMode('include');
//       setActiveRegionIndex(null);
//       toast.success('Region saved!', { theme: 'dark' });
//     }
//   };

//   const handleExcludePoints = (index) => {
//     setMode('point_based');
//     setPointMode('exclude');
//     setActiveRegionIndex(index);
//     setCurrentRegion(null);
//     drawCanvas();
//   };

//   const handleUndo = () => {
//     if (mode === 'point_based' && pointMode === 'exclude' && activeRegionIndex !== null) {
//       const updatedRegions = [...regions];
//       updatedRegions[activeRegionIndex].excludePoints.pop();
//       setRegions(updatedRegions);
//       drawCanvas();
//     } else if (currentRegion?.excludePoints?.length > 0) {
//       setCurrentRegion({ ...currentRegion, excludePoints: currentRegion.excludePoints.slice(0, -1) });
//       drawCanvas();
//     } else if (mode === 'point_based' && currentRegion?.points?.length > 0) {
//       setCurrentRegion({ ...currentRegion, points: currentRegion.points.slice(0, -1) });
//       drawCanvas();
//     } else {
//       setRegions(regions.slice(0, -1));
//       setCurrentRegion(null);
//       setActiveRegionIndex(null);
//       if (cropperRef.current?.cropper) {
//         cropperRef.current.cropper.clear();
//       }
//       toast.info('Last action undone.', { theme: 'dark' });
//     }
//   };

//   const handleReset = () => {
//     setRegions([]);
//     setCurrentRegion(null);
//     setActiveRegionIndex(null);
//     setMode('bounding_box');
//     setPointMode('include');
//     setError(null);
//     setShowMasks(false);
//     setSegmentedRegions(null);
//     if (cropperRef.current?.cropper) {
//       cropperRef.current.cropper.clear();
//     }
//     toast.info('All selections reset.', { theme: 'dark' });
//   };

//   const handleDone = async () => {
//     if (regions.length === 0 && !currentRegion) {
//       setError('Add at least one region.');
//       toast.error('Add at least one region.', { theme: 'dark' });
//       return;
//     }
//     setIsProcessing(true);
//     try {
//       setError(null);
//       const regionsToSubmit = currentRegion ? [...regions, currentRegion] : regions;
//       const boxRegions = regionsToSubmit.filter(r => r.type === 'bounding_box' && !r.excludePoints.length);
//       const pointRegions = regionsToSubmit.filter(r => r.type === 'point_based');
//       const boxAsPointRegions = regionsToSubmit.filter(r => r.type === 'bounding_box' && r.excludePoints.length);
//       const results = [];

//       if (boxRegions.length > 0) {
//         const response = await axios.post('http://127.0.0.1:8000/segment_with_boxes', {
//           image_url: image.url,
//           teacher_id: teacherEmail,
//           regions: boxRegions.map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height }))
//         }, { timeout: 60000 });
//         results.push(...response.data.results.map((res, i) => ({
//           ...boxRegions[i], maskUrl: res.cutout, outlineUrl: res.outline, position: res.position, type: 'bounding_box'
//         })));
//       }

//       if (pointRegions.length > 0) {
//         const response = await axios.post('http://127.0.0.1:8000/segment_with_points', {
//           image_url: image.url,
//           teacher_id: teacherEmail,
//           regions: pointRegions.map(r => ({ points: r.points, excludePoints: r.excludePoints || [] }))
//         }, { timeout: 60000 });
//         results.push(...response.data.results.map((res, i) => ({
//           ...pointRegions[i], maskUrl: res.cutout, outlineUrl: res.outline, position: res.position, type: 'point_based'
//         })));
//       }

//       if (boxAsPointRegions.length > 0) {
//         const response = await axios.post('http://127.0.0.1:8000/segment_with_box_as_points', {
//           image_url: image.url,
//           teacher_id: teacherEmail,
//           regions: boxAsPointRegions.map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height, excludePoints: r.excludePoints || [] }))
//         }, { timeout: 60000 });
//         results.push(...response.data.results.map((res, i) => ({
//           ...boxAsPointRegions[i], maskUrl: res.cutout, outlineUrl: res.outline, position: res.position, type: 'box_as_points'
//         })));
//       }

//       const segmentedData = { type: 'mixed', regions: results, originalSize: imageSize };
//       setSegmentedRegions(segmentedData);
//       setShowMasks(true);
//       onRegionsSegmented(segmentedData);
//       toast.success('Segmentation complete!', { theme: 'dark' });
//     } catch (err) {
//       setError('Failed to segment: ' + err.message);
//       toast.error('Failed to segment.', { theme: 'dark' });
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const toggleMasks = () => {
//     setShowMasks(!showMasks);
//     drawCanvas();
//   };

//   const isSelectRegionDisabled = () => {
//     if (mode === 'bounding_box') {
//       const cropper = cropperRef.current?.cropper;
//       if (!cropper) return true;
//       const { width, height } = cropper.getData(true) || {};
//       return !width || width <= 0 || !height || height <= 0;
//     }
//     return mode === 'point_based' && (!currentRegion || currentRegion.points.length === 0);
//   };

//   return (
//     <motion.div className="selection-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
//       <div className="selection-header">
//         <motion.button className="back-button" onClick={onBack} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-tooltip-id="back-tooltip" data-tooltip-content="Go back to upload">
//           <MdArrowBack size={24} />
//         </motion.button>
//         <h2>Select Regions</h2>
//       </div>
//       <p className="selection-description">Choose Bounding Box or Point-Based to define regions.</p>
//       <div className="selection-area">
//         {mode === 'bounding_box' && !currentRegion && (
//           <Cropper
//             src={image.url}
//             style={{ width: `${imageSize.width}px`, height: `${imageSize.height}px`, margin: '0 auto' }}
//             initialAspectRatio={null}
//             guides={true}
//             viewMode={1}
//             autoCropArea={0}
//             ref={cropperRef}
//             dragMode="crop"
//             cropBoxResizable={true}
//             background={false}
//             cropBoxMovable={true}
//             zoomable={false}
//             scalable={false}
//             minCropBoxWidth={10}
//             minCropBoxHeight={10}
//           />
//         )}
//         {(mode === 'point_based' || currentRegion || showMasks) && (
//           <canvas ref={canvasRef} onClick={handleCanvasClick} width={imageSize.width} height={imageSize.height} style={{ margin: '0 auto' }} />
//         )}
//       </div>
//       <AnimatePresence>
//         {isProcessing && (
//           <motion.div className="processing-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
//             <div className="processing-animation">
//               <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="dot" />
//               <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="dot" />
//               <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="dot" />
//             </div>
//             <p>Processing Segmentation...</p>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       <div className="selection-toolbar">
//         <div className="toolbar-group">
//           <motion.button
//             className={`control-button ${mode === 'bounding_box' ? 'active' : ''}`}
//             onClick={() => handleModeChange('bounding_box')}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             data-tooltip-id="bbox-tooltip"
//             data-tooltip-content="Draw rectangles"
//           >
//             Bounding Box
//           </motion.button>
//           <motion.button
//             className={`control-button ${mode === 'point_based' ? 'active' : ''}`}
//             onClick={() => handleModeChange('point_based')}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             data-tooltip-id="points-tooltip"
//             data-tooltip-content="Place points"
//           >
//             Point-Based
//           </motion.button>
//         </div>
//         {mode === 'point_based' && (
//           <div className="toolbar-group">
//             <motion.button
//               className={`control-button ${pointMode === 'include' ? 'active' : ''}`}
//               onClick={() => handlePointModeChange('include')}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               data-tooltip-id="include-tooltip"
//               data-tooltip-content="Add foreground points"
//             >
//               Include Points
//             </motion.button>
//             <motion.button
//               className={`control-button ${pointMode === 'exclude' ? 'active' : ''}`}
//               onClick={() => handlePointModeChange('exclude')}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               data-tooltip-id="exclude-tooltip"
//               data-tooltip-content="Add background points"
//             >
//               Exclude Points
//             </motion.button>
//           </div>
//         )}
//         <div className="toolbar-group">
//           <motion.button
//             className="control-button select-region"
//             onClick={handleSelectRegion}
//             disabled={isSelectRegionDisabled()}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             data-tooltip-id="select-tooltip"
//             data-tooltip-content="Confirm region"
//           >
//             <MdCheck size={20} /> Select Region
//           </motion.button>
//           <motion.button
//             className="control-button add-region"
//             onClick={handleAddRegion}
//             disabled={!currentRegion}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             data-tooltip-id="add-tooltip"
//             data-tooltip-content="Save region"
//           >
//             <MdAddCircle size={20} /> Add Region
//           </motion.button>
//         </div>
//         <div className="toolbar-group">
//           {regions.map((region, index) => (
//             <motion.button
//               key={index}
//               className={`control-button exclude ${mode === 'point_based' && pointMode === 'exclude' && activeRegionIndex === index ? 'active' : ''}`}
//               onClick={() => handleExcludePoints(index)}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               data-tooltip-id={`exclude-${index}-tooltip`}
//               data-tooltip-content={`Exclude areas from region ${index + 1}`}
//             >
//               <MdRemoveCircle size={20} /> Exclude R{index + 1}
//             </motion.button>
//           ))}
//         </div>
//         <div className="toolbar-group">
//           <motion.button
//             className="control-button undo"
//             onClick={handleUndo}
//             disabled={regions.length === 0 && !currentRegion}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             data-tooltip-id="undo-tooltip"
//             data-tooltip-content="Undo last action"
//           >
//             <MdRefresh size={20} /> Undo
//           </motion.button>
//           <motion.button
//             className="control-button reset"
//             onClick={handleReset}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             data-tooltip-id="reset-tooltip"
//             data-tooltip-content="Reset all"
//           >
//             <MdRefresh size={20} /> Reset
//           </motion.button>
//           <motion.button
//             className="control-button done"
//             onClick={handleDone}
//             disabled={isProcessing}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             data-tooltip-id="done-tooltip"
//             data-tooltip-content="Segment regions"
//           >
//             <MdCheck size={20} /> Done
//           </motion.button>
//           {segmentedRegions && (
//             <motion.button
//               className="control-button show-masks"
//               onClick={toggleMasks}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               data-tooltip-id="masks-tooltip"
//               data-tooltip-content={showMasks ? 'Hide masks' : 'Show masks'}
//             >
//               <MdVisibility size={20} /> {showMasks ? 'Hide Masks' : 'Show Masks'}
//             </motion.button>
//           )}
//         </div>
//         <Tooltip id="bbox-tooltip" place="top" />
//         <Tooltip id="points-tooltip" place="top" />
//         <Tooltip id="include-tooltip" place="top" />
//         <Tooltip id="exclude-tooltip" place="top" />
//         <Tooltip id="select-tooltip" place="top" />
//         <Tooltip id="add-tooltip" place="top" />
//         {regions.map((_, index) => <Tooltip key={index} id={`exclude-${index}-tooltip`} place="top" />)}
//         <Tooltip id="undo-tooltip" place="top" />
//         <Tooltip id="reset-tooltip" place="top" />
//         <Tooltip id="done-tooltip" place="top" />
//         <Tooltip id="masks-tooltip" place="top" />
//       </div>
//       {error && <div className="error-message">{error}</div>}
//     </motion.div>
//   );
// };

// export default SelectionComponent;
import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MdArrowBack, MdRefresh, MdCheck, MdAddCircle, MdRemoveCircle, MdVisibility } from 'react-icons/md';
import { Tooltip } from 'react-tooltip';
import { toast } from 'react-toastify';
import '../pages/teachers/TeachByParts.css';

const SelectionComponent = ({ image, teacherEmail, onRegionsSegmented, onBack }) => {
  const [mode, setMode] = useState('bounding_box');
  const [pointMode, setPointMode] = useState('include');
  const [regions, setRegions] = useState([]);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [activeRegionIndex, setActiveRegionIndex] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [showMasks, setShowMasks] = useState(false);
  const [segmentedRegions, setSegmentedRegions] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasValidSelection, setHasValidSelection] = useState(false); // New state variable
  const cropperRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (image?.url) {
      const img = new Image();
      img.src = image.url;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxWidth = 800;
        const maxHeight = 600;
        if (width > height) {
          height = (maxHeight / maxWidth) * width;
          width = maxWidth;
        } else {
          width = (maxWidth / maxHeight) * height;
          height = maxHeight;
        }
        setImageSize({ width, height });
      };
    }
  }, [image]);

  useEffect(() => {
    drawCanvas();
  }, [regions, currentRegion, mode, pointMode, activeRegionIndex, showMasks, segmentedRegions]);

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const { width, height } = cropper.getData(true);
      setHasValidSelection(width > 0 && height > 0);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setPointMode('include');
    setError(null);
    setCurrentRegion(null);
    setActiveRegionIndex(null);
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.clear();
      setHasValidSelection(false);
    }
  };

  const handlePointModeChange = (newPointMode) => {
    setPointMode(newPointMode);
  };

  const handleSelectRegion = () => {
    if (mode === 'bounding_box') {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
        const { x, y, width, height } = cropper.getData(true);
        if (width > 0 && height > 0) {
          setCurrentRegion({ type: 'bounding_box', x, y, width, height, excludePoints: [] });
          cropper.clear();
          setHasValidSelection(false);
          toast.success('Region selected!', { theme: 'dark' });
        } else {
          setError('Draw a valid region.');
          toast.error('Draw a valid region.', { theme: 'dark' });
        }
      }
    } else if (mode === 'point_based') {
      if (currentRegion?.points?.length > 0) {
        toast.success('Points selected!', { theme: 'dark' });
      } else {
        setError('Add at least one point.');
        toast.error('Add at least one point.', { theme: 'dark' });
      }
    }
  };

  const handleCanvasClick = (e) => {
    if (mode !== 'point_based') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (pointMode === 'include') {
      if (!currentRegion) {
        setCurrentRegion({ type: 'point_based', points: [{ x, y }], excludePoints: [] });
      } else {
        setCurrentRegion({ ...currentRegion, points: [...currentRegion.points, { x, y }] });
      }
    } else if (pointMode === 'exclude') {
      if (activeRegionIndex !== null) {
        const updatedRegions = [...regions];
        updatedRegions[activeRegionIndex].excludePoints.push({ x, y });
        setRegions(updatedRegions);
      } else if (currentRegion) {
        setCurrentRegion({ ...currentRegion, excludePoints: [...currentRegion.excludePoints, { x, y }] });
      }
    }
    drawCanvas();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image.url;
    img.onload = () => {
      canvas.width = imageSize.width;
      canvas.height = imageSize.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      regions.forEach((region, index) => {
        if (region.type === 'bounding_box') {
          ctx.strokeStyle = index === activeRegionIndex ? '#FF9966' : '#E6E6E6';
          ctx.lineWidth = 2;
          ctx.strokeRect(region.x, region.y, region.width, region.height);
          ctx.font = '16px Inter';
          ctx.fillStyle = '#E6E6E6';
          ctx.fillText(index + 1, region.x + 5, region.y + 20);
        } else {
          region.points.forEach((point, pointIndex) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#33FFCC';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
            ctx.font = '12px Inter';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(pointIndex + 1, point.x + 8, point.y - 8);
          });
        }
        region.excludePoints?.forEach((point, pointIndex) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF6666';
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();
          ctx.font = '12px Inter';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(pointIndex + 1, point.x + 8, point.y - 8);
        });
      });

      if (currentRegion) {
        if (currentRegion.type === 'bounding_box') {
          ctx.strokeStyle = '#FF9966';
          ctx.lineWidth = 2;
          ctx.strokeRect(currentRegion.x, currentRegion.y, currentRegion.width, currentRegion.height);
        } else {
          currentRegion.points.forEach((point, pointIndex) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#33FFCC';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
            ctx.font = '12px Inter';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(pointIndex + 1, point.x + 8, point.y - 8);
          });
          currentRegion.excludePoints.forEach((point, pointIndex) => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = '#FF6666';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
            ctx.font = '12px Inter';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(pointIndex + 1, point.x + 8, point.y - 8);
          });
        }
      }

      if (showMasks && segmentedRegions) {
        segmentedRegions.regions.forEach((region) => {
          const maskImg = new Image();
          maskImg.src = region.maskUrl;
          maskImg.onload = () => {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(maskImg, region.position.x || 0, region.position.y || 0, region.position.width || imageSize.width, region.position.height || imageSize.height);
            ctx.globalAlpha = 1.0;
          };
        });
      }
    };
  };

  const handleAddRegion = () => {
    if (currentRegion) {
      setRegions([...regions, currentRegion]);
      setCurrentRegion(null);
      setMode(mode);
      setPointMode('include');
      setActiveRegionIndex(null);
      toast.success('Region saved!', { theme: 'dark' });
    }
  };

  const handleExcludePoints = (index) => {
    setMode('point_based');
    setPointMode('exclude');
    setActiveRegionIndex(index);
    setCurrentRegion(null);
    drawCanvas();
  };

  const handleUndo = () => {
    if (mode === 'point_based' && pointMode === 'exclude' && activeRegionIndex !== null) {
      const updatedRegions = [...regions];
      updatedRegions[activeRegionIndex].excludePoints.pop();
      setRegions(updatedRegions);
      drawCanvas();
    } else if (currentRegion?.excludePoints?.length > 0) {
      setCurrentRegion({ ...currentRegion, excludePoints: currentRegion.excludePoints.slice(0, -1) });
      drawCanvas();
    } else if (mode === 'point_based' && currentRegion?.points?.length > 0) {
      setCurrentRegion({ ...currentRegion, points: currentRegion.points.slice(0, -1) });
      drawCanvas();
    } else {
      setRegions(regions.slice(0, -1));
      setCurrentRegion(null);
      setActiveRegionIndex(null);
      if (cropperRef.current?.cropper) {
        cropperRef.current.cropper.clear();
        setHasValidSelection(false);
      }
      toast.info('Last action undone.', { theme: 'dark' });
    }
  };

  const handleReset = () => {
    setRegions([]);
    setCurrentRegion(null);
    setActiveRegionIndex(null);
    setMode('bounding_box');
    setPointMode('include');
    setError(null);
    setShowMasks(false);
    setSegmentedRegions(null);
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.clear();
      setHasValidSelection(false);
    }
    toast.info('All selections reset.', { theme: 'dark' });
  };

  const handleDone = async () => {
    if (regions.length === 0 && !currentRegion) {
      setError('Add at least one region.');
      toast.error('Add at least one region.', { theme: 'dark' });
      return;
    }
    setIsProcessing(true);
    try {
      setError(null);
      const regionsToSubmit = currentRegion ? [...regions, currentRegion] : regions;
      const boxRegions = regionsToSubmit.filter(r => r.type === 'bounding_box' && !r.excludePoints.length);
      const pointRegions = regionsToSubmit.filter(r => r.type === 'point_based');
      const boxAsPointRegions = regionsToSubmit.filter(r => r.type === 'bounding_box' && r.excludePoints.length);
      const results = [];

      if (boxRegions.length > 0) {
        const response = await axios.post('http://127.0.0.1:8000/segment_with_boxes', {
          image_url: image.url,
          teacher_id: teacherEmail,
          regions: boxRegions.map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height }))
        }, { timeout: 60000 });
        results.push(...response.data.results.map((res, i) => ({
          ...boxRegions[i], maskUrl: res.cutout, outlineUrl: res.outline, position: res.position, type: 'bounding_box'
        })));
      }

      if (pointRegions.length > 0) {
        const response = await axios.post('http://127.0.0.1:8000/segment_with_points', {
          image_url: image.url,
          teacher_id: teacherEmail,
          regions: pointRegions.map(r => ({ points: r.points, excludePoints: r.excludePoints || [] }))
        }, { timeout: 60000 });
        results.push(...response.data.results.map((res, i) => ({
          ...pointRegions[i], maskUrl: res.cutout, outlineUrl: res.outline, position: res.position, type: 'point_based'
        })));
      }

      if (boxAsPointRegions.length > 0) {
        const response = await axios.post('http://127.0.0.1:8000/segment_with_box_as_points', {
          image_url: image.url,
          teacher_id: teacherEmail,
          regions: boxAsPointRegions.map(r => ({ x: r.x, y: r.y, width: r.width, height: r.height, excludePoints: r.excludePoints || [] }))
        }, { timeout: 60000 });
        results.push(...response.data.results.map((res, i) => ({
          ...boxAsPointRegions[i], maskUrl: res.cutout, outlineUrl: res.outline, position: res.position, type: 'box_as_points'
        })));
      }

      const segmentedData = { type: 'mixed', regions: results, originalSize: imageSize };
      setSegmentedRegions(segmentedData);
      setShowMasks(true);
      onRegionsSegmented(segmentedData);
      toast.success('Segmentation complete!', { theme: 'dark' });
    } catch (err) {
      setError('Failed to segment: ' + err.message);
      toast.error('Failed to segment.', { theme: 'dark' });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMasks = () => {
    setShowMasks(!showMasks);
    drawCanvas();
  };

  const isSelectRegionDisabled = () => {
    if (mode === 'bounding_box') {
      return !hasValidSelection;
    }
    return mode === 'point_based' && (!currentRegion || currentRegion.points.length === 0);
  };

  return (
    <motion.div className="selection-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="selection-header">
        <motion.button className="back-button" onClick={onBack} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} data-tooltip-id="back-tooltip" data-tooltip-content="Go back to upload">
          <MdArrowBack size={24} />
        </motion.button>
        <h2>Select Regions</h2>
      </div>
      <p className="selection-description">Choose Bounding Box or Point-Based to define regions.</p>
      <div className="selection-area">
        {mode === 'bounding_box' && !currentRegion && (
          <Cropper
            src={image.url}
            style={{ width: `${imageSize.width}px`, height: `${imageSize.height}px`, margin: '0 auto' }}
            initialAspectRatio={null}
            guides={true}
            viewMode={1}
            autoCropArea={0}
            ref={cropperRef}
            dragMode="crop"
            cropBoxResizable={true}
            background={false}
            cropBoxMovable={true}
            zoomable={false}
            scalable={false}
            minCropBoxWidth={10}
            minCropBoxHeight={10}
            crop={handleCrop}
          />
        )}
        {(mode === 'point_based' || currentRegion || showMasks) && (
          <canvas ref={canvasRef} onClick={handleCanvasClick} width={imageSize.width} height={imageSize.height} style={{ margin: '0 auto' }} />
        )}
      </div>
      <AnimatePresence>
        {isProcessing && (
          <motion.div className="processing-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="processing-animation">
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="dot" />
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="dot" />
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="dot" />
            </div>
            <p>Processing Segmentation...</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="selection-toolbar">
        <div className="toolbar-group">
          <motion.button
            className={`control-button ${mode === 'bounding_box' ? 'active' : ''}`}
            onClick={() => handleModeChange('bounding_box')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-tooltip-id="bbox-tooltip"
            data-tooltip-content="Draw rectangles"
          >
            Bounding Box
          </motion.button>
          <motion.button
            className={`control-button ${mode === 'point_based' ? 'active' : ''}`}
            onClick={() => handleModeChange('point_based')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-tooltip-id="points-tooltip"
            data-tooltip-content="Place points"
          >
            Point-Based
          </motion.button>
        </div>
        {mode === 'point_based' && (
          <div className="toolbar-group">
            <motion.button
              className={`control-button ${pointMode === 'include' ? 'active' : ''}`}
              onClick={() => handlePointModeChange('include')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              data-tooltip-id="include-tooltip"
              data-tooltip-content="Add foreground points"
            >
              Include Points
            </motion.button>
            <motion.button
              className={`control-button ${pointMode === 'exclude' ? 'active' : ''}`}
              onClick={() => handlePointModeChange('exclude')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              data-tooltip-id="exclude-tooltip"
              data-tooltip-content="Add background points"
            >
              Exclude Points
            </motion.button>
          </div>
        )}
        <div className="toolbar-group">
          <motion.button
            className="control-button select-region"
            onClick={handleSelectRegion}
            disabled={isSelectRegionDisabled()}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-tooltip-id="select-tooltip"
            data-tooltip-content="Confirm region"
          >
            <MdCheck size={20} /> Select Region
          </motion.button>
          <motion.button
            className="control-button add-region"
            onClick={handleAddRegion}
            disabled={!currentRegion}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-tooltip-id="add-tooltip"
            data-tooltip-content="Save region"
          >
            <MdAddCircle size={20} /> Add Region
          </motion.button>
        </div>
        <div className="toolbar-group">
          {regions.map((region, index) => (
            <motion.button
              key={index}
              className={`control-button exclude ${mode === 'point_based' && pointMode === 'exclude' && activeRegionIndex === index ? 'active' : ''}`}
              onClick={() => handleExcludePoints(index)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              data-tooltip-id={`exclude-${index}-tooltip`}
              data-tooltip-content={`Exclude areas from region ${index + 1}`}
            >
              <MdRemoveCircle size={20} /> Exclude R{index + 1}
            </motion.button>
          ))}
        </div>
        <div className="toolbar-group">
          <motion.button
            className="control-button undo"
            onClick={handleUndo}
            disabled={regions.length === 0 && !currentRegion}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-tooltip-id="undo-tooltip"
            data-tooltip-content="Undo last action"
          >
            <MdRefresh size={20} /> Undo
          </motion.button>
          <motion.button
            className="control-button reset"
            onClick={handleReset}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-tooltip-id="reset-tooltip"
            data-tooltip-content="Reset all"
          >
            <MdRefresh size={20} /> Reset
          </motion.button>
          <motion.button
            className="control-button done"
            onClick={handleDone}
            disabled={isProcessing}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-tooltip-id="done-tooltip"
            data-tooltip-content="Segment regions"
          >
            <MdCheck size={20} /> Done
          </motion.button>
          {segmentedRegions && (
            <motion.button
              className="control-button show-masks"
              onClick={toggleMasks}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              data-tooltip-id="masks-tooltip"
              data-tooltip-content={showMasks ? 'Hide masks' : 'Show masks'}
            >
              <MdVisibility size={20} /> {showMasks ? 'Hide Masks' : 'Show Masks'}
            </motion.button>
          )}
        </div>
        <Tooltip id="bbox-tooltip" place="top" />
        <Tooltip id="points-tooltip" place="top" />
        <Tooltip id="include-tooltip" place="top" />
        <Tooltip id="exclude-tooltip" place="top" />
        <Tooltip id="select-tooltip" place="top" />
        <Tooltip id="add-tooltip" place="top" />
        {regions.map((_, index) => <Tooltip key={index} id={`exclude-${index}-tooltip`} place="top" />)}
        <Tooltip id="undo-tooltip" place="top" />
        <Tooltip id="reset-tooltip" place="top" />
        <Tooltip id="done-tooltip" place="top" />
        <Tooltip id="masks-tooltip" place="top" />
      </div>
      {error && <div className="error-message">{error}</div>}
    </motion.div>
  );
};

export default SelectionComponent;