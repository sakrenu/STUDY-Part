// // home.js
// import React, { useState, useRef } from 'react';
// import Cropper from 'react-cropper';
// import 'cropperjs/dist/cropper.css';
// import axios from 'axios';
// import './home.css';

// const Home = () => {
//   const [image, setImage] = useState(null);
//   const [isSelectingRegions, setIsSelectingRegions] = useState(true);
//   const [selectedRegions, setSelectedRegions] = useState([]);
//   const [isAddingNotes, setIsAddingNotes] = useState(false);
//   const [processedOutput, setProcessedOutput] = useState(null);
//   const [currentRegionIndex, setCurrentRegionIndex] = useState(null);
//   const [regionNotes, setRegionNotes] = useState({});
//   const [showOutput, setShowOutput] = useState(false);
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [currentImageUrl, setCurrentImageUrl] = useState(null);
//   const [processedRegions, setProcessedRegions] = useState([]);
//   const [currentRegionForNotes, setCurrentRegionForNotes] = useState(null);
//   const [isViewingOutput, setIsViewingOutput] = useState(false);
//   const cropperRef = useRef(null);

//   const handleImageUpload = async (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       try {
//         const formData = new FormData();
//         formData.append('image', file);
//         const response = await axios.post('http://localhost:5000/upload', formData);
//         const imageUrl = response.data.image_url;
//         setCurrentImageUrl(imageUrl);
//         setImage(file);
//         setIsSelectingRegions(true);
//         setSelectedRegions([]);
//       } catch (error) {
//         setError('Failed to upload image: ' + error.message);
//       }
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
//     try {
//       if (!currentImageUrl) throw new Error('No image URL available');
//       setIsLoading(true);
//       const processedResults = await Promise.all(
//         selectedRegions.map((region, index) =>
//           axios.post('http://localhost:5000/segment', {
//             image_url: currentImageUrl,
//             bounding_box: {
//               x: Math.round(region.x),
//               y: Math.round(region.y),
//               width: Math.round(region.width),
//               height: Math.round(region.height),
//               rotate: region.rotate || 0,
//             },
//             teacher_id: 'teacher_1', // Hardcoded for now
//             region_index: index,
//           })
//         )
//       );
//       setProcessedRegions(processedResults.map((response) => response.data));
//       setProcessedOutput({
//         originalImage: currentImageUrl,
//         regions: processedResults.map((response) => ({
//           highlightedOutline: response.data.highlighted_outline,
//         })),
//       });
//       setIsSelectingRegions(false);
//       setIsAddingNotes(true);
//     } catch (error) {
//       setError('Failed to process regions: ' + error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAddNote = (index, note) => {
//     setRegionNotes((prev) => ({ ...prev, [index]: note }));
//   };

//   const handleDoneAddingNotes = () => {
//     setIsAddingNotes(false);
//     setIsViewingOutput(true);
//     setShowOutput(true);
//   };

//   const handleRegionClick = (index) => {
//     if (isAddingNotes) {
//       setCurrentRegionForNotes(index);
//     } else if (isViewingOutput) {
//       setCurrentRegionForNotes(index);
//     }
//   };

//   const handleSaveNotes = async (index, notes) => {
//     try {
//       setIsLoading(true);
//       if (!notes || notes.trim() === '') throw new Error('Please enter some notes');
//       const response = await axios.post('http://localhost:5000/add_note', {
//         image_url: currentImageUrl,
//         segment_index: index.toString(),
//         note: notes.trim(),
//         teacher_id: 'teacher_1',
//       });
//       if (response.data.message) {
//         setRegionNotes((prev) => ({ ...prev, [index]: notes }));
//         setCurrentRegionForNotes(null);
//       }
//     } catch (error) {
//       setError('Failed to save notes: ' + error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const renderProcessedOutput = () => {
//     return (
//       <div className="processed-output-container">
//         <div className="original-image-container">
//           <img
//             src={currentImageUrl}
//             alt="Original"
//             className="base-image"
//             style={{ width: '800px', height: '600px', objectFit: 'contain' }}
//           />
//           {processedRegions.map((region, index) => (
//             <div
//               key={index}
//               className="region-overlay"
//               onClick={() => handleRegionClick(index)}
//             >
//               <img
//                 src={region.highlighted_outline}
//                 alt={`Region ${index + 1}`}
//                 className="region-outline"
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   width: '100%',
//                   height: '100%',
//                   objectFit: 'contain',
//                 }}
//               />
//             </div>
//           ))}
//         </div>

