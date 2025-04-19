// // import React, { useState, useRef } from 'react';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { MdNoteAdd, MdLabel, MdBorderOuter, MdAnimation, MdMic, MdDone, MdEdit, MdArrowBack } from 'react-icons/md';
// // import AddNotes from './AddNotes';
// // import './FeatureAdditionEnhanced.css';

// // const FeatureAddition = ({ image, lessonId, regions, teacherEmail, onBack, onComplete }) => {
// //   const [selectedRegionId, setSelectedRegionId] = useState(null);
// //   const [notes, setNotes] = useState({});
// //   const [isAddingNotes, setIsAddingNotes] = useState(false);
// //   const [showAddNotes, setShowAddNotes] = useState(false);
// //   const [isPreviewing, setIsPreviewing] = useState(false);
// //   const imageRef = useRef(null);

// //   const handleRegionClick = (regionId) => {
// //     if (isAddingNotes) {
// //       setSelectedRegionId(regionId);
// //       setShowAddNotes(true);
// //     } else if (isPreviewing) {
// //       setSelectedRegionId(regionId);
// //     } else {
// //       return;
// //     }
// //   };

// //   const handleAddNotes = () => {
// //     setIsAddingNotes(true);
// //     setIsPreviewing(false);
// //     setSelectedRegionId(null);
// //   };

// //   const handleSaveNote = (regionId, note) => {
// //     setNotes((prev) => ({ ...prev, [regionId]: note }));
// //     setShowAddNotes(false);
// //   };

// //   const handleCancelAddNotes = () => {
// //     setShowAddNotes(false);
// //   };

// //   const handleDoneAddingNotes = () => {
// //     setIsAddingNotes(false);
// //     setIsPreviewing(true);
// //     setSelectedRegionId(null);
// //   };

// //   const handleBackToFeatures = () => {
// //     setIsPreviewing(false);
// //     setSelectedRegionId(null);
// //   };

// //   const handleAddLabels = () => {
// //     console.log(`Add Labels for region ${selectedRegionId}`);
// //   };

// //   const handleAddOutline = () => {
// //     console.log(`Add Outline for region ${selectedRegionId}`);
// //   };

// //   const handleAnimate = () => {
// //     console.log(`Animate region ${selectedRegionId}`);
// //   };

// //   const handleRecordNotes = () => {
// //     console.log(`Record Notes for region ${selectedRegionId}`);
// //   };

// //   const handleSave = () => {
// //     onComplete({
// //       lessonId,
// //       regions: regions.map((region, index) => ({
// //         ...region,
// //         segmentIndex: index,
// //         notes: notes[region.region_id] || '',
// //       })),
// //       features: { notes },
// //     });
// //   };

// //   const renderPreview = () => {
// //     return (
// //       <div className="featadd-preview-container">
// //         <div className="featadd-preview-image-container">
// //           <img
// //             src={image.url}
// //             alt="Segmented Image"
// //             className="featadd-preview-base-image"
// //             onLoad={() => {
// //               if (imageRef.current) {
// //                 const { width, height } = imageRef.current;
// //                 imageRef.current.parentElement.style.width = `${width}px`;
// //                 imageRef.current.parentElement.style.height = `${height}px`;
// //               }
// //             }}
// //             ref={imageRef}
// //           />
// //           <div className="featadd-preview-regions-overlay">
// //             {regions.map((region) => (
// //               <div
// //                 key={region.region_id}
// //                 className={`featadd-preview-region ${selectedRegionId === region.region_id ? 'featadd-preview-selected' : ''} ${notes[region.region_id] ? 'featadd-has-notes' : ''}`}
// //                 onClick={() => handleRegionClick(region.region_id)}
// //               >
// //                 <img
// //                   src={region.mask_url}
// //                   alt={`Region ${region.region_id}`}
// //                   className="featadd-preview-mask"
// //                   style={{ opacity: 0.5 }}
// //                   onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
// //                 />
// //                 {notes[region.region_id] && (
// //                   <div className="featadd-notes-indicator">
// //                     <MdNoteAdd size={20} />
// //                   </div>
// //                 )}
// //               </div>
// //             ))}
// //           </div>
// //         </div>
        
// //         <div className="featadd-preview-controls">
// //           <motion.button
// //             className="featadd-back-to-features-button"
// //             onClick={handleBackToFeatures}
// //             whileHover={{ scale: 1.1 }}
// //             whileTap={{ scale: 0.9 }}
// //           >
// //             <MdArrowBack size={20} /> Back to Features
// //           </motion.button>
          
// //           <motion.button
// //             className="featadd-save-button"
// //             onClick={handleSave}
// //             whileHover={{ scale: 1.1 }}
// //             whileTap={{ scale: 0.9 }}
// //           >
// //             Save All
// //           </motion.button>
// //         </div>
        
// //         <AnimatePresence>
// //           {selectedRegionId && (
// //             <motion.div
// //               className="featadd-notes-popup"
// //               initial={{ opacity: 0, y: 20 }}
// //               animate={{ opacity: 1, y: 0 }}
// //               exit={{ opacity: 0, y: 20 }}
// //               transition={{ duration: 0.3 }}
// //             >
// //               <h3>
// //                 <span
// //                   className="featadd-color-indicator"
// //                   style={{ backgroundColor: '#e982c8' }}
// //                 ></span>
// //                 Notes for Segment {regions.findIndex((r) => r.region_id === selectedRegionId) + 1}
// //               </h3>
// //               <div className="featadd-notes-content">
// //                 {notes[selectedRegionId] || 'No notes added for this segment'}
// //               </div>
// //               <div className="featadd-notes-popup-buttons">
// //                 {notes[selectedRegionId] && (
// //                   <motion.button
// //                     className="featadd-edit-note-button"
// //                     onClick={() => setShowAddNotes(true)}
// //                     whileHover={{ scale: 1.1 }}
// //                     whileTap={{ scale: 0.9 }}
// //                   >
// //                     <MdEdit size={16} /> Edit Note
// //                   </motion.button>
// //                 )}
// //                 <motion.button
// //                   className="featadd-notes-close-button"
// //                   onClick={() => setSelectedRegionId(null)}
// //                   whileHover={{ scale: 1.1 }}
// //                   whileTap={{ scale: 0.9 }}
// //                 >
// //                   Close
// //                 </motion.button>
// //               </div>
// //             </motion.div>
// //           )}
// //         </AnimatePresence>
// //       </div>
// //     );
// //   };

// //   return (
// //     <motion.div
// //       className="featadd-container"
// //       initial={{ opacity: 0 }}
// //       animate={{ opacity: 1 }}
// //       transition={{ duration: 0.5 }}
// //     >
// //       <div className="featadd-header">
// //         <h2>Add Features to Segments</h2>
// //         <p>
// //           {isAddingNotes
// //             ? 'Click a segment to add or edit notes.'
// //             : isPreviewing
// //             ? 'Preview your segments and notes. Click to view.'
// //             : 'Select a segment to add features.'}
// //         </p>
// //       </div>
// //       <div className="featadd-content">
// //         {isPreviewing ? (
// //           renderPreview()
// //         ) : (
// //           <>
// //             <div className="featadd-image-container">
// //               <img
// //                 src={image.url}
// //                 alt="Segmented Image"
// //                 className="featadd-base-image"
// //                 onLoad={() => {
// //                   if (imageRef.current) {
// //                     const { width, height } = imageRef.current;
// //                     imageRef.current.parentElement.style.width = `${width}px`;
// //                     imageRef.current.parentElement.style.height = `${height}px`;
// //                   }
// //                 }}
// //                 ref={imageRef}
// //               />
// //               <div className="featadd-regions-overlay">
// //                 {regions.map((region) => (
// //                   <div
// //                     key={region.region_id}
// //                     className={`featadd-region 
// //                       ${selectedRegionId === region.region_id ? 'featadd-selected' : ''} 
// //                       ${isAddingNotes ? 'featadd-adding' : ''} 
// //                       ${notes[region.region_id] ? 'featadd-has-notes' : ''}`}
// //                     onClick={() => handleRegionClick(region.region_id)}
// //                     style={{ 
// //                       pointerEvents: isAddingNotes ? 'auto' : 'none',
// //                       cursor: isAddingNotes ? 'pointer' : 'default' 
// //                     }}
// //                   >
// //                     <img
// //                       src={region.mask_url}
// //                       alt={`Region ${region.region_id}`}
// //                       className="featadd-mask"
// //                       style={{ opacity: 0.5 }}
// //                       onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
// //                     />
// //                     {notes[region.region_id] && isAddingNotes && (
// //                       <div className="featadd-notes-indicator">
// //                         <MdNoteAdd size={20} />
// //                       </div>
// //                     )}
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //             <div className="featadd-sidebar">
// //               {selectedRegionId && !isAddingNotes ? (
// //                 <div className="featadd-panel">
// //                   <h3>
// //                     <span
// //                       className="featadd-color-indicator"
// //                       style={{ backgroundColor: '#e982c8' }}
// //                     ></span>
// //                     Segment {regions.findIndex((r) => r.region_id === selectedRegionId) + 1}
// //                   </h3>
// //                   <div className="featadd-actions">
// //                     <motion.button
// //                       className="featadd-action-button"
// //                       onClick={handleAddNotes}
// //                       whileHover={{ scale: 1.1 }}
// //                       whileTap={{ scale: 0.9 }}
// //                     >
// //                       <MdNoteAdd size={20} /> Add Notes
// //                     </motion.button>
// //                     <motion.button
// //                       className="featadd-action-button"
// //                       onClick={handleAddLabels}
// //                       whileHover={{ scale: 1.1 }}
// //                       whileTap={{ scale: 0.9 }}
// //                     >
// //                       <MdLabel size={20} /> Add Labels
// //                     </motion.button>
// //                     <motion.button
// //                       className="featadd-action-button"
// //                       onClick={handleAddOutline}
// //                       whileHover={{ scale: 1.1 }}
// //                       whileTap={{ scale: 0.9 }}
// //                     >
// //                       <MdBorderOuter size={20} /> Add Outline
// //                     </motion.button>
// //                     <motion.button
// //                       className="featadd-action-button"
// //                       onClick={handleAnimate}
// //                       whileHover={{ scale: 1.1 }}
// //                       whileTap={{ scale: 0.9 }}
// //                     >
// //                       <MdAnimation size={20} /> Animate
// //                     </motion.button>
// //                     <motion.button
// //                       className="featadd-action-button"
// //                       onClick={handleRecordNotes}
// //                       whileHover={{ scale: 1.1 }}
// //                       whileTap={{ scale: 0.9 }}
// //                     >
// //                       <MdMic size={20} /> Record Notes
// //                     </motion.button>
// //                   </div>
// //                 </div>
// //               ) : isAddingNotes ? (
// //                 <div className="featadd-panel">
// //                   <h3>Adding Notes</h3>
// //                   <p className="featadd-instruction">
// //                     Click on any segment to add or edit notes.
// //                     {Object.keys(notes).length > 0 && ` (${Object.keys(notes).length} segments have notes)`}
// //                   </p>
// //                   <div className="featadd-notes-status">
// //                     {regions.map((region, index) => (
// //                       <div 
// //                         key={region.region_id} 
// //                         className={`featadd-segment-status ${notes[region.region_id] ? 'has-note' : ''}`}
// //                       >
// //                         <span>Segment {index + 1}</span>
// //                         {notes[region.region_id] ? (
// //                           <MdDone size={16} className="featadd-note-done" />
// //                         ) : (
// //                           <span className="featadd-note-missing">No note</span>
// //                         )}
// //                       </div>
// //                     ))}
// //                   </div>
// //                 </div>
// //               ) : (
// //                 <div className="featadd-empty-state">
// //                   <p>Select "Add Notes" below to begin adding notes to segments</p>
// //                 </div>
// //               )}
// //               <div className="featadd-footer">
// //                 <motion.button
// //                   className="featadd-back-button"
// //                   onClick={onBack}
// //                   whileHover={{ scale: 1.1 }}
// //                   whileTap={{ scale: 0.9 }}
// //                 >
// //                   Back
// //                 </motion.button>
// //                 {!isAddingNotes && !selectedRegionId && (
// //                   <motion.button
// //                     className="featadd-action-button"
// //                     onClick={handleAddNotes}
// //                     whileHover={{ scale: 1.1 }}
// //                     whileTap={{ scale: 0.9 }}
// //                   >
// //                     <MdNoteAdd size={20} /> Add Notes
// //                   </motion.button>
// //                 )}
// //                 {isAddingNotes && (
// //                   <motion.button
// //                     className="featadd-done-notes-button"
// //                     onClick={handleDoneAddingNotes}
// //                     whileHover={{ scale: 1.1 }}
// //                     whileTap={{ scale: 0.9 }}
// //                   >
// //                     <MdDone size={20} /> Done Adding Notes
// //                   </motion.button>
// //                 )}
// //                 {!isAddingNotes && (
// //                   <motion.button
// //                     className="featadd-save-button"
// //                     onClick={handleSave}
// //                     whileHover={{ scale: 1.1 }}
// //                     whileTap={{ scale: 0.9 }}
// //                   >
// //                     Save
// //                   </motion.button>
// //                 )}
// //               </div>
// //             </div>
// //           </>
// //         )}
// //       </div>
// //       {showAddNotes && (
// //         <AddNotes
// //           regionId={selectedRegionId}
// //           lessonId={lessonId}
// //           teacherEmail={teacherEmail}
// //           regionIndex={regions.findIndex((r) => r.region_id === selectedRegionId)}
// //           maskUrl={regions.find((r) => r.region_id === selectedRegionId).mask_url}
// //           cutoutUrl={regions.find((r) => r.region_id === selectedRegionId).cutout_url}
// //           position={regions.find((r) => r.region_id === selectedRegionId).position}
// //           onSave={handleSaveNote}
// //           onCancel={handleCancelAddNotes}
// //           initialNote={notes[selectedRegionId] || ''}
// //         />
// //       )}
// //     </motion.div>
// //   );
// // };

// // export default FeatureAddition;

// import React, { useState, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { MdNoteAdd, MdLabel, MdBorderOuter, MdAnimation, MdMic, MdDone } from 'react-icons/md';
// import AddNotes from './AddNotes';
// import './FeatureAdditionEnhanced.css';

// const FeatureAddition = ({ image, lessonId, regions, teacherEmail, onBack, onComplete }) => {
//   const [selectedRegionId, setSelectedRegionId] = useState(null);
//   const [notes, setNotes] = useState({});
//   const [isAddingNotes, setIsAddingNotes] = useState(false);
//   const [showAddNotes, setShowAddNotes] = useState(false);
//   const [isPreviewing, setIsPreviewing] = useState(true); // Start in preview mode
//   const imageRef = useRef(null);

//   const handleRegionClick = (regionId) => {
//     if (isAddingNotes) {
//       setSelectedRegionId(regionId);
//       setShowAddNotes(true);
//     } else if (!isPreviewing) {
//       setSelectedRegionId(regionId === selectedRegionId ? null : regionId);
//     } else if (isPreviewing) {
//       setSelectedRegionId(regionId); // For viewing notes in preview
//     }
//   };

//   const handleAddNotes = () => {
//     setIsAddingNotes(true);
//     setIsPreviewing(false);
//     setSelectedRegionId(null);
//   };

//   const handleSaveNote = (regionId, note) => {
//     setNotes((prev) => ({ ...prev, [regionId]: note }));
//     setShowAddNotes(false);
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

//   const handleBackFromPreview = () => {
//     setIsPreviewing(false);
//     setSelectedRegionId(null);
//   };

//   // Placeholder handlers for other buttons
//   const handleAddLabels = () => {
//     console.log(`Add Labels for region ${selectedRegionId}`);
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
//       })),
//       features: { notes },
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
//                 } ${isAddingNotes ? 'featadd-preview-adding' : ''}`}
//                 onClick={() => handleRegionClick(region.region_id)}
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
//             onClick={handleBackFromPreview}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//           >
//             Back to Features
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
//                 Notes for Segment {regions.findIndex((r) => r.region_id === selectedRegionId) + 1}
//               </h3>
//               <div className="featadd-notes-content">
//                 {notes[selectedRegionId] || 'No notes added for this segment'}
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

//   return (
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
//             ? 'Preview your segments and notes. Click to view.'
//             : 'Select a segment to add features or start adding notes.'}
//         </p>
//       </div>
//       <div className="featadd-content">
//         {isPreviewing || isAddingNotes ? (
//           renderPreview()
//         ) : (
//           <>
//             <div className="featadd-image-container">
//               <img
//                 src={image.url}
//                 alt="Segmented Image"
//                 className="featadd-base-image"
//                 onLoad={() => {
//                   if (imageRef.current) {
//                     const { width, height } = imageRef.current;
//                     imageRef.current.parentElement.style.width = `${width}px`;
//                     imageRef.current.parentElement.style.height = `${height}px`;
//                   }
//                 }}
//                 ref={imageRef}
//               />
//               <div className="featadd-regions-overlay">
//                 {regions.map((region) => (
//                   <div
//                     key={region.region_id}
//                     className={`featadd-region ${
//                       selectedRegionId === region.region_id ? 'featadd-selected' : ''
//                     } ${isAddingNotes ? 'featadd-adding' : ''}`}
//                     onClick={() => handleRegionClick(region.region_id)}
//                   >
//                     <img
//                       src={region.mask_url}
//                       alt={`Region ${region.region_id}`}
//                       className="featadd-mask"
//                       style={{ opacity: 0.5 }}
//                       onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
//                     />
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div className="featadd-sidebar">
//               {selectedRegionId && !isAddingNotes ? (
//                 <div className="featadd-panel">
//                   <h3>
//                     <span
//                       className="featadd-color-indicator"
//                       style={{ backgroundColor: '#e982c8' }}
//                     ></span>
//                     Segment {regions.findIndex((r) => r.region_id === selectedRegionId) + 1}
//                   </h3>
//                   <div className="featadd-actions">
//                     <motion.button
//                       className="featadd-action-button"
//                       onClick={handleAddNotes}
//                       whileHover={{ scale: 1.1 }}
//                       whileTap={{ scale: 0.9 }}
//                     >
//                       <MdNoteAdd size={20} /> Add Notes
//                     </motion.button>
//                     <motion.button
//                       className="featadd-action-button"
//                       onClick={handleAddLabels}
//                       whileHover={{ scale: 1.1 }}
//                       whileTap={{ scale: 0.9 }}
//                     >
//                       <MdLabel size={20} /> Add Labels
//                     </motion.button>
//                     <motion.button
//                       className="featadd-action-button"
//                       onClick={handleAddOutline}
//                       whileHover={{ scale: 1.1 }}
//                       whileTap={{ scale: 0.9 }}
//                     >
//                       <MdBorderOuter size={20} /> Add Outline
//                     </motion.button>
//                     <motion.button
//                       className="featadd-action-button"
//                       onClick={handleAnimate}
//                       whileHover={{ scale: 1.1 }}
//                       whileTap={{ scale: 0.9 }}
//                     >
//                       <MdAnimation size={20} /> Animate
//                     </motion.button>
//                     <motion.button
//                       className="featadd-action-button"
//                       onClick={handleRecordNotes}
//                       whileHover={{ scale: 1.1 }}
//                       whileTap={{ scale: 0.9 }}
//                     >
//                       <MdMic size={20} /> Record Notes
//                     </motion.button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="featadd-empty-state">
//                   <p>{isAddingNotes ? 'Click a segment to add notes' : 'Select a segment to add features'}</p>
//                 </div>
//               )}
//               <div className="featadd-footer">
//                 <motion.button
//                   className="featadd-back-button"
//                   onClick={onBack}
//                   whileHover={{ scale: 1.1 }}
//                   whileTap={{ scale: 0.9 }}
//                 >
//                   Back
//                 </motion.button>
//                 {isAddingNotes && (
//                   <motion.button
//                     className="featadd-done-notes-button"
//                     onClick={handleDoneAddingNotes}
//                     whileHover={{ scale: 1.1 }}
//                     whileTap={{ scale: 0.9 }}
//                   >
//                     <MdDone size={20} /> Done Adding Notes
//                   </motion.button>
//                 )}
//                 <motion.button
//                   className="featadd-save-button"
//                   onClick={handleSave}
//                   whileHover={{ scale: 1.1 }}
//                   whileTap={{ scale: 0.9 }}
//                 >
//                   Save
//                 </motion.button>
//               </div>
//             </div>
//           </>
//         )}
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
// };

// export default FeatureAddition;

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdNoteAdd, MdLabel, MdBorderOuter, MdAnimation, MdMic, MdDone } from 'react-icons/md';
import AddNotes from './AddNotes';
import './FeatureAdditionEnhanced.css';

const FeatureAddition = ({ image, lessonId, regions, teacherEmail, onBack, onComplete }) => {
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [notes, setNotes] = useState({});
  const [isAddingNotes, setIsAddingNotes] = useState(false);
  const [showAddNotes, setShowAddNotes] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const imageRef = useRef(null);

  const handleRegionClick = (regionId) => {
    if (isAddingNotes) {
      setSelectedRegionId(regionId);
      setShowAddNotes(true);
    } else if (!isPreviewing) {
      setSelectedRegionId(regionId === selectedRegionId ? null : regionId);
    } else if (isPreviewing) {
      setSelectedRegionId(regionId); // For viewing notes in preview
    }
  };

  const handleAddNotes = () => {
    setIsAddingNotes(true);
    setIsPreviewing(false);
    setSelectedRegionId(null);
  };

  const handleSaveNote = (regionId, note) => {
    setNotes((prev) => ({ ...prev, [regionId]: note }));
    setShowAddNotes(false);
    setSelectedRegionId(null);
  };

  const handleCancelAddNotes = () => {
    setShowAddNotes(false);
    setSelectedRegionId(null);
  };

  const handleDoneAddingNotes = () => {
    setIsAddingNotes(false);
    setIsPreviewing(true);
    setSelectedRegionId(null);
  };

  const handleBackToAddNotes = () => {
    setIsPreviewing(false);
    setIsAddingNotes(true);
    setSelectedRegionId(null);
  };

  // Placeholder handlers for other buttons
  const handleAddLabels = () => {
    console.log(`Add Labels for region ${selectedRegionId}`);
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
      })),
      features: { notes },
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
                } ${isAddingNotes ? 'featadd-preview-adding featadd-active' : 'featadd-active'}`}
                onClick={() => handleRegionClick(region.region_id)}
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
            onClick={handleBackToAddNotes}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Back to Add Notes
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
                Notes for Segment {regions.findIndex((r) => r.region_id === selectedRegionId) + 1}
              </h3>
              <div className="featadd-notes-content">
                {notes[selectedRegionId] || 'No notes added for this segment'}
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

  return (
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
            ? 'Preview your segments and notes. Click to view.'
            : 'Select a segment or choose a feature to add.'}
        </p>
      </div>
      <div className="featadd-content">
        {isPreviewing ? (
          renderPreview()
        ) : (
          <>
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
                    onClick={() => handleRegionClick(region.region_id)}
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
          </>
        )}
      </div>
      {showAddNotes && (
        <AddNotes
          regionId={selectedRegionId}
          lessonId={lessonId}
          teacherEmail={teacherEmail}
          regionIndex={regions.findIndex((r) => r.region_id === selectedRegionId)}
          maskUrl={regions.find((r) => r.region_id === selectedRegionId).mask_url}
          cutoutUrl={regions.find((r) => r.region_id === selectedRegionId).cutout_url}
          position={regions.find((r) => r.region_id === selectedRegionId).position}
          onSave={handleSaveNote}
          onCancel={handleCancelAddNotes}
          initialNote={notes[selectedRegionId] || ''}
        />
      )}
    </motion.div>
  );
};

export default FeatureAddition;