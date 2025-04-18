import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotesMode.css';
import { getAuth } from 'firebase/auth';
import { db, storage } from '../../firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import axios from 'axios';

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
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
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
                
                const response = await axios.post('http://127.0.0.1:8000/upload', formData);
                const imageUrl = response.data.image_url;
                
                setCurrentImageUrl(imageUrl);
                setImage(file);
                setIsSelectingRegions(true);
            } catch (error) {
                console.error('Failed to upload image:', error);
                alert('Error uploading image: ' + error.message);
            } finally {
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

    // Handle segmentation
    const handleDoneSelecting = async () => {
        try {
            if (!currentImageUrl) {
                throw new Error('No image URL available');
            }
    
            setIsLoading(true);
            console.log('Processing regions:', selectedRegions);
    
            const response = await axios.post('http://127.0.0.1:8000/segment-all', {
                image_url: currentImageUrl,
                bounding_boxes: selectedRegions
            });
    
            setCombinedSegmentImage(response.data.combined_image);
            setRegionData(response.data.regions || []); // Ensure regionData is at least an empty array
            setIsSelectingRegions(false);
    
        } catch (error) {
            console.error('Error:', error);
            alert('Error processing image: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsLoading(false);
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
            await fetch('/delete-image', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ publicId }),
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
            {/* Navigation Bar */}
            <nav className="nav-container">
                <div className="logo-container">
                    <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
                    <a href="/" className="logo">
                        <span className="study">Study</span>
                        <span className="part">Part</span>
                    </a>
                </div>
                <button 
                    onClick={() => navigate('/student-dashboard')} 
                    className="logout-btn"
                >
                    Back
                </button>
            </nav>

            <div className="notes-mode-container">
                {/* Sidebar for Notes */}
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

                {/* Toggle Button */}
                <div
                    className={`toggle-button-container ${isSidebarOpen ? 'open' : 'closed'}`}
                    onMouseEnter={() => setShowToggleText(true)}
                    onMouseLeave={() => setShowToggleText(false)}
                >
                    <button className="toggle-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        <svg 
                            className="toggle-icon" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path 
                                d="M15 6L9 12L15 18" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    {showToggleText && <span className="toggle-text">{isSidebarOpen ? 'Close' : 'Open'}</span>}
                </div>

                {/* Main Content */}
                <div className={`main-content ${isSidebarOpen ? '' : 'closed'}`}>
                    <h1>Notes Mode</h1>

                    {/* Image Upload */}
                    <div className="image-upload">
                        <label className="file-upload-label">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="file-input"
                                disabled={isLoading}
                            />
                            <span className="upload-button">Choose Image</span>
                        </label>
                    </div>

                    {/* Image Selection Area */}
                    {currentImageUrl && isSelectingRegions && (
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

                    {/* Display Segmented Regions */}
                    {!isSelectingRegions && combinedSegmentImage && (
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

                    {!currentImageUrl && !isLoading && (
                        <div className="no-image-message">
                            <p>Please select an image to upload</p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="loading-indicator">
                            <p>Processing... Please wait.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesMode;