import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; // Import db from the firebase configuration file
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
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
    const [croppedImage, setCroppedImage] = useState(null);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

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
            <header className="dashboard-header">
                <h1>Teacher's Dashboard</h1>
                <button
                    className="back-button"
                    onClick={() => navigate('/dashboard')}
                >
                    Back to Features Dashboard
                </button>
            </header>

            {error && <p className="error-message">{error}</p>}

            <div className="dashboard-section">
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
                <button className="dashboard-action-button" onClick={handleSegmentation}>
                    Segment Image
                </button>
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

            <div className="dashboard-section">
                <h2>Quiz Mode</h2>
                <p>Placeholder for future quiz feature</p>
            </div>

            <div className="dashboard-section">
                <h2>Manage Students</h2>
                <ul>
                    {students.map(student => (
                        <li key={student.id}>
                            {student.email}
                            <button className="dashboard-action-button" onClick={() => handleSendToStudent(student.id)}>
                                Send
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TeachersDashboard;
