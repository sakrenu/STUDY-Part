import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotesMode.css';
import { getAuth } from 'firebase/auth';
import { db, storage } from '../../firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import axios from 'axios';

const BACKEND_URL = 'http://127.0.0.1:8000'; // Define this at the top level, after imports

const NotesMode = () => {
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [cropper, setCropper] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showToggleText, setShowToggleText] = useState(false);
    const [note, setNote] = useState('');
    const [savedNotes, setSavedNotes] = useState([]);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [selectedNote, setSelectedNote] = useState(null);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [isSelectingRegions, setIsSelectingRegions] = useState(true);
    const [processedRegions, setProcessedRegions] = useState([]);
    const [currentRegionForNotes, setCurrentRegionForNotes] = useState(null);
    const [regionNotes, setRegionNotes] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const cropperRef = useRef(null);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [isNotesPopupVisible, setIsNotesPopupVisible] = useState(false);
    // Add a new state variable at the top of the component:
    const [combinedSegmentImage, setCombinedSegmentImage] = useState(null);
    const [regionData, setRegionData] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;
    const [isEditing, setIsEditing] = useState(false);
    const [simulationProgress, setSimulationProgress] = useState(0);
    const [simulationMessage, setSimulationMessage] = useState('');
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const NotesPopup = ({ regionIndex, regionNotes, setRegionNotes, onSave, onClose }) => {
        const [noteText, setNoteText] = useState(regionNotes[regionIndex] || '');
    
        const handleSave = () => {
            onSave(regionIndex, noteText);
            onClose();
        };
    
        return (
            <div className="notes-popup-overlay">
                <div className="notes-popup">
                    <h3>Add Notes for Region {regionIndex + 1}</h3>
                    <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add notes..."
                        className="notes-textarea"
                    />
                    <div className="notes-popup-buttons">
                        <button onClick={handleSave} className="save-note-button">
                            Save
                        </button>
                        <button onClick={onClose} className="cancel-note-button">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    // Fetch notes from Firestore
    const fetchNotes = async () => {
        if (!user) return;

        try {
            const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const notes = [];
            querySnapshot.forEach((doc) => {
                notes.push({ id: doc.id, ...doc.data() });
            });
            setSavedNotes(notes); // Update savedNotes state with fetched notes
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    // Fetch notes on component mount and when user changes
    useEffect(() => {
        fetchNotes();
    }, [user]); // Dependency on `user` ensures notes are fetched when user logs in

    // Add this useEffect after other useEffects
    useEffect(() => {
        // Reset all states when component mounts
        setSelectedNote(null);
        setNote('');
        setImage(null);
        setCurrentImageUrl(null);
        setSelectedRegions([]);
        setProcessedRegions([]);
        setRegionNotes({});
        setIsSelectingRegions(true);
        setCombinedSegmentImage(null);
        setRegionData([]);
        setIsEditing(false);
    }, []); // Empty dependency array means this runs once on mount

    // Handle image upload
    const handleImageUpload = async (file) => {
        if (file) {
            try {
                setIsLoading(true);
                // Reset all relevant states when new image is uploaded
                setNote('');
                setSelectedRegions([]);
                setProcessedRegions([]);
                setRegionNotes({});
                setRegionData([]);
                setCombinedSegmentImage(null);
                setSelectedNote(null);
                setIsEditing(false);
                
                const formData = new FormData();
                formData.append('image', file);
                
                console.log('Uploading image to backend...');
                const response = await axios.post(`${BACKEND_URL}/v1/deprecated/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 30000 // 30 seconds timeout
                });
                
                console.log('Upload response:', response.data);
                const imageUrl = response.data.image_url;
                
                setCurrentImageUrl(imageUrl);
                setImage(file);
                setIsSelectingRegions(true);
            } catch (error) {
                console.error('Failed to upload image:', error);
                let errorMessage = 'Error uploading image: ';
                
                if (error.response) {
                    // Server responded with an error
                    errorMessage += error.response.data?.error || error.response.data?.detail || error.response.statusText || error.message;
                } else if (error.request) {
                    // Request was made but no response received
                    errorMessage += 'No response from server. Please check if the backend is running on port 8000.';
                } else {
                    // Error in setting up the request
                    errorMessage += error.message;
                }
                
                alert(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            try {
                setIsLoading(true);
                setError(null);
                const reader = new FileReader();
                reader.onload = (e) => {
                    setCurrentImageUrl(e.target.result);
                };
                reader.readAsDataURL(file);

                // Start simulation progress
                let progress = 0;
                const progressInterval = setInterval(() => {
                    if (progress < 90) {
                        progress += progress < 25 ? 2 : 1;
                        setSimulationProgress(progress);
                        setSimulationMessage(
                            progress < 25 ? 
                            `Loading your image... (${Math.round(progress)}%)` :
                            progress < 50 ?
                            `Processing image... (${Math.round(progress)}%)` :
                            `Almost there (${Math.round(progress)}%)`
                        );
                    }
                }, 50);

                // Handle file upload
                const formData = new FormData();
                formData.append('file', file);

                // Wait before completing to show some progress
                setTimeout(() => {
                    handleImageUpload(file);
                    clearInterval(progressInterval);
                    
                    // Complete the progress animation
                    setSimulationProgress(100);
                    setSimulationMessage(`Finishing up (100%)`);
                    
                    setTimeout(() => {
                        setIsLoading(false);
                        setSimulationProgress(0);
                        setSimulationMessage('');
                    }, 500);
                }, 1000);

            } catch (error) {
                console.error('Error handling file:', error);
                setError('Failed to process image. Please try again.');
                setIsLoading(false);
            }
        }
    };

    // Handle region selection
    const handleSelectRegion = () => {
        if (cropperRef.current) {
            const cropData = cropperRef.current.cropper.getData();
            const boundingBox = {
                x: Math.round(cropData.x),
                y: Math.round(cropData.y),
                width: Math.round(cropData.width),
                height: Math.round(cropData.height),
                rotate: cropData.rotate || 0
            };
            setSelectedRegions([...selectedRegions, boundingBox]);
            cropperRef.current.cropper.clear();
        }
    };

    // Handle segmentation with proper progress updates
    const handleDoneSelecting = async () => {
        try {
            if (!currentImageUrl) {
                throw new Error('No image URL available');
            }

            if (selectedRegions.length === 0) {
                alert('Please select at least one region before proceeding');
                return;
            }

            setIsLoading(true);
            console.log('Processing regions:', selectedRegions);
            
            // Format the bounding boxes correctly for the API
            const formattedBoundingBoxes = selectedRegions.map(region => ({
                x: region.x,
                y: region.y,
                width: region.width,
                height: region.height
            }));
            
            // Start simulation progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                if (progress < 95) {
                    progress += 2;
                    setSimulationProgress(progress);
                    setSimulationMessage(
                        progress < 25 ? 
                        `Processing regions... (${Math.round(progress)}%)` :
                        progress < 50 ?
                        `Analyzing segments... (${Math.round(progress)}%)` :
                        progress < 75 ?
                        `Creating visual maps... (${Math.round(progress)}%)` :
                        `Almost there (${Math.round(progress)}%)`
                    );
                }
            }, 100);

            // Log the request for debugging
            console.log('Sending request to backend with:', {
                image_url: currentImageUrl,
                bounding_boxes: formattedBoundingBoxes
            });

            // Make API call to segment the image
            const response = await axios.post(`${BACKEND_URL}/v1/deprecated/segment-all`, {
                image_url: currentImageUrl,
                bounding_boxes: formattedBoundingBoxes
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 60000 // 60 seconds timeout - segmentation can take time
            });

            // Log the response for debugging
            console.log('Received response from backend:', response.data);

            clearInterval(progressInterval);
            setSimulationProgress(100);
            setSimulationMessage('Segmentation complete!');
            
            setTimeout(() => {
                if (response.data && response.data.combined_image) {
                    setCombinedSegmentImage(response.data.combined_image);
                    setRegionData(response.data.regions || []); // Ensure regionData is at least an empty array
                    setIsSelectingRegions(false);
                    setIsLoading(false);
                    setSimulationProgress(0);
                    setSimulationMessage('');
                } else {
                    throw new Error('Invalid response from server: missing combined_image');
                }
            }, 500);

        } catch (error) {
            // Enhanced error handling
            console.error('Error details:', error);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);
            
            let errorMessage = 'Error processing image: ';
            if (error.response) {
                // Server responded with an error
                errorMessage += error.response.data?.error || error.response.data?.detail || error.response.statusText || error.message;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage += 'No response from server. Please check if the backend is running.';
            } else {
                // Error in setting up the request
                errorMessage += error.message;
            }
            
            alert(errorMessage);
            setIsLoading(false);
            setSimulationProgress(0);
            setSimulationMessage('');
        }
    };
    

    // Add this function to check if any region has notes
    const hasAnyNotes = () => {
        return Object.values(regionNotes).some(note => note.trim() !== '');
    };

    // Modify the handleSaveNote function
    const handleSaveNote = async () => {
        if (!currentImageUrl) {
            alert('Please select an image first');
            return;
        }

        if (!hasAnyNotes()) {
            alert('Please add notes for at least one region');
            return;
        }

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert('Please sign in to save notes');
            return;
        }

        try {
            setIsLoading(true);
            // Create region data array from regionData and regionNotes
            const regions = regionData.map(region => ({
                index: region.index,
                bbox: region.bbox,
                notes: regionNotes[region.index] || ''  // Use region.index to get correct notes
            }));

            const noteData = {
                userId: user.uid,
                imageUrl: currentImageUrl,
                createdAt: new Date().toISOString(),
                regions: regions,
                combinedImage: combinedSegmentImage
            };

            if (isEditing && selectedNote) {
                // Update existing note
                await updateDoc(doc(db, 'notes', selectedNote.id), noteData);
                setSavedNotes(savedNotes.map(note => 
                    note.id === selectedNote.id ? {...noteData, id: selectedNote.id} : note
                ));
                alert('Note updated successfully!');
            } else {
                // Create new note
                const docRef = await addDoc(collection(db, 'notes'), noteData);
                setSavedNotes([...savedNotes, { ...noteData, id: docRef.id }]);
                alert('Note saved successfully!');
            }

            // Reset states
            setNote('');
            setImage(null);
            setCurrentImageUrl(null);
            setProcessedRegions([]);
            setRegionNotes({});
            setSelectedRegions([]);
            setIsSelectingRegions(true);
            setCombinedSegmentImage(null);
            setRegionData([]);
            setSelectedNote(null);
            setIsEditing(false);
            
            fetchNotes();
        } catch (error) {
            console.error("Error saving note:", error);
            alert('Error saving note: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle note deletion
    const handleDeleteNote = async (noteId, imageUrl) => {
        try {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await axios.delete('http://127.0.0.1:8000/v1/deprecated/delete-image', {
                data: { public_id: publicId }
            });

            await deleteDoc(doc(db, 'notes', noteId));
            setSavedNotes(savedNotes.filter(note => note.id !== noteId)); // Remove deleted note from savedNotes
            alert('Note deleted successfully!');
        } catch (error) {
            console.error("Error deleting note:", error);
            alert('Error deleting note: ' + error.message);
        } finally {
            setNoteToDelete(null);
        }
    };

    // Cancel deletion of a note
    const cancelDelete = () => {
        setNoteToDelete(null);
    };

    // Update handleNoteSelection function
    const handleNoteSelection = (note) => {
        setSelectedNote(note);
        setCurrentImageUrl(note.imageUrl);
        setCombinedSegmentImage(note.combinedImage);
        setIsSelectingRegions(false);
        setIsEditing(true); // Set editing mode when note is selected
        
        // Set region data and notes
        setRegionData(note.regions.map(region => ({
            index: region.index,
            bbox: region.bbox
        })));
        
        // Convert regions array to regionNotes object
        const notesObj = note.regions.reduce((acc, region) => {
            acc[region.index] = region.notes;
            return acc;
        }, {});
        setRegionNotes(notesObj);
    };

    // Handle note update
    const handleUpdateNote = async () => {
        if (!selectedNote) return;

        try {
            setIsLoading(true);
            const noteData = {
                ...selectedNote,
                note: note,
                regions: processedRegions.map((region, index) => ({
                    ...region,
                    notes: regionNotes[index] || '',
                }))
            };

            await updateDoc(doc(db, 'notes', selectedNote.id), noteData);
            setSavedNotes(savedNotes.map(n => n.id === selectedNote.id ? noteData : n));
            alert('Note updated successfully!');
        } catch (error) {
            console.error("Error updating note:", error);
            alert('Error updating note: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle region click
    const handleRegionClick = (event) => {
        if (!regionData || regionData.length === 0) {
            console.warn('No region data available');
            return;
        }
    
        const rect = event.target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const scaleX = event.target.naturalWidth / rect.width;
        const scaleY = event.target.naturalHeight / rect.height;
        const clickX = x * scaleX;
        const clickY = y * scaleY;
    
        // Find which region was clicked by checking if the click point is inside any bounding box
        let clickedRegion = null;
        let minArea = Infinity;

        regionData.forEach(region => {
            const [x1, y1, x2, y2] = region.bbox;
            
            // Check if click is inside this region
            if (clickX >= x1 && clickX <= x2 && clickY >= y1 && clickY <= y2) {
                // Calculate area of this region
                const area = (x2 - x1) * (y2 - y1);
                // If this is the smallest region containing the click point, use it
                if (area < minArea) {
                    minArea = area;
                    clickedRegion = region;
                }
            }
        });
    
        if (clickedRegion) {
            console.log('Clicked region:', clickedRegion);
            setCurrentRegionForNotes(clickedRegion.index);
            setIsNotesPopupVisible(true);
        } else {
            console.log('No region found at click location');
        }
    };

    // Handle save notes
    const handleSaveNotes = (index, note) => {
        setRegionNotes({ ...regionNotes, [index]: note });
    };

    // Handle close popup
    const handleClosePopup = () => {
        setIsNotesPopupVisible(false);
        setCurrentRegionForNotes(null);
    };

    return (
        <div className="notes-mode">
            {/* Top Navigation */}
            <nav className="top-nav">
                <div className="logo-container">
                    <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
                    <a href="/" className="logo">
                        <span className="study">Study</span>
                        <span className="part">Part</span>
                    </a>
                </div>
                <button className="back-btn" onClick={() => navigate('/student-dashboard')}>Back</button>
            </nav>

            <div className="notes-container">
                <h1 className="notes-title">Notes Mode</h1>

                <div className={`notes-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <h2>Notes List</h2>
                    <button 
                        className="new-note-button"
                        onClick={() => {
                            setSelectedNote(null);
                            setNote('');
                            setImage(null);
                            setCurrentImageUrl(null); // Reset image URL
                            setSelectedRegions([]); // Reset selected regions
                            setProcessedRegions([]); // Reset processed regions
                            setRegionNotes({}); // Reset region notes
                            setIsSelectingRegions(true); // Reset to region selection mode
                        }}
                    >
                        New Note
                    </button>
                    <div className="sidebar-notes">
                        {savedNotes.length === 0 ? (
                            <p className="no-notes">No notes yet.</p>
                        ) : (
                            savedNotes.map((note, index) => (
                                <div key={note.id || index} className="sidebar-note-item" onClick={() => handleNoteSelection(note)}>
                                    <img 
                                        src={note.imageUrl} 
                                        alt="Note thumbnail" 
                                        className="note-thumbnail"
                                    />
                                    <div 
                                        className="note-content-preview"
                                        dangerouslySetInnerHTML={{ __html: note.note }}
                                    />
                                    <p className="note-date">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                    {noteToDelete?.noteId === note.id ? (
                                        <div className="delete-confirmation">
                                            <p>Are you sure?</p>
                                            <button 
                                                className="confirm-delete-button"
                                                onClick={() => handleDeleteNote(note.id, note.imageUrl)}
                                            >
                                                Yes, Delete
                                            </button>
                                            <button 
                                                className="cancel-delete-button"
                                                onClick={cancelDelete}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="note-actions">
                                            <button 
                                                className="delete-note-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNoteToDelete({ noteId: note.id, imageUrl: note.imageUrl });
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Toggle Button with Arrow */}
                <div
                    className={`toggle-button-container ${isSidebarOpen ? 'open' : 'closed'}`}
                    onMouseEnter={() => setShowToggleText(true)}
                    onMouseLeave={() => setShowToggleText(false)}
                >
                    <button 
                        className="toggle-button" 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
                    >
                        <span className={`sidebar-arrow ${isSidebarOpen ? 'arrow-left' : 'arrow-right'}`}>
                            <svg width="28" height="28" viewBox="0 0 28 28">
                                <polyline
                                    points="18,6 10,14 18,22"
                                    fill="none"
                                    stroke="#4A90E2"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                    </button>
                    {showToggleText && (
                        <span className="toggle-text">{isSidebarOpen ? 'Close' : 'Open'}</span>
                    )}
                </div>

                {/* Main Content */}
                <div className={`main-content ${isSidebarOpen ? '' : 'closed'}`}>
                    <div className="upload-section">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            style={{ display: 'none' }}
                            disabled={isLoading}
                        />
                        
                        {!currentImageUrl && !isLoading && (
                            <div className="choose-image-container">
                                <button 
                                    className="upload-button" 
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={isLoading}
                                >
                                    Choose Image
                                </button>
                                <div className="no-image-message">
                                    <p>Please select an image to upload</p>
                                </div>
                            </div>
                        )}

                        {currentImageUrl && isSelectingRegions && !isLoading && (
                            <div className="cropper-container">
                                <Cropper
                                    src={currentImageUrl}
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

                        {currentImageUrl && isLoading && (
                            <div className="image-preview">
                                <div className="processing-animation">
                                    <img
                                        src={currentImageUrl}
                                        alt="Preview"
                                        className={`preview-image dull-image`}
                                    />
                                    <div className="processing-overlay" />
                                    <div className="simulation-overlay">
                                        <div className="simulation-bar-container">
                                            <div className="simulation-bar">
                                                <div 
                                                    className="simulation-progress"
                                                    style={{ width: `${simulationProgress}%` }}
                                                />
                                                <div className="simulation-glow" />
                                            </div>
                                        </div>
                                        <div className="simulation-percentage">
                                            {Math.round(simulationProgress)}%
                                        </div>
                                        <div className="simulation-message">
                                            {simulationMessage}
                                        </div>
                                    </div>
                                    <div className="neural-animation-overlay">
                                        <div className="neural-particles" />
                                        <div className="neural-particles" />
                                        <div className="neural-particles" />
                                    </div>
                                </div>
                                <p className="processing-text">Processing your image...</p>
                            </div>
                        )}
                    </div>

                    {/* Display Segmented Regions - only shown when not in cropping mode */}
                    {!isSelectingRegions && combinedSegmentImage && !isLoading && (
                        <div className="combined-segments-container">
                            <h3>Click on a region to add notes</h3>
                            <div className="interactive-image-container">
                                <img 
                                    src={combinedSegmentImage} 
                                    alt="All segments" 
                                    className="combined-segments-image" 
                                    onClick={handleRegionClick}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                            <button 
                                onClick={handleSaveNote} 
                                className="save-all-notes-button"
                                disabled={!hasAnyNotes()}
                            >
                                Save All Notes
                            </button>
                        </div>
                    )}

                    {/* Notes Popup */}
                    {isNotesPopupVisible && (
                        <NotesPopup
                            regionIndex={currentRegionForNotes}
                            regionNotes={regionNotes}
                            setRegionNotes={setRegionNotes}
                            onSave={handleSaveNotes}
                            onClose={handleClosePopup}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesMode;
