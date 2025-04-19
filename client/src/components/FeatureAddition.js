// import React, { useState, useRef, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import axios from 'axios';
// import { MdAddCircle, MdCheckCircle, MdEdit, MdColorLens } from 'react-icons/md';
// import './FeatureAddition.css';

// const FeatureAddition = ({ image, lessonId, regions, teacherEmail, onBack, onComplete }) => {
//   const [selectedRegion, setSelectedRegion] = useState(null);
//   const [isAddingFeatures, setIsAddingFeatures] = useState(false);
//   const [regionColors, setRegionColors] = useState({});
//   const [features, setFeatures] = useState({});
//   const [currentFeature, setCurrentFeature] = useState(null);
//   const imageRef = useRef(null);

//   // Color palette for segments
//   const colorPalette = [
//     'rgba(255, 0, 0, 0.5)',    // Red
//     'rgba(0, 255, 0, 0.5)',    // Green
//     'rgba(0, 0, 255, 0.5)',    // Blue
//     'rgba(255, 255, 0, 0.5)',  // Yellow
//     'rgba(255, 0, 255, 0.5)',  // Magenta
//     'rgba(0, 255, 255, 0.5)',  // Cyan
//     'rgba(255, 165, 0, 0.5)',  // Orange
//     'rgba(128, 0, 128, 0.5)'   // Purple
//   ];

//   // Initialize random colors for each region
//   useEffect(() => {
//     const colors = {};
//     regions.forEach((region, index) => {
//       colors[region.region_id] = colorPalette[index % colorPalette.length];
//     });
//     setRegionColors(colors);
//   }, [regions]);

//   const handleStartAddingFeatures = () => {
//     setIsAddingFeatures(true);
//   };

//   const handleRegionClick = (region) => {
//     if (!isAddingFeatures) return;
//     setSelectedRegion(region);
//   };

//   const handleFeatureChange = (e) => {
//     if (!currentFeature) return;
//     setCurrentFeature({
//       ...currentFeature,
//       name: e.target.value
//     });
//   };

//   const handleFeatureSubmit = () => {
//     if (!currentFeature || !currentFeature.name.trim() || !selectedRegion) return;
    
//     // Update features state
//     setFeatures({
//       ...features,
//       [selectedRegion.region_id]: [
//         ...(features[selectedRegion.region_id] || []),
//         currentFeature
//       ]
//     });
    
//     // Reset current feature
//     setCurrentFeature(null);
//   };

//   const handleAddFeature = () => {
//     if (!selectedRegion) return;
//     setCurrentFeature({
//       id: `feature_${Date.now()}`,
//       name: '',
//       regionId: selectedRegion.region_id
//     });
//   };

//   const handleSaveAllFeatures = async () => {
//     try {
//       const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
//       await axios.post(`${API_URL}/save_features`, {
//         lesson_id: lessonId,
//         teacher_email: teacherEmail,
//         features: Object.entries(features).map(([regionId, regionFeatures]) => ({
//           region_id: regionId,
//           features: regionFeatures.map(f => f.name)
//         }))
//       });
      
//       // Call onComplete to move to the next stage
//       onComplete({
//         lessonId,
//         regions,
//         features
//       });
//     } catch (error) {
//       console.error('Error saving features:', error);
//     }
//   };

//   console.log("FeatureAddition rendered with regions:", regions);

//   return (
//     <motion.div
//       className="feature-addition-container"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//     >
//       <div className="feature-addition-header">
//         <h2>Review Segments and Add Features</h2>
//         <p>Click on segments to add detailed features or properties</p>
//       </div>

//       <div className="feature-addition-content">
//         <div className="feature-addition-image-container">
//           <img
//             ref={imageRef}
//             src={image.url}
//             alt="Segmented Image"
//             className="feature-addition-base-image"
//           />
          
//           {regions.map((region) => (
//             <div 
//               key={region.region_id}
//               className={`feature-addition-region ${selectedRegion?.region_id === region.region_id ? 'selected' : ''}`}
//               onClick={() => handleRegionClick(region)}
//               style={{ cursor: isAddingFeatures ? 'pointer' : 'default' }}
//             >
//               <img
//                 src={region.mask_url}
//                 alt={`Region ${region.region_id}`}
//                 className="feature-addition-mask"
//                 style={{ 
//                   backgroundColor: regionColors[region.region_id] || 'rgba(0, 0, 0, 0.3)'
//                 }}
//               />
              
//               {/* Feature indicators */}
//               {features[region.region_id]?.length > 0 && (
//                 <div className="feature-addition-indicators">
//                   <span className="feature-addition-count">
//                     {features[region.region_id].length}
//                   </span>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>

