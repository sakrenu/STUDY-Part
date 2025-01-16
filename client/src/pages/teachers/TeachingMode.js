import React, { useState, useEffect, useRef } from 'react';
import { 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    updateDoc, 
    getDoc,
    arrayUnion // Import arrayUnion
} from 'firebase/firestore';
import { db } from '../../firebase'; // Import db from Firebase
import axios from 'axios';
import './TeachingMode.css';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

const TeachersDashboard = () => {
    const [image, setImage] = useState(null);
    const [segmentedImages, setSegmentedImages] = useState([]);
    const [notes, setNotes] = useState({});
    const [students, setStudents] = useState([]);
    const [cropper, setCropper] = useState(null);
    const [teacherId, setTeacherId] = useState('teacher_1'); // Store the teacher's ID
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]); // Previously uploaded images
    const [isNotesSaved, setIsNotesSaved] = useState(false); // Track if notes are saved
    const [currentImageUrl, setCurrentImageUrl] = useState(null); // Track the current image URL
    const cropperRef = useRef(null);

    useEffect(() => {
        // Fetch students and teacher data
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

        // Fetch previously uploaded images
        const fetchUploadedImages = async () => {
            try {
                const teacherRef = doc(db, 'teachers', teacherId);
                const teacherData = (await getDoc(teacherRef)).data();
                if (teacherData && teacherData.images) {
                    setUploadedImages(Object.entries(teacherData.images));
                }
            } catch (err) {
                setError('Failed to fetch uploaded images: ' + err.message);
            }
        };

        fetchStudents();
        fetchUploadedImages();
    }, [teacherId]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) setImage(file);
    };

    const handleSelectRegion = () => {
        if (cropperRef.current) {
            const cropper = cropperRef.current.cropper;
            const canvas = cropper.getCroppedCanvas();

            // Convert the canvas to a Blob
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create a URL for the Blob
                    const imageUrl = URL.createObjectURL(blob);
                    setImage(imageUrl); // Update the image state
                } else {
                    setError('Failed to create image blob.');
                }
            }, 'image/jpeg'); // Specify the image format
        }
    };

    const handleSegmentation = async () => {
        if (cropperRef.current) {
            setIsLoading(true);
            const canvas = cropperRef.current.cropper.getCroppedCanvas();
            const croppedImageUrl = canvas.toDataURL('image/jpeg');

            const formData = new FormData();
            formData.append('image', image);

            try {
                // Upload the cropped image to the server
                const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                const imageUrl = uploadResponse.data.image_url;
                setCurrentImageUrl(imageUrl);

                // Perform segmentation
                const segmentResponse = await axios.post('http://localhost:5000/segment', {
                    image_url: imageUrl,
                    bounding_box: {
                        left: cropperRef.current.cropper.getData().x,
                        top: cropperRef.current.cropper.getData().y,
                        width: cropperRef.current.cropper.getData().width,
                        height: cropperRef.current.cropper.getData().height,
                    },
                    teacher_id: teacherId,
                });

                const segmentedUrls = segmentResponse.data.segmented_urls;
                setSegmentedImages(segmentedUrls);
            } catch (err) {
                setError('Segmentation failed: ' + err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleNoteChange = (segmentIndex, note) => {
        setNotes(prevNotes => ({
            ...prevNotes,
            [segmentIndex]: note,
        }));
    };

    // const saveNotes = async () => {
    //     try {
    //         const teacherRef = doc(db, 'teachers', teacherId);
    //         const teacherData = (await getDoc(teacherRef)).data();

    //         // Create a new segment object
    //         const newSegment = {
    //             segment_url: segmentedImages[0], // URL of the segmented part
    //             notes: notes[0] || '', // Notes for the segmented part
    //         };

    //         if (teacherData) {
    //             // Check if the image already exists in Firestore
    //             const existingImageData = teacherData.images?.[currentImageUrl] || { segments: [] };

    //             // Update the segments array for the current image
    //             await updateDoc(teacherRef, {
    //                 [`images.${currentImageUrl}`]: {
    //                     segments: arrayUnion(newSegment), // Add the new segment to the array
    //                 },
    //             });
    //         } else {
    //             // Create a new teacher document
    //             await setDoc(teacherRef, {
    //                 teacherId: teacherId,
    //                 images: {
    //                     [currentImageUrl]: {
    //                         segments: [newSegment], // Initialize with the first segment
    //                     },
    //                 },
    //             });
    //         }

    //         setIsNotesSaved(true);
    //     } catch (err) {
    //         setError('Failed to save notes: ' + err.message);
    //     }
    // };
    const saveNotes = async () => {
        try {
            const teacherRef = doc(db, 'teachers', teacherId);
            const teacherData = (await getDoc(teacherRef)).data();
    
            // Create a new segment object
            const newSegment = {
                segment_url: segmentedImages[0], // URL of the segmented part
                notes: notes[0] || '', // Notes for the segmented part
            };
    
            // Sanitize the URL to make it Firestore-compatible
            const sanitizedImageUrl = encodeURIComponent(currentImageUrl);
    
            if (teacherData) {
                // Check if the image already exists in Firestore
                const existingImageData = teacherData.images?.[sanitizedImageUrl] || { segments: [] };
    
                // Update the segments array for the current image
                await updateDoc(teacherRef, {
                    [`images.${sanitizedImageUrl}`]: {
                        segments: arrayUnion(newSegment), // Add the new segment to the array
                    },
                });
            } else {
                // Create a new teacher document
                await setDoc(teacherRef, {
                    teacherId: teacherId,
                    images: {
                        [sanitizedImageUrl]: {
                            segments: [newSegment], // Initialize with the first segment
                        },
                    },
                });
            }
    
            setIsNotesSaved(true);
        } catch (err) {
            setError('Failed to save notes: ' + err.message);
        }
    };
    

    const handleSegmentAnotherPart = () => {
        setSegmentedImages([]);
        setNotes({});
        setIsNotesSaved(false);
    };

    return (
        <div className="teachers-dashboard">
            {/* Sidebar for previously uploaded images */}
            <div className="sidebar">
                <h2>Previously Uploaded Images</h2>
                <ul>
                    {uploadedImages.map(([imageUrl, imageData]) => (
                        <li key={imageUrl}>
                            <img src={imageUrl} alt="Uploaded" className="uploaded-image" />
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Header */}
                <header className="dashboard-header">
                    <h1 className="dashboard-title">Teaching Mode</h1>
                    <p className="dashboard-subtitle">Manage your students and teaching materials with ease.</p>
                </header>

                {/* Error Message */}
                {error && <div className="error-message">{error}</div>}

                {/* Image Upload and Cropping Section */}
                <section className="upload-section card-neon">
                    <h2>Upload and Segment Image</h2>
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
                        {image && (
                            <div className="cropper-container">
                                <Cropper
                                    src={URL.createObjectURL(image)}
                                    style={{ height: 400, width: '100%' }}
                                    aspectRatio={1}
                                    guides={true}
                                    ref={cropperRef}
                                />
                                <button onClick={handleSelectRegion} className="select-region-button">
                                    Select Region
                                </button>
                            </div>
                        )}
                        <button
                            onClick={handleSegmentation}
                            className="segment-button"
                            disabled={!image || isLoading}
                        >
                            {isLoading ? 'Processing...' : 'Segment Image'}
                        </button>
                    </div>
                </section>

                {/* Segmented Images and Notes Section */}
                {segmentedImages.length > 0 && (
                    <section className="segmented-section card-neon">
                        <h2>Segmented Images and Notes</h2>
                        <div className="segmented-grid">
                            {segmentedImages.map((segmentedImage, index) => (
                                <div key={index} className="segment-card">
                                    <img
                                        src={segmentedImage}
                                        alt={`Segmented Part ${index}`}
                                        className="segmented-image"
                                    />
                                    <textarea
                                        value={notes[index] || ''}
                                        onChange={(e) => handleNoteChange(index, e.target.value)}
                                        placeholder="Add notes..."
                                        className="notes-textarea"
                                    />
                                </div>
                            ))}
                        </div>
                        <button onClick={saveNotes} className="save-notes-button">
                            Save Notes
                        </button>
                        {isNotesSaved && (
                            <div className="notes-saved-message">
                                Notes Saved!
                                <button onClick={handleSegmentAnotherPart} className="segment-another-button">
                                    Segment Another Part
                                </button>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
};

export default TeachersDashboard;