//         {currentRegionForNotes !== null && isAddingNotes && (
//           <div className="notes-popup">
//             <h3>Add Notes for Region {currentRegionForNotes + 1}</h3>
//             <textarea
//               value={regionNotes[currentRegionForNotes] || ''}
//               onChange={(e) =>
//                 setRegionNotes((prev) => ({
//                   ...prev,
//                   [currentRegionForNotes]: e.target.value,
//                 }))
//               }
//               placeholder="Add notes for this region..."
//               className="notes-textarea"
//               disabled={isLoading}
//             />
//             <div className="notes-popup-buttons">
//               <button
//                 onClick={() =>
//                   handleSaveNotes(currentRegionForNotes, regionNotes[currentRegionForNotes])
//                 }
//                 className="save-notes-button"
//                 disabled={isLoading}
//               >
//                 {isLoading ? 'Saving...' : 'Save Notes'}
//               </button>
//               <button
//                 onClick={() => setCurrentRegionForNotes(null)}
//                 className="cancel-button"
//                 disabled={isLoading}
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         )}

//         {currentRegionForNotes !== null && isViewingOutput && (
//           <div className="notes-popup">
//             <h3>Notes for Region {currentRegionForNotes + 1}</h3>
//             <div className="notes-content">
//               {regionNotes[currentRegionForNotes] || 'No notes added for this region'}
//             </div>
//             <button
//               onClick={() => setCurrentRegionForNotes(null)}
//               className="close-button"
//             >
//               Close
//             </button>
//           </div>
//         )}

//         {isAddingNotes && (
//           <button onClick={handleDoneAddingNotes} className="done-notes-button">
//             Done Adding Notes
//           </button>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="main-content">
//       <header className="dashboard-header">
//         <h1 className="dashboard-title">Teaching Mode</h1>
//         <p className="dashboard-subtitle">Create Engaging Teaching Material for Your Students.</p>
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

//         {image && isSelectingRegions && (
//           <div className="cropper-container">
//             <Cropper
//               src={image instanceof File ? URL.createObjectURL(image) : image}
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
//         )}

//         {isAddingNotes && processedOutput && (
//           <div className="notes-addition-container">
//             <h3>Add Notes to Selected Regions</h3>
//             <div className="original-image-container">
//               <img
//                 src={processedOutput.originalImage}
//                 alt="Original"
//                 className="base-image"
//                 style={{ width: '800px', height: '600px', objectFit: 'contain' }}
//               />
//               {processedOutput.regions &&
//                 processedOutput.regions.map((region, index) => (
//                   <div
//                     key={index}
//                     className="region-note-section"
//                     onClick={() => setCurrentRegionIndex(index)}
//                   >
//                     <img
//                       src={region.highlightedOutline}
//                       alt={`Region ${index + 1}`}
//                       className="region-outline"
//                       style={{
//                         position: 'absolute',
//                         top: 0,
//                         left: 0,
//                         width: '100%',
//                         height: '100%',
//                         objectFit: 'contain',
//                       }}
//                     />
//                   </div>
//                 ))}
//             </div>
//             {currentRegionIndex !== null && (
//               <div className="note-input-popup">
//                 <textarea
//                   value={regionNotes[currentRegionIndex] || ''}
//                   onChange={(e) => handleAddNote(currentRegionIndex, e.target.value)}
//                   placeholder="Add notes for this region..."
//                   className="notes-textarea"
//                 />
//                 <button onClick={() => setCurrentRegionIndex(null)} className="save-note-button">
//                   Save Note
//                 </button>
//               </div>
//             )}
//             <button onClick={handleDoneAddingNotes} className="done-notes-button">
//               Done Adding Notes
//             </button>
//           </div>
//         )}

//         {showOutput && processedOutput && (
//           <div className="final-output-container">
//             <h3>Final Output</h3>
//             <div className="original-image-container">
//               {/* Add more output view code here if needed */}
//             </div>
//           </div>
//         )}
//       </section>

//       {isLoading && <div className="loading-message">Processing regions...</div>}
//       {(isAddingNotes || isViewingOutput) && renderProcessedOutput()}
//     </div>
//   );
// };

// export default Home;
// home.js - first groq. 
// import React, { useState, useRef, useEffect } from 'react';
// import Cropper from 'react-cropper';
// import 'cropperjs/dist/cropper.css';
// import axios from 'axios';
// import { auth, db } from '../../firebase'; // Assuming this is the correct path
// import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
// import './home.css';

// const Home = () => {
//   const [image, setImage] = useState(null);
//   const [isSelectingRegions, setIsSelectingRegions] = useState(true);
//   const [selectedRegions, setSelectedRegions] = useState([]);
//   const [isAddingNotes, setIsAddingNotes] = useState(false);
//   const [processedOutput, setProcessedOutput] = useState(null);
//   const [currentRegionIndex, setCurrentRegionIndex] = useState(null);
//   const [regionNotes, setRegionNotes] = useState({});
//   const [showOutput, setShowOutput] = useState(false);
//   const [error, setError] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [currentImageUrl, setCurrentImageUrl] = useState(null);
//   const [processedRegions, setProcessedRegions] = useState([]);
//   const [currentRegionForNotes, setCurrentRegionForNotes] = useState(null);
//   const [isViewingOutput, setIsViewingOutput] = useState(false);
//   const [teacherEmail, setTeacherEmail] = useState(null);
//   const cropperRef = useRef(null);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       if (user) {
//         setTeacherEmail(user.email);
//       } else {
//         setError('You must be logged in as a teacher to use this page.');
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   const handleImageUpload = async (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       try {
//         const formData = new FormData();
//         formData.append('image', file);
//         const response = await axios.post('http://localhost:5000/upload', formData);
//         const imageUrl = response.data.image_url;
//         setCurrentImageUrl(imageUrl);
//         setImage(file);
//         setIsSelectingRegions(true);
//         setSelectedRegions([]);
//       } catch (error) {
//         setError('Failed to upload image: ' + error.message);
//       }
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
//           axios.post('http://localhost:5000/segment', {
//             image_url: currentImageUrl,
//             bounding_box: {
//               x: Math.round(region.x),
//               y: Math.round(region.y),
//               width: Math.round(region.width),
//               height: Math.round(region.height),
//               rotate: region.rotate || 0,
//             },
//             teacher_id: teacherEmail,
//             region_index: index,
//           })
//         )
//       );
//       setProcessedRegions(processedResults.map((response) => response.data));
//       setProcessedOutput({
//         originalImage: currentImageUrl,
//         regions: processedResults.map((response) => ({
//           highlightedOutline: response.data.highlighted_outline,
//           position: response.data.position,
//         })),
//       });
//       setIsSelectingRegions(false);
//       setIsAddingNotes(true);
//     } catch (error) {
//       setError('Failed to process regions: ' + error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleAddNote = (index, note) => {
//     setRegionNotes((prev) => ({ ...prev, [index]: note }));
//   };

//   const handleSaveNotes = (index) => {
//     // Save the current note to regionNotes and close the popup
//     setRegionNotes((prev) => ({ ...prev, [index]: regionNotes[index] || '' }));
//     setCurrentRegionForNotes(null);
//   };

//   const handleDoneAddingNotes = async () => {
//     if (!teacherEmail) {
//       setError('Teacher email not available. Please log in.');
//       return;
//     }
//     try {
//       setIsLoading(true);

//       const lessonRef = await addDoc(
//         collection(db, 'Teachers', teacherEmail, 'Lessons'),
//         {
//           originalImageUrl: currentImageUrl,
//           createdAt: new Date().toISOString(),
//           title: `Lesson ${new Date().toLocaleDateString()}`,
//         }
//       );

//       await Promise.all(
//         processedRegions.map(async (region, index) => {
//           const segmentData = {
//             boundingBox: {
//               xMin: region.position.x,
//               yMin: region.position.y,
//               xMax: region.position.x + region.position.width,
//               yMax: region.position.y + region.position.height,
//             },
//             segmentCoordinates: [
//               { x: region.position.x, y: region.position.y },
//               { x: region.position.x + region.position.width, y: region.position.y },
//               { x: region.position.x + region.position.width, y: region.position.y + region.position.height },
//               { x: region.position.x, y: region.position.y + region.position.height },
//             ],
//             notes: regionNotes[index] || '',
//             highlightedOutlineUrl: region.highlighted_outline,
//           };
//           await setDoc(
//             doc(db, 'Teachers', teacherEmail, 'Lessons', lessonRef.id, 'Segments', `segment_${index}`),
//             segmentData
//           );
//         })
//       );

//       setIsAddingNotes(false);
//       setIsViewingOutput(true);
//       setShowOutput(true);
//     } catch (error) {
//       setError('Failed to save lesson to Firestore: ' + error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRegionClick = (index) => {
//     if (isAddingNotes) {
//       setCurrentRegionForNotes(index);
//     } else if (isViewingOutput) {
//       setCurrentRegionForNotes(index);
//     }
//   };

//   const renderProcessedOutput = () => {
//     return (
//       <div className="processed-output-container">
//         <div className="original-image-container">
//           <img
//             src={currentImageUrl}
//             alt="Original"
//             className="base-image"
//             style={{ width: '800px', height: '600px', objectFit: 'contain' }}
//           />
//           {processedRegions.map((region, index) => (
//             <div
//               key={index}
//               className="region-overlay"
//               onClick={() => handleRegionClick(index)}
//             >
//               <img
//                 src={region.highlighted_outline}
//                 alt={`Region ${index + 1}`}
//                 className="region-outline"
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   width: '100%',
//                   height: '100%',
//                   objectFit: 'contain',
//                 }}
//               />
//             </div>
//           ))}
//         </div>

//         {currentRegionForNotes !== null && isAddingNotes && (
//           <div className="notes-popup">
//             <h3>Add Notes for Region {currentRegionForNotes + 1}</h3>
//             <textarea
//               value={regionNotes[currentRegionForNotes] || ''}
//               onChange={(e) =>
//                 handleAddNote(currentRegionForNotes, e.target.value)
//               }
//               placeholder="Add notes for this region..."
//               className="notes-textarea"
//               disabled={isLoading}
//             />
//             <div className="notes-popup-buttons">
//               <button
//                 onClick={() => handleSaveNotes(currentRegionForNotes)}
//                 className="save-notes-button"
//                 disabled={isLoading}
//               >
//                 Save Notes
//               </button>
//               <button
//                 onClick={() => setCurrentRegionForNotes(null)}
//                 className="close-button"
//                 disabled={isLoading}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         )}

//         {currentRegionForNotes !== null && isViewingOutput && (
//           <div className="notes-popup">
//             <h3>Notes for Region {currentRegionForNotes + 1}</h3>
//             <div className="notes-content">
//               {regionNotes[currentRegionForNotes] || 'No notes added for this region'}
//             </div>
//             <button
//               onClick={() => setCurrentRegionForNotes(null)}
//               className="close-button"
//             >
//               Close
//             </button>
//           </div>
//         )}

//         {isAddingNotes && (
//           <button onClick={handleDoneAddingNotes} className="done-notes-button">
//             Done Adding Notes
//           </button>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="main-content">
//       <header className="dashboard-header">
//         <h1 className="dashboard-title">Teaching Mode</h1>
//         <p className="dashboard-subtitle">Create Engaging Teaching Material for Your Students.</p>
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

//         {image && isSelectingRegions && (
//           <div className="cropper-container">
//             <Cropper
//               src={image instanceof File ? URL.createObjectURL(image) : image}
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
//         )}

//         {(isAddingNotes || isViewingOutput) && renderProcessedOutput()}
//       </section>

//       {isLoading && <div className="loading-message">Processing...</div>}
//     </div>
//   );
// };

// export default Home;
import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import axios from 'axios';
import { auth, db } from '../../firebase'; // Assuming this is the correct path
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import './home.css';

const Home = () => {
  const [image, setImage] = useState(null);
  const [isSelectingRegions, setIsSelectingRegions] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [isAddingNotes, setIsAddingNotes] = useState(false);
  const [processedOutput, setProcessedOutput] = useState(null);
  const [currentRegionIndex, setCurrentRegionIndex] = useState(null);
  const [regionNotes, setRegionNotes] = useState({});
  const [showOutput, setShowOutput] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [processedRegions, setProcessedRegions] = useState([]);
  const [currentRegionForNotes, setCurrentRegionForNotes] = useState(null);
  const [isViewingOutput, setIsViewingOutput] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [lessonId, setLessonId] = useState(null); // Added to store lesson ID
  const cropperRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTeacherEmail(user.email);
      } else {
        setError('You must be logged in as a teacher to use this page.');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axios.post('http://127.0.0.1:8000/upload', formData);
        const imageUrl = response.data.image_url;
        setCurrentImageUrl(imageUrl);
        setImage(file);
        setIsSelectingRegions(true);
        setSelectedRegions([]);
      } catch (error) {
        setError('Failed to upload image: ' + error.message);
      }
    }
  };

  const handleSelectRegion = () => {
    if (cropperRef.current) {
      const cropData = cropperRef.current.cropper.getData();
      setSelectedRegions([...selectedRegions, cropData]);
      cropperRef.current.cropper.clear();
    }
  };

  const handleDoneSelecting = async () => {
    if (!teacherEmail) {
      setError('Teacher email not available. Please log in.');
      return;
    }
    try {
      if (!currentImageUrl) throw new Error('No image URL available');
      setIsLoading(true);
      const processedResults = await Promise.all(
        selectedRegions.map((region, index) =>
          axios.post('http://127.0.0.1:8000/segment', {
            image_url: currentImageUrl,
            bounding_box: {
              x: Math.round(region.x),
              y: Math.round(region.y),
              width: Math.round(region.width),
              height: Math.round(region.height),
              rotate: region.rotate || 0,
            },
            teacher_id: teacherEmail,
            region_index: index,
          })
        )
      );
      setProcessedRegions(processedResults.map((response) => response.data));
      setProcessedOutput({
        originalImage: currentImageUrl,
        regions: processedResults.map((response) => ({
          highlightedOutline: response.data.highlighted_outline,
          position: response.data.position,
        })),
      });

      // Create the lesson document and initial segments
      const lessonRef = await addDoc(
        collection(db, 'Teachers', teacherEmail, 'Lessons'),
        {
          originalImageUrl: currentImageUrl,
          createdAt: new Date().toISOString(),
          title: `Lesson ${new Date().toLocaleDateString()}`,
        }
      );
      setLessonId(lessonRef.id); // Store the lesson ID

      // Save initial segments without notes
      await Promise.all(
        processedResults.map(async (response, index) => {
          const region = response.data;
          const segmentData = {
            boundingBox: {
              xMin: region.position.x,
              yMin: region.position.y,
              xMax: region.position.x + region.position.width,
              yMax: region.position.y + region.position.height,
            },
            segmentCoordinates: [
              { x: region.position.x, y: region.position.y },
              { x: region.position.x + region.position.width, y: region.position.y },
              { x: region.position.x + region.position.width, y: region.position.y + region.position.height },
              { x: region.position.x, y: region.position.y + region.position.height },
            ],
            notes: '', // Initially empty, updated via /add_note
            highlightedOutlineUrl: region.highlighted_outline,
          };
          await setDoc(
            doc(db, 'Teachers', teacherEmail, 'Lessons', lessonRef.id, 'Segments', `segment_${index}`),
            segmentData
          );
        })
      );

      setIsSelectingRegions(false);
      setIsAddingNotes(true);
    } catch (error) {
      setError('Failed to process regions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = (index, note) => {
    setRegionNotes((prev) => ({ ...prev, [index]: note }));
  };

  const handleSaveNotes = async (index) => {
    if (!teacherEmail || !lessonId) {
      setError('Teacher email or lesson ID not available.');
      return;
    }
    try {
      const note = regionNotes[index] || '';
      await axios.post('http://127.0.0.1:8000/add_note', {
        image_url: currentImageUrl,
        segment_index: index,
        note: note,
        teacher_id: teacherEmail,
        lesson_id: lessonId, // Pass the lesson ID
      });
      setRegionNotes((prev) => ({ ...prev, [index]: note }));
      setCurrentRegionForNotes(null);
    } catch (error) {
      setError('Failed to save note: ' + error.message);
    }
  };

  const handleDoneAddingNotes = async () => {
    setIsAddingNotes(false);
    setIsViewingOutput(true);
    setShowOutput(true);
  };

  const handleRegionClick = (index) => {
    if (isAddingNotes) {
      setCurrentRegionForNotes(index);
    } else if (isViewingOutput) {
      setCurrentRegionForNotes(index);
    }
  };

  const renderProcessedOutput = () => {
    return (
      <div className="processed-output-container">
        <div className="original-image-container">
          <img
            src={currentImageUrl}
            alt="Original"
            className="base-image"
            style={{ width: '800px', height: '600px', objectFit: 'contain' }}
          />
          {processedRegions.map((region, index) => (
            <div
              key={index}
              className="region-overlay"
              onClick={() => handleRegionClick(index)}
            >
              <img
                src={region.highlighted_outline}
                alt={`Region ${index + 1}`}
                className="region-outline"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </div>
          ))}
        </div>

        {currentRegionForNotes !== null && isAddingNotes && (
          <div className="notes-popup">
            <h3>Add Notes for Region {currentRegionForNotes + 1}</h3>
            <textarea
              value={regionNotes[currentRegionForNotes] || ''}
              onChange={(e) =>
                handleAddNote(currentRegionForNotes, e.target.value)
              }
              placeholder="Add notes for this region..."
              className="notes-textarea"
              disabled={isLoading}
            />
            <div className="notes-popup-buttons">
              <button
                onClick={() => handleSaveNotes(currentRegionForNotes)}
                className="save-notes-button"
                disabled={isLoading}
              >
                Save Notes
              </button>
              <button
                onClick={() => setCurrentRegionForNotes(null)}
                className="close-button"
                disabled={isLoading}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {currentRegionForNotes !== null && isViewingOutput && (
          <div className="notes-popup">
            <h3>Notes for Region {currentRegionForNotes + 1}</h3>
            <div className="notes-content">
              {regionNotes[currentRegionForNotes] || 'No notes added for this region'}
            </div>
            <button
              onClick={() => setCurrentRegionForNotes(null)}
              className="close-button"
            >
              Close
            </button>
          </div>
        )}

        {isAddingNotes && (
          <button onClick={handleDoneAddingNotes} className="done-notes-button">
            Done Adding Notes
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="main-content">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Teaching Mode</h1>
        <p className="dashboard-subtitle">Create Engaging Teaching Material for Your Students.</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="upload-section card-neon">
        <h2>Upload your Image</h2>
        <div className="upload-container">
          <label className="file-upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            <span className="upload-button">Choose Image</span>
          </label>
        </div>

        {image && isSelectingRegions && (
          <div className="cropper-container">
            <Cropper
              src={image instanceof File ? URL.createObjectURL(image) : image}
              style={{ height: 600, width: '100%', maxWidth: 800 }}
              initialAspectRatio={NaN}
              aspectRatio={NaN}
              guides={true}
              ref={cropperRef}
              zoomable={false}
              scalable={false}
              mouseWheelZoom={false}
              dragMode="crop"
              cropBoxMovable={true}
              cropBoxResizable={true}
              toggleDragModeOnDblclick={false}
              viewMode={1}
              minContainerWidth={800}
              minContainerHeight={600}
            />
            <div className="region-selection-controls">
              <button onClick={handleSelectRegion} className="select-region-button">
                Select Region
              </button>
              {selectedRegions.length > 0 && (
                <>
                  <button
                    onClick={() => cropperRef.current.cropper.clear()}
                    className="select-another-button"
                  >
                    Select Another Part
                  </button>
                  <button onClick={handleDoneSelecting} className="done-selecting-button">
                    Done Selecting ({selectedRegions.length} regions)
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {(isAddingNotes || isViewingOutput) && renderProcessedOutput()}
      </section>

      {isLoading && <div className="loading-message">Processing...</div>}
    </div>
  );
};

export default Home;