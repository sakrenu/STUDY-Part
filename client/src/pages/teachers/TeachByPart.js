// import React, { useState, useRef, useEffect } from 'react';
// import Cropper from 'react-cropper';
// import 'cropperjs/dist/cropper.css';
// import axios from 'axios';
// import { auth } from '../../firebase';
// import './TeachByPart.css';

// const TeachByPart = ({ teacherEmail = '' }) => {
//   const [image, setImage] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [uploadedImageUrl, setUploadedImageUrl] = useState('');
//   const [imageEmbeddingId, setImageEmbeddingId] = useState('');
//   const [segmentationMode, setSegmentationMode] = useState('boundingBox');
//   const [isSelectingRegions, setIsSelectingRegions] = useState(true);
//   const [selectedRegions, setSelectedRegions] = useState([]);
//   const [points, setPoints] = useState([]);
//   const [pointLabels, setPointLabels] = useState([]);
//   const [selectionMode, setSelectionMode] = useState('foreground');
//   const [processedOutput, setProcessedOutput] = useState(null);
//   const [currentImageUrl, setCurrentImageUrl] = useState(null);
//   const [isLabeling, setIsLabeling] = useState(false);
//   const [labels, setLabels] = useState([]);
//   const [currentLabel, setCurrentLabel] = useState(null);
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isTeachByPart, setIsTeachByPart] = useState(false);
//   const [currentPartIndex, setCurrentPartIndex] = useState(-1);
//   const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
//   const cropperRef = useRef(null);
//   const imageRef = useRef(null);
//   const canvasRef = useRef(null);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       if (!user) {
//         setError('You must be logged in as a teacher to use this page.');
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     if (isTeachByPart && currentPartIndex >= 0 && processedOutput) {
//       const parts = processedOutput.regions.map((region, index) => ({
//         ...region,
//         label: labels.find((l) => l.regionIndex === region.regionIndex) || {
//           clickX: region.position.x + region.position.width / 2,
//           clickY: region.position.y + region.position.height / 2,
//           text: `Part ${index + 1}`,
//           regionIndex: index,
//         },
//       }));
//       if (currentPartIndex < parts.length) {
//         const timer = setTimeout(() => {
//           setCurrentPartIndex((prev) => prev + 1);
//         }, 4000);
//         return () => clearTimeout(timer);
//       }
//     }
//   }, [isTeachByPart, currentPartIndex, processedOutput, labels]);

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setSelectedFile(file);
//       const previewUrl = URL.createObjectURL(file);
//       setImagePreview(previewUrl);
//       setImage(file);
//       setCurrentImageUrl(previewUrl);
//       setIsSelectingRegions(true);
//       setSelectedRegions([]);
//       setPoints([]);
//       setPointLabels([]);
//       setLabels([]);
//       setCurrentLabel(null);
//       setProcessedOutput(null);
//       setImageEmbeddingId('');
//       setError('');

//       const img = new Image();
//       img.onload = () => {
//         setImageSize({ width: img.width, height: img.height });
//       };
//       img.src = previewUrl;
//     }
//   };

//   const handleGenerateEmbeddings = async () => {
//     if (!selectedFile) {
//       setError("Please select an image first.");
//       return;
//     }

//     setError('');
//     setIsLoading(true);

//     try {
//       const uploadForm = new FormData();
//       uploadForm.append('image', selectedFile);
//       const uploadResponse = await axios.post('http://127.0.0.1:8000/upload', uploadForm, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       }).catch(err => {
//         throw new Error(`Upload failed: ${err.response?.data?.message || err.message}`);
//       });
//       const imageUrl = uploadResponse.data.image_url;
//       setUploadedImageUrl(imageUrl);

//       const embeddingResponse = await axios.post('http://127.0.0.1:8000/get_image_embedding', {
//         image_url: imageUrl,
//         teacher_id: teacherEmail,
//       }).catch(err => {
//         throw new Error(`Embedding generation failed: ${err.response?.data?.message || err.message}`);
//       });

//       setImageEmbeddingId(embeddingResponse.data.embedding_id);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSelectRegion = () => {
//     if (cropperRef.current) {
//       const cropData = cropperRef.current.cropper.getData();
//       setSelectedRegions([...selectedRegions, cropData]);
//       cropperRef.current.cropper.clear();
//     }
//   };

//   const handleDoneSelecting = async () => {
//     if (!teacherEmail) {
//       setError('Teacher email not available. Please log in.');
//       return;
//     }
//     try {
//       if (!currentImageUrl) throw new Error('No image URL available');
//       setIsLoading(true);
//       const processedResults = await Promise.all(
//         selectedRegions.map((region, index) =>
//           axios.post('http://127.0.0.1:8000/segment_label', {
//             image_url: uploadedImageUrl,
//             bounding_box: {
//               x: Math.round(region.x),
//               y: Math.round(region.y),
//               width: Math.round(region.width),
//               height: Math.round(region.height),
//               rotate: region.rotate || 0,
//             },
//             teacher_id: teacherEmail,
//             region_index: index,
//           }).catch(err => {
//             throw new Error(`Segmentation failed: ${err.response?.data?.message || err.message}`);
//           })
//         )
//       );
//       setProcessedOutput({
//         originalImage: currentImageUrl,
//         regions: processedResults.map((response, index) => ({
//           cutoutUrl: response.data.cutout_url,
//           position: response.data.position,
//           regionIndex: index,
//         })),
//       });
//       setIsSelectingRegions(false);
//       setIsLabeling(true);
//     } catch (error) {
//       setError('Failed to process regions: ' + error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCanvasClick = (e) => {
//     if (!imageEmbeddingId) {
//       setError("Please generate embeddings first before selecting points.");
//       return;
//     }

//     const rect = canvasRef.current.getBoundingClientRect();
//     const scaleX = imageSize.width / rect.width;
//     const scaleY = imageSize.height / rect.height;

//     const x = (e.clientX - rect.left) * scaleX;
//     const y = (e.clientY - rect.top) * scaleY;

//     const newPoints = [...points, { x, y }];
//     const newLabels = [...pointLabels, selectionMode === 'foreground' ? 1 : 0];

//     setPoints(newPoints);
//     setPointLabels(newLabels);

//     drawPoints();
//   };

//   const drawPoints = () => {
//     if (!canvasRef.current || !imageRef.current || !imageSize.width || !imageSize.height) return;

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     canvas.width = imageRef.current.width;
//     canvas.height = imageRef.current.height;

//     points.forEach((point, index) => {
//       const scaleX = canvas.width / imageSize.width;
//       const scaleY = canvas.height / imageSize.height;

//       ctx.beginPath();
//       ctx.arc(point.x * scaleX, point.y * scaleY, 7, 0, 2 * Math.PI);
//       ctx.fillStyle = pointLabels[index] === 1 ? 'green' : 'red';
//       ctx.fill();
//       ctx.strokeStyle = 'white';
//       ctx.lineWidth = 2;
//       ctx.stroke();
//       ctx.fillStyle = 'white';
//       ctx.font = '10px Arial';
//       ctx.fillText(index + 1, point.x * scaleX + 9, point.y * scaleY + 9);
//     });
//   };

//   useEffect(() => {
//     drawPoints();
//   }, [points, pointLabels, imageSize]);

//   const handleUndoPoint = () => {
//     if (points.length > 0) {
//       setPoints(points.slice(0, -1));
//       setPointLabels(pointLabels.slice(0, -1));
//     }
//   };

//   const handleResetPoints = () => {
//     setPoints([]);
//     setPointLabels([]);
//   };

//   const handleSegmentWithPoints = async () => {
//     if (!imageEmbeddingId || points.length === 0) {
//       setError("Please generate embeddings and select at least one point.");
//       return;
//     }

//     try {
//       setIsLoading(true);
//       setError('');

//       const pointsArray = points.map(p => ({ x: p.x, y: p.y }));
//       const segmentationResponse = await axios.post('http://127.0.0.1:8000/segment_with_points', {
//         image_embedding_id: imageEmbeddingId,
//         points: pointsArray,
//         labels: pointLabels,
//         original_size: [imageSize.width, imageSize.height],
//         teacher_id: teacherEmail,
//       }).catch(err => {
//         throw new Error(`Point segmentation failed: ${err.response?.data?.message || err.message}`);
//       });

//       setProcessedOutput({
//         originalImage: currentImageUrl,
//         regions: [{
//           cutoutUrl: segmentationResponse.data.cutout_url,
//           position: segmentationResponse.data.position,
//           regionIndex: 0,
//         }],
//       });
//       setIsSelectingRegions(false);
//       setIsLabeling(true);
//     } catch (err) {
//       setError('Segmentation failed: ' + err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleImageClick = (e) => {
//     if (!isLabeling || !processedOutput) return;

//     const rect = imageRef.current.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;

//     const imageWidth = imageRef.current.naturalWidth;
//     const imageHeight = imageRef.current.naturalHeight;
//     const displayWidth = rect.width;
//     const displayHeight = rect.height;
//     const normalizedX = (x / displayWidth) * imageWidth;
//     const normalizedY = (y / displayHeight) * imageHeight;

//     const clickedRegion = processedOutput.regions.find((region) => {
//       const { x: regionX, y: regionY, width, height } = region.position;
//       return (
//         normalizedX >= regionX &&
//         normalizedX <= regionX + width &&
//         normalizedY >= regionY &&
//         normalizedY <= regionY + height
//       );
//     });

//     if (clickedRegion) {
//       const existingLabel = labels.find((label) => label.regionIndex === clickedRegion.regionIndex);
//       if (existingLabel) {
//         setLabels((prev) =>
//           prev.map((label) =>
//             label.regionIndex === clickedRegion.regionIndex
//               ? { ...label, clickX: x, clickY: y }
//               : label
//           )
//         );
//       } else {
//         setCurrentLabel({
//           clickX: x,
//           clickY: y,
//           regionIndex: clickedRegion.regionIndex,
//           text: '',
//         });
//       }
//     }
//   };

//   const handleLabelChange = (text) => {
//     setCurrentLabel((prev) => ({ ...prev, text }));
//   };

//   const handleLabelSubmit = () => {
//     if (currentLabel && currentLabel.text.trim()) {
//       setLabels((prev) => [...prev, currentLabel]);
//       setCurrentLabel(null);
//     }
//   };

//   const handleDoneLabeling = () => {
//     setIsLabeling(false);
//     setCurrentLabel(null);
//   };

//   const handleTeachByPart = () => {
//     setIsTeachByPart(true);
//     setCurrentPartIndex(0);
//   };

//   const renderTeachByPart = () => {
//     if (!processedOutput) return null;

//     const parts = processedOutput.regions.map((region, index) => ({
//       ...region,
//       label: labels.find((l) => l.regionIndex === region.regionIndex) || {
//         clickX: region.position.x + region.position.width / 2,
//         clickY: region.position.y + region.position.height / 2,
//         text: `Part ${index + 1}`,
//         regionIndex: index,
//       },
//     }));

//     return (
//       <div className="teach-by-part-container" style={{ display: 'flex', gap: '20px' }}>
//         <div className="original-image-teach" style={{ position: 'relative', width: '800px', height: '600px' }}>
//           <img
//             src={currentImageUrl}
//             alt="Original with empty parts"
//             style={{
//               width: '100%',
//               height: '100%',
//               objectFit: 'contain',
//               maskImage: parts.map(p => `url(${p.cutoutUrl})`).join(', '),
//               WebkitMaskImage: parts.map(p => `url(${p.cutoutUrl})`).join(', '),
//               maskSize: '100% 100%',
//               WebkitMaskSize: '100% 100%',
//               maskComposite: 'exclude',
//               WebkitMaskComposite: 'exclude',
//             }}
//           />
//           {parts.map((part, index) => (
//             <div
//               key={index}
//               style={{
//                 position: 'absolute',
//                 top: 0,
//                 left: 0,
//                 width: '100%',
//                 height: '100%',
//                 pointerEvents: 'none',
//               }}
//             >
//               {index <= currentPartIndex && (
//                 <img
//                   src={part.cutoutUrl}
//                   alt={`Part ${index}`}
//                   style={{
//                     position: 'absolute',
//                     top: 0,
//                     left: index === currentPartIndex ? 'calc(100% + 320px)' : 0,
//                     width: '100%',
//                     height: '100%',
//                     objectFit: 'contain',
//                     opacity: 0.3,
//                     transition: index === currentPartIndex ? 'left 1s ease-in-out' : 'none',
//                     animation: index === currentPartIndex ? 'slideIn 1s ease-in-out forwards' : 'none',
//                     outline: '2px solid #00ffcc',
//                     outlineOffset: '-2px',
//                   }}
//                 />
//               )}
//               {index < currentPartIndex && (
//                 <div className="label-wrapper">
//                   <svg
//                     style={{
//                       position: 'absolute',
//                       top: 0,
//                       left: 0,
//                       width: '800px',
//                       height: '600px',
//                       pointerEvents: 'none',
//                     }}
//                   >
//                     <line
//                       x1={part.label.clickX}
//                       y1={part.label.clickY}
//                       x2={part.label.clickX + 100}
//                       y2={part.label.clickY - 20}
//                       stroke="#ffffff"
//                       strokeWidth="2"
//                       style={{ animation: 'labelSlideIn 1s ease-in-out forwards 1s' }}
//                     />
//                   </svg>
//                   <div
//                     className="label-text"
//                     style={{
//                       position: 'absolute',
//                       top: part.label.clickY - 20,
//                       left: part.label.clickX + 100,
//                       backgroundColor: '#2a2a2a',
//                       color: '#ffffff',
//                       padding: '5px 10px',
//                       borderRadius: '5px',
//                       whiteSpace: 'nowrap',
//                       animation: 'labelSlideInText 1s ease-in-out forwards 1s',
//                     }}
//                   >
//                     {part.label.text}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//         <div className="parts-list" style={{ width: '300px' }}>
//           <h3>Parts</h3>
//           {parts.map((part, index) => (
//             <div
//               key={index}
//               style={{
//                 marginBottom: '10px',
//                 opacity: index > currentPartIndex ? 1 : 0,
//                 transition: 'opacity 0.5s ease',
//               }}
//             >
//               <img
//                 src={part.cutoutUrl}
//                 alt={`Part ${index}`}
//                 style={{
//                   width: '100px',
//                   height: 'auto',
//                   display: index > currentPartIndex ? 'block' : 'none',
//                 }}
//               />
//               <p
//                 style={{
//                   fontWeight: index === currentPartIndex ? 'bold' : 'normal',
//                   color: index === currentPartIndex ? '#ffffff' : '#cccccc',
//                 }}
//               >
//                 {part.label.text}
//               </p>
//             </div>
//           ))}
//           {currentPartIndex >= parts.length && (
//             <button onClick={() => setIsTeachByPart(false)} className="exit-teach-button">
//               Exit Teach-by-Part
//             </button>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const renderProcessedOutput = () => {
//     return (
//       <div className="processed-output-container">
//         <div className="original-image-container" onClick={handleImageClick}>
//           <img
//             ref={imageRef}
//             src={currentImageUrl}
//             alt="Original"
//             className="base-image"
//             style={{ width: '800px', height: '600px', objectFit: 'contain', cursor: isLabeling ? 'crosshair' : 'default' }}
//           />
//           {processedOutput.regions.map((region, index) => (
//             <div key={index} className="region-overlay">
//               <img
//                 src={region.cutoutUrl}
//                 alt={`Region ${index + 1}`}
//                 className="region-cutout"
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   width: '100%',
//                   height: '100%',
//                   objectFit: 'contain',
//                   opacity: 0.5,
//                   pointerEvents: 'none',
//                 }}
//               />
//             </div>
//           ))}
//           {labels.map((label, index) => {
//             const labelX = label.clickX + 100;
//             const labelY = label.clickY - 20;
//             return (
//               <div key={index} className="label-wrapper">
//                 <svg
//                   style={{
//                     position: 'absolute',
//                     top: 0,
//                     left: 0,
//                     width: '800px',
//                     height: '600px',
//                     pointerEvents: 'none',
//                   }}
//                 >
//                   <line
//                     x1={label.clickX}
//                     y1={label.clickY}
//                     x2={labelX}
//                     y2={labelY}
//                     stroke="#ffffff"
//                     strokeWidth="2"
//                   />
//                 </svg>
//                 <div
//                   className="label-text"
//                   style={{
//                     position: 'absolute',
//                     top: labelY,
//                     left: labelX,
//                     backgroundColor: '#2a2a2a',
//                     color: '#ffffff',
//                     padding: '5px 10px',
//                     borderRadius: '5px',
//                     whiteSpace: 'nowrap',
//                   }}
//                 >
//                   {label.text}
//                 </div>
//               </div>
//             );
//           })}
//           {currentLabel && (
//             <div
//               className="label-input-wrapper"
//               style={{
//                 position: 'absolute',
//                 top: currentLabel.clickY - 20,
//                 left: currentLabel.clickX + 100,
//               }}
//             >
//               <input
//                 type="text"
//                 value={currentLabel.text}
//                 onChange={(e) => handleLabelChange(e.target.value)}
//                 placeholder="Enter label..."
//                 className="label-input"
//                 autoFocus
//                 onKeyPress={(e) => {
//                   if (e.key === 'Enter') handleLabelSubmit();
//                 }}
//               />
//               <button onClick={handleLabelSubmit} className="submit-label-button">
//                 Add
//               </button>
//               <button onClick={() => setCurrentLabel(null)} className="close-button">
//                 Cancel
//               </button>
//             </div>
//           )}
//         </div>
//         {isLabeling && (
//           <button onClick={handleDoneLabeling} className="done-labeling-button">
//             Done Labeling
//           </button>
//         )}
//         {!isLabeling && !isTeachByPart && (
//           <button onClick={handleTeachByPart} className="teach-by-part-button">
//             Teach-by-Part
//           </button>
//         )}
//         {isTeachByPart && renderTeachByPart()}
//       </div>
//     );
//   };

//   return (
//     <div className="teach-content">
//       <header className="dashboard-header">
//         <h1 className="dashboard-title">TeachByPart Mode</h1>
//         <p className="dashboard-subtitle">Upload an image, segment regions, label them, and teach by parts.</p>
//       </header>

//       {error && <div className="error-message">{error}</div>}

//       <section className="upload-section card-neon">
//         <h2>Upload your Image</h2>
//         <div className="upload-container">
//           <label className="file-upload-label">
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handleImageUpload}
//               className="file-input"
//             />
//             <span className="upload-button">Choose Image</span>
//           </label>
//         </div>

//         {imagePreview && (
//           <div className="segmentation-mode-section">
//             <h2>Choose Segmentation Method</h2>
//             <div className="mode-buttons">
//               <button
//                 className={`mode-button ${segmentationMode === 'boundingBox' ? 'active' : ''}`}
//                 onClick={() => setSegmentationMode('boundingBox')}
//               >
//                 Bounding Box
//               </button>
//               <button
//                 className={`mode-button ${segmentationMode === 'point' ? 'active' : ''}`}
//                 onClick={() => setSegmentationMode('point')}
//               >
//                 Point-Based
//               </button>
//             </div>
//             <button
//               onClick={handleGenerateEmbeddings}
//               className={`generate-button ${isLoading ? 'disabled' : ''}`}
//               disabled={isLoading}
//             >
//               {isLoading ? 'Generating Embeddings...' : 'Generate Embeddings'}
//             </button>
//           </div>
//         )}
//       </section>

//       {imageEmbeddingId && segmentationMode === 'boundingBox' && isSelectingRegions && (
//         <section className="cropper-section">
//           <div className="cropper-container">
//             <Cropper
//               src={imagePreview}
//               style={{ height: 600, width: '100%', maxWidth: 800 }}
//               initialAspectRatio={NaN}
//               aspectRatio={NaN}
//               guides={true}
//               ref={cropperRef}
//               zoomable={false}
//               scalable={false}
//               mouseWheelZoom={false}
//               dragMode="crop"
//               cropBoxMovable={true}
//               cropBoxResizable={true}
//               toggleDragModeOnDblclick={false}
//               viewMode={1}
//               minContainerWidth={800}
//               minContainerHeight={600}
//             />
//             <div className="region-selection-controls">
//               <button onClick={handleSelectRegion} className="select-region-button">
//                 Select Region
//               </button>
//               {selectedRegions.length > 0 && (
//                 <>
//                   <button
//                     onClick={() => cropperRef.current.cropper.clear()}
//                     className="select-another-button"
//                   >
//                     Select Another Part
//                   </button>
//                   <button onClick={handleDoneSelecting} className="done-selecting-button">
//                     Done Selecting ({selectedRegions.length} regions)
//                   </button>
//                 </>
//               )}
//             </div>
//           </div>
//         </section>
//       )}

//       {imageEmbeddingId && segmentationMode === 'point' && isSelectingRegions && (
//         <section className="point-selection-section">
//           <h2>Selection Mode</h2>
//           <div className="mode-buttons">
//             <button
//               className={`mode-button ${selectionMode === 'foreground' ? 'active' : ''}`}
//               onClick={() => setSelectionMode('foreground')}
//             >
//               Foreground (Green)
//             </button>
//             <button
//               className={`mode-button ${selectionMode === 'background' ? 'active' : ''}`}
//               onClick={() => setSelectionMode('background')}
//             >
//               Background (Red)
//             </button>
//           </div>
//           <div className="image-container">
//             <div className="image-canvas-wrapper">
//               <img
//                 ref={imageRef}
//                 src={imagePreview}
//                 alt="Uploaded preview"
//                 className="segmentation-image"
//               />
//               <canvas
//                 ref={canvasRef}
//                 className="selection-canvas"
//                 onClick={handleCanvasClick}
//               />
//             </div>
//             <div className="control-buttons">
//               <button onClick={handleUndoPoint} disabled={points.length === 0}>
//                 Undo Last Point
//               </button>
//               <button onClick={handleResetPoints} disabled={points.length === 0}>
//                 Reset Selection
//               </button>
//               <button
//                 onClick={handleSegmentWithPoints}
//                 className={`segment-button ${isLoading ? 'disabled' : ''}`}
//                 disabled={isLoading || points.length === 0}
//               >
//                 {isLoading ? 'Segmenting...' : 'Generate Segment'}
//               </button>
//             </div>
//           </div>
//         </section>
//       )}

//       {(isLabeling || !isSelectingRegions) && processedOutput && renderProcessedOutput()}

//       {isLoading && <div className="loading-message">Processing...</div>}
//     </div>
//   );
// };

// export default TeachByPart;
// src/pages/teachers/TeachByParts.js
import React, { useState, useEffect } from 'react'; // Adjusted path assuming firebase.js is at src/
import UploadComponent from '../../components/UploadComponent'; // Assuming components/ is one level up
import { motion } from 'framer-motion';
import { MdUpload, MdLibraryBooks } from 'react-icons/md';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';// Assuming styles/ is one level up
import { auth } from '../../firebase';
import './TeachByPart.css';

const TeachByParts = () => {
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [currentStep, setCurrentStep] = useState('welcome'); // welcome, upload, select, annotate, preview, library
  const [uploadedImage, setUploadedImage] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTeacherEmail(user.email);
      } else {
        setCurrentStep('welcome');
        alert('Please log in as a teacher to continue.');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUploaded = ({ file, imageUrl }) => {
    setUploadedImage({ file, url: imageUrl });
    setCurrentStep('select');
  };

  const handleBack = () => {
    if (currentStep === 'upload') {
      setCurrentStep('welcome');
      setUploadedImage(null);
    }
  };

  const handleStepChange = (step) => {
    if (step === 'library' || (step === 'upload' && !teacherEmail)) {
      setCurrentStep(step);
    } else if (teacherEmail) {
      setCurrentStep(step);
    }
  };

  const sidebarItems = [
    {
      name: 'Upload',
      icon: <MdUpload size={24} />,
      step: 'upload',
      description: 'Start by uploading an image for your lesson',
    },
    {
      name: 'Library',
      icon: <MdLibraryBooks size={24} />,
      step: 'library',
      description: 'View and manage your saved lessons',
    },
    // Placeholder for future steps: Select, Annotate, Preview
  ];

  return (
    <div className="teach-by-parts-container">
      <motion.div
        className="sidebar"
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="sidebar-title">TeachByParts</h3>
        <ul className="sidebar-menu">
          {sidebarItems.map((item) => (
            <motion.li
              key={item.step}
              className={`sidebar-item ${currentStep === item.step ? 'active' : ''}`}
              onClick={() => handleStepChange(item.step)}
              whileHover={{ scale: 1.05 }}
              data-tooltip-id={`sidebar-${item.step}`}
              data-tooltip-content={item.description}
            >
              {item.icon}
              <span>{item.name}</span>
              <Tooltip id={`sidebar-${item.step}`} place="right" />
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <div className="main-content">
        <motion.header
          className="main-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Interactive Lesson Creator</h1>
          <p>Create engaging lessons with annotations, audio, and more.</p>
        </motion.header>

        {currentStep === 'welcome' && (
          <motion.div
            className="welcome-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2>Welcome to TeachByParts</h2>
            <p>
              Upload an image to start building a lesson, or explore your saved lessons in the Library.
            </p>
            <motion.button
              className="start-button"
              onClick={() => setCurrentStep('upload')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Start Creating
            </motion.button>
          </motion.div>
        )}

        {currentStep === 'upload' && (
          <UploadComponent
            onImageUploaded={handleImageUploaded}
            onBack={handleBack}
          />
        )}

        {/* Placeholder for future steps: select, annotate, preview, library */}
      </div>

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default TeachByParts;