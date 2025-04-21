import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdNoteAdd, MdLabel, MdAnimation, MdMic, MdDone } from 'react-icons/md';
import AddNotes from './AddNotes';
import AddLabel from './AddLabel';
import RecordNotes from './RecordNotes';
import './FeatureAdditionEnhanced.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const FeatureAddition = ({ 
  image, 
  lessonId, 
  regions, 
  teacherEmail, 
  onComplete, 
  onBack, 
  setLessonWithFeatures, 
  setSegmentedRegions, 
  setCurrentStep 
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [notes, setNotes] = useState({});
  const [labels, setLabels] = useState({});
  const [clickCoordinates, setClickCoordinates] = useState({});
  const [isAddingNotes, setIsAddingNotes] = useState(false);
  const [isAddingLabels, setIsAddingLabels] = useState(false);
  const [isRecordingNotes, setIsRecordingNotes] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const imageRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const handleRegionClick = (regionId, e) => {
    if (!isAddingNotes && !isAddingLabels) {
      setSelectedRegionId(regionId === selectedRegionId ? null : regionId);
    } else if (isPreviewing) {
      setSelectedRegionId(regionId);
    } else {
      setSelectedRegionId(regionId === selectedRegionId ? null : regionId);
    }
  };

  const handleAddNotes = () => {
    setIsAddingNotes(true);
    setIsAddingLabels(false);
    setIsRecordingNotes(false);
    setIsPreviewing(false);
    setSelectedRegionId(null);
  };

  const handleAddLabels = () => {
    setIsAddingLabels(true);
    setIsAddingNotes(false);
    setIsRecordingNotes(false);
    setIsPreviewing(false);
    setSelectedRegionId(null);
  };

  const handleRecordNotes = () => {
    // First cleanup any existing media streams in case they exist
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    setIsRecordingNotes(true);
    setIsAddingNotes(false);
    setIsAddingLabels(false);
    setIsPreviewing(false);
    setSelectedRegionId(null);
  };

  const handleSaveNote = (regionId, note, coordinates) => {
    setNotes((prev) => ({ ...prev, [regionId]: note }));
    setClickCoordinates((prev) => ({ ...prev, [regionId]: coordinates }));
  };

  const handleSaveLabel = (regionId, label, coordinates) => {
    setLabels((prev) => ({ ...prev, [regionId]: label }));
    setClickCoordinates((prev) => ({ ...prev, [regionId]: coordinates }));
  };

  const handleDoneAddingNotes = () => {
    setIsAddingNotes(false);
    setIsPreviewing(true);
    setSelectedRegionId(null);
  };

  const handleDoneAddingLabels = () => {
    setIsAddingLabels(false);
    setIsPreviewing(true);
    setSelectedRegionId(null);
  };

  const handleDoneRecordingNotes = () => {
    setIsRecordingNotes(false);
    setIsPreviewing(true);
    setSelectedRegionId(null);
  };

  const handleBackToAddNotes = () => {
    setIsPreviewing(false);
    setIsAddingNotes(true);
    setSelectedRegionId(null);
  };

  const handleBackToAddLabels = () => {
    setIsPreviewing(false);
    setIsAddingLabels(true);
    setSelectedRegionId(null);
  };

  const handleBackToRecordNotes = () => {
    setIsPreviewing(false);
    setIsRecordingNotes(true);
    setSelectedRegionId(null);
  };

  const handleBackToFeatures = () => {
    setIsPreviewing(false);
    setIsAddingNotes(false);
    setIsAddingLabels(false);
    setIsRecordingNotes(false);
    setSelectedRegionId(null);
  };

  const handleAnimate = () => {
    console.log(`Animate region ${selectedRegionId}`);
  };

  const handleSave = () => {
    onComplete({
      lessonId,
      regions: regions.map((region, index) => ({
        ...region,
        segmentIndex: index,
        notes: notes[region.region_id] || '',
        label: labels[region.region_id] || '',
        annotation: clickCoordinates[region.region_id] || null,
      })),
      features: { notes, labels, annotations: clickCoordinates },
    });
  };

  const handleRegionsSegmented = (data) => {
    console.log('Regions segmented with features:', data);
    if (data && data.lessonId && data.regions) {
      // Format the regions data to include all features (notes, labels, audio)
      const enhancedRegions = data.regions.map(region => {
        // Combine existing features with new data
        const notes = data.features?.notes?.[region.region_id] || '';
        const label = data.features?.labels?.[region.region_id] || '';
        const annotation = data.features?.annotations?.[region.region_id] || null;
        
        return {
          ...region,
          notes: typeof notes === 'string' ? notes : notes?.text || '',
          audioUrl: notes?.audioUrl || null,
          label,
          annotation,
        };
      });
      
      // Create a comprehensive lesson data structure
      const lessonData = {
        lessonId: data.lessonId,
        regions: enhancedRegions,
        features: data.features,
        noteOrder: Object.keys(data.features?.notes || {})
      };
      
      setLessonWithFeatures(lessonData);
      setSegmentedRegions(enhancedRegions);
      setCurrentStep('finalPreview');
    } else {
      console.error("Invalid data received from FeatureAddition:", data);
      toast.error('An error occurred processing lesson features.');
      setCurrentStep('select');
    }
  };

  const renderPreview = () => {
    return (
      <div className="featadd-preview-container">
        <div className="featadd-preview-image-container">
          <img
            ref={imageRef}
            src={image.url}
            alt="Segmented Image"
            className="featadd-preview-base-image"
            onLoad={() => {
              if (imageRef.current) {
                const { width, height } = imageRef.current.getBoundingClientRect();
                if (imageRef.current.parentElement) {
                  imageRef.current.parentElement.style.width = `${width}px`;
                  imageRef.current.parentElement.style.height = `${height}px`;
                }
              }
            }}
          />
          <div className="featadd-preview-regions-overlay">
            {regions.map((region) => {
              return (
                <div
                  key={region.region_id}
                  className={`featadd-preview-region ${
                    selectedRegionId === region.region_id ? 'featadd-preview-selected' : ''
                  } featadd-active`}
                  onClick={(e) => handleRegionClick(region.region_id, e)}
                >
                  <img
                    src={region.mask_url}
                    alt={`Region ${region.region_id}`}
                    className={`featadd-preview-mask`}
                    style={{ opacity: 0.5 }}
                    onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="featadd-preview-footer">
          <motion.button
            className="featadd-preview-back-button"
            onClick={isAddingNotes ? handleBackToAddNotes : isAddingLabels ? handleBackToAddLabels : isRecordingNotes ? handleBackToRecordNotes : handleBackToFeatures}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Back to {isAddingNotes ? 'Add Notes' : isAddingLabels ? 'Add Labels' : isRecordingNotes ? 'Record Notes' : 'Features'}
          </motion.button>
        </div>
        <AnimatePresence>
          {selectedRegionId && isPreviewing && (
            <motion.div
              className="featadd-notes-popup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h3>
                <span
                  className="featadd-color-indicator"
                  style={{ backgroundColor: '#e982c8' }}
                ></span>
                Segment {regions.findIndex((r) => r.region_id === selectedRegionId) + 1}
              </h3>
              <div className="featadd-notes-content">
                <p><strong>Notes:</strong> {notes[selectedRegionId] || 'No notes added'}</p>
                <p><strong>Label:</strong> {labels[selectedRegionId] || 'No label added'}</p>
                {clickCoordinates[selectedRegionId] && (
                  <p><strong>Annotation:</strong> Clicked at ({clickCoordinates[selectedRegionId].x.toFixed(0)}, {clickCoordinates[selectedRegionId].y.toFixed(0)})</p>
                )}
              </div>
              <motion.button
                className="featadd-notes-close-button"
                onClick={() => setSelectedRegionId(null)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Close
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderMainInterface = () => (
    <motion.div
      className="featadd-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="featadd-header">
        <h2>Add Features to Segments</h2>
        <p>
          {isAddingNotes
            ? 'Click any segment to add or edit notes.'
            : isAddingLabels
            ? 'Click any segment to add or edit labels.'
            : isRecordingNotes
            ? 'Click any segment to record notes.'
            : isPreviewing
            ? 'Preview your segments and features. Click to view.'
            : 'Select a segment or choose a feature to add.'}
        </p>
      </div>
      <div className="featadd-content">
        <div className="featadd-image-container">
          <img
            ref={imageRef}
            src={image.url}
            alt="Segmented Image"
            className="featadd-base-image"
            onLoad={() => {
              if (imageRef.current) {
                const { width, height } = imageRef.current.getBoundingClientRect();
                if (imageRef.current.parentElement) {
                  imageRef.current.parentElement.style.width = `${width}px`;
                  imageRef.current.parentElement.style.height = `${height}px`;
                }
              }
            }}
          />
          <div className="featadd-regions-overlay">
            {regions.map((region) => {
              const isActive = isAddingNotes || isAddingLabels || isRecordingNotes;
              return (
                <div
                  key={region.region_id}
                  className={`featadd-region${
                    selectedRegionId === region.region_id ? ' featadd-selected' : ''
                  }${isActive ? ' featadd-active' : ''}${isAddingNotes ? ' featadd-adding' : ''}`}
                  onClick={(e) => handleRegionClick(region.region_id, e)}
                >
                  <img
                    src={region.mask_url}
                    alt={`Region ${region.region_id}`}
                    className={`featadd-mask`}
                    style={{ opacity: 0.5 }}
                    onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="featadd-sidebar">
          <div className="featadd-panel">
            <h3>
              <span
                className="featadd-color-indicator"
                style={{ backgroundColor: '#e982c8' }}
              ></span>
              {selectedRegionId
                ? `Segment ${regions.findIndex((r) => r.region_id === selectedRegionId) + 1}`
                : 'Features'}
            </h3>
            <div className="featadd-actions">
              <motion.button
                className="featadd-action-button"
                onClick={handleAddNotes}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MdNoteAdd size={20} /> Add Notes
              </motion.button>
              <motion.button
                className="featadd-action-button"
                onClick={handleAddLabels}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MdLabel size={20} /> Add Labels
              </motion.button>
              <motion.button
                className="featadd-action-button"
                onClick={handleAnimate}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MdAnimation size={20} /> Animate
              </motion.button>
              <motion.button
                className="featadd-action-button"
                onClick={handleRecordNotes}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MdMic size={20} /> Record Notes
              </motion.button>
            </div>
          </div>
          <div className="featadd-footer">
            <motion.button
              className="featadd-back-button"
              onClick={onBack}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Back
            </motion.button>
            {(isAddingNotes || isAddingLabels || isRecordingNotes) && (
              <motion.button
                className="featadd-done-button"
                onClick={isAddingNotes ? handleDoneAddingNotes : isAddingLabels ? handleDoneAddingLabels : handleDoneRecordingNotes}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MdDone size={20} /> Done Adding {isAddingNotes ? 'Notes' : isAddingLabels ? 'Labels' : 'Recording Notes'}
              </motion.button>
            )}
            <motion.button
              className="featadd-save-button"
              onClick={handleSave}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Save
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isAddingNotes ? (
        <motion.div
          key="add-notes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AddNotes
            image={image}
            lessonId={lessonId}
            regions={regions}
            teacherEmail={teacherEmail}
            onSave={handleSaveNote}
            onDone={handleDoneAddingNotes}
            onCancel={handleBackToFeatures}
            existingNotes={notes}
            existingCoordinates={clickCoordinates}
          />
        </motion.div>
      ) : isAddingLabels ? (
        <motion.div
          key="add-label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AddLabel
            image={image}
            lessonId={lessonId}
            regions={regions}
            teacherEmail={teacherEmail}
            onSave={handleSaveLabel}
            onDone={handleDoneAddingLabels}
            onBack={handleBackToFeatures}
            existingLabels={labels}
            existingCoordinates={clickCoordinates}
          />
        </motion.div>
      ) : isRecordingNotes ? (
        <motion.div
          key="record-notes"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <RecordNotes
            image={image}
            lessonId={lessonId}
            regions={regions}
            teacherEmail={teacherEmail}
            onSave={handleSaveNote}
            onDone={handleDoneRecordingNotes}
            onCancel={handleBackToFeatures}
            existingNotes={notes}
            existingCoordinates={clickCoordinates}
          />
        </motion.div>
      ) : (
        <motion.div
          key="main-interface"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isPreviewing ? renderPreview() : renderMainInterface()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeatureAddition;