import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdCrop, MdAddCircle, MdCheckCircle, MdUndo, MdRestartAlt, MdVisibility, MdArrowForward } from 'react-icons/md';
import FeatureAddition from './FeatureAddition';
import '../pages/teachers/TeachByParts.css';

const SelectionComponent = ({ image, image_id, teacherEmail, onRegionsSegmented, onBack }) => {
  const [imageDimensions, setImageDimensions] = useState({ width: image?.width || 0, height: image?.height || 0 });
  const [activeTool, setActiveTool] = useState("box");
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [boxStart, setBoxStart] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [draggingBoxIndex, setDraggingBoxIndex] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [points, setPoints] = useState([]);
  const [regions, setRegions] = useState([]);
  const [showMasks, setShowMasks] = useState(true);
  const [lessonId, setLessonId] = useState(null);
  const [activeBox, setActiveBox] = useState(null);
  const [showMaskPreview, setShowMaskPreview] = useState(false);
  const [showFeatureAddition, setShowFeatureAddition] = useState(false);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    console.log('SelectionComponent received image_id:', image_id);
    if (image?.width && image?.height) {
      setImageDimensions({ width: image.width, height: image.height });
    }
  }, [image, image_id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    boxes.forEach((box, index) => {
      ctx.strokeStyle = index === draggingBoxIndex ? '#ffcc00' : '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
      ctx.setLineDash([]);
    });

    if (currentBox && activeTool === "box") {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(currentBox.x1, currentBox.y1, currentBox.x2 - currentBox.x1, currentBox.y2 - currentBox.y1);
      ctx.setLineDash([]);
    }

    if (activeTool === "include" || activeTool === "exclude") {
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = point.label === 1 ? 'green' : 'red';
        ctx.fill();
      });
    }
  }, [currentBox, boxes, points, activeTool, draggingBoxIndex]);

  const isPointInBox = (x, y, box) => {
    return x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2;
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "box") {
      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        if (isPointInBox(x, y, box)) {
          setDraggingBoxIndex(i);
          setDragOffset({ x: x - box.x1, y: y - box.y1 });
          return;
        }
      }
      setIsDrawingBox(true);
      setBoxStart({ x, y });
      setCurrentBox({ x1: x, y1: y, x2: x, y2: y });
    }
  };

  const handleMouseMove = (e) => {
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    if (activeTool === "box") {
      if (isDrawingBox && boxStart) {
        setCurrentBox({
          x1: Math.min(boxStart.x, x),
          y1: Math.min(boxStart.y, y),
          x2: Math.max(boxStart.x, x),
          y2: Math.max(boxStart.y, y)
        });
      } else if (draggingBoxIndex !== null) {
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

  const handleMouseUp = (e) => {
    if (activeTool === "box") {
      if (isDrawingBox && boxStart) {
        setIsDrawingBox(false);
        if (currentBox && (currentBox.x2 - currentBox.x1 > 5) && (currentBox.y2 - currentBox.y1 > 5)) {
          setBoxes([...boxes, currentBox]);
          setActiveBox(currentBox);
        }
        setCurrentBox(null);
        setBoxStart(null);
      }
      if (draggingBoxIndex !== null) {
        setDraggingBoxIndex(null);
      }
    }
  };

  const handlePointClick = (e) => {
    if (activeTool !== "include" && activeTool !== "exclude") return;
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    const newPoint = { x, y, label: activeTool === "include" ? 1 : 0 };
    setPoints(prevPoints => [...prevPoints, newPoint]);
  };

  const handleSelectRegion = () => {
    if (currentBox) {
      setActiveBox(currentBox);
      setCurrentBox(null);
    }
  };

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

      if (activeBox && pointCoords.length > 0) {
        boxesToProcess = [...boxes, activeBox];
      }

      for (const box of boxesToProcess) {
        const payload = {
          image_id,
          box: [box.x1, box.y1, box.x2, box.y2],
          points: pointCoords.length > 0 ? pointCoords : null,
          labels: pointLabels.length > 0 ? pointLabels : null
        };
        const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
        const response = await axios.post(`${API_URL}/segment`, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Segment response:', response.data);
        const incomingRegions = response.data.regions.filter(
          newRegion => !newRegions.some(existing => existing.region_id === newRegion.region_id)
        );
        newRegions = [...newRegions, ...incomingRegions];
        if (!lessonId) setLessonId(response.data.lesson_id);
      }

      if (boxesToProcess.length === 0 && pointCoords.length > 0) {
        const payload = {
          image_id,
          box: activeBox ? [activeBox.x1, activeBox.y1, activeBox.x2, activeBox.y2] : null,
          points: pointCoords,
          labels: pointLabels
        };
        const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
        const response = await axios.post(`${API_URL}/segment`, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Segment response:', response.data);
        const incomingRegions = response.data.regions.filter(
          newRegion => !newRegions.some(existing => existing.region_id === newRegion.region_id)
        );
        newRegions = [...newRegions, ...incomingRegions];
        if (!lessonId) setLessonId(response.data.lesson_id);
      }

      setRegions(newRegions);
      setBoxes([]);
      setPoints([]);
      setCurrentBox(null);
      setActiveBox(null);
      console.log('Updated regions:', newRegions); // Debug log
    } catch (error) {
      const errorDetail = error.response?.data?.detail || error.message;
      console.error('Error segmenting:', errorDetail);
      toast.error(`Segmentation failed: ${errorDetail}`);
    }
  };

  const handleAddPart = () => {
    setCurrentBox(null);
    setActiveBox(null);
  };

  const handleDone = () => {
    if (regions.length === 0) {
      toast.error("No regions have been segmented. Please segment at least one region.");
      return;
    }
    setShowMaskPreview(true);
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
    setShowMaskPreview(false);
  };

  const toggleMasks = () => {
    setShowMasks(!showMasks);
  };

  const handleProceedToFeatures = () => {
    setShowFeatureAddition(true);
  };

  const handleFeaturesComplete = (data) => {
    onRegionsSegmented({
      lesson_id: lessonId,
      regions: regions.map(region => ({
        ...region,
        teacher_email: teacherEmail,
        features: data.features
      }))
    });
  };

  return (
    <motion.div
      className="selcomp-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {!showFeatureAddition && !showMaskPreview && (
        <>
          <div className="controls">
            <motion.button className="control-button" onClick={() => setActiveTool("box")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdCrop size={20} /> Bounding Box
            </motion.button>
            <motion.button className={`control-button ${activeTool === "include" ? 'active-point-mode' : ''}`} onClick={() => setActiveTool("include")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdAddCircle size={20} /> Include Point
            </motion.button>
            <motion.button className={`control-button ${activeTool === "exclude" ? 'active-point-mode' : ''}`} onClick={() => setActiveTool("exclude")} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdAddCircle size={20} /> Exclude Point
            </motion.button>
            <motion.button className="control-button" onClick={handleSelectRegion} disabled={activeTool !== "box" || !currentBox} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdCheckCircle size={20} /> Select Region
            </motion.button>
            <motion.button className="control-button" onClick={handleAddPart} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdAddCircle size={20} /> Add Part
            </motion.button>
            <motion.button className="control-button" onClick={handleSegment} disabled={!image_id || typeof image_id !== 'string' || image_id.trim() === '' || (boxes.length === 0 && points.length === 0 && !activeBox)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdCheckCircle size={20} /> Segment
            </motion.button>
            <motion.button className="control-button" onClick={handleDone} disabled={regions.length === 0} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdCheckCircle size={20} /> Done
            </motion.button>
            <motion.button className="control-button" onClick={handleUndo} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdUndo size={20} /> Undo
            </motion.button>
            <motion.button className="control-button" onClick={handleReset} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdRestartAlt size={20} /> Reset
            </motion.button>
            <motion.button className="control-button" onClick={toggleMasks} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <MdVisibility size={20} /> {showMasks ? 'Hide' : 'Show'} Masks
            </motion.button>
            <motion.button className="control-button" onClick={onBack} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              Back
            </motion.button>
          </div>
          <div className="selcomp-image-container">
            <img
              ref={imageRef}
              src={image.url}
              alt="Uploaded"
              className="selcomp-base-image"
              onLoad={() => {
                const img = imageRef.current;
                if (img && canvasRef.current) {
                  canvasRef.current.width = img.width;
                  canvasRef.current.height = img.height;
                }
              }}
            />
            <canvas
              ref={canvasRef}
              className="overlay-canvas"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={handlePointClick}
              onContextMenu={(e) => {
                e.preventDefault();
                if (activeTool !== "exclude") setActiveTool("exclude");
                handlePointClick(e);
              }}
            />
            {showMasks && regions.map((region) => (
              <div key={region.region_id} className="region-overlay">
                <img
                  src={region.mask_url}
                  alt={`Mask ${region.region_id}`}
                  className="region-outline"
                  style={{
                    width: imageRef.current?.width,
                    height: imageRef.current?.height,
                    opacity: 0.5
                  }}
                  onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
                />
              </div>
            ))}
          </div>
        </>
      )}
      {showMaskPreview && !showFeatureAddition && (
        <motion.div
          className="selcomp-mask-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="selcomp-image-container">
            <img
              ref={imageRef}
              src={image.url}
              alt="Uploaded"
              className="selcomp-base-image"
            />
            <div className="regions-overlay-container">
              {regions.map((region) => (
                <div key={region.region_id} className="region-overlay">
                  <img
                    src={region.mask_url}
                    alt={`Region ${region.region_id}`}
                    className="region-outline"
                    style={{
                      width: imageRef.current?.width,
                      height: imageRef.current?.height,
                      opacity: 0.5
                    }}
                    onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="selcomp-toolbar">
            <motion.button
              className="selcomp-toolbar-button"
              onClick={handleProceedToFeatures}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MdArrowForward size={20} /> Proceed to Add Features
            </motion.button>
            <motion.button
              className="selcomp-toolbar-button selcomp-back-button"
              onClick={() => setShowMaskPreview(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Back
            </motion.button>
          </div>
        </motion.div>
      )}
      {showFeatureAddition && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FeatureAddition
            image={image}
            lessonId={lessonId}
            regions={regions}
            teacherEmail={teacherEmail}
            onBack={() => setShowFeatureAddition(false)}
            onComplete={handleFeaturesComplete}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default SelectionComponent;