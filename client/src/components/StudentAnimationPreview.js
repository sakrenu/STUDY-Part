import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './Animation.css';

const StudentAnimationPreview = ({ image, regions, recordings, onClose, onSave }) => {
  const [currentPartIndex, setCurrentPartIndex] = useState(-1);
  const [isAnimationStarted, setIsAnimationStarted] = useState(false);

  const parts = regions.map((region, index) => ({
    ...region,
    audioUrl: recordings[region.region_id] || null,
    label: `Part ${index + 1}`,
  }));

  useEffect(() => {
    if (isAnimationStarted && currentPartIndex >= 0 && currentPartIndex < parts.length) {
      const currentPart = parts[currentPartIndex];
      if (currentPart.audioUrl) {
        const audio = new Audio(currentPart.audioUrl);
        audio.play();
        audio.onended = () => {
          setCurrentPartIndex((prev) => prev + 1);
        };
      } else {
        setTimeout(() => {
          setCurrentPartIndex((prev) => prev + 1);
        }, 2000);
      }
    }
  }, [isAnimationStarted, currentPartIndex, parts]);

  const handleStartAnimation = () => {
    setIsAnimationStarted(true);
    setCurrentPartIndex(0);
  };

  const handleSaveAnimation = async () => {
    try {
      // Placeholder for saving animation data to Firebase
      // Adjust the structure based on your backend requirements
      const animationData = {
        imageUrl: image.url,
        regions: parts.map((part) => ({
          regionId: part.region_id,
          maskUrl: part.mask_url,
          audioUrl: part.audioUrl,
          position: part.position,
        })),
        createdAt: new Date().toISOString(),
      };
      // Example: Save to Firebase (adjust path as needed)
      // await setDoc(doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Animations', 'animationId'), animationData);
      console.log('Saving animation:', animationData);
      onSave();
    } catch (err) {
      console.error('Failed to save animation:', err);
    }
  };

  return (
    <motion.div
      className="animation-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="animation-left">
        <h3>Original Image</h3>
        <div className="animation-image-container">
          <img
            src={image.url}
            alt="Original"
            className="animation-base-image"
          />
          {parts.map((part, index) => (
            <motion.img
              key={index}
              src={part.mask_url}
              alt={`Part ${index}`}
              className="animation-mask"
              initial={{ opacity: 0 }}
              animate={{
                opacity: index <= currentPartIndex ? 0.5 : 0,
              }}
              transition={{ duration: 0.5 }}
            />
          ))}
        </div>
      </div>
      <div className="animation-right">
        <h3>Segmented Parts</h3>
        <div className="animation-stack">
          {parts.map((part, index) => (
            <motion.div
              key={index}
              className="animation-part"
              initial={{
                x: 0,
                y: index * 120,
                opacity: 1,
              }}
              animate={{
                x: index <= currentPartIndex ? -1000 : 0,
                y: index * 120,
                opacity: index <= currentPartIndex ? 0 : 1,
              }}
              transition={{
                x: { duration: 1, ease: 'easeInOut' },
                opacity: { duration: 0.5 },
              }}
            >
              <img
                src={part.mask_url}
                alt={`Part ${index}`}
                className="animation-part-image"
              />
              <p>{part.label}</p>
            </motion.div>
          ))}
        </div>
        <div className="animation-controls">
          {!isAnimationStarted && (
            <button
              className="animation-start-button"
              onClick={handleStartAnimation}
            >
              Start Animation
            </button>
          )}
          <button
            className="animation-exit-button"
            onClick={onClose}
          >
            Close Preview
          </button>
          <button
            className="animation-save-button"
            onClick={handleSaveAnimation}
          >
            Save Animation
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentAnimationPreview;