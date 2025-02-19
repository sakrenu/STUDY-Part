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
import BasicVersion from './BasicVersion';

const TeachingMode = () => {
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
    const [basicContours, setBasicContours] = useState([]);
    const [basicNotes, setBasicNotes] = useState({});
    const [showNotePopup, setShowNotePopup] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [showNotesInput, setShowNotesInput] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [contourCanvas, setContourCanvas] = useState(null);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [processedRegions, setProcessedRegions] = useState([]);

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

            // Convert the canvas to a Blob
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const formData = new FormData();
                    formData.append('image', blob, 'cropped-image.jpg'); // Append the Blob to FormData

                    try {
                        const uploadResponse = await axios.post('http://localhost:5000/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });

                        const imageUrl = uploadResponse.data.image_url;
                        setCurrentImageUrl(imageUrl);

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
                        const originalWithHighlightUrl = segmentResponse.data.original_with_highlight;

                        // Update state variables
                        setSegmentedImages(segmentedUrls);
                        setOriginalWithHighlight(originalWithHighlightUrl);
                    } catch (err) {
                        setError('Segmentation failed: ' + err.message);
                    } finally {
                        setIsLoading(false);
                    }
                } else {
                    setError('Failed to create image blob.');
                    setIsLoading(false);
                }
            }, 'image/jpeg'); // Specify the image format
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

            // Get the cropper data for coordinates
            const cropData = cropperRef.current.cropper.getData();
            
            const newSegment = {
                segment_url: segmentedImages[0],
                notes: notes[0] || '',
                coordinates: {
                    x: (cropData.x / cropperRef.current.cropper.getContainerData().width) * 100,
                    y: (cropData.y / cropperRef.current.cropper.getContainerData().height) * 100,
                    width: (cropData.width / cropperRef.current.cropper.getContainerData().width) * 100,
                    height: (cropData.height / cropperRef.current.cropper.getContainerData().height) * 100
                }
            };

            // Add to processed regions
            setProcessedRegions(prev => [...prev, newSegment]);

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
            case 'basicversion':
                return <BasicVersion />;
            default:
                return null;
        }
    };

    // Replace the handleAddContour function
    const handleRegionSelect = () => {
        if (!cropperRef.current || !imageRef.current) {
            console.error('Cropper or image reference not available');
            return;
        }

        try {
            const cropper = cropperRef.current.cropper;
            const cropData = cropper.getData();
            
            // Ensure we have valid dimensions
            if (cropData.width <= 0 || cropData.height <= 0) {
                console.error('Invalid crop dimensions');
                return;
            }

            setSelectedRegion(cropData);

            // Create a temporary canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions to match the cropped region
            canvas.width = Math.round(cropData.width);
            canvas.height = Math.round(cropData.height);

            // Wait for image to load
            const image = imageRef.current;
            if (!image.complete) {
                image.onload = () => processRegion(image, cropData, canvas, ctx);
            } else {
                processRegion(image, cropData, canvas, ctx);
            }
        } catch (error) {
            console.error('Error in handleRegionSelect:', error);
            setError('Failed to process selected region');
        }
    };

    // Separate function to process the region
    const processRegion = (image, cropData, canvas, ctx) => {
        try {
            // Draw the cropped region
            ctx.drawImage(
                image,
                Math.round(cropData.x),
                Math.round(cropData.y),
                Math.round(cropData.width),
                Math.round(cropData.height),
                0,
                0,
                Math.round(cropData.width),
                Math.round(cropData.height)
            );

            // Get image data and detect edges
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const edgeData = detectEdges(imageData);

            // Draw edges on the contour canvas
            if (canvasRef.current) {
                const contourCtx = canvasRef.current.getContext('2d');
                canvasRef.current.width = canvas.width;
                canvasRef.current.height = canvas.height;
                contourCtx.putImageData(edgeData, 0, 0);
            }

            setContourCanvas(canvas.toDataURL());
        } catch (error) {
            console.error('Error in processRegion:', error);
            setError('Failed to process region');
        }
    };

    const handleAddNotes = () => {
        if (selectedRegion && currentNote) {
            setBasicContours(prev => [...prev, selectedRegion]);
            setBasicNotes(prev => ({
                ...prev,
                [basicContours.length]: currentNote
            }));
            // Reset states
            setSelectedRegion(null);
            setShowNotesInput(false);
            setCurrentNote('');
        }
    };

    const handleDone = () => {
        setShowNotesInput(false);
        setSelectedRegion(null);
        // You can add any additional cleanup or state resets here
    };

    const detectEdges = (imageData) => {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const output = new Uint8ClampedArray(width * height * 4);

        // Convert to grayscale and apply Sobel operator for edge detection
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Get surrounding pixels
                const tl = getGrayscale(data, (y - 1) * width + (x - 1), width);
                const t = getGrayscale(data, (y - 1) * width + x, width);
                const tr = getGrayscale(data, (y - 1) * width + (x + 1), width);
                const l = getGrayscale(data, y * width + (x - 1), width);
                const r = getGrayscale(data, y * width + (x + 1), width);
                const bl = getGrayscale(data, (y + 1) * width + (x - 1), width);
                const b = getGrayscale(data, (y + 1) * width + x, width);
                const br = getGrayscale(data, (y + 1) * width + (x + 1), width);

                // Sobel operators
                const gx = -tl - 2 * l - bl + tr + 2 * r + br;
                const gy = -tl - 2 * t - tr + bl + 2 * b + br;

                const g = Math.sqrt(gx * gx + gy * gy);

                // Threshold for edges
                const isEdge = g > 50 ? 255 : 0;

                output[idx] = isEdge;     // R
                output[idx + 1] = isEdge; // G
                output[idx + 2] = isEdge; // B
                output[idx + 3] = 255;    // A
            }
        }

        return new ImageData(output, width, height);
    };

    const getGrayscale = (data, idx, width) => {
        idx *= 4;
        // Convert RGB to grayscale using luminosity method
        return data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    };

    useEffect(() => {
        if (image) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                imageRef.current = img;
            };
            img.onerror = (error) => {
                console.error('Error loading image:', error);
                setError('Failed to load image');
            };
            img.src = image instanceof File ? URL.createObjectURL(image) : image;
        }
    }, [image]);

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
                    <li 
                        className={activeTab === 'basicversion' ? 'active' : ''} 
                        onClick={() => setActiveTab('basicversion')}
                    >
                        Basic Version
                    </li>
                </ul>
            </nav>

            {/* Main Content */}
            {renderContent()}
        </div>
    );
};

export default TeachingMode;
