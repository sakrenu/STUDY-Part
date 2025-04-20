import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './AddOutline.css';

const AddOutline = ({ image, onSave, onCancel, regions }) => {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isDrawingOutline, setIsDrawingOutline] = useState(false);
  const imageRef = useRef(null);

  const handleAddOutline = () => {
    setIsDrawingOutline(true);
    console.log('Drawing outline mode activated');
    setSelectedSegment(null); 
  };

  const handleImageClick = (e) => {
    if (!isDrawingOutline || !imageRef.current || !regions || regions.length === 0) {
      console.log('Click ignored: Not drawing or missing data');
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    if (!imageWidth || !imageHeight || !displayWidth || !displayHeight) {
      console.error('Image dimensions are invalid. Cannot calculate click position.');
      return;
    }

    const scaleX = imageWidth / displayWidth;
    const scaleY = imageHeight / displayHeight;
    const originalX = x * scaleX;
    const originalY = y * scaleY;

    console.log(`Click: Display=(${x.toFixed(2)}, ${y.toFixed(2)}), Original=(${originalX.toFixed(2)}, ${originalY.toFixed(2)}), Scale=(${scaleX.toFixed(2)}, ${scaleY.toFixed(2)})`);

    let clickedRegion = null;
    let minArea = Infinity;

    regions.forEach((region) => {
      if (!region.position) {
        console.warn(`Region ${region.region_id} is missing position data. Cannot detect click.`);
        return;
      }

      const { x: regionX, y: regionY, width: regionWidth, height: regionHeight } = region.position;

      if (regionX === undefined || regionY === undefined || regionWidth === undefined || regionHeight === undefined) {
         console.warn(`Region ${region.region_id} has invalid position data:`, region.position);
         return;
      }

      console.log(`Checking Region ${region.region_id}: BBox=[${regionX}, ${regionY}, ${regionWidth}, ${regionHeight}]`);

      if (
        originalX >= regionX &&
        originalX <= regionX + regionWidth &&
        originalY >= regionY &&
        originalY <= regionY + regionHeight
      ) {
        const area = regionWidth * regionHeight;
        console.log(`Click is inside Region ${region.region_id}, Area: ${area}`);
        if (area < minArea) {
          minArea = area;
          clickedRegion = region;
        }
      }
    });

    if (clickedRegion) {
      console.log('Selected Region:', clickedRegion.region_id);
      const newSelected = selectedSegment === clickedRegion.region_id ? null : clickedRegion.region_id;
      setSelectedSegment(newSelected);
    } else {
      console.log('No region found at click location. Deselecting.');
      setSelectedSegment(null);
    }
  };

  const handleSaveClick = () => {
    if (!selectedSegment) return;
    console.log(`Saving outline for region: ${selectedSegment}`);
    onSave(selectedSegment);
  };

  React.useEffect(() => {
    console.log('Regions received in AddOutline:', regions);
  }, [regions]);

  return (
    <>
      <div className="add-outline-backdrop" onClick={onCancel} />
      <motion.div 
        className="add-outline-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="add-outline-header">
          <h2>Add Outline to Segments</h2>
          <p>
            {isDrawingOutline
              ? selectedSegment
                ? `Segment ${regions.findIndex(r => r.region_id === selectedSegment) + 1} selected. Click again to deselect or another segment to switch.`
                : "Click on a segment to add a yellow outline"
              : "Click 'Add Outline' to start adding outlines to segments"}
          </p>
        </div>

        <div className="add-outline-content">
          <div 
            className={`outline-image-container ${isDrawingOutline ? 'clickable' : ''} ${selectedSegment ? 'segment-selected' : ''}`}
            onClick={handleImageClick}
          >
            <img
              ref={imageRef}
              src={image.url}
              alt="Segmented Image"
              className="outline-base-image"
              onLoad={() => console.log('Base image loaded')}
              onError={() => console.error('Base image failed to load')}
            />
            <div className="outline-regions-overlay">
              {regions && regions.map((region) => {
                const isSelected = selectedSegment === region.region_id;
                return (
                  <div 
                    key={region.region_id}
                    className={`outline-mask-container ${isSelected ? 'selected' : ''}`}
                  >
                    <img
                      src={region.mask_url}
                      alt={`Segment ${region.region_id}`}
                      className={`outline-mask ${isSelected ? 'highlighted-mask' : ''}`}
                      onError={() => console.error(`Mask failed to load for region ${region.region_id}: ${region.mask_url}`)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="add-outline-footer">
          {!isDrawingOutline ? (
            <button className="outline-add-button" onClick={handleAddOutline}>
              Add Outline
            </button>
          ) : (
            <>
              <button className="outline-cancel-button" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="outline-save-button"
                onClick={handleSaveClick}
                disabled={!selectedSegment}
              >
                Save Outline
              </button>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default AddOutline; 