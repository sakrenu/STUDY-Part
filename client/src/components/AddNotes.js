import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { MdUndo, MdRedo, MdErrorOutline } from 'react-icons/md';
import './AddNotes.css';

const AddNotes = ({ image, lessonId, regions, teacherEmail, onSave, onDone, onCancel, existingNotes, existingCoordinates }) => {
  const [currentNote, setCurrentNote] = useState(null);
  const [notes, setNotes] = useState(existingNotes || {});
  const [clickCoordinates, setClickCoordinates] = useState(existingCoordinates || {});
  const [history, setHistory] = useState({});
  const [historyIndex, setHistoryIndex] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const imageRef = useRef(null);
  const textareaRef = useRef(null);
  const maxChars = 500;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [currentNote?.text]);

  const handleImageClick = (e) => {
    if (!imageRef.current || !regions || regions.length === 0) {
      console.log('Image ref or regions not available:', { imageRef: !!imageRef.current, regions });
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

    const clickedRegion = regions.find((region) => {
      const { position } = region;
      if (!position || position.x === undefined || position.y === undefined || position.width === undefined || position.height === undefined) {
        console.log('Invalid region position:', region);
        return false;
      }
      return (
        originalX >= position.x &&
        originalX <= position.x + position.width &&
        originalY >= position.y &&
        originalY <= position.y + position.height
      );
    });

    if (clickedRegion) {
      const regionId = clickedRegion.region_id;
      setCurrentNote({
        regionId,
        text: notes[regionId] || '',
        clickX: x,
        clickY: y,
        maskUrl: clickedRegion.mask_url,
        cutoutUrl: clickedRegion.cutout_url,
        position: clickedRegion.position,
        regionIndex: regions.findIndex((r) => r.region_id === regionId),
      });
      setHistory((prev) => ({
        ...prev,
        [regionId]: prev[regionId] || [notes[regionId] || ''],
      }));
      setHistoryIndex((prev) => ({
        ...prev,
        [regionId]: 0,
      }));
    }
  };

  const handleNoteChange = (e) => {
    const newNote = e.target.value.slice(0, maxChars);
    setCurrentNote((prev) => ({ ...prev, text: newNote }));
    const regionId = currentNote.regionId;
    const newHistory = history[regionId].slice(0, historyIndex[regionId] + 1);
    newHistory.push(newNote);
    setHistory((prev) => ({
      ...prev,
      [regionId]: newHistory,
    }));
    setHistoryIndex((prev) => ({
      ...prev,
      [regionId]: newHistory.length - 1,
    }));
    setError(null);
  };

  const handleUndo = () => {
    const regionId = currentNote.regionId;
    if (historyIndex[regionId] > 0) {
      const newIndex = historyIndex[regionId] - 1;
      setHistoryIndex((prev) => ({
        ...prev,
        [regionId]: newIndex,
      }));
      setCurrentNote((prev) => ({
        ...prev,
        text: history[regionId][newIndex],
      }));
    }
  };

  const handleRedo = () => {
    const regionId = currentNote.regionId;
    if (historyIndex[regionId] < history[regionId].length - 1) {
      const newIndex = historyIndex[regionId] + 1;
      setHistoryIndex((prev) => ({
        ...prev,
        [regionId]: newIndex,
      }));
      setCurrentNote((prev) => ({
        ...prev,
        text: history[regionId][newIndex],
      }));
    }
  };

  const handleSave = async () => {
    if (!currentNote || !currentNote.text.trim()) {
      setError('Note cannot be empty');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const { regionId, text, clickX, clickY, maskUrl, cutoutUrl, position, regionIndex } = currentNote;
      await setDoc(
        doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
        {
          regionId,
          segmentIndex: regionIndex,
          notes: text,
          annotation: { x: clickX, y: clickY },
          maskUrl,
          cutoutUrl,
          position,
        },
        { merge: true }
      );
      setNotes((prev) => ({ ...prev, [regionId]: text }));
      setClickCoordinates((prev) => ({ ...prev, [regionId]: { x: clickX, y: clickY } }));
      onSave(regionId, text, { x: clickX, y: clickY });
      setCurrentNote(null);
    } catch (err) {
      setError('Failed to save note: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelNote = () => {
    setCurrentNote(null);
    setError(null);
  };

  if (!image || !image.url) {
    return (
      <motion.div
        className="addnotes-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="addnotes-header">
          <h2>Add Notes to Segments</h2>
          <p>Error: Image not available</p>
        </div>
        <div className="addnotes-footer">
          <motion.button
            className="addnotes-back-button"
            onClick={onCancel}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Back to Features
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="addnotes-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="addnotes-header">
        <h2>Add Notes to Segments</h2>
        <p>Click directly on a colored segment to add or edit a note.</p>
      </div>
      <div className="addnotes-image-container" onClick={handleImageClick}>
        <img
          src={image.url}
          alt="Segmented Image"
          className="addnotes-base-image"
          ref={imageRef}
        />
        <div className="addnotes-regions-overlay">
          {regions.map((region) => (
            <img
              key={region.region_id}
              src={region.mask_url}
              alt={`Segment ${region.region_id}`}
              className="addnotes-mask"
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
              onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
            />
          ))}
        </div>
      </div>
      <div className="addnotes-footer">
        <motion.button
          className="addnotes-back-button"
          onClick={onCancel}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Back to Features
        </motion.button>
        <motion.button
          className="addnotes-done-button"
          onClick={onDone}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Done Adding Notes
        </motion.button>
      </div>
      <AnimatePresence>
        {currentNote && (
          <motion.div
            className="addnotes-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="addnotes-popup"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              role="dialog"
              aria-labelledby="addnotes-title"
              aria-describedby="addnotes-description"
            >
              <div className="addnotes-header">
                <h3 id="addnotes-title">
                  <span className="addnotes-color-indicator" style={{ backgroundColor: '#e982c8' }}></span>
                  {notes[currentNote.regionId] ? 'Edit Notes' : 'Add Notes'} for Segment {currentNote.regionIndex + 1}
                </h3>
              </div>
              <div className="addnotes-preview">
                <img
                  src={currentNote.maskUrl}
                  alt={`Segment ${currentNote.regionIndex + 1} preview`}
                  className="addnotes-preview-image"
                  onError={() => console.error(`Failed to load mask: ${currentNote.maskUrl}`)}
                />
              </div>
              {error && (
                <motion.div
                  className="addnotes-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <MdErrorOutline size={20} />
                  {error}
                </motion.div>
              )}
              <div className="addnotes-textarea-container">
                <textarea
                  ref={textareaRef}
                  value={currentNote.text}
                  onChange={handleNoteChange}
                  placeholder="Enter notes for this segment (e.g., 'This is the main subject of the image...')"
                  className="addnotes-textarea"
                  disabled={isSaving}
                  aria-describedby="addnotes-char-count"
                />
                <div className="addnotes-textarea-footer">
                  <span id="addnotes-char-count" className="addnotes-char-count">
                    {currentNote.text.length}/{maxChars}
                  </span>
                  <div className="addnotes-undo-redo">
                    <motion.button
                      className="addnotes-undo-button"
                      onClick={handleUndo}
                      disabled={historyIndex[currentNote.regionId] === 0 || isSaving}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Undo last change"
                      aria-label="Undo last change"
                    >
                      <MdUndo size={20} />
                    </motion.button>
                    <motion.button
                      className="addnotes-redo-button"
                      onClick={handleRedo}
                      disabled={historyIndex[currentNote.regionId] === history[currentNote.regionId].length - 1 || isSaving}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Redo last change"
                      aria-label="Redo last change"
                    >
                      <MdRedo size={20} />
                    </motion.button>
                  </div>
                </div>
              </div>
              <div className="addnotes-buttons">
                <motion.button
                  className="addnotes-save-button"
                  onClick={handleSave}
                  disabled={isSaving}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Save note"
                >
                  {isSaving ? <span className="addnotes-spinner"></span> : 'Save Note'}
                </motion.button>
                <motion.button
                  className="addnotes-cancel-button"
                  onClick={handleCancelNote}
                  disabled={isSaving}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Cancel and close"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddNotes;