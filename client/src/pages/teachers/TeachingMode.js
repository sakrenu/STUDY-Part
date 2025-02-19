// export default TeachersDashboard;
import React, { useState, useEffect, useRef } from 'react';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    getDoc,
    arrayUnion,
} from 'firebase/firestore';
import { db } from '../../firebase';
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
    const [teacherId, setTeacherId] = useState('teacher_1');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isNotesSaved, setIsNotesSaved] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [groups, setGroups] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [originalWithHighlight, setOriginalWithHighlight] = useState(null);
    const cropperRef = useRef(null);
    const [processedOutput, setProcessedOutput] = useState(null);
    const [showOutput, setShowOutput] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [segmentNotes, setSegmentNotes] = useState('');

    // Fetch students and groups
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

        const fetchGroups = async () => {
            try {
                const teacherRef = doc(db, 'teachers', teacherId);
                const teacherData = (await getDoc(teacherRef)).data();
                if (teacherData && teacherData.groups) {
                    setGroups(teacherData.groups);
                }
            } catch (err) {
                setError('Failed to fetch groups: ' + err.message);
            }
        };

        fetchStudents();
        fetchUploadedImages();
        fetchGroups();
    }, [teacherId]);

    // Handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file); // Set the image state to the File object
        }
    };

    // Handle region selection
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

    // Handle segmentation
    const handleSegmentation = async () => {
        if (cropperRef.current) {
            setIsLoading(true);
            const canvas = cropperRef.current.cropper.getCroppedCanvas();

            canvas.toBlob(async (blob) => {
                if (blob) {
                    const formData = new FormData();
                    formData.append('image', blob, 'cropped-image.jpg');

                    try {
                        console.log('Uploading image...');
                        const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });

                        const imageUrl = uploadResponse.data.image_url;
                        setCurrentImageUrl(imageUrl);

                        console.log('Processing image with SAM...');
                        const segmentResponse = await axios.post('http://localhost:5000/segment', {
                            image_url: imageUrl,
                            bounding_box: cropperRef.current.cropper.getData(),
                            teacher_id: teacherId,
                        });

                        console.log('Segment response:', segmentResponse.data);

                        // Update state with processed images
                        setSegmentedImages(segmentResponse.data.segmented_urls);
                        setOriginalWithHighlight(segmentResponse.data.original_with_highlight);
                        setProcessedOutput({
                            originalImage: imageUrl,
                            maskedImage: segmentResponse.data.masked_image,
                            cutout: segmentResponse.data.cutout,
                            highlightedOutline: segmentResponse.data.highlighted_outline,
                            originalSize: segmentResponse.data.originalSize
                        });

                    } catch (err) {
                        console.error('Segmentation error:', err);
                        setError('Segmentation failed: ' + err.message);
                    } finally {
                        setIsLoading(false);
                    }
                }
            }, 'image/jpeg');
        }
    };

    // Handle note change
    const handleNoteChange = (segmentIndex, note) => {
        setNotes(prevNotes => ({
            ...prevNotes,
            [segmentIndex]: note,
        }));
    };

    // Save notes
    const saveNotes = async () => {
        try {
            const teacherRef = doc(db, 'teachers', teacherId);
            const teacherData = (await getDoc(teacherRef)).data();

            const newSegment = {
                segment_url: segmentedImages[0],
                notes: notes[0] || '',
            };

            const sanitizedImageUrl = encodeURIComponent(currentImageUrl);

            if (teacherData) {
                const existingImageData = teacherData.images?.[sanitizedImageUrl] || { segments: [] };
                await updateDoc(teacherRef, {
                    [`images.${sanitizedImageUrl}`]: {
                        segments: arrayUnion(newSegment),
                    },
                });
            } else {
                await setDoc(teacherRef, {
                    teacherId: teacherId,
                    images: {
                        [sanitizedImageUrl]: {
                            segments: [newSegment],
                        },
                    },
                });
            }

            setIsNotesSaved(true);
        } catch (err) {
            setError('Failed to save notes: ' + err.message);
        }
    };

    // Handle segment another part
    const handleSegmentAnotherPart = () => {
        setSegmentedImages([]);
        setNotes({});
        setIsNotesSaved(false);
    };

    // Create a new group
    const handleCreateGroup = async () => {
        if (!newGroupName) {
            setError('Group name cannot be empty.');
            return;
        }

        const groupId = `group_${Date.now()}`;
        const newGroup = {
            id: groupId,
            name: newGroupName,
            students: [],
        };

        try {
            const teacherRef = doc(db, 'teachers', teacherId);
            await updateDoc(teacherRef, {
                groups: arrayUnion(newGroup),
            });

            setGroups([...groups, newGroup]);
            setNewGroupName('');
        } catch (err) {
            setError('Failed to create group: ' + err.message);
        }
    };

    // Add selected students to a group
    const handleAddStudentsToGroup = async () => {
        if (!selectedGroup || selectedStudents.length === 0) {
            setError('Please select a group and at least one student.');
            return;
        }

        try {
            const teacherRef = doc(db, 'teachers', teacherId);
            const updatedGroups = groups.map(group => {
                if (group.id === selectedGroup) {
                    return {
                        ...group,
                        students: [...group.students, ...selectedStudents],
                    };
                }
                return group;
            });

            await updateDoc(teacherRef, {
                groups: updatedGroups,
            });

            setGroups(updatedGroups);
            setSelectedStudents([]);
        } catch (err) {
            setError('Failed to add students to group: ' + err.message);
        }
    };

    // Share notes with a group or all students
    const handleShareNotes = async (groupId = null) => {
        try {
            const teacherRef = doc(db, 'teachers', teacherId);
            const teacherData = (await getDoc(teacherRef)).data();

            if (!teacherData || !teacherData.notes) {
                setError('No notes found to share.');
                return;
            }

            const notes = teacherData.notes;

            if (groupId) {
                // Share notes with a specific group
                const group = groups.find(g => g.id === groupId);
                if (!group) {
                    setError('Group not found.');
                    return;
                }

                for (const studentId of group.students) {
                    const studentRef = doc(db, 'users', studentId);
                    await updateDoc(studentRef, {
                        sharedNotes: arrayUnion(...notes),
                    });
                }
            } else {
                // Share notes with all students
                for (const student of students) {
                    const studentRef = doc(db, 'users', student.id);
                    await updateDoc(studentRef, {
                        sharedNotes: arrayUnion(...notes),
                    });
                }
            }

            alert('Notes shared successfully!');
        } catch (err) {
            setError('Failed to share notes: ' + err.message);
        }
    };

    // Add handler for viewing output
    const handleViewOutput = () => {
        setShowOutput(true);
    };

    // Add handler for segment click
    const handleSegmentClick = (segment) => {
        setSelectedSegment(segment);
        setSegmentNotes(segment.notes || '');
    };

    // Render content based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'home':
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
                                {image && (
                                    <div className="cropper-container">
                                        <Cropper
                                            src={image instanceof File ? URL.createObjectURL(image) : image}
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
                                <button onClick={handleViewOutput} className="view-output-button">
                                    View Output
                                </button>
                                {showOutput && renderProcessedOutput()}
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

                        {/* Display the original image with highlighted cutout */}
                        {originalWithHighlight && (
                            <div className="original-with-highlight">
                                <h2>Original Image with Highlighted Cutout</h2>
                                <img
                                    src={originalWithHighlight}
                                    alt="Original with Highlight"
                                    className="original-with-highlight-image"
                                />
                            </div>
                        )}
                    </div>
                );
            case 'manage':
                return (
                    <div className="manage-students">
                        <h2>Manage Students</h2>
                        {error && <div className="error-message">{error}</div>}

                        {/* Create Group Section */}
                        <section className="create-group-section">
                            <h3>Create New Group</h3>
                            <input
                                type="text"
                                placeholder="Enter group name"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                            <button onClick={handleCreateGroup}>Create Group</button>
                        </section>

                        {/* Add Students to Group Section */}
                        <section className="add-students-section">
                            <h3>Add Students to Group</h3>
                            <select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                            >
                                <option value="">Select a group</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                            <div className="student-list">
                                {students.map(student => (
                                    <div key={student.id} className="student-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.includes(student.id)}
                                            onChange={(e) =>
                                                setSelectedStudents(
                                                    e.target.checked
                                                        ? [...selectedStudents, student.id]
                                                        : selectedStudents.filter(id => id !== student.id)
                                                )
                                            }
                                        />
                                        <span>{student.name}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddStudentsToGroup}>Add Selected Students to Group</button>
                        </section>

                        {/* Share Notes Section */}
                        <section className="share-notes-section">
                            <h3>Share Notes</h3>
                            <button onClick={() => handleShareNotes()}>Share Notes with All Students</button>
                            <div className="group-list">
                                {groups.map(group => (
                                    <div key={group.id} className="group-card">
                                        <h4>{group.name}</h4>
                                        <button onClick={() => handleShareNotes(group.id)}>
                                            Share Notes with {group.name}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                );
            case 'library':
                return (
                    <div className="library-content">
                        <h2>Library</h2>
                        <div className="library-grid">
                            {uploadedImages.map(([imageUrl, imageData]) => {
                                // Ensure segments exist and is an array
                                const segments = imageData?.segments || [];
                                return (
                                    <div key={imageUrl} className="library-card">
                                        <img src={imageUrl} alt="Uploaded" className="library-image" />
                                        <div className="library-notes">
                                            {segments.map((segment, index) => (
                                                <div key={index} className="segment-note">
                                                    <img
                                                        src={segment.segment_url}
                                                        alt={`Segment ${index}`}
                                                        className="segment-image"
                                                    />
                                                    <p>{segment.notes}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // Update the render section to include the new output view
    const renderProcessedOutput = () => {
        if (!processedOutput) return null;

        return (
            <div className="processed-output-container">
                <div className="original-image-container">
                    <img 
                        src={processedOutput.originalImage} 
                        alt="Original" 
                        className="base-image"
                    />
                    <div className="highlighted-outline-overlay">
                        <img 
                            src={processedOutput.highlightedOutline}
                            alt="Highlighted outline"
                            className="outline-image"
                            style={{
                                width: `${processedOutput.originalSize.width}px`,
                                height: `${processedOutput.originalSize.height}px`
                            }}
                        />
                    </div>
                    <div className="cutout-overlay">
                        {processedOutput.cutout && (
                            <img
                                src={processedOutput.cutout}
                                alt="Cutout"
                                className="cutout-image clickable"
                                style={{
                                    width: `${processedOutput.originalSize.width}px`,
                                    height: `${processedOutput.originalSize.height}px`
                                }}
                                onClick={() => handleSegmentClick({
                                    segment_url: processedOutput.cutout,
                                    notes: notes[0]
                                })}
                            />
                        )}
                    </div>
                </div>
                {selectedSegment && (
                    <div className="segment-notes-popup">
                        <h3>Teacher's Notes</h3>
                        <p>{segmentNotes}</p>
                        <button onClick={() => setSelectedSegment(null)}>Close</button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="teachers-dashboard">
            {/* Navbar */}
            <nav className="navbar">
                <ul>
                    <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
                        Home
                    </li>
                    <li className={activeTab === 'tutorial' ? 'active' : ''} onClick={() => setActiveTab('tutorial')}>
                        Tutorial
                    </li>
                    <li className={activeTab === 'manage' ? 'active' : ''} onClick={() => setActiveTab('manage')}>
                        Manage Students
                    </li>
                    <li className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>
                        Library
                    </li>
                </ul>
            </nav>

            {/* Main Content */}
            {renderContent()}
        </div>
    );
};

export default TeachersDashboard;
