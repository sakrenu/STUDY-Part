// // // Library.js
// // import React, { useState, useEffect } from 'react';
// // import { useAuthState } from 'react-firebase-hooks/auth';
// // import { auth, db } from '../../firebase';
// // import { doc, getDoc, updateDoc, arrayUnion, getDocs, collection } from 'firebase/firestore';
// // import './Library.css';

// // const Library = () => {
// //   const [user, loadingAuth] = useAuthState(auth);
// //   const [libraryItems, setLibraryItems] = useState([]);
// //   const [selectedItems, setSelectedItems] = useState([]);
// //   const [error, setError] = useState(null);
// //   const [isLoading, setIsLoading] = useState(true);

// //   // Fetch all past uploads and notes for the teacher
// //   useEffect(() => {
// //     if (loadingAuth) return; // Wait for auth state
// //     if (!user) {
// //       setError('Please sign in as a teacher to access the library.');
// //       setIsLoading(false);
// //       return;
// //     }

// //     const fetchLibraryItems = async () => {
// //       try {
// //         const teacherRef = doc(db, 'teachers', user.uid);
// //         const teacherDoc = await getDoc(teacherRef);
// //         if (teacherDoc.exists()) {
// //           const teacherData = teacherDoc.data();
// //           const images = teacherData.images || {};
          
// //           // Transform images into a list of library items, using Cloudinary URLs
// //           const items = Object.entries(images).map(([imageUrl, imageData]) => ({
// //             imageUrl, // Cloudinary URL
// //             segments: imageData.segments || [],
// //             timestamp: imageData.timestamp || new Date().toISOString(),
// //           }));

// //           setLibraryItems(items);
// //         } else {
// //           setLibraryItems([]);
// //           setError(`No teacher document found for ID: ${user.uid}`);
// //         }
// //       } catch (err) {
// //         setError('Failed to fetch library items: ' + err.message);
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     };

// //     fetchLibraryItems();
// //   }, [user, loadingAuth]);

// //   // Handle selection of library items
// //   const handleSelectItem = (itemId, isChecked) => {
// //     setSelectedItems((prev) =>
// //       isChecked ? [...prev, itemId] : prev.filter((id) => id !== itemId)
// //     );
// //   };

// //   // Share selected library items with students, using Cloudinary URLs
// //   const handleShareLibraryItems = async () => {
// //     if (!user) {
// //       setError('Please sign in to share items.');
// //       return;
// //     }
// //     if (selectedItems.length === 0) {
// //       setError('Please select at least one item to share.');
// //       return;
// //     }

// //     try {
// //       const studentsQuery = await getDocs(collection(db, 'users'));
// //       const students = studentsQuery.docs
// //         .map((doc) => ({ id: doc.id, ...doc.data() }))
// //         .filter((user) => user.role === 'student');

// //       for (const student of students) {
// //         const studentRef = doc(db, 'users', student.id);
// //         await updateDoc(studentRef, {
// //           sharedNotes: arrayUnion(...selectedItems.map((itemId) => ({
// //             imageUrl: itemId, // Cloudinary URL
// //             notes: libraryItems.find((item) => item.imageUrl === itemId)?.segments || [],
// //           }))),
// //         });
// //       }

// //       setError('Items shared successfully with all students!');
// //       setSelectedItems([]);
// //     } catch (err) {
// //       setError('Failed to share library items: ' + err.message);
// //     }
// //   };

// //   if (loadingAuth) return <div className="loading-message">Loading...</div>;
// //   if (error) return <div className="error-message">{error}</div>;
// //   if (!user || user.role !== 'teacher') return <div className="error-message">Access denied. Please sign in as a teacher.</div>;

// //   return (
// //     <div className="library-container">
// //       <h1>Library</h1>
// //       {libraryItems.length === 0 ? (
// //         <p>No items in library yet.</p>
// //       ) : (
// //         <>
// //           <div className="library-grid">
// //             {libraryItems.map((item) => (
// //               <div key={item.imageUrl} className="library-card">
// //                 <img src={item.imageUrl} alt="Uploaded" className="library-image" />
// //                 <div className="library-notes">
// //                   {item.segments.map((segment, index) => (
// //                     <div key={index} className="segment-note">
// //                       <p>Region {index + 1}: {segment.notes || 'No notes'}</p>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <label className="select-item">
// //                   <input
// //                     type="checkbox"
// //                     checked={selectedItems.includes(item.imageUrl)}
// //                     onChange={(e) => handleSelectItem(item.imageUrl, e.target.checked)}
// //                   />
// //                   Select
// //                 </label>
// //               </div>
// //             ))}
// //           </div>
// //           <button onClick={handleShareLibraryItems} className="share-library-button">
// //             Share Selected Items with Students
// //           </button>
// //         </>
// //       )}
// //     </div>
// //   );
// // };

// // export default Library;
// // Library.js
// import React, { useState, useEffect } from 'react';
// import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
// import { auth, db } from '../../firebase'; // Adjust path as needed
// import './Library.css'; // Ensure you have or create this CSS file

// const Library = () => {
//   const [lessons, setLessons] = useState([]);
//   const [teacherEmail, setTeacherEmail] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedSegment, setSelectedSegment] = useState(null); // Track selected segment for notes/edit
//   const [editedNote, setEditedNote] = useState(''); // Track edited note

//   // Get teacher's email from Firebase Auth
//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       if (user) {
//         setTeacherEmail(user.email);
//       } else {
//         setError('You must be logged in as a teacher to view the library.');
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   // Fetch lessons when teacherEmail is available
//   useEffect(() => {
//     if (!teacherEmail) return;

//     const fetchLessons = async () => {
//       try {
//         setLoading(true);
//         const lessonsRef = collection(db, 'Teachers', teacherEmail, 'Lessons');
//         const lessonsSnapshot = await getDocs(lessonsRef);
//         const lessonsList = await Promise.all(
//           lessonsSnapshot.docs.map(async (lessonDoc) => {
//             const lessonData = lessonDoc.data();
//             const segmentsRef = collection(db, 'Teachers', teacherEmail, 'Lessons', lessonDoc.id, 'Segments');
//             const segmentsSnapshot = await getDocs(segmentsRef);
//             const segments = segmentsSnapshot.docs.map((segDoc) => ({
//               id: segDoc.id,
//               ...segDoc.data(),
//             }));
//             return {
//               id: lessonDoc.id,
//               originalImageUrl: lessonData.originalImageUrl,
//               title: lessonData.title || `Lesson ${new Date(lessonData.createdAt).toLocaleDateString()}`,
//               createdAt: lessonData.createdAt,
//               segments,
//             };
//           })
//         );
//         setLessons(lessonsList);
//       } catch (err) {
//         setError('Failed to load library: ' + err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLessons();
//   }, [teacherEmail]);

//   // Handle segment click to show/edit notes
//   const handleSegmentClick = (lessonId, segment, index) => {
//     setSelectedSegment({ lessonId, segment, index });
//     setEditedNote(segment.notes || ''); // Pre-fill with existing notes
//   };

//   // Save edited notes to Firestore
//   const handleSaveEditedNote = async () => {
//     if (!selectedSegment || !editedNote.trim()) {
//       setError('Please enter a note before saving.');
//       return;
//     }

//     try {
//       setLoading(true);
//       const segmentRef = doc(db, 'Teachers', teacherEmail, 'Lessons', selectedSegment.lessonId, 'Segments', selectedSegment.segment.id);
//       await updateDoc(segmentRef, { notes: editedNote.trim() });

//       // Update local state to reflect changes
//       setLessons((prevLessons) =>
//         prevLessons.map((lesson) =>
//           lesson.id === selectedSegment.lessonId
//             ? {
//                 ...lesson,
//                 segments: lesson.segments.map((seg, i) =>
//                   i === selectedSegment.index ? { ...seg, notes: editedNote.trim() } : seg
//                 ),
//               }
//             : lesson
//         )
//       );
//       setSelectedSegment(null);
//       setEditedNote('');
//     } catch (err) {
//       setError('Failed to save edited note: ' + err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Close the notes/edit popup
//   const handleCloseNotes = () => {
//     setSelectedSegment(null);
//     setEditedNote('');
//   };

//   if (loading) return <div className="loading-message">Loading library...</div>;
//   if (error) return <div className="error-message">{error}</div>;

//   return (
//     <div className="library-content">
//       <h2>Library</h2>
//       <div className="library-grid">
//         {lessons.length === 0 ? (
//           <p>No lessons found in your library.</p>
//         ) : (
//           lessons.map((lesson) => (
//             <div key={lesson.id} className="library-card">
//               <img src={lesson.originalImageUrl} alt={lesson.title} className="library-image" />
//               <h3>{lesson.title}</h3>
//               <div className="interactive-output">
//                 <div className="original-image-container">
//                   <img
//                     src={lesson.originalImageUrl}
//                     alt="Lesson Output"
//                     className="base-image"
//                     style={{ width: '800px', height: '600px', objectFit: 'contain', position: 'relative' }}
//                   />
//                   {lesson.segments.map((segment, index) => (
//                     <div
//                       key={segment.id}
//                       className="region-overlay"
//                       onClick={() => handleSegmentClick(lesson.id, segment, index)}
//                       style={{
//                         position: 'absolute',
//                         top: `${(segment.boundingBox.yMin / (segment.boundingBox.yMax - segment.boundingBox.yMin + 100)) * 100}%`,
//                         left: `${(segment.boundingBox.xMin / (segment.boundingBox.xMax - segment.boundingBox.xMin + 100)) * 100}%`,
//                         width: `${((segment.boundingBox.xMax - segment.boundingBox.xMin) / (segment.boundingBox.xMax - segment.boundingBox.xMin + 100)) * 100}%`,
//                         height: `${((segment.boundingBox.yMax - segment.boundingBox.yMin) / (segment.boundingBox.yMax - segment.boundingBox.yMin + 100)) * 100}%`,
//                         border: '2px solid #ff0000', // Red border for visibility
//                         cursor: 'pointer',
//                       }}
//                     >
//                       {/* Optional: Overlay with segment outline image if needed */}
//                       <img
//                         src={segment.highlightedOutlineUrl}
//                         alt={`Segment ${index + 1}`}
//                         className="segment-outline"
//                         style={{
//                           position: 'absolute',
//                           top: 0,
//                           left: 0,
//                           width: '100%',
//                           height: '100%',
//                           objectFit: 'contain',
//                           opacity: 0.5, // Make it semi-transparent for overlay
//                         }}
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <p className="created-at">
//                 Created: {new Date(lesson.createdAt).toLocaleString()}
//               </p>
//               {selectedSegment && selectedSegment.lessonId === lesson.id && (
//                 <div className="notes-popup">
//                   <h3>Edit Notes for Region {selectedSegment.index + 1}</h3>
//                   <textarea
//                     value={editedNote}
//                     onChange={(e) => setEditedNote(e.target.value)}
//                     placeholder="Edit notes for this region..."
//                     className="notes-textarea"
//                     disabled={loading}
//                   />
//                   <div className="notes-popup-buttons">
//                     <button
//                       onClick={handleSaveEditedNote}
//                       className="save-notes-button"
//                       disabled={loading}
//                     >
//                       {loading ? 'Saving...' : 'Save Notes'}
//                     </button>
//                     <button
//                       onClick={handleCloseNotes}
//                       className="close-button"
//                       disabled={loading}
//                     >
//                       Close
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// };

// export default Library;

import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase'; // Still need auth for teacherEmail
import axios from 'axios';
import './library.css';

const Library = () => {
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLessonForNotes, setCurrentLessonForNotes] = useState(null);
  const [currentSegmentForNotes, setCurrentSegmentForNotes] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTeacherEmail(user.email);
      } else {
        setError('You must be logged in as a teacher to view the library.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!teacherEmail) return;

    const fetchLessons = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/get_lessons', {
          params: { teacher_id: teacherEmail },
        });
        setLessons(response.data.lessons);
      } catch (err) {
        setError('Failed to fetch lessons: ' + (err.response?.data?.error || err.message));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [teacherEmail]);

  const handleSegmentClick = (lessonId, segmentId) => {
    setCurrentLessonForNotes(lessonId);
    setCurrentSegmentForNotes(segmentId);
    const lesson = lessons.find((l) => l.id === lessonId);
    const segment = lesson.segments.find((s) => s.id === segmentId);
    setEditNote(segment.notes || '');
    setIsEditing(false);
  };

  const handleEditNote = () => {
    setIsEditing(true);
  };

  const handleSaveNote = async () => {
    if (!teacherEmail || !currentLessonForNotes || !currentSegmentForNotes) {
      setError('Missing required data to save note.');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/add_note', {
        image_url: lessons.find((l) => l.id === currentLessonForNotes).originalImageUrl,
        segment_index: parseInt(currentSegmentForNotes.split('_')[1]),
        note: editNote,
        teacher_id: teacherEmail,
        lesson_id: currentLessonForNotes,
      });

      setLessons((prevLessons) =>
        prevLessons.map((lesson) =>
          lesson.id === currentLessonForNotes
            ? {
                ...lesson,
                segments: lesson.segments.map((segment) =>
                  segment.id === currentSegmentForNotes ? { ...segment, notes: editNote } : segment
                ),
              }
            : lesson
        )
      );
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save note: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePopup = () => {
    setCurrentLessonForNotes(null);
    setCurrentSegmentForNotes(null);
    setIsEditing(false);
  };

  return (
    <div className="library-container">
      <h1>Lesson Library</h1>
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading-message">Loading...</div>}

      {lessons.length === 0 ? (
        <p>No lessons available.</p>
      ) : (
        lessons.map((lesson) => (
          <div key={lesson.id} className="lesson-item">
            <h2>{lesson.title}</h2>
            <p>Created on {new Date(lesson.createdAt).toLocaleDateString()}</p>
            <div className="image-container" style={{ position: 'relative', width: '800px', height: '600px' }}>
              <img
                src={lesson.originalImageUrl}
                alt={lesson.title}
                className="original-image"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              {lesson.segments.map((segment) => (
                <div
                  key={segment.id}
                  className="segment-overlay"
                  onClick={() => handleSegmentClick(lesson.id, segment.id)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                >
                  <img
                    src={segment.highlightedOutlineUrl}
                    alt={`Segment ${segment.id}`}
                    className="highlighted-outline"
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
          </div>
        ))
      )}

      {currentLessonForNotes && currentSegmentForNotes && (
        <div className="notes-popup">
          <h3>
            Notes for {lessons.find((l) => l.id === currentLessonForNotes)?.title} - {currentSegmentForNotes}
          </h3>
          {isEditing ? (
            <>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="notes-textarea"
                placeholder="Edit your notes here..."
                disabled={isLoading}
              />
              <div className="popup-buttons">
                <button onClick={handleSaveNote} className="save-button" disabled={isLoading}>
                  Save
                </button>
                <button onClick={handleClosePopup} className="close-button" disabled={isLoading}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="notes-content">{editNote || 'No notes added'}</div>
              <div className="popup-buttons">
                <button onClick={handleEditNote} className="edit-button">
                  Edit Notes
                </button>
                <button onClick={handleClosePopup} className="close-button">
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;