//         <div className="feature-addition-sidebar">
//           {!isAddingFeatures ? (
//             <div className="feature-addition-start">
//               <p>The image has been segmented into {regions.length} parts.</p>
//               <p>Each segment is highlighted with a different color.</p>
//               <motion.button
//                 className="feature-addition-start-button"
//                 onClick={handleStartAddingFeatures}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <MdEdit size={20} /> Start Adding Features
//               </motion.button>
//             </div>
//           ) : selectedRegion ? (
//             <div className="feature-addition-panel">
//               <h3>
//                 <div 
//                   className="feature-addition-color-indicator" 
//                   style={{ backgroundColor: regionColors[selectedRegion.region_id] }}
//                 ></div>
//                 Segment {regions.indexOf(selectedRegion) + 1}
//               </h3>
              
//               <div className="feature-addition-features-list">
//                 {features[selectedRegion.region_id]?.map((feature) => (
//                   <div key={feature.id} className="feature-addition-feature-item">
//                     <MdColorLens size={16} />
//                     <span>{feature.name}</span>
//                   </div>
//                 ))}
//               </div>
              
//               {currentFeature ? (
//                 <div className="feature-addition-input-group">
//                   <input
//                     type="text"
//                     value={currentFeature.name}
//                     onChange={handleFeatureChange}
//                     placeholder="Enter feature name..."
//                     className="feature-addition-input"
//                     autoFocus
//                   />
//                   <div className="feature-addition-buttons">
//                     <motion.button
//                       className="feature-addition-submit-button"
//                       onClick={handleFeatureSubmit}
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                     >
//                       <MdCheckCircle size={16} /> Add
//                     </motion.button>
//                     <motion.button
//                       className="feature-addition-cancel-button"
//                       onClick={() => setCurrentFeature(null)}
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                     >
//                       Cancel
//                     </motion.button>
//                   </div>
//                 </div>
//               ) : (
//                 <motion.button
//                   className="feature-addition-add-button"
//                   onClick={handleAddFeature}
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                 >
//                   <MdAddCircle size={20} /> Add Feature
//                 </motion.button>
//               )}
//             </div>
//           ) : (
//             <div className="feature-addition-empty-state">
//               <p>Select a segment to add features</p>
//             </div>
//           )}
          
//           <div className="feature-addition-actions">
//             <motion.button
//               className="feature-addition-back-button"
//               onClick={onBack}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               Back
//             </motion.button>
            
//             {isAddingFeatures && Object.keys(features).length > 0 && (
//               <motion.button
//                 className="feature-addition-save-button"
//                 onClick={handleSaveAllFeatures}
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 <MdCheckCircle size={20} /> Save All Features
//               </motion.button>
//             )}
//           </div>
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// export default FeatureAddition;
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { MdNoteAdd, MdLabel, MdBorderOuter, MdAnimation, MdMic } from 'react-icons/md';
import './FeatureAdditionEnhanced.css';

const FeatureAddition = ({ image, lessonId, regions, teacherEmail, onBack, onComplete }) => {
  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const imageRef = useRef(null);

  const handleRegionClick = (regionId) => {
    setSelectedRegionId(regionId === selectedRegionId ? null : regionId);
  };

  // Placeholder handlers for buttons
  const handleAddNotes = () => {
    console.log(`Add Notes for region ${selectedRegionId}`);
  };

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
      regions,
      features: {} // Placeholder
    });
  };

  return (
    <div className="featadd-container">
      <div className="featadd-header">
        <h2>Add Features to Segments</h2>
        <p>Click a segment to add features or properties.</p>
      </div>
      <div className="featadd-content">
        <div className="featadd-image-container">
          <img
            ref={imageRef}
            src={image.url}
            alt="Segmented Image"
            className="featadd-base-image"
          />
          <div className="featadd-regions-overlay">
            {regions.map((region) => (
              <div
                key={region.region_id}
                className={`featadd-region ${selectedRegionId === region.region_id ? 'featadd-selected' : ''}`}
                onClick={() => handleRegionClick(region.region_id)}
              >
                <img
                  src={region.mask_url}
                  alt={`Region ${region.region_id}`}
                  className="featadd-mask"
                  style={{
                    width: imageRef.current?.width,
                    height: imageRef.current?.height, // Fixed typo
                    opacity: 0.5
                  }}
                  onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="featadd-sidebar">
          {selectedRegionId ? (
            <div className="featadd-panel">
              <h3>
                <span
                  className="featadd-color-indicator"
                  style={{ backgroundColor: '#e982c8' }}
                ></span>
                Segment {regions.findIndex(r => r.region_id === selectedRegionId) + 1}
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
          ) : (
            <div className="featadd-empty-state">
              <p>Select a segment to add features</p>
            </div>
          )}
          <div className="featadd-footer">
            <motion.button
              className="featadd-back-button"
              onClick={onBack}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Back
            </motion.button>
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
    </div>
  );
};

export default FeatureAddition;