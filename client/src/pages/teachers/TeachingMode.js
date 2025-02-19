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
    const [processedOutput, setProcessedOutput] = useState(null);
    const [showOutput, setShowOutput] = useState(false);
    const [selectedSegment, setSelectedSegment] = useState(null);
    const [segmentNotes, setSegmentNotes] = useState('');
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [isSelectingRegions, setIsSelectingRegions] = useState(true);
    const [isAddingNotes, setIsAddingNotes] = useState(false);
    const [regionNotes, setRegionNotes] = useState({});
    const [currentRegionIndex, setCurrentRegionIndex] = useState(null);
    const [processedRegions, setProcessedRegions] = useState([]);
    const [currentRegionForNotes, setCurrentRegionForNotes] = useState(null);
    const [isViewingOutput, setIsViewingOutput] = useState(false);
    const [basicContours, setBasicContours] = useState([]);
    const [basicNotes, setBasicNotes] = useState({});
    const [showNotePopup, setShowNotePopup] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [showNotesInput, setShowNotesInput] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [contourCanvas, setContourCanvas] = useState(null);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

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
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const formData = new FormData();
                formData.append('image', file);
                
                const response = await axios.post('http://localhost:5000/upload', formData);
                const imageUrl = response.data.image_url;
                
                setCurrentImageUrl(imageUrl);  // Set the current image URL
                setImage(file);
                setIsSelectingRegions(true);
                setSelectedRegions([]);
            } catch (error) {
                setError('Failed to upload image: ' + error.message);
            }
        }
    };

    // Handle region selection
    const handleSelectRegion = () => {
        if (cropperRef.current) {
            const cropData = cropperRef.current.cropper.getData();
            setSelectedRegions([...selectedRegions, cropData]);
            
            // Reset cropper for next selection
            cropperRef.current.cropper.clear();
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

    // Add handler for viewing output
    const handleViewOutput = () => {
        setShowOutput(true);
    };

    // Add handler for segment click
    const handleSegmentClick = (segment) => {
        setSelectedSegment(segment);
        setSegmentNotes(segment.notes || '');
    };

    // Add new function to handle completion of region selection
    const handleDoneSelecting = async () => {
        try {
            if (!currentImageUrl) {
                throw new Error('No image URL available');
            }

            setIsLoading(true);
            console.log('Processing regions:', selectedRegions);

            const processedResults = await Promise.all(
                selectedRegions.map((region, index) => 
                    axios.post('http://localhost:5000/segment', {
                        image_url: currentImageUrl,
                        bounding_box: {
                            x: Math.round(region.x),
                            y: Math.round(region.y),
                            width: Math.round(region.width),
                            height: Math.round(region.height),
                            rotate: region.rotate || 0
                        },
                        teacher_id: teacherId,
                        region_index: index
                    })
                )
            );

            setProcessedRegions(processedResults.map(response => response.data));
            setIsSelectingRegions(false);
            setIsAddingNotes(true);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to process regions: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Add function to handle note addition
    const handleAddNote = (index, note) => {
        setRegionNotes(prev => ({
            ...prev,
            [index]: note
        }));
    };

    // Add function to handle completion of note addition
    const handleDoneAddingNotes = () => {
        setIsAddingNotes(false);
        setIsViewingOutput(true);
    };

    // Handle clicking on a region to add/view notes
    const handleRegionClick = (index) => {
        if (isAddingNotes) {
            setCurrentRegionForNotes(index);
        } else if (isViewingOutput) {
            // Show saved notes in a popup
            setCurrentRegionForNotes(index);
        }
    };

    // Handle saving notes for a specific region
    const handleSaveNotes = async (index, notes) => {
        try {
            console.log('Saving notes for region:', index, notes);
            setIsLoading(true);
            setError(''); // Clear any previous errors
            
            if (!notes || notes.trim() === '') {
                throw new Error('Please enter some notes before saving');
            }

            const response = await axios.post('http://localhost:5000/add_note', {
                image_url: currentImageUrl,
                segment_index: index.toString(),
                note: notes.trim(),
                teacher_id: teacherId
            });

            if (response.data.message) {
                // Update local state with the new note
                setRegionNotes(prev => ({
                    ...prev,
                    [index]: notes
                }));
                setCurrentRegionForNotes(null);
                // Show success message
                console.log('Note saved successfully');
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            const errorMessage = error.response?.data?.error || error.message;
            setError('Failed to save notes: ' + errorMessage);
        } finally {
            setIsLoading(false);
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
                            </div>

                            {/* Image Selection Area */}
                            {image && isSelectingRegions && (
                                <div className="cropper-container">
                                    <Cropper
                                        src={image instanceof File ? URL.createObjectURL(image) : image}
                                        style={{ 
                                            height: 600,
                                            width: '100%',
                                            maxWidth: 800
                                        }}
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
                                                <button onClick={() => cropperRef.current.cropper.clear()} className="select-another-button">
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

                            {/* Notes Addition Area */}
                            {isAddingNotes && processedOutput && (
                                <div className="notes-addition-container">
                                    <h3>Add Notes to Selected Regions</h3>
                                    <div className="original-image-container">
                                        <img 
                                            src={processedOutput.originalImage} 
                                            alt="Original" 
                                            className="base-image"
                                            style={{
                                                width: '800px',
                                                height: '600px',
                                                objectFit: 'contain'
                                            }}
                                        />
                                        {processedOutput.regions.map((region, index) => (
                                            <div 
                                                key={index}
                                                className="region-note-section"
                                                onClick={() => setCurrentRegionIndex(index)}
                                            >
                                                <img 
                                                    src={region.highlightedOutline}
                                                    alt={`Region ${index + 1}`}
                                                    className="region-outline"
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain'
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {currentRegionIndex !== null && (
                                        <div className="note-input-popup">
                                            <textarea
                                                value={regionNotes[currentRegionIndex] || ''}
                                                onChange={(e) => handleAddNote(currentRegionIndex, e.target.value)}
                                                placeholder="Add notes for this region..."
                                                className="notes-textarea"
                                            />
                                            <button onClick={() => setCurrentRegionIndex(null)} className="save-note-button">
                                                Save Note
                                            </button>
                                        </div>
                                    )}
                                    <button 
                                        onClick={handleDoneAddingNotes}
                                        className="done-notes-button"
                                    >
                                        Done Adding Notes
                                    </button>
                                </div>
                            )}

                            {/* Final Output View */}
                            {showOutput && processedOutput && (
                                <div className="final-output-container">
                                    <h3>Final Output</h3>
                                    <div className="original-image-container">
                                        {/* Your existing output view code */}
                                    </div>
                                </div>
                            )}
                        </section>
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

    // Update the render section to include the new output view
    const renderProcessedOutput = () => {
        return (
            <div className="processed-output-container">
                <div className="original-image-container">
                    {/* Base Image */}
                    <img 
                        src={currentImageUrl} 
                        alt="Original" 
                        className="base-image"
                        style={{
                            width: '800px',
                            height: '600px',
                            objectFit: 'contain'
                        }}
                    />
                    
                    {/* Overlay all highlighted regions */}
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
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Notes Input Popup */}
                {currentRegionForNotes !== null && isAddingNotes && (
                    <div className="notes-popup">
                        <h3>Add Notes for Region {currentRegionForNotes + 1}</h3>
                        <textarea
                            value={regionNotes[currentRegionForNotes] || ''}
                            onChange={(e) => setRegionNotes(prev => ({
                                ...prev,
                                [currentRegionForNotes]: e.target.value
                            }))}
                            placeholder="Add notes for this region..."
                            className="notes-textarea"
                            disabled={isLoading}
                        />
                        <div className="notes-popup-buttons">
                            <button 
                                onClick={() => handleSaveNotes(currentRegionForNotes, regionNotes[currentRegionForNotes])}
                                className="save-notes-button"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Save Notes'}
                            </button>
                            <button 
                                onClick={() => setCurrentRegionForNotes(null)}
                                className="cancel-button"
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* View Notes Popup */}
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

                {/* Show Done Adding Notes button only when in adding notes mode */}
                {isAddingNotes && (
                    <button 
                        onClick={handleDoneAddingNotes}
                        className="done-notes-button"
                    >
                        Done Adding Notes
                    </button>
                )}
            </div>
        );
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
                    <li className={activeTab === 'basicversion' ? 'active' : ''} onClick={() => setActiveTab('basicversion')}>
                        Basic Version
                    </li>
                </ul>
            </nav>

            {/* Main Content */}
            {renderContent()}
            
            {/* Only show SAM processing outputs in the Home tab */}
            { activeTab === 'home' && isLoading && 
              <div className="loading-message">Processing regions...</div> 
            }
            
            { activeTab === 'home' && (isAddingNotes || isViewingOutput) && renderProcessedOutput() }
        </div>
    );
};

export default TeachingMode;
