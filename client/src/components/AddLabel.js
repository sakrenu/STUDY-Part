import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import './Addlabel.css';

const AddLabel = ({ image, lessonId, regions, teacherEmail, onSave, onDone, onBack, existingLabels, existingCoordinates }) => {
  const [currentLabel, setCurrentLabel] = useState(null);
  const [labels, setLabels] = useState(existingLabels || {});
  const [clickCoordinates, setClickCoordinates] = useState(existingCoordinates || {});
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef(null);
  const inputRef = useRef(null);

  const handleRegionClick = (region, e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    console.log(`Clicked on region ${region.region_id} at (${x}, ${y})`);
    
    setCurrentLabel({
      regionId: region.region_id,
      regionIndex: regions.findIndex((r) => r.region_id === region.region_id),
      text: labels[region.region_id] || '',
      clickX: x,
      clickY: y,
    });
    
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleLabelChange = (text) => {
    setCurrentLabel((prev) => ({ ...prev, text }));
    setError(null);
  };

  const handleLabelSubmit = async () => {
    if (!currentLabel.text.trim()) {
      setError('Label cannot be empty');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const { regionId, regionIndex, text, clickX, clickY } = currentLabel;
      await setDoc(
        doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
        {
          regionId,
          segmentIndex: regionIndex,
          label: text,
          annotation: { x: clickX, y: clickY },
          maskUrl: regions.find((r) => r.region_id === regionId).mask_url,
          cutoutUrl: regions.find((r) => r.region_id === regionId).cutout_url,
          position: regions.find((r) => r.region_id === regionId).position,
        },
        { merge: true }
      );
      setLabels((prev) => ({ ...prev, [regionId]: text }));
      setClickCoordinates((prev) => ({ ...prev, [regionId]: { x: clickX, y: clickY } }));
      onSave(regionId, text, { x: clickX, y: clickY });
      setCurrentLabel(null);
    } catch (err) {
      setError('Failed to save label: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelLabel = () => {
    setCurrentLabel(null);
    setError(null);
  };

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
        <p>Click a segment to add or edit a label.</p>
      </div>
      <div className="addlabel-image-container">
        <img
          src={image.url}
          alt="Segmented Image"
          className="addlabel-base-image"
          ref={imageRef}
          onLoad={() => {
            if (imageRef.current) {
              const { width, height } = imageRef.current;
              imageRef.current.parentElement.style.width = `${width}px`;
              imageRef.current.parentElement.style.height = `${height}px`;
            }
          }}
        />
        <div className="addlabel-regions-overlay">
          {regions.map((region, index) => {
            // Assign a distinct color to each region
            const colors = [
              'rgba(255, 0, 0, 0.5)',     // Red
              'rgba(0, 255, 0, 0.5)',     // Green
              'rgba(0, 0, 255, 0.5)',     // Blue
              'rgba(255, 255, 0, 0.5)',   // Yellow
              'rgba(255, 0, 255, 0.5)',   // Magenta
              'rgba(0, 255, 255, 0.5)',   // Cyan
              'rgba(255, 165, 0, 0.5)',   // Orange
              'rgba(128, 0, 128, 0.5)'    // Purple
            ];
            const color = colors[index % colors.length];
            
            return (
              <div
                key={region.region_id}
                className="addlabel-region"
                onClick={(e) => handleRegionClick(region, e)}
              >
                <img
                  src={region.mask_url}
                  alt={`Region ${region.region_id}`}
                  className="addlabel-mask"
                  style={{ 
                    opacity: 0.7, 
                    backgroundColor: color,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    cursor: 'pointer'
                  }}
                  onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
                />
                {labels[region.region_id] && (
                  <div className="addlabel-has-label-indicator">
                    <span>✓</span>
                  </div>
                )}
              </div>
            );
          })}
          {Object.entries(labels).map(([regionId, text]) => {
            const coords = clickCoordinates[regionId];
            if (!coords) return null;
            const labelX = coords.x + 100;
            const labelY = coords.y - 20;
            return (
              <div key={regionId} className="addlabel-wrapper">
                <svg
                  className="addlabel-svg"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 10,
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
                  />
                </svg>
                <div
                  className="addlabel-text"
                  style={{
                    position: 'absolute',
                    top: labelY,
                    left: labelX,
                    zIndex: 10,
                  }}
                >
                  {text}
                </div>
              </div>
            );
          })}
          {currentLabel && (
            <div
              className="addlabel-input-wrapper"
              style={{
                position: 'absolute',
                top: currentLabel.clickY - 20,
                left: currentLabel.clickX + 100,
                zIndex: 10,
              }}
            >
              <svg
                className="addlabel-svg"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                <line
                  x1={currentLabel.clickX}
                  y1={currentLabel.clickY}
                  x2={currentLabel.clickX + 100}
                  y2={currentLabel.clickY - 20}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="addlabel-line"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={currentLabel.text}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Enter label..."
                className="addlabel-input"
                disabled={isSaving}
                maxLength={100}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleLabelSubmit();
                }}
              />
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="addlabel-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="addlabel-input-buttons">
                <button
                  onClick={handleLabelSubmit}
                  className="addlabel-submit-button"
                  disabled={isSaving}
                >
                  {isSaving ? <span className="addlabel-spinner"></span> : 'Add'}
                </button>
                <button
                  onClick={handleCancelLabel}
                  className="addlabel-cancel-button"
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="addlabel-footer">
        <motion.button
          className="addlabel-back-button"
          onClick={onBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Back to Features
        </motion.button>
        <motion.button
          className="addlabel-done-button"
          onClick={onDone}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Done Labeling
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AddLabel;