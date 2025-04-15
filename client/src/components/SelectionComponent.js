import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import '../pages/teachers/TeachByParts.css';
import { toast } from 'react-toastify';
import { MdCrop, MdAddCircle, MdCheckCircle, MdUndo, MdRestartAlt, MdVisibility } from 'react-icons/md';

const SelectionComponent = ({ image, image_id, teacherEmail, onRegionsSegmented, onBack }) => {
  const [imageDimensions, setImageDimensions] = useState({ width: image?.width || 0, height: image?.height || 0 });
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [boxStart, setBoxStart] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [points, setPoints] = useState([]);
  const [regions, setRegions] = useState([]);
  const [showMasks, setShowMasks] = useState(true);
  const [lessonId, setLessonId] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    console.log('SelectionComponent received image_id:', image_id);
    if (image?.width && image?.height) {
      setImageDimensions({ width: image.width, height: image.height });
    }
  }, [image, image_id]);

  const handleMouseDown = (e) => {
    if (isDrawingBox) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setBoxStart({ x, y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawingBox && boxStart) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentBox({
        x1: Math.min(boxStart.x, x),
        y1: Math.min(boxStart.y, y),
        x2: Math.max(boxStart.x, x),
        y2: Math.max(boxStart.y, y)
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawingBox && boxStart) {
      setIsDrawingBox(false);
    }
  };

  const handlePointClick = (e, label) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints([...points, { x, y, label }]);
  };

  const handleSelectRegion = async () => {
    if (currentBox) {
      await handleSegment();
    }
  };

  const handleSegment = async () => {
    const pointCoords = points.map(p => [p.x, p.y]);
    const pointLabels = points.map(p => p.label);
    const box = currentBox ? [
      currentBox.x1,
      currentBox.y1,
      currentBox.x2,
      currentBox.y2
    ] : null;

    if (!image_id || typeof image_id !== 'string' || image_id.trim() === '') {
      console.error('Invalid image_id:', image_id);
      toast.error("Image is not uploaded properly. Please try uploading again.");
      return;
    }

    if (!box && pointCoords.length === 0) {
      toast.error("Please select either a bounding box or some points.");
      return;
    }

    try {
      const payload = {
        image_id,
        box,
        points: pointCoords.length > 0 ? pointCoords : null,
        labels: pointLabels.length > 0 ? pointLabels : null
      };
      console.log("Calling /segment with payload:", JSON.stringify(payload, null, 2));
      const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${API_URL}/segment`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('Segmentation response:', response.data);
      setRegions(response.data.regions);
      setLessonId(response.data.lesson_id);
      setCurrentBox(null);
      setPoints([]);
    } catch (error) {
      const errorDetail = error.response?.data?.detail
        ? typeof error.response.data.detail === 'string'
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail)
        : error.message || 'Unknown error';
      console.error('Error segmenting:', error, 'Response:', error.response?.data, 'Detail:', errorDetail);
      toast.error(`Segmentation failed: ${errorDetail}`);
    }
  };

  const handleAddPart = () => {
    if (regions.length > 0) {
      setRegions([...regions]);
      setCurrentBox(null);
      setPoints([]);
    }
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
    } else if (currentBox) {
      setCurrentBox(null);
    } else if (regions.length > 0) {
      setRegions(regions.slice(0, -1));
    }
  };

  const handleReset = () => {
    setCurrentBox(null);
    setPoints([]);
    setRegions([]);
  };

  const toggleMasks = () => {
    setShowMasks(!showMasks);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentBox) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        currentBox.x1,
        currentBox.y1,
        currentBox.x2 - currentBox.x1,
        currentBox.y2 - currentBox.y1
      );
      ctx.setLineDash([]);
    }

    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = point.label === 1 ? 'green' : 'red';
      ctx.fill();
    });
  }, [currentBox, points]);

  return (
    <motion.div
      className="selection-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="controls">
        <motion.button
          className="control-button"
          onClick={() => setIsDrawingBox(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdCrop size={20} /> Bounding Box
        </motion.button>
        <motion.button
          className="control-button"
          onClick={() => console.log('Include Point: Click canvas (left for include, right for exclude)')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdAddCircle size={20} /> Include Point
        </motion.button>
        <motion.button
          className="control-button"
          onClick={() => console.log('Exclude Point: Right-click canvas')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdAddCircle size={20} /> Exclude Point
        </motion.button>
        <motion.button
          className="control-button"
          onClick={handleSelectRegion}
          disabled={!currentBox}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdCheckCircle size={20} /> Select Region
        </motion.button>
        <motion.button
          className="control-button"
          onClick={handleAddPart}
          disabled={regions.length === 0}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MdAddCircle size={20} /> Add Part
        </motion.button>
        <motion.button
          className="control-button"
          onClick={handleSegment}
          disabled={!image_id || typeof image_id !== 'string' || image_id.trim() === '' || (!currentBox && points.length === 0)}
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
      <div className="image-container">
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
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
          }}
        />
        <canvas
          ref={canvasRef}
          className="overlay-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={(e) => handlePointClick(e, 1)}
          onContextMenu={(e) => handlePointClick(e, 0)}
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