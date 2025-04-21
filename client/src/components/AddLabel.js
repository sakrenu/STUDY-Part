import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import './AddLabel.css';

const AddLabel = ({ image, lessonId, regions, teacherEmail, onSave, onDone, onBack, existingLabels, existingCoordinates }) => {
  const [currentLabel, setCurrentLabel] = useState(null);
  const [labels, setLabels] = useState(existingLabels || {});
  const [clickCoordinates, setClickCoordinates] = useState(existingCoordinates || {});
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log('Regions received:', regions);
    const handleClickOutside = (e) => {
      // Only handle clicks outside both the container and input wrapper
      const inputWrapper = document.querySelector('.addlabel-input-wrapper');
      if (currentLabel && 
          !containerRef.current?.contains(e.target) && 
          !inputWrapper?.contains(e.target)) {
        setCurrentLabel(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentLabel, regions]);

  const handleImageClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (isPreview || !imageRef.current || !regions || regions.length === 0) {
      return;
    }
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate scale factors
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    // Convert click coordinates to image coordinates
    const imageX = x * scaleX;
    const imageY = y * scaleY;

    console.log('Click coordinates:', { display: { x, y }, image: { imageX, imageY } });

    const clickedRegion = regions.find((region) => {
      const { position } = region;
      if (!position) return false;

      const isInRegion = 
        imageX >= position.x &&
        imageX <= position.x + position.width &&
        imageY >= position.y &&
        imageY <= position.y + position.height;

      console.log('Region check:', {
        regionId: region.region_id,
        position,
        isInRegion
      });

      return isInRegion;
    });

    if (clickedRegion) {
      console.log('Found region:', clickedRegion.region_id);
      
      // Store both display coordinates for UI and image coordinates for saving
      setCurrentLabel({
        regionId: clickedRegion.region_id,
        text: labels[clickedRegion.region_id] || '',
        clickX: x,
        clickY: y,
        imageX: imageX,
        imageY: imageY,
        labelX: x + 100,
        labelY: y - 30
      });

      // Save both display coordinates for the UI and normalized coordinates for consistency
      setClickCoordinates(prev => ({
        ...prev,
        [clickedRegion.region_id]: { 
          x: x, 
          y: y,
          imageX: imageX,
          imageY: imageY,
          scaleX: scaleX,
          scaleY: scaleY
        }
      }));
    }
  };

  const handleLabelChange = (e) => {
    setCurrentLabel((prev) => ({ ...prev, text: e.target.value }));
    setError(null);
  };

  const handleLabelSubmit = async () => {
    if (!currentLabel || !currentLabel.text.trim()) {
      setError('Label cannot be empty');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const { regionId, text, imageX, imageY, clickX, clickY } = currentLabel;
      
      // Save to Firestore with the normalized image coordinates
      await setDoc(
        doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
        {
          regionId,
          label: text,
          annotation: { 
            x: clickX, 
            y: clickY,
            imageX: imageX,
            imageY: imageY
          },
        },
        { merge: true }
      );

      // Update local state
      setLabels(prev => ({ ...prev, [regionId]: text }));
      // Keep both display and normalized coordinates
      setClickCoordinates(prev => {
        const coords = prev[regionId] || {};
        return {
          ...prev, 
          [regionId]: { 
            ...coords,
            x: clickX, 
            y: clickY,
            imageX: imageX,
            imageY: imageY
          }
        };
      });
      
      // Notify parent component with complete coordinate info
      onSave(regionId, text, { 
        x: clickX, 
        y: clickY,
        imageX: imageX,
        imageY: imageY
      });
      setCurrentLabel(null);
    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to save label: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelLabel = () => {
    setCurrentLabel(null);
    setError(null);
  };

  const handleDoneLabeling = () => {
    setIsPreview(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setError(null);
    const allData = regions.map(region => ({
      regionId: region.region_id,
      label: labels[region.region_id] || '',
      annotation: clickCoordinates[region.region_id] || null,
    }));
    try {
      // Persist all labels to Firestore
      const savePromises = allData.map(({ regionId, label, annotation }) => {
        return setDoc(
          doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
          { regionId, label, annotation },
          { merge: true }
        );
      });
      await Promise.all(savePromises);
      // Notify parent of saved data
      onSave(allData);
      // Exit preview and go back
      setIsPreview(false);
      onBack();
    } catch (err) {
      console.error('Failed to save labels:', err);
      setError(`Failed to save labels: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToFeatures = () => {
    setIsPreview(false);
    onBack();
  };

  if (isPreview) {
    return (
      <motion.div
        className="addlabel-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="addlabel-header">
          <h2>Preview Labels</h2>
          <p>Review the labeled segments as they will appear to students.</p>
        </div>
        <div className="addlabel-image-container" ref={containerRef}>
          <img
            src={image.url}
            alt="Segmented Image"
            className="addlabel-base-image"
            ref={imageRef}
          />
          <div className="addlabel-regions-overlay">
            {regions.map((region) => (
              <img
                key={region.region_id}
                src={region.mask_url}
                alt={`Segment ${region.region_id}`}
                className="addlabel-mask"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
              />
            ))}
            {Object.entries(labels).map(([regionId, text]) => {
              const coords = clickCoordinates[regionId];
              if (!coords) return null;
              const labelX = coords.x + 100;
              const labelY = coords.y - 20;
              return (
                <div key={`preview-label-${regionId}`} className="addlabel-preview-wrapper">
                  <svg className="addlabel-line">
                    <motion.line
                      x1={coords.x}
                      y1={coords.y}
                      x2={labelX}
                      y2={labelY}
                      stroke="#ffffff"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div
                    className="addlabel-preview-text"
                    style={{
                      position: 'absolute',
                      top: labelY,
                      left: labelX,
                      zIndex: 15,
                    }}
                  >
                    {text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="addlabel-footer">
          <button className="addlabel-back-button" onClick={handleBackToFeatures}>Back to Features</button>
          <button className="addlabel-save-button" onClick={handleSaveAll}>Save</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="addlabel-container" onClick={(e) => e.stopPropagation()}>
      <div className="addlabel-header">
        <h2>Label Segments</h2>
        <p>Click directly on a colored segment to add or edit a label.</p>
      </div>
      <div className="addlabel-content-wrapper">
        <div className="addlabel-image-container" onClick={handleImageClick} ref={containerRef}>
          <img
            src={image.url}
            alt="Segmented Image"
            className="addlabel-base-image"
            ref={imageRef}
          />
          <div className="addlabel-regions-overlay">
            {regions.map((region) => (
              <img
                key={region.region_id}
                src={region.mask_url}
                alt={`Segment ${region.region_id}`}
                className="addlabel-mask"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
              />
            ))}
            <AnimatePresence>
              {currentLabel && (
                <motion.div
                  className="addlabel-label-wrapper"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="addlabel-line">
                    <motion.line
                      x1={currentLabel.clickX}
                      y1={currentLabel.clickY}
                      x2={currentLabel.labelX}
                      y2={currentLabel.labelY}
                      stroke="#ffffff"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            {Object.entries(labels).map(([regionId, text]) => {
              const coords = clickCoordinates[regionId];
              if (!coords || regionId === currentLabel?.regionId) return null;
              const labelX = coords.x + 100;
              const labelY = coords.y - 20;
              return (
                <div key={`label-${regionId}`} className="addlabel-wrapper">
                  <svg
                    className="addlabel-svg"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      zIndex: 15,
                      overflow: 'visible',
                    }}
                  >
                    <line
                      x1={coords.x}
                      y1={coords.y}
                      x2={labelX}
                      y2={labelY}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="addlabel-line"
                      key={`line-${regionId}-${coords.x}-${coords.y}`}
                    />
                  </svg>
                  <div
                    className="addlabel-text"
                    style={{
                      position: 'absolute',
                      top: labelY,
                      left: labelX,
                      zIndex: 15,
                    }}
                  >
                    {text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {currentLabel && (
          <div 
            className="addlabel-input-wrapper"
            onClick={(e) => e.stopPropagation()} // Add this to prevent click propagation
          >
            <input
              type="text"
              value={currentLabel.text}
              onChange={handleLabelChange}
              className="addlabel-input"
              disabled={isSaving}
              autoFocus
            />
            <div className="addlabel-button-group">
              <button onClick={handleLabelSubmit} disabled={isSaving}>Save</button>
              <button onClick={handleCancelLabel} disabled={isSaving}>Cancel</button>
            </div>
            {error && <div className="addlabel-error">{error}</div>}
          </div>
        )}
      </div>
      <div className="addlabel-footer">
        <button className="addlabel-back-button" onClick={onBack}>Back to Features</button>
        <button className="addlabel-done-button" onClick={handleDoneLabeling}>Done Labeling</button>
      </div>
    </motion.div>
  );
};

export default AddLabel;