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
      if (currentLabel && !containerRef.current.contains(e.target)) {
        setCurrentLabel(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentLabel, regions]);

  const handleImageClick = (e) => {
    if (isPreview || !imageRef.current || !regions || regions.length === 0) {
      console.log('Image ref or regions not available, or in preview mode:', { imageRef: !!imageRef.current, regions, isPreview });
      return;
    }
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const scaleX = imageWidth / displayWidth;
    const scaleY = imageHeight / displayHeight;
    const originalX = x * scaleX;
    const originalY = y * scaleY;

    console.log('Click detected at:', { x, y, originalX, originalY });

    const clickedRegion = regions.find((region) => {
      const { position } = region;
      if (!position || position.x === undefined || position.y === undefined || position.width === undefined || position.height === undefined) {
        console.log('Invalid region position:', region);
        return false;
      }
      const regionX = position.x * scaleX;
      const regionY = position.y * scaleY;
      const regionWidth = position.width * scaleX;
      const regionHeight = position.height * scaleY;
      return (
        originalX >= regionX &&
        originalX <= regionX + regionWidth &&
        originalY >= regionY &&
        originalY <= regionY + regionHeight
      );
    });

    if (clickedRegion) {
      console.log('Clicked region:', clickedRegion.region_id);
      const { position } = clickedRegion;
      const regionDisplayX = (position.x / imageWidth) * displayWidth;
      const regionDisplayY = (position.y / imageHeight) * displayHeight;
      const regionDisplayWidth = (position.width / imageWidth) * displayWidth;
      const regionDisplayHeight = (position.height / imageHeight) * displayHeight;

      let labelX = Math.min(x + 100, regionDisplayX + regionDisplayWidth - 150);
      let labelY = Math.max(y - 30, regionDisplayY);
      labelX = Math.max(labelX, rect.left + 10);
      labelY = Math.min(labelY, rect.bottom - 60);

      setCurrentLabel({
        regionId: clickedRegion.region_id,
        text: labels[clickedRegion.region_id] || '',
        clickX: x,
        clickY: y,
        labelX,
        labelY,
      });
    } else {
      console.log('No region clicked at:', { x, y });
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
      const { regionId, text, clickX, clickY } = currentLabel;
      await setDoc(
        doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
        {
          regionId,
          label: text,
          annotation: { x: clickX, y: clickY },
        },
        { merge: true }
      );
      setLabels((prev) => ({ ...prev, [regionId]: text }));
      setClickCoordinates((prev) => ({ ...prev, [regionId]: { x: clickX, y: clickY } }));
      onSave(regionId, text, { x: clickX, y: clickY });
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

  const handleSaveAll = () => {
    const allData = regions.map(region => ({
      regionId: region.region_id,
      label: labels[region.region_id] || '',
      annotation: clickCoordinates[region.region_id] || null,
    }));
    onSave(allData);
    setIsPreview(false);
    onBack();
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
    <motion.div
      className="addlabel-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="addlabel-header">
        <h2>Label Segments</h2>
        <p>Click directly on a colored segment to add or edit a label.</p>
      </div>
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
                <div className="addlabel-input-wrapper" style={{ top: currentLabel.labelY, left: currentLabel.labelX }}>
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
      <div className="addlabel-footer">
        <button className="addlabel-back-button" onClick={onBack}>Back to Features</button>
        <button className="addlabel-done-button" onClick={handleDoneLabeling}>Done Labeling</button>
      </div>
    </motion.div>
  );
};

export default AddLabel;