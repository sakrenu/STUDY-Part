import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import './StudentPreview.css';

const StudentPreview = ({ image, regions, notes, noteOrder, lessonId, teacherEmail, onClose, onSave }) => {
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef(null);

  const handleSegmentClick = (regionId) => {
    setSelectedRegionId(regionId);
  };

  const handleSavePreview = async () => {
    setIsSaving(true);
    try {
      const studentViewData = {
        imageUrl: image.url,
        regions: regions.map((region) => ({
          regionId: region.region_id,
          maskUrl: region.mask_url,
          position: region.position,
          notes: notes[region.region_id] || '',
        })),
        noteOrder: noteOrder,
      };
      await setDoc(
        doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'StudentView', 'config'),
        studentViewData,
        { merge: true }
      );
      onSave();
    } catch (err) {
      console.error('Failed to save preview:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="student-preview-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="student-preview-container"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="student-preview-header">
          <h2>Student View Preview</h2>
          <p>Click a segment to view its notes in the preview.</p>
        </div>
        <div className="student-preview-image-container">
          <img
            src={image.url}
            alt="Segmented Image"
            className="student-preview-base-image"
            ref={imageRef}
          />
          <div className="student-preview-regions-overlay">
            {regions
              .sort((a, b) => noteOrder.indexOf(a.region_id) - noteOrder.indexOf(b.region_id))
              .map((region) => (
                <div
                  key={region.region_id}
                  className={`student-preview-segment ${selectedRegionId === region.region_id ? 'selected' : ''}`}
                  onClick={() => handleSegmentClick(region.region_id)}
                  style={{
                    position: 'absolute',
                    top: `${(region.position.y / imageRef.current?.naturalHeight) * 100}%`,
                    left: `${(region.position.x / imageRef.current?.naturalWidth) * 100}%`,
                    width: `${(region.position.width / imageRef.current?.naturalWidth) * 100}%`,
                    height: `${(region.position.height / imageRef.current?.naturalHeight) * 100}%`,
                  }}
                >
                  <img
                    src={region.mask_url}
                    alt={`Segment ${region.region_id}`}
                    className="student-preview-mask"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      opacity: 0.5,
                    }}
                  />
                </div>
              ))}
          </div>
          <AnimatePresence>
            {selectedRegionId && notes[selectedRegionId] && (
              <motion.div
                className="student-preview-notes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                style={{
                  top: `${(regions.find(r => r.region_id === selectedRegionId).position.y / imageRef.current?.naturalHeight) * 100 + 5}%`,
                  left: `${(regions.find(r => r.region_id === selectedRegionId).position.x / imageRef.current?.naturalWidth) * 100}%`,
                }}
              >
                <h3>Segment Notes</h3>
                <p>{notes[selectedRegionId]}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="student-preview-footer">
          <motion.button
            className="student-preview-close-button"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Close Preview
          </motion.button>
          <motion.button
            className="student-preview-save-button"
            onClick={handleSavePreview}
            disabled={isSaving}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isSaving ? <span className="student-preview-spinner"></span> : 'Save Preview'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentPreview;