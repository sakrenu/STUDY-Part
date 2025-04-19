// import React, { useState, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { MdNoteAdd, MdLabel, MdBorderOuter, MdAnimation, MdMic, MdDone } from 'react-icons/md';
// import AddNotes from './AddNotes';
// import AddLabel from './AddLabel';
// import './FeatureAdditionEnhanced.css';

// const FeatureAddition = ({ image, lessonId, regions, teacherEmail, onBack, onComplete }) => {
//   const [selectedRegionId, setSelectedRegionId] = useState(null);
//   const [notes, setNotes] = useState({});
//   const [labels, setLabels] = useState({});
//   const [clickCoordinates, setClickCoordinates] = useState({});
//   const [isAddingNotes, setIsAddingNotes] = useState(false);
//   const [isAddingLabels, setIsAddingLabels] = useState(false);
//   const [showAddNotes, setShowAddNotes] = useState(false);
//   const [isPreviewing, setIsPreviewing] = useState(false);
//   const imageRef = useRef(null);

//   const handleRegionClick = (regionId, e) => {
//     if (isAddingNotes) {
//       setSelectedRegionId(regionId);
//       setShowAddNotes(true);
//     } else if (!isPreviewing) {
//       setSelectedRegionId(regionId === selectedRegionId ? null : regionId);
//     } else if (isPreviewing) {
//       setSelectedRegionId(regionId);
//     }
//   };

//   const handleAddNotes = () => {
//     setIsAddingNotes(true);
//     setIsAddingLabels(false);
//     setIsPreviewing(false);
//     setSelectedRegionId(null);
//   };

//   const handleAddLabels = () => {
//     setIsAddingLabels(true);
//     setIsAddingNotes(false);
//     setIsPreviewing(false);
//     setSelectedRegionId(null);
//   };

//   const handleSaveNote = (regionId, note) => {
//     setNotes((prev) => ({ ...prev, [regionId]: note }));
//     setShowAddNotes(false);
//     setSelectedRegionId(null);
//   };

//   const handleSaveLabel = (regionId, label, coordinates) => {
//     setLabels((prev) => ({ ...prev, [regionId]: label }));
//     setClickCoordinates((prev) => ({ ...prev, [regionId]: coordinates }));
//   };

//   const handleCancelAddNotes = () => {
//     setShowAddNotes(false);
//     setSelectedRegionId(null);
//   };

//   const handleDoneAddingNotes = () => {
//     setIsAddingNotes(false);
//     setIsPreviewing(true);
//     setSelectedRegionId(null);
//   };

//   const handleDoneAddingLabels = () => {
//     setIsAddingLabels(false);
//     setIsPreviewing(true);
//     setSelectedRegionId(null);
//   };

//   const handleBackToAddNotes = () => {
//     setIsPreviewing(false);
//     setIsAddingNotes(true);
//     setSelectedRegionId(null);
//   };

//   const handleBackToAddLabels = () => {
//     setIsPreviewing(false);
//     setIsAddingLabels(true);
//     setSelectedRegionId(null);
//   };

//   const handleBackToFeatures = () => {
//     setIsPreviewing(false);
//     setIsAddingNotes(false);
//     setIsAddingLabels(false);
//     setSelectedRegionId(null);
//   };

//   const handleAddOutline = () => {
//     console.log(`Add Outline for region ${selectedRegionId}`);
//   };

//   const handleAnimate = () => {
//     console.log(`Animate region ${selectedRegionId}`);
//   };

//   const handleRecordNotes = () => {
//     console.log(`Record Notes for region ${selectedRegionId}`);
//   };

//   const handleSave = () => {
//     onComplete({
//       lessonId,
//       regions: regions.map((region, index) => ({
//         ...region,
//         segmentIndex: index,
//         notes: notes[region.region_id] || '',
//         label: labels[region.region_id] || '',
//         annotation: clickCoordinates[region.region_id] || null,
//       })),
//       features: { notes, labels, annotations: clickCoordinates },
//     });
//   };

//   const renderPreview = () => {
//     return (
//       <div className="featadd-preview-container">
//         <div className="featadd-preview-image-container">
//           <img
//             src={image.url}
//             alt="Segmented Image"
//             className="featadd-preview-base-image"
//             onLoad={() => {
//               if (imageRef.current) {
//                 const { width, height } = imageRef.current;
//                 imageRef.current.parentElement.style.width = `${width}px`;
//                 imageRef.current.parentElement.style.height = `${height}px`;
//               }
//             }}
//             ref={imageRef}
//           />
//           <div className="featadd-preview-regions-overlay">
//             {regions.map((region) => (
//               <div
//                 key={region.region_id}
//                 className={`featadd-preview-region ${
//                   selectedRegionId === region.region_id ? 'featadd-preview-selected' : ''
//                 } featadd-active`}
//                 onClick={(e) => handleRegionClick(region.region_id, e)}
//               >
//                 <img
//                   src={region.mask_url}
//                   alt={`Region ${region.region_id}`}
//                   className="featadd-preview-mask"
//                   style={{ opacity: 0.5 }}
//                   onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
//                 />
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="featadd-preview-footer">
//           <motion.button
//             className="featadd-preview-back-button"
//             onClick={isAddingNotes ? handleBackToAddNotes : isAddingLabels ? handleBackToAddLabels : handleBackToFeatures}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//           >
//             Back to {isAddingNotes ? 'Add Notes' : isAddingLabels ? 'Add Labels' : 'Features'}
//           </motion.button>
//         </div>
//         <AnimatePresence>
//           {selectedRegionId && isPreviewing && (
//             <motion.div
//               className="featadd-notes-popup"
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 20 }}
//               transition={{ duration: 0.3 }}
//             >
//               <h3>
//                 <span
//                   className="featadd-color-indicator"
//                   style={{ backgroundColor: '#e982c8' }}
//                 ></span>
//                 Segment {regions.findIndex((r) => r.region_id === selectedRegionId) + 1}
//               </h3>
//               <div className="featadd-notes-content">
//                 <p><strong>Notes:</strong> {notes[selectedRegionId] || 'No notes added'}</p>
//                 <p><strong>Label:</strong> {labels[selectedRegionId] || 'No label added'}</p>
//                 {clickCoordinates[selectedRegionId] && (
//                   <p><strong>Annotation:</strong> Clicked at ({clickCoordinates[selectedRegionId].x.toFixed(0)}, {clickCoordinates[selectedRegionId].y.toFixed(0)})</p>
//                 )}
//               </div>
//               <motion.button
//                 className="featadd-notes-close-button"
//                 onClick={() => setSelectedRegionId(null)}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 Close
//               </motion.button>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     );
//   };

//   const renderMainInterface = () => (
//     <motion.div
//       className="featadd-container"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//     >
//       <div className="featadd-header">
//         <h2>Add Features to Segments</h2>
//         <p>
//           {isAddingNotes
//             ? 'Click any segment to add or edit notes.'
//             : isPreviewing
//             ? 'Preview your segments and features. Click to view.'
//             : 'Select a segment or choose a feature to add.'}
//         </p>
//       </div>
//       <div className="featadd-content">
//         <div className="featadd-image-container">
//           <img
//             src={image.url}
//             alt="Segmented Image"
//             className="featadd-base-image"
//             onLoad={() => {
//               if (imageRef.current) {
//                 const { width, height } = imageRef.current;
//                 imageRef.current.parentElement.style.width = `${width}px`;
//                 imageRef.current.parentElement.style.height = `${height}px`;
//               }
//             }}
//             ref={imageRef}
//           />
//           <div className="featadd-regions-overlay">
//             {regions.map((region) => (
//               <div
//                 key={region.region_id}
//                 className={`featadd-region ${
//                   selectedRegionId === region.region_id ? 'featadd-selected featadd-active' : ''
//                 } ${isAddingNotes ? 'featadd-adding featadd-active' : ''}`}
//                 onClick={(e) => handleRegionClick(region.region_id, e)}
//               >
//                 <img
//                   src={region.mask_url}
//                   alt={`Region ${region.region_id}`}
//                   className="featadd-mask"
//                   style={{ opacity: 0.5 }}
//                   onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
//                 />
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="featadd-sidebar">
//           <div className="featadd-panel">
//             <h3>
//               <span
//                 className="featadd-color-indicator"
//                 style={{ backgroundColor: '#e982c8' }}
//               ></span>
//               {selectedRegionId
//                 ? `Segment ${regions.findIndex((r) => r.region_id === selectedRegionId) + 1}`
//                 : 'Features'}
//             </h3>
//             <div className="featadd-actions">
//               <motion.button
//                 className="featadd-action-button"
//                 onClick={handleAddNotes}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <MdNoteAdd size={20} /> Add Notes
//               </motion.button>
//               <motion.button
//                 className="featadd-action-button"
//                 onClick={handleAddLabels}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <MdLabel size={20} /> Add Labels
//               </motion.button>
//               <motion.button
//                 className="featadd-action-button"
//                 onClick={handleAddOutline}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <MdBorderOuter size={20} /> Add Outline
//               </motion.button>
//               <motion.button
//                 className="featadd-action-button"
//                 onClick={handleAnimate}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <MdAnimation size={20} /> Animate
//               </motion.button>
//               <motion.button
//                 className="featadd-action-button"
//                 onClick={handleRecordNotes}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <MdMic size={20} /> Record Notes
//               </motion.button>
//             </div>
//           </div>
//           <div className="featadd-footer">
//             <motion.button
//               className="featadd-back-button"
//               onClick={onBack}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//             >
//               Back
//             </motion.button>
//             {isAddingNotes && (
//               <motion.button
//                 className="featadd-done-notes-button"
//                 onClick={handleDoneAddingNotes}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <MdDone size={20} /> Done Adding Notes
//               </motion.button>
//             )}
//             <motion.button
//               className="featadd-save-button"
//               onClick={handleSave}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//             >
//               Save
//             </motion.button>
//           </div>
//         </div>
//       </div>
//       {showAddNotes && (
//         <AddNotes
//           regionId={selectedRegionId}
//           lessonId={lessonId}
//           teacherEmail={teacherEmail}
//           regionIndex={regions.findIndex((r) => r.region_id === selectedRegionId)}
//           maskUrl={regions.find((r) => r.region_id === selectedRegionId).mask_url}
//           cutoutUrl={regions.find((r) => r.region_id === selectedRegionId).cutout_url}
//           position={regions.find((r) => r.region_id === selectedRegionId).position}
//           onSave={handleSaveNote}
//           onCancel={handleCancelAddNotes}
//           initialNote={notes[selectedRegionId] || ''}
//         />
//       )}
//     </motion.div>
//   );

//   return (
//     <AnimatePresence>
//       {isAddingLabels ? (
//         <motion.div
//           key="add-label"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <AddLabel
//             image={image}
// // Zip to file FeatureAddition.js
//             lessonId={lessonId}
//             regions={regions}
//             teacherEmail={teacherEmail}
//             onSave={handleSaveLabel}
//             onDone={handleDoneAddingLabels}
//             onBack={handleBackToFeatures}
//             existingLabels={labels}
//             existingCoordinates={clickCoordinates}
//           />
//         </motion.div>
//       ) : (
//         <motion.div
//           key="main-interface"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           {isPreviewing ? renderPreview() : renderMainInterface()}
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// };

// export default FeatureAddition;
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdNoteAdd, MdLabel, MdBorderOuter, MdAnimation, MdMic, MdDone } from 'react-icons/md';
import AddNotes from './AddNotes';
import AddLabel from './AddLabel';
import './FeatureAdditionEnhanced.css';

const FeatureAddition = ({ image, lessonId, regions, teacherEmail, onBack, onComplete }) => {
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [notes, setNotes] = useState({});
  const [labels, setLabels] = useState({});
  const [clickCoordinates, setClickCoordinates] = useState({});
  const [isAddingNotes, setIsAddingNotes] = useState(false);
  const [isAddingLabels, setIsAddingLabels] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const imageRef = useRef(null);

  const handleRegionClick = (regionId, e) => {
    if (!isAddingNotes && !isAddingLabels) {
      setSelectedRegionId(regionId === selectedRegionId ? null : regionId);
    } else if (isPreviewing) {
      setSelectedRegionId(regionId);
    }
  };

  const handleAddNotes = () => {
    setIsAddingNotes(true);
    setIsAddingLabels(false);
    setIsPreviewing(false);
    setSelectedRegionId(null);
  };

  const handleAddLabels = () => {
    setIsAddingLabels(true);
    setIsAddingNotes(false);
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

  const handleBackToFeatures = () => {
    setIsPreviewing(false);
    setIsAddingNotes(false);
    setIsAddingLabels(false);
    setSelectedRegionId(null);
  };

  const handleAddOutline = () => {
    console.log(`Add Outline for region ${selectedRegionId}`);
  };

  const handleAnimate = () => {
    console.log(`Animate region ${selectedRegionId}`);
  };

  const handleRecordNotes = () => {
    console.log(`Record Notes for region ${selectedRegionId}`);
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

  const renderPreview = () => {
    return (
      <div className="featadd-preview-container">
        <div className="featadd-preview-image-container">
          <img
            src={image.url}
            alt="Segmented Image"
            className="featadd-preview-base-image"
            onLoad={() => {
              if (imageRef.current) {
                const { width, height } = imageRef.current;
                imageRef.current.parentElement.style.width = `${width}px`;
                imageRef.current.parentElement.style.height = `${height}px`;
              }
            }}
            ref={imageRef}
          />
          <div className="featadd-preview-regions-overlay">
            {regions.map((region) => (
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
                  className="featadd-preview-mask"
                  style={{ opacity: 0.5 }}
                  onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="featadd-preview-footer">
          <motion.button
            className="featadd-preview-back-button"
            onClick={isAddingNotes ? handleBackToAddNotes : isAddingLabels ? handleBackToAddLabels : handleBackToFeatures}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Back to {isAddingNotes ? 'Add Notes' : isAddingLabels ? 'Add Labels' : 'Features'}
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
            : isPreviewing
            ? 'Preview your segments and features. Click to view.'
            : 'Select a segment or choose a feature to add.'}
        </p>
      </div>
      <div className="featadd-content">
        <div className="featadd-image-container">
          <img
            src={image.url}
            alt="Segmented Image"
            className="featadd-base-image"
            onLoad={() => {
              if (imageRef.current) {
                const { width, height } = imageRef.current;
                imageRef.current.parentElement.style.width = `${width}px`;
                imageRef.current.parentElement.style.height = `${height}px`;
              }
            }}
            ref={imageRef}
          />
          <div className="featadd-regions-overlay">
            {regions.map((region) => (
              <div
                key={region.region_id}
                className={`featadd-region ${
                  selectedRegionId === region.region_id ? 'featadd-selected featadd-active' : ''
                } ${isAddingNotes ? 'featadd-adding featadd-active' : ''}`}
                onClick={(e) => handleRegionClick(region.region_id, e)}
              >
                <img
                  src={region.mask_url}
                  alt={`Region ${region.region_id}`}
                  className="featadd-mask"
                  style={{ opacity: 0.5 }}
                  onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
                />
              </div>
            ))}
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
                onClick={handleAddOutline}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MdBorderOuter size={20} /> Add Outline
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
            {isAddingNotes && (
              <motion.button
                className="featadd-done-notes-button"
                onClick={handleDoneAddingNotes}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MdDone size={20} /> Done Adding Notes
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