import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { MdPlayArrow, MdVolumeUp } from 'react-icons/md';
import './StudentPreview.css';

const StudentPreview = ({ image, regions, notes, noteOrder, lessonId, teacherEmail, onClose, onSave }) => {
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const imageRef = useRef(null);

  const handleSegmentClick = (regionId) => {
    setSelectedRegionId(regionId);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
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
          notes: notes[region.region_id]?.text || '',
          audioUrl: notes[region.region_id]?.audioUrl || null,
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

  const handleReadAloud = () => {
    if (!selectedRegionId || !notes[selectedRegionId]?.text) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(notes[selectedRegionId].text);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
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
        <div className="student-preview-content">
          <div className="student-preview-header">
            <h2>Student View Preview</h2>
            <p>Click a segment to view its notes and audio below.</p>
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
          </div>
          <AnimatePresence>
            {selectedRegionId && (
              <motion.div
                className="student-preview-notes-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <h3>Segment {regions.find((r) => r.region_id === selectedRegionId).regionIndex + 1} Notes</h3>
                {notes[selectedRegionId]?.text ? (
                  <p>{notes[selectedRegionId].text}</p>
                ) : (
                  <p className="student-preview-no-notes">No notes available for this segment.</p>
                )}
                <div className="student-preview-audio-section">
                  {notes[selectedRegionId]?.audioUrl ? (
                    <audio controls src={notes[selectedRegionId].audioUrl} className="student-preview-audio-player">
                      <MdPlayArrow size={20} /> Play Audio
                    </audio>
                  ) : (
                    <p className="student-preview-no-audio">No recording available.</p>
                  )}
                </div>
                {notes[selectedRegionId]?.text && (
                  <motion.button
                    className="student-preview-read-aloud"
                    onClick={handleReadAloud}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={isSpeaking ? 'Stop reading aloud' : 'Read notes aloud'}
                  >
                    <MdVolumeUp size={20} /> {isSpeaking ? 'Stop Reading' : 'Read Aloud'}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StudentPreview;