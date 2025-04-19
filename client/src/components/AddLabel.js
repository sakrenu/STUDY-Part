// import React, { useState, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { db } from '../firebase';
// import { doc, setDoc } from 'firebase/firestore';
// import './AddLabel.css';

// const AddLabel = ({ image, lessonId, regions, teacherEmail, onSave, onDone, existingLabels, existingCoordinates }) => {
//   const [currentLabel, setCurrentLabel] = useState(null);
//   const [labels, setLabels] = useState(existingLabels || {});
//   const [clickCoordinates, setClickCoordinates] = useState(existingCoordinates || {});
//   const [error, setError] = useState(null);
//   const [isSaving, setIsSaving] = useState(false);
//   const imageRef = useRef(null);
//   const inputRef = useRef(null);

//   const handleImageClick = async (e) => {
//     const rect = imageRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     const imageWidth = imageRef.current.naturalWidth;
//     const imageHeight = imageRef.current.naturalHeight;
//     const displayWidth = rect.width;
//     const displayHeight = rect.height;
//     const normalizedX = (x / displayWidth) * imageWidth;
//     const normalizedY = (y / displayHeight) * imageHeight;

//     const clickedRegion = regions.find((region) => {
//       const { x: regionX, y: regionY, width, height } = region.position;
//       return (
//         normalizedX >= regionX &&
//         normalizedX <= regionX + width &&
//         normalizedY >= regionY &&
//         normalizedY <= regionY + height
//       );
//     });

//     if (clickedRegion) {
//       setCurrentLabel({
//         regionId: clickedRegion.region_id,
//         regionIndex: regions.findIndex((r) => r.region_id === clickedRegion.region_id),
//         text: labels[clickedRegion.region_id] || '',
//         clickX: x,
//         clickY: y,
//       });
//       setTimeout(() => inputRef.current?.focus(), 0);
//     }
//   };

//   const handleLabelChange = (text) => {
//     setCurrentLabel((prev) => ({ ...prev, text }));
//     setError(null);
//   };

//   const handleLabelSubmit = async () => {
//     if (!currentLabel.text.trim()) {
//       setError('Label cannot be empty');
//       return;
//     }
//     setIsSaving(true);
//     setError(null);
//     try {
//       const { regionId, regionIndex, text, clickX, clickY } = currentLabel;
//       await setDoc(
//         doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
//         {
//           regionId,
//           segmentIndex: regionIndex,
//           label: text,
//           annotation: { x: clickX, y: clickY },
//           maskUrl: regions.find((r) => r.region_id === regionId).mask_url,
//           cutoutUrl: regions.find((r) => r.region_id === regionId).cutout_url,
//           position: regions.find((r) => r.region_id === regionId).position,
//         },
//         { merge: true }
//       );
//       setLabels((prev) => ({ ...prev, [regionId]: text }));
//       setClickCoordinates((prev) => ({ ...prev, [regionId]: { x: clickX, y: clickY } }));
//       onSave(regionId, text, { x: clickX, y: clickY });
//       setCurrentLabel(null);
//     } catch (err) {
//       setError('Failed to save label: ' + err.message);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleCancelLabel = () => {
//     setCurrentLabel(null);
//     setError(null);
//   };

//   return (
//     <motion.div
//       className="addlabel-container"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <div className="addlabel-header">
//         <h2>Label Segments</h2>
//         <p>Click a segment to add or edit a label.</p>
//       </div>
//       <div className="addlabel-image-container" onClick={handleImageClick}>
//         <img
//           src={image.url}
//           alt="Segmented Image"
//           className="addlabel-base-image"
//           ref={imageRef}
//           style={{ cursor: 'crosshair' }}
//         />
//         <div className="addlabel-regions-overlay">
//           {regions.map((region) => (
//             <div
//               key={region.region_id}
//               className="addlabel-region"
//             >
//               <img
//                 src={region.mask_url}
//                 alt={`Region ${region.region_id}`}
//                 className="addlabel-mask"
//                 style={{ opacity: 0.5 }}
//                 onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
//               />
//             </div>
//           ))}
//           {Object.entries(labels).map(([regionId, text]) => {
//             const coords = clickCoordinates[regionId];
//             if (!coords) return null;
//             const labelX = coords.x + 100;
//             const labelY = coords.y - 20;
//             return (
//               <div key={regionId} className="addlabel-wrapper">
//                 <svg
//                   style={{
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     width: '100%',
//                     height: '100%',
//                     pointerEvents: 'none',
//                   }}
//                 >
//                   <line
//                     x1={coords.x}
//                     y1={coords.y}
//                     x2={labelX}
//                     y2={labelY}
//                     stroke="#ffffff"
//                     strokeWidth="2"
//                     className="addlabel-line"
//                   />
//                 </svg>
//                 <div
//                   className="addlabel-text"
//                   style={{
//                     position: 'absolute',
//                     top: labelY,
//                     left: labelX,
//                   }}
//                 >
//                   {text}
//                 </div>
//               </div>
//             );
//           })}
//           {currentLabel && (
//             <div
//               className="addlabel-input-wrapper"
//               style={{
//                 position: 'absolute',
//                 top: currentLabel.clickY - 20,
//                 left: currentLabel.clickX + 100,
//               }}
//             >
//               <svg
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   width: '100%',
//                   height: '100%',
//                   pointerEvents: 'none',
//                 }}
//               >
//                 <line
//                   x1={currentLabel.clickX}
//                   y1={currentLabel.clickY}
//                   x2={currentLabel.clickX + 100}
//                   y2={currentLabel.clickY - 20}
//                   stroke="#ffffff"
//                   strokeWidth="2"
//                   className="addlabel-line"
//                 />
//               </svg>
//               <input
//                 ref={inputRef}
//                 type="text"
//                 value={currentLabel.text}
//                 onChange={(e) => handleLabelChange(e.target.value)}
//                 placeholder="Enter label..."
//                 className="addlabel-input"
//                 disabled={isSaving}
//                 maxLength={100}
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') handleLabelSubmit();
//                 }}
//               />
//               <AnimatePresence>
//                 {error && (
//                   <motion.div
//                     className="addlabel-error"
//                     initial={{ opacity: 0, y: -10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     {error}
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//               <div className="addlabel-input-buttons">
//                 <button
//                   onClick={handleLabelSubmit}
//                   className="addlabel-submit-button"
//                   disabled={isSaving}
//                 >
//                   {isSaving ? <span className="addlabel-spinner"></span> : 'Add'}
//                 </button>
//                 <button
//                   onClick={handleCancelLabel}
//                   className="addlabel-cancel-button"
//                   disabled={isSaving}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//       <div className="addlabel-footer">
//         <motion.button
//           className="addlabel-done-button"
//           onClick={onDone}
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           Done Labeling
//         </motion.button>
//       </div>
//     </motion.div>
//   );
// };

// export default AddLabel;

import React, { useState, useRef } from 'react';
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
  const imageRef = useRef(null);
  const inputRef = useRef(null);

  const handleRegionClick = (region, e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log(`Clicked at (${x}, ${y}) on region ${region.region_id}`);

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
        />
        <div className="addlabel-regions-overlay">
          {regions.map((region) => (
            <div
              key={region.region_id}
              className="addlabel-region"
              onClick={(e) => handleRegionClick(region, e)}
            >
              <img
                src={region.mask_url}
                alt={`Region ${region.region_id}`}
                className="addlabel-mask"
                style={{ opacity: 0.5 }}
                onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
              />
            </div>
          ))}
          {Object.entries(labels).map(([regionId, text]) => {
            const coords = clickCoordinates[regionId];
            if (!coords) return null;
            const labelX = coords.x + 100;
            const labelY = coords.y - 20;
            return (
              <div key={regionId} className="addlabel-wrapper">
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
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
              }}
            >
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
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