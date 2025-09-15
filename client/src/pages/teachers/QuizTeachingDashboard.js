import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
// import { auth } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { MdArrowBack } from 'react-icons/md';
import './QuizTeachingDashboard.css';

const QuizTeachingDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const hasSegments = state?.regions && state.regions.length > 0;
  const [currentLabel, setCurrentLabel] = useState(null);
  const [labels, setLabels] = useState({});
  const [clickCoordinates, setClickCoordinates] = useState({});
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (hasSegments && !quizId) {
      setQuizId(uuidv4());
    }
    const handleClickOutside = (e) => {
      const inputWrapper = document.querySelector('.quiz-label-input-wrapper');
      if (currentLabel && !containerRef.current?.contains(e.target) && !inputWrapper?.contains(e.target)) {
        setCurrentLabel(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentLabel, hasSegments]);

  const handleCreateSegments = () => {
    navigate('/teach-by-parts');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (isPreview || !imageRef.current || !state.regions || state.regions.length === 0) {
      return;
    }
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const imageX = x * scaleX;
    const imageY = y * scaleY;

    const clickedRegion = state.regions.find((region) => {
      const { position } = region;
      if (!position) return false;
      return (
        imageX >= position.x &&
        imageX <= position.x + position.width &&
        imageY >= position.y &&
        imageY <= position.y + position.height
      );
    });

    if (clickedRegion) {
      setCurrentLabel({
        regionId: clickedRegion.region_id,
        text: labels[clickedRegion.region_id] || '',
        clickX: x,
        clickY: y,
        labelX: x + 100,
        labelY: y - 30
      });

      setClickCoordinates(prev => ({
        ...prev,
        [clickedRegion.region_id]: { x, y }
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
      const { regionId, text, clickX, clickY } = currentLabel;
      await setDoc(
        doc(db, 'Teachers', state.teacherEmail, 'Lessons', state.lessonId, 'Quizzes', quizId, 'Segments', regionId),
        {
          regionId,
          label: text,
          annotation: { x: clickX, y: clickY },
        },
        { merge: true }
      );

      setLabels(prev => ({ ...prev, [regionId]: text }));
      setClickCoordinates(prev => ({ ...prev, [regionId]: { x: clickX, y: clickY } }));
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

  const handleSaveQuiz = async () => {
    if (Object.keys(labels).length === 0) {
      setError('Please label at least one segment before saving.');
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, 'Teachers', state.teacherEmail, 'Lessons', state.lessonId, 'Quizzes', quizId),
        {
          quizId,
          type: 'label_the_parts',
          image: state.image,
          regions: state.regions,
          labels,
          createdAt: new Date(),
        },
        { merge: true }
      );
      navigate('/dashboard', { state: { quizSaved: true } });
    } catch (err) {
      console.error('Save quiz error:', err);
      setError(`Failed to save quiz: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToLabeling = () => {
    setIsPreview(false);
  };

  if (!hasSegments) {
    return (
      <div className="quiz-dashboard-container">
        <nav className="top-nav">
          <div className="logo-container">
            <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
            <a href="/" className="logo">
              <span className="study">Study</span>
              <span className="part">Part</span>
            </a>
          </div>
          <div className="nav-buttons">
            <button className="back-btn" onClick={handleBack}>
              <span className="back-btn-text">Back</span>
              <MdArrowBack size={20} className="back-btn-icon" />
            </button>
          </div>
        </nav>
        <motion.div
          className="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <header className="main-header">
            <h1 className="header-title">Quiz Creation Dashboard</h1>
            <p className="header-subtitle">Design engaging quizzes with segmented regions</p>
          </header>
          <motion.div
            className="no-segments-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="no-segments-title">No Segmentation Available</h2>
            <p className="no-segments-description">
              Create segments first to start building your quiz.
            </p>
            <motion.button
              className="start-button"
              onClick={handleCreateSegments}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Go to TeachByParts
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (isPreview) {
    return (
      <motion.div
        className="quiz-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="top-nav">
          <div className="logo-container">
            <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
            <a href="/" className="logo">
              <span className="study">Study</span>
              <span className="part">Part</span>
            </a>
          </div>
          <div className="nav-buttons">
            <button className="back-btn" onClick={handleBack}>
              <span className="back-btn-text">Back</span>
              <MdArrowBack size={20} className="back-btn-icon" />
            </button>
          </div>
        </nav>
        <div className="quiz-header">
          <h2>Preview Quiz Labels</h2>
          <p>Review the labeled segments as they will appear to students (without labels).</p>
        </div>
        <div className="quiz-image-container" ref={containerRef}>
          <img
            src={state.image.url}
            alt="Segmented Image"
            className="quiz-base-image"
            ref={imageRef}
          />
          <div className="quiz-regions-overlay">
            {state.regions.map((region) => (
              <img
                key={region.region_id}
                src={region.mask_url}
                alt={`Segment ${region.region_id}`}
                className="quiz-mask"
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
                <div key={`preview-label-${regionId}`} className="quiz-preview-wrapper">
                  <svg className="quiz-line">
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
                    className="quiz-preview-text"
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
        <div className="quiz-footer">
          <motion.button
            className="quiz-back-button"
            onClick={handleBackToLabeling}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Back to Labeling
          </motion.button>
          <motion.button
            className="quiz-save-button"
            onClick={handleSaveQuiz}
            disabled={isSaving}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Save Quiz
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="quiz-container" onClick={(e) => e.stopPropagation()}>
      <nav className="top-nav">
        <div className="logo-container">
          <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
          <a href="/" className="logo">
            <span className="study">Study</span>
            <span className="part">Part</span>
          </a>
        </div>
        <div className="nav-buttons">
          <button className="back-btn" onClick={handleBack}>
            <span className="back-btn-text">Back</span>
            <MdArrowBack size={20} className="back-btn-icon" />
          </button>
        </div>
      </nav>
      <div className="quiz-header">
        <h2>Create Label the Parts Quiz</h2>
        <p>Click on a colored segment to add or edit a label for the quiz.</p>
      </div>
      <div className="quiz-content-wrapper">
        <div className="quiz-image-container" onClick={handleImageClick} ref={containerRef}>
          <img
            src={state.image.url}
            alt="Segmented Image"
            className="quiz-base-image"
            ref={imageRef}
          />
          <div className="quiz-regions-overlay">
            {state.regions.map((region) => (
              <img
                key={region.region_id}
                src={region.mask_url}
                alt={`Segment ${region.region_id}`}
                className="quiz-mask"
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
                  className="quiz-label-wrapper"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="quiz-line">
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
                <div key={`label-${regionId}`} className="quiz-wrapper">
                  <svg
                    className="quiz-svg"
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
                      className="quiz-line"
                      key={`line-${regionId}-${coords.x}-${coords.y}`}
                    />
                  </svg>
                  <div
                    className="quiz-text"
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
            className="quiz-label-input-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={currentLabel.text}
              onChange={handleLabelChange}
              className="quiz-label-input"
              disabled={isSaving}
              autoFocus
            />
            <div className="quiz-button-group">
              <button onClick={handleLabelSubmit} disabled={isSaving}>Save</button>
              <button onClick={handleCancelLabel} disabled={isSaving}>Cancel</button>
            </div>
            {error && <div className="quiz-error">{error}</div>}
          </div>
        )}
      </div>
      <div className="quiz-footer">
        <motion.button
          className="quiz-back-button"
          onClick={handleBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Back to Dashboard
        </motion.button>
        <motion.button
          className="quiz-done-button"
          onClick={handleDoneLabeling}
          disabled={Object.keys(labels).length === 0}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Preview Quiz
        </motion.button>
      </div>
    </motion.div>
  );
};

export default QuizTeachingDashboard;