// // // // // // // client/src/components/TeacherDashboard.js
// // import React, { useState } from 'react';
// // import axios from 'axios';
// // import Cropper from 'react-cropper';
// // import 'cropperjs/dist/cropper.css';
// // import './TeachersDashboard.css';

// // const TeacherDashboard = () => {
// //   const [image, setImage] = useState(null);
// //   const [cropper, setCropper] = useState(null);
// //   const [segmentedImage, setSegmentedImage] = useState(null);
// //   const [imagePath, setImagePath] = useState(null);

// //   const handleImageUpload = async (e) => {
// //     const file = e.target.files[0];
// //     const formData = new FormData();
// //     formData.append('image', file);

// //     try {
// //       const response = await axios.post('http://localhost:5000/upload', formData, {
// //         headers: {
// //           'Content-Type': 'multipart/form-data',
// //         },
// //       });
// //       setImagePath(response.data.image_path);
// //       setImage(URL.createObjectURL(file));
// //     } catch (error) {
// //       console.error('Image upload error:', error);
// //     }
// //   };

// //   const getCropData = () => {
// //     if (cropper) {
// //       const boundingBox = cropper.getCropBoxData();
// //       return [boundingBox.left, boundingBox.top, boundingBox.width + boundingBox.left, boundingBox.height + boundingBox.top];
// //     }
// //     return null;
// //   };

// //   const handleSegmentation = async () => {
// //     const boundingBox = getCropData();
// //     if (!boundingBox) {
// //       alert('Please select a part of the image.');
// //       return;
// //     }

// //     try {
// //       const response = await axios.post('http://localhost:5000/segment', {
// //         image_path: imagePath,
// //         bounding_box: boundingBox,
// //       });
// //       setSegmentedImage(response.data.segmented_image_path);
// //     } catch (error) {
// //       console.error('Segmentation error:', error);
// //     }
// //   };

// //   return (
// //     <div className="dashboard-container">
// //       <h1 className="dashboard-title">Teacher Dashboard</h1>
// //       <input type="file" accept="image/*" onChange={handleImageUpload} className="upload-button" />
// //       {image && (
// //         <div>
// //           <Cropper
// //             src={image}
// //             style={{ height: 400, width: '100%' }}
// //             aspectRatio={1}
// //             guides={false}
// //             onInitialized={(instance) => setCropper(instance)}
// //           />
// //           <button onClick={handleSegmentation} className="segment-button">
// //             Segment Image
// //           </button>
// //         </div>
// //       )}
// //       {segmentedImage && (
// //         <div>
// //           <h2>Segmented Image</h2>
// //           <img src={segmentedImage} alt="Segmented" className="segmented-image clickable-image" />
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default TeacherDashboard;
// // // // // client/src/components/TeacherDashboard.js
// // ---------------------above one uses croppers.js ----------------------------------------------below 24th dec--------------
// import React, { useState, useEffect, useRef } from 'react';
// import { db } from '../firebase'; // Import db from the firebase configuration file
// import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
// import axios from 'axios';
// import './TeachersDashboard.css';
// import Cropper from 'react-cropper';
// import 'cropperjs/dist/cropper.css';

// const TeachersDashboard = () => {
//     const [image, setImage] = useState(null);
//     const [segmentedImages, setSegmentedImages] = useState([]);
//     const [notes, setNotes] = useState({});
//     const [students, setStudents] = useState([]);
//     const [cropper, setCropper] = useState(null);
//     const [croppedImage, setCroppedImage] = useState(null);

//     useEffect(() => {
//         const fetchStudents = async () => {
//             const querySnapshot = await getDocs(collection(db, 'users'));
//             const studentList = querySnapshot.docs
//                 .map(doc => ({ id: doc.id, ...doc.data() }))
//                 .filter(user => user.role === 'student');
//             setStudents(studentList);
//         };

//         fetchStudents();
//     }, []);

//     const handleImageUpload = (e) => {
//         const file = e.target.files[0];
//         setImage(file);
//     };

//     const handleSegmentation = async () => {
//         if (cropper) {
//             const canvas = cropper.getCroppedCanvas();
//             const croppedImageUrl = canvas.toDataURL('image/jpeg');
//             setCroppedImage(croppedImageUrl);

//             const formData = new FormData();
//             formData.append('image', image);
//             formData.append('cropped_image', croppedImageUrl);

//             const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
//                 headers: {
//                     'Content-Type': 'multipart/form-data',
//                 },
//             });

//             const imageUrl = uploadResponse.data.image_url;

//             const segmentResponse = await axios.post('/segment', {
//                 image_url: imageUrl,
//                 bounding_box: {
//                     left: cropper.getData().x,
//                     top: cropper.getData().y,
//                     width: cropper.getData().width,
//                     height: cropper.getData().height,
//                 },
//             });

//             setSegmentedImages(segmentResponse.data.segmented_urls);
//         }
//     };

//     const handleNoteChange = (segmentId, note) => {
//         setNotes(prevNotes => ({
//             ...prevNotes,
//             [segmentId]: note,
//         }));
//     };

//     const handleSendToStudent = async (studentId) => {
//         const studentDocRef = doc(db, 'users', studentId);
//         await setDoc(studentDocRef, {
//             segmentedImages,
//             notes,
//         }, { merge: true });
//     };

//     return (
//         <div className="teachers-dashboard">
//             <h1>Teacher's Dashboard</h1>
//             <div className="teaching-mode">
//                 <h2>Teaching Mode</h2>
//                 <input type="file" accept="image/*" onChange={handleImageUpload} />
//                 {image && (
//                     <Cropper
//                         src={URL.createObjectURL(image)}
//                         style={{ height: 400, width: '100%' }}
//                         aspectRatio={1}
//                         guides={true}
//                         onInitialized={(instance) => {
//                             setCropper(instance);
//                         }}
//                     />
//                 )}
//                 <button onClick={handleSegmentation}>Segment Image</button>
//                 {segmentedImages.map((segmentedImage, index) => (
//                     <div key={index} className="segmented-image-container">
//                         <img src={segmentedImage} alt={`Segmented ${index}`} />
//                         <textarea
//                             value={notes[index] || ''}
//                             onChange={(e) => handleNoteChange(index, e.target.value)}
//                             placeholder="Add notes..."
//                         />
//                     </div>
//                 ))}
//             </div>
//             <div className="quiz-mode">
//                 <h2>Quiz Mode</h2>
//                 <p>Placeholder for future quiz feature</p>
//             </div>
//             <div className="manage-students">
//                 <h2>Manage Students</h2>
//                 <ul>
//                     {students.map(student => (
//                         <li key={student.id}>
//                             {student.email}
//                             <button onClick={() => handleSendToStudent(student.id)}>Send</button>
//                         </li>
//                     ))}
//                 </ul>
//             </div>
//         </div>
//     );
// };

// export default TeachersDashboard;
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase'; // Import db from the firebase configuration file
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import './TeachersDashboard.css';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

const TeachersDashboard = () => {
    const [image, setImage] = useState(null);
    const [segmentedImages, setSegmentedImages] = useState([]);
    const [notes, setNotes] = useState({});
    const [students, setStudents] = useState([]);
    const [cropper, setCropper] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const studentList = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(user => user.role === 'student');
                setStudents(studentList);
            } catch (err) {
                setError('Failed to fetch students: ' + err.message);
            }
        };

        fetchStudents();
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        setImage(file);
    };

    const handleSegmentation = async () => {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas();
            const croppedImageUrl = canvas.toDataURL('image/jpeg');
            setCroppedImage(croppedImageUrl);

            const formData = new FormData();
            formData.append('image', image);

            try {
                const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                const imageUrl = uploadResponse.data.image_url;

                const segmentResponse = await axios.post('http://localhost:5000/segment', {
                    image_url: imageUrl,
                    bounding_box: {
                        left: cropper.getData().x,
                        top: cropper.getData().y,
                        width: cropper.getData().width,
                        height: cropper.getData().height,
                    },
                });

                setSegmentedImages(segmentResponse.data.segmented_urls);
            } catch (err) {
                setError('Failed to segment image: ' + err.message);
                console.error('Segmentation error:', err);
            }
        }
    };

    const handleNoteChange = (segmentId, note) => {
        setNotes(prevNotes => ({
            ...prevNotes,
            [segmentId]: note,
        }));
    };

    const handleSendToStudent = async (studentId) => {
        try {
            const studentDocRef = doc(db, 'users', studentId);
            await setDoc(studentDocRef, {
                segmentedImages,
                notes,
            }, { merge: true });
        } catch (err) {
            setError('Failed to send to student: ' + err.message);
        }
    };

    return (
        <div className="teachers-dashboard">
            <h1>Teacher's Dashboard</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="teaching-mode">
                <h2>Teaching Mode</h2>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {image && (
                    <Cropper
                        src={URL.createObjectURL(image)}
                        style={{ height: 400, width: '100%' }}
                        aspectRatio={1}
                        guides={true}
                        onInitialized={(instance) => {
                            setCropper(instance);
                        }}
                    />
                )}
                <button onClick={handleSegmentation}>Segment Image</button>
                {segmentedImages.map((segmentedImage, index) => (
                    <div key={index} className="segmented-image-container">
                        <img src={segmentedImage} alt={`Segmented ${index}`} />
                        <textarea
                            value={notes[index] || ''}
                            onChange={(e) => handleNoteChange(index, e.target.value)}
                            placeholder="Add notes..."
                        />
                    </div>
                ))}
            </div>
            <div className="quiz-mode">
                <h2>Quiz Mode</h2>
                <p>Placeholder for future quiz feature</p>
            </div>
            <div className="manage-students">
                <h2>Manage Students</h2>
                <ul>
                    {students.map(student => (
                        <li key={student.id}>
                            {student.email}
                            <button onClick={() => handleSendToStudent(student.id)}>Send</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TeachersDashboard;
