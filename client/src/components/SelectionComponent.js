// // src/components/SelectionComponent.js
// import React, { useState, useRef, useEffect } from 'react';
// import Cropper from 'react-cropper';
// import 'cropperjs/dist/cropper.css';
// import axios from 'axios';
// import { motion } from 'framer-motion';
// import { MdArrowBack, MdRefresh, MdCheck, MdAddCircle, MdAdd, MdRemove } from 'react-icons/md';
// import { Tooltip } from 'react-tooltip';
// import { toast } from 'react-toastify';
// // import '../styles/TeachByParts.css';
// import '../pages/teachers/TeachByParts.css';

// const SelectionComponent = ({ image, teacherEmail, onRegionsSegmented, onBack }) => {
//   const [regions, setRegions] = useState([]);
//   const [currentRegion, setCurrentRegion] = useState(null); // { x, y, width, height, points: [] }
//   const [pointType, setPointType] = useState('include'); // include, exclude
//   const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
//   const [error, setError] = useState(null);
//   const cropperRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [showCanvas, setShowCanvas] = useState(false);

//   useEffect(() => {
//     if (image?.url) {
//       const img = new Image();
//       img.src = image.url;
//       img.onload = () => {
//         // Resize to 800x600, maintaining aspect ratio
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

//   const handleSelectRegion = () => {
//     const cropper = cropperRef.current?.cropper;
//     if (cropper) {
//       const { x, y, width, height } = cropper.getData(true);
//       if (width > 0 && height > 0) {
//         setCurrentRegion({ x, y, width, height, points: [] });
//         setShowCanvas(true);
//         cropper.disable();
//         toast.success('Region selected! Add points or save.', { theme: 'dark' });
//       } else {
//         setError('Please draw a valid region.');
//         toast.error('Please draw a valid region.', { theme: 'dark' });
//       }
//     }
//   };

//   const handleCanvasClick = (e) => {
//     if (!showCanvas || !currentRegion) return;
//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
//     const scaleX = imageSize.width / rect.width;
//     const scaleY = imageSize.height / rect.height;
//     const x = (e.clientX - rect.left) * scaleX;
//     const y = (e.clientY - rect.top) * scaleY;

//     setCurrentRegion({
//       ...currentRegion,
//       points: [...currentRegion.points, { x, y, label: pointType === 'include' ? 1 : 0 }],
//     });
//     drawPoints();
//   };

//   const drawPoints = () => {
//     if (!currentRegion) return;
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     const img = new Image();
//     img.src = image.url;
//     img.onload = () => {
//       canvas.width = imageSize.width;
//       canvas.height = imageSize.height;
//       ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
//       // Highlight region
//       ctx.fillStyle = 'rgba(255, 153, 102, 0.3)'; // Coral glow
//       ctx.fillRect(currentRegion.x, currentRegion.y, currentRegion.width, currentRegion.height);
//       // Draw points
//       currentRegion.points.forEach((point, index) => {
//         const scaleX = canvas.width / imageSize.width;
//         const scaleY = canvas.height / imageSize.height;
//         ctx.beginPath();
//         ctx.arc(point.x * scaleX, point.y * scaleY, 5, 0, 2 * Math.PI);
//         ctx.fillStyle = point.label === 1 ? '#33FFCC' : '#FF6666';
//         ctx.fill();
//         ctx.strokeStyle = '#FFFFFF';
//         ctx.stroke();
//         ctx.font = '12px Inter';
//         ctx.fillStyle = '#FFFFFF';
//         ctx.fillText(index + 1, point.x * scaleX + 8, point.y * scaleY - 8);
//       });
//     };
//   };

//   useEffect(() => {
//     if (showCanvas && currentRegion) {
//       drawPoints();
//     }
//   }, [currentRegion, showCanvas]);

//   const handleAddRegion = () => {
//     if (currentRegion) {
//       setRegions([...regions, currentRegion]);
//       setCurrentRegion(null);
//       setShowCanvas(false);
//       cropperRef.current?.cropper.enable();
//       cropperRef.current?.cropper.clear();
//       toast.success('Region added!', { theme: 'dark' });
//     }
//   };

//   const handleUndoPoint = () => {
//     if (currentRegion && currentRegion.points.length > 0) {
//       setCurrentRegion({
//         ...currentRegion,
//         points: currentRegion.points.slice(0, -1),
//       });
//       drawPoints();
//     }
//   };

//   const handleReset = () => {
//     setRegions([]);
//     setCurrentRegion(null);
//     setShowCanvas(false);
//     setError(null);
//     if (cropperRef.current?.cropper) {
//       cropperRef.current.cropper.clear();
//       cropperRef.current.cropper.enable();
//     }
//     toast.info('Selections reset.', { theme: 'dark' });
//   };

//   const handleDone = async () => {
//     if (regions.length === 0 && !currentRegion) {
//       setError('Please add at least one region.');
//       toast.error('Please add at least one region.', { theme: 'dark' });
//       return;
//     }
//     try {
//       setError(null);
//       const regionsToSubmit = currentRegion ? [...regions, currentRegion] : regions;
//       const response = await axios.post('http://127.0.0.1:8000/segment_with_boxes_and_points', {
//         image_url: image.url,
//         teacher_id: teacherEmail,
//         regions: regionsToSubmit,
//       });
//       const segmentedRegions = response.data.results.map((result, index) => ({
//         ...regionsToSubmit[index],
//         maskUrl: result.cutout,
//         outlineUrl: result.outline,
//       }));
//       onRegionsSegmented({
//         type: 'combined',
//         regions: segmentedRegions,
//         originalSize: imageSize,
//       });
//       toast.success('Regions segmented successfully!', { theme: 'dark' });
//     } catch (err) {
//       setError('Failed to segment regions: ' + err.message);
//       toast.error('Failed to segment regions.', { theme: 'dark' });
//     }
//   };

//   return (
//     <motion.div
//       className="selection-container"
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <div className="selection-header">
//         <motion.button
//           className="back-button"
//           onClick={onBack}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           data-tooltip-id="back-tooltip"
//           data-tooltip-content="Go back to upload"
//         >
//           <MdArrowBack size={24} />
//         </motion.button>
//         <h2>Select Regions</h2>
//       </div>
//       <p className="selection-description">
//         Draw a box to select a region, then add points to include or exclude areas.
//       </p>
//       <div className="selection-area">
//         {!showCanvas && (
//           <Cropper
//             src={image.url}
//             style={{ width: `${imageSize.width}px`, height: `${imageSize.height}px`, margin: '0 auto' }}
//             initialAspectRatio={null}
//             guides={false}
//             viewMode={1}
//             autoCropArea={0.5}
//             ref={cropperRef}
//             dragMode="crop"
//             cropBoxResizable={true}
//             background={false}
//             cropBoxMovable={false}
//             zoomable={false}
//             scalable={false}
//           />
//         )}
//         {showCanvas && (
//           <canvas
//             ref={canvasRef}
//             onClick={handleCanvasClick}
//             style={{ width: `${imageSize.width}px`, height: `${imageSize.height}px`, margin: '0 auto' }}
//           />
//         )}
//       </div>
//       <div className="selection-toolbar">
//         {!showCanvas && (
//           <motion.button
//             className="control-button select-region"
//             onClick={handleSelectRegion}
//             disabled={!cropperRef.current?.cropper.getData().width}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             data-tooltip-id="select-tooltip"
//             data-tooltip-content="Confirm the selected region"
//           >
//             <MdCheck size={20} /> Select Region
//           </motion.button>
//         )}
//         {showCanvas && (
//           <>
//             <motion.button
//               className={`control-button point-type ${pointType === 'include' ? 'active' : ''}`}
//               onClick={() => setPointType('include')}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               data-tooltip-id="include-tooltip"
//               data-tooltip-content="Click to mark areas you want to include in the segment"
//             >
//               <MdAdd size={20} /> Include Points
//             </motion.button>
//             <motion.button
//               className={`control-button point-type exclude ${pointType === 'exclude' ? 'active' : ''}`}
//               onClick={() => setPointType('exclude')}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               data-tooltip-id="exclude-tooltip"
//               data-tooltip-content="Click to mark areas you want to exclude from the segment"
//             >
//               <MdRemove size={20} /> Exclude Points
//             </motion.button>
//             <motion.button
//               className="control-button undo"
//               onClick={handleUndoPoint}
//               disabled={!currentRegion?.points.length}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               data-tooltip-id="undo-tooltip"
//               data-tooltip-content="Remove last point"
//             >
//               <MdRefresh size={20} /> Undo
//             </motion.button>
//           </>
//         )}
//         <motion.button
//           className="control-button add-region"
//           onClick={handleAddRegion}
//           disabled={!currentRegion}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           data-tooltip-id="add-tooltip"
//           data-tooltip-content="Save this region"
//         >
//           <MdAddCircle size={20} /> Add Region
//         </motion.button>
//         <motion.button
//           className="control-button reset"
//           onClick={handleReset}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           data-tooltip-id="reset-tooltip"
//           data-tooltip-content="Clear all selections"
//         >
//           <MdRefresh size={20} /> Reset
//         </motion.button>
//         <motion.button
//           className="control-button done"
//           onClick={handleDone}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//           data-tooltip-id="done-tooltip"
//           data-tooltip-content="Finish and segment regions"
//         >
//           <MdCheck size={20} /> Done
//         </motion.button>
//         <Tooltip id="select-tooltip" place="top" />
//         <Tooltip id="include-tooltip" place="top" />
//         <Tooltip id="exclude-tooltip" place="top" />
//         <Tooltip id="undo-tooltip" place="top" />
//         <Tooltip id="add-tooltip" place="top" />
//         <Tooltip id="reset-tooltip" place="top" />
//         <Tooltip id="done-tooltip" place="top" />
//       </div>
//       {error && <div className="error-message">{error}</div>}
//     </motion.div>
//   );
// };

// export default SelectionComponent;
// src/components/SelectionComponent.js







// src/components/SelectionComponent.js
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
  const [mode, setMode] = useState('bounding_box'); // bounding_box, point_based, exclude_points
  const [regions, setRegions] = useState([]); // [{ type, x, y, width, height, points, excludePoints }]
  const [currentRegion, setCurrentRegion] = useState(null); // Temp region
  const [activeRegionIndex, setActiveRegionIndex] = useState(null); // For exclude points
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [showMasks, setShowMasks] = useState(false);
  const [segmentedRegions, setSegmentedRegions] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
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
    if (mode === 'exclude_points' || mode === 'point_based' || showMasks || currentRegion) {
      drawCanvas();
    }
  }, [regions, currentRegion, mode, activeRegionIndex, showMasks, segmentedRegions]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError(null);
    setCurrentRegion(null);
    setActiveRegionIndex(null);
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.clear();
    }
  };

  const handleSelectRegion = () => {
    if (mode === 'bounding_box') {
      const cropper = cropperRef.current?.cropper;
      if (cropper) {
        const { x, y, width, height } = cropper.getData(true);
        if (width > 0 && height > 0) {
          setCurrentRegion({ type: 'bounding_box', x, y, width, height, excludePoints: [] });
          cropper.clear();
          toast.success('Region selected! Add exclude points or save.', { theme: 'dark' });
        } else {
          setError('Please draw a valid region.');
          toast.error('Please draw a valid region.', { theme: 'dark' });
        }
      }
    } else if (mode === 'point_based') {
      if (currentRegion?.points?.length > 0) {
        toast.success('Points selected! Add exclude points or save.', { theme: 'dark' });
      } else {
        setError('Please add at least one point.');
        toast.error('Please add at least one point.', { theme: 'dark' });
      }
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (mode === 'point_based' && !currentRegion) {
      setCurrentRegion({ type: 'point_based', points: [{ x, y }], excludePoints: [] });
    } else if (mode === 'point_based' && currentRegion) {
      setCurrentRegion({ ...currentRegion, points: [...currentRegion.points, { x, y }] });
    } else if (mode === 'exclude_points' && activeRegionIndex !== null) {
      const updatedRegions = [...regions];
      updatedRegions[activeRegionIndex].excludePoints.push({ x, y });
      setRegions(updatedRegions);
    } else if (mode === 'exclude_points' && currentRegion) {
      setCurrentRegion({ ...currentRegion, excludePoints: [...currentRegion.excludePoints, { x, y }] });
    }
    drawCanvas();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = image.url;
    img.onload = () => {
      canvas.width = imageSize.width;
      canvas.height = imageSize.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw saved regions
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

      // Draw current region
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
        }
        currentRegion.excludePoints?.forEach((point, pointIndex) => {
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

      // Draw masks
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
      setMode(mode === 'point_based' ? 'point_based' : 'bounding_box');
      setActiveRegionIndex(null);
      toast.success('Region saved!', { theme: 'dark' });
    }
  };

  const handleExcludePoints = (index) => {
    setMode('exclude_points');
    setActiveRegionIndex(index);
    setCurrentRegion(null);
    drawCanvas();
  };

  const handleUndo = () => {
    if (mode === 'exclude_points' && activeRegionIndex !== null) {
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
      }
      toast.info('Last action undone.', { theme: 'dark' });
    }
  };

  const handleReset = () => {
    setRegions([]);
    setCurrentRegion(null);
    setActiveRegionIndex(null);
    setMode('bounding_box');
    setError(null);
    setShowMasks(false);
    setSegmentedRegions(null);
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.clear();
    }
    toast.info('All selections reset.', { theme: 'dark' });
  };

  const handleDone = async () => {
    if (regions.length === 0 && !currentRegion) {
      setError('Please add at least one region.');
      toast.error('Please add at least one region.', { theme: 'dark' });
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
      // Segment bounding boxes
      if (boxRegions.length > 0) {
        const response = await axios.post('http://127.0.0.1:8000/segment_with_boxes', {
          image_url: image.url,
          teacher_id: teacherEmail,
          regions: boxRegions.map(r => ({
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height
          }))
        }, { timeout: 60000 });
        results.push(...response.data.results.map((res, i) => ({
          ...boxRegions[i],
          maskUrl: res.cutout,
          outlineUrl: res.outline,
          position: res.position,
          type: 'bounding_box'
        })));
      }

      // Segment points
      if (pointRegions.length > 0) {
        const response = await axios.post('http://127.0.0.1:8000/segment_with_points', {
          image_url: image.url,
          teacher_id: teacherEmail,
          regions: pointRegions.map(r => ({
            points: r.points,
            excludePoints: r.excludePoints || []
          }))
        }, { timeout: 60000 });
        results.push(...response.data.results.map((res, i) => ({
          ...pointRegions[i],
          maskUrl: res.cutout,
          outlineUrl: res.outline,
          position: res.position,
          type: 'point_based'
        })));
      }

      // Segment box as points
      if (boxAsPointRegions.length > 0) {
        const response = await axios.post('http://127.0.0.1:8000/segment_with_box_as_points', {
          image_url: image.url,
          teacher_id: teacherEmail,
          regions: boxAsPointRegions.map(r => ({
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            excludePoints: r.excludePoints || []
          }))
        }, { timeout: 60000 });
        results.push(...response.data.results.map((res, i) => ({
          ...boxAsPointRegions[i],
          maskUrl: res.cutout,
          outlineUrl: res.outline,
          position: res.position,
          type: 'box_as_points'
        })));
      }

      const segmentedData = {
        type: 'mixed',
        regions: results,
        originalSize: imageSize,
      };
      setSegmentedRegions(segmentedData);
      setShowMasks(true);
      onRegionsSegmented(segmentedData);
      toast.success('Segmentation complete!', { theme: 'dark' });
    } catch (err) {
      setError('Failed to segment regions: ' + err.message);
      toast.error('Failed to segment regions.', { theme: 'dark' });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMasks = () => {
    setShowMasks(!showMasks);
    drawCanvas();
  };

  return (
    <motion.div
      className="selection-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="selection-header">
        <motion.button
          className="back-button"
          onClick={onBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-tooltip-id="back-tooltip"
          data-tooltip-content="Go back to upload"
        >
          <MdArrowBack size={24} />
        </motion.button>
        <h2>Select Regions</h2>
      </div>
      <p className="selection-description">
        Choose Bounding Box or Point-Based, select a region, then add exclude points if needed.
      </p>
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
          />
        )}
        {(mode === 'point_based' || mode === 'exclude_points' || showMasks || currentRegion) && (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            width={imageSize.width}
            height={imageSize.height}
            style={{ margin: '0 auto' }}
          />
        )}
      </div>
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="processing-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="processing-animation">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                className="dot"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                className="dot"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                className="dot"
              />
            </div>
            <p>Processing Segmentation...</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="selection-toolbar">
        <motion.button
          className={`control-button ${mode === 'bounding_box' ? 'active' : ''}`}
          onClick={() => handleModeChange('bounding_box')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-tooltip-id="bbox-tooltip"
          data-tooltip-content="Draw rectangles to select regions"
        >
          Bounding Box
        </motion.button>
        <motion.button
          className={`control-button ${mode === 'point_based' ? 'active' : ''}`}
          onClick={() => handleModeChange('point_based')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-tooltip-id="points-tooltip"
          data-tooltip-content="Place points to define regions"
        >
          Point-Based
        </motion.button>
        <motion.button
          className="control-button select-region"
          onClick={handleSelectRegion}
          disabled={(mode === 'bounding_box' && !cropperRef.current?.cropper.getData().width) || (mode === 'point_based' && !currentRegion?.points?.length)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-tooltip-id="select-tooltip"
          data-tooltip-content="Confirm the current region"
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
          data-tooltip-content="Save the current region"
        >
          <MdAddCircle size={20} /> Add Region
        </motion.button>
        {regions.map((region, index) => (
          <motion.button
            key={index}
            className={`control-button exclude ${mode === 'exclude_points' && activeRegionIndex === index ? 'active' : ''}`}
            onClick={() => handleExcludePoints(index)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-tooltip-id={`exclude-${index}-tooltip`}
            data-tooltip-content={`Add points to exclude areas from region ${index + 1}`}
          >
            <MdRemoveCircle size={20} /> Exclude Region {index + 1}
          </motion.button>
        ))}
        <motion.button
          className="control-button undo"
          onClick={handleUndo}
          disabled={regions.length === 0 && !currentRegion}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-tooltip-id="undo-tooltip"
          data-tooltip-content="Remove last action"
        >
          <MdRefresh size={20} /> Undo
        </motion.button>
        <motion.button
          className="control-button reset"
          onClick={handleReset}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-tooltip-id="reset-tooltip"
          data-tooltip-content="Clear all selections"
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
          data-tooltip-content="Segment all regions"
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
        <Tooltip id="bbox-tooltip" place="top" />
        <Tooltip id="points-tooltip" place="top" />
        <Tooltip id="select-tooltip" place="top" />
        <Tooltip id="add-tooltip" place="top" />
        {regions.map((_, index) => (
          <Tooltip key={index} id={`exclude-${index}-tooltip`} place="top" />
        ))}
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