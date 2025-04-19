import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotesMode.css';
import { getAuth } from 'firebase/auth';
import { db, storage } from '../../firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import axios from 'axios';

const NotesMode = () => {
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showToggleText, setShowToggleText] = useState(false);
    const [savedNotes, setSavedNotes] = useState([]);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [selectedNote, setSelectedNote] = useState(null);
    const [selectedPoints, setSelectedPoints] = useState([]);
    const [pointLabels, setPointLabels] = useState([]);
    const [isSelectingPoints, setIsSelectingPoints] = useState(true);
    const [currentRegionForNotes, setCurrentRegionForNotes] = useState(null);
    const [regionNotes, setRegionNotes] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [currentImageId, setCurrentImageId] = useState(null);
    const [currentImageDimensions, setCurrentImageDimensions] = useState({ width: 0, height: 0 });
    const [isNotesPopupVisible, setIsNotesPopupVisible] = useState(false);
    const [segmentationResults, setSegmentationResults] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;
    const [isEditing, setIsEditing] = useState(false);
    const imageDisplayRef = useRef(null);
    const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
    const [selectionMode, setSelectionMode] = useState('foreground'); // 'foreground' or 'background'

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

    const fetchNotes = async () => {
        if (!user) return;

        try {
            const q = query(collection(db, 'notes'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const notes = [];
            querySnapshot.forEach((doc) => {
                notes.push({ id: doc.id, ...doc.data() });
            });
            setSavedNotes(notes);
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [user]);

    useEffect(() => {
        setSelectedNote(null);
        setImage(null);
        setCurrentImageUrl(null);
        setCurrentImageId(null);
        setCurrentImageDimensions({ width: 0, height: 0 });
        setSelectedPoints([]);
        setPointLabels([]);
        setSegmentationResults([]);
        setRegionNotes({});
        setIsSelectingPoints(true);
        setIsEditing(false);
    }, []);

    useEffect(() => {
        const updateDisplayDimensions = () => {
            if (imageDisplayRef.current) {
                setDisplayDimensions({
                    width: imageDisplayRef.current.offsetWidth,
                    height: imageDisplayRef.current.offsetHeight,
                });
            }
        };

        updateDisplayDimensions();

        window.addEventListener('resize', updateDisplayDimensions);

        return () => window.removeEventListener('resize', updateDisplayDimensions);
    }, [currentImageUrl, segmentationResults]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            let previewUrl = null;
            try {
                setIsLoading(true);
                setSelectedNote(null);
                setIsEditing(false);
                setImage(file);

                previewUrl = URL.createObjectURL(file);
                setCurrentImageUrl(previewUrl);
                
                setCurrentImageId(null);
                setCurrentImageDimensions({ width: 0, height: 0 });
                setSelectedPoints([]);
                setPointLabels([]);
                setSegmentationResults([]);
                setRegionNotes({});

                const formData = new FormData();
                formData.append('file', file);
                
                const response = await axios.post('http://127.0.0.1:8000/upload_image', formData);

                setCurrentImageUrl(response.data.image_url);
                setCurrentImageId(response.data.image_id);
                setCurrentImageDimensions({ width: response.data.width, height: response.data.height });

                setIsSelectingPoints(true);

                // Load image to get dimensions
                const img = new Image();
                img.onload = () => {
                    setCurrentImageDimensions({ width: img.width, height: img.height });
                };
                img.src = response.data.image_url;
            } catch (error) {
                console.error('Failed to upload image:', error);
                alert('Error uploading image: ' + error.message);
            } finally {
                setIsLoading(false);
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                }
            }
        }
    };

    const handleCanvasClick = (e) => {
        if (!currentImageId || !isSelectingPoints) return;
        
        // Get click coordinates relative to the image
        const rect = canvasRef.current.getBoundingClientRect();
        const scaleX = currentImageDimensions.width / rect.width;
        const scaleY = currentImageDimensions.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        // Add the point with correct label (1 for foreground, 0 for background)
        setSelectedPoints(prev => [...prev, { x, y }]);
        setPointLabels(prev => [...prev, selectionMode === 'foreground' ? 1 : 0]);
        
        // Redraw canvas
        drawPoints();
    };

    const drawPoints = () => {
        if (!canvasRef.current || !imageRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set canvas dimensions to match the displayed image
        canvas.width = imageRef.current.width;
        canvas.height = imageRef.current.height;
        
        // Draw points
        selectedPoints.forEach((point, index) => {
            const scaleX = canvas.width / currentImageDimensions.width;
            const scaleY = canvas.height / currentImageDimensions.height;
            
            ctx.beginPath();
            ctx.arc(point.x * scaleX, point.y * scaleY, 7, 0, 2 * Math.PI);
            
            // Set point fill color based on label
            ctx.fillStyle = pointLabels[index] === 1 ? 'green' : 'red';
            ctx.fill();
            
            // Add a white border stroke to help the point stand out
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Add point number
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(index + 1, point.x * scaleX + 9, point.y * scaleY + 9);
        });
    };

    useEffect(() => {
        drawPoints();
    }, [selectedPoints, pointLabels, currentImageDimensions]);

    const handleUndoPoint = () => {
        if (selectedPoints.length > 0) {
            setSelectedPoints(prev => prev.slice(0, -1));
            setPointLabels(prev => prev.slice(0, -1));
        }
    };

    const handleResetPoints = () => {
        setSelectedPoints([]);
        setPointLabels([]);
    };

    const handleDoneSelecting = async () => {
        if (!currentImageId) {
            alert('Image ID is missing. Please upload the image again.');
            return;
        }
        if (selectedPoints.length === 0) {
            alert('Please select at least one point.');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Processing points:', selectedPoints);

            const pointCoords = selectedPoints.map(p => [p.x, p.y]);
            const payload = {
                image_id: currentImageId,
                points: pointCoords,
                labels: pointLabels
            };

            console.log("Calling /segment with payload:", JSON.stringify(payload, null, 2));
            const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
            const response = await axios.post(`${API_URL}/segment`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('Segmentation response:', response.data);

            if (response.data.regions && response.data.regions.length > 0) {
                const newRegions = response.data.regions.map((region, index) => ({
                    ...region,
                    originalSelectionIndex: index
                }));
                setSegmentationResults(newRegions);
                
                const initialNotes = {};
                newRegions.forEach((_, index) => {
                    initialNotes[index] = '';
                });
                setRegionNotes(initialNotes);
            } else {
                console.warn('Segmentation returned no regions.');
                alert('No regions were detected. Try selecting different points.');
            }

            setIsSelectingPoints(false);

        } catch (error) {
            const errorDetail = error.response?.data?.detail
                ? (typeof error.response.data.detail === 'string'
                   ? error.response.data.detail
                   : JSON.stringify(error.response.data.detail))
                : error.message || 'Unknown error';
            console.error('Error segmenting:', error, 'Response:', error.response?.data, 'Detail:', errorDetail);
            alert('Error processing regions: ' + errorDetail);
        } finally {
            setIsLoading(false);
        }
    };
    
    const hasAnyNotes = () => {
        return Object.values(regionNotes).some(note => note.trim() !== '');
    };

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
            const regionsToSave = segmentationResults.map(region => ({
                region_id: region.region_id,
                lesson_id: region.lesson_id,
                mask_url: region.mask_url,
                cutout_url: region.cutout_url,
                position: region.position,
                score: region.score,
                notes: regionNotes[region.originalSelectionIndex] || ''
            }));

            const noteData = {
                userId: user.uid,
                imageId: currentImageId,
                imageUrl: currentImageUrl,
                imageWidth: currentImageDimensions.width,
                imageHeight: currentImageDimensions.height,
                createdAt: new Date().toISOString(),
                regions: regionsToSave,
            };

            if (isEditing && selectedNote) {
                await updateDoc(doc(db, 'notes', selectedNote.id), noteData);
                setSavedNotes(savedNotes.map(note => 
                    note.id === selectedNote.id ? {...noteData, id: selectedNote.id} : note
                ));
                alert('Note updated successfully!');
            } else {
                const docRef = await addDoc(collection(db, 'notes'), noteData);
                setSavedNotes([...savedNotes, { ...noteData, id: docRef.id }]);
                alert('Note saved successfully!');
            }

            setImage(null);
            setCurrentImageUrl(null);
            setCurrentImageId(null);
            setCurrentImageDimensions({ width: 0, height: 0 });
            setSelectedPoints([]);
            setPointLabels([]);
            setSegmentationResults([]);
            setRegionNotes({});
            setIsSelectingPoints(true);
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
            setSavedNotes(savedNotes.filter(note => note.id !== noteId));
            alert('Note deleted successfully!');
        } catch (error) {
            console.error("Error deleting note:", error);
            alert('Error deleting note: ' + error.message);
        } finally {
            setNoteToDelete(null);
        }
    };

    const cancelDelete = () => {
        setNoteToDelete(null);
    };

    const handleNoteSelection = (note) => {
        setSelectedNote(note);
        setCurrentImageUrl(note.imageUrl);
        setCurrentImageId(note.imageId);
        setCurrentImageDimensions({ width: note.imageWidth || 0, height: note.imageHeight || 0 });
        setIsSelectingPoints(false);
        setIsEditing(true);

        setSegmentationResults(note.regions || []);

        const notesObj = (note.regions || []).reduce((acc, region, index) => {
            acc[index] = region.notes || '';
            return acc;
        }, {});
        setRegionNotes(notesObj);

        setSelectedPoints([]);
    };

    const handleRegionClick = (event) => {
        if (!segmentationResults || segmentationResults.length === 0) {
            console.warn('No segmentation data available to handle click.');
            return;
        }
        if (isSelectingPoints) {
            console.warn('Cannot select points for notes while in selection mode.');
            return;
        }

        const imageElement = imageDisplayRef.current;
        if (!imageElement) return;

        const rect = imageElement.getBoundingClientRect();

        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const scaleX = imageElement.naturalWidth / rect.width;
        const scaleY = imageElement.naturalHeight / rect.height;

        const originalClickX = clickX * scaleX;
        const originalClickY = clickY * scaleY;

        console.log(`Click detected at display: (${clickX.toFixed(2)}, ${clickY.toFixed(2)}), original: (${originalClickX.toFixed(2)}, ${originalClickY.toFixed(2)})`);

        let clickedRegionInfo = null;
        let minArea = Infinity;

        segmentationResults.forEach((region, index) => {
            const { x1, y1, x2, y2 } = region.position;

            if (originalClickX >= x1 && originalClickX <= x2 && originalClickY >= y1 && originalClickY <= y2) {
                const area = (x2 - x1) * (y2 - y1);
                 if (area < minArea) {
                    minArea = area;
                    clickedRegionInfo = { region: region, index: index };
                }
                console.log(`Click is inside region ${index} (Area: ${area.toFixed(2)}) Box: [${x1.toFixed(2)}, ${y1.toFixed(2)}, ${x2.toFixed(2)}, ${y2.toFixed(2)}]`);
             } else {
            }
        });

        if (clickedRegionInfo) {
            console.log('Clicked region index:', clickedRegionInfo.index);
            setCurrentRegionForNotes(clickedRegionInfo.index);
            setIsNotesPopupVisible(true);
        } else {
            console.log('No region found at click location');
        }
    };

    const handleSaveNotes = (index, note) => {
        setRegionNotes({ ...regionNotes, [index]: note });
    };

    const handleClosePopup = () => {
        setIsNotesPopupVisible(false);
        setCurrentRegionForNotes(null);
    };

    return (
        <div className="notes-mode">
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
                <div className={`notes-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                    <h2>Notes List</h2>
                    <button 
                        className="new-note-button"
                        onClick={() => {
                            setSelectedNote(null);
                            setImage(null);
                            setCurrentImageUrl(null);
                            setCurrentImageId(null);
                            setCurrentImageDimensions({ width: 0, height: 0 });
                            setSelectedPoints([]);
                            setPointLabels([]);
                            setSegmentationResults([]);
                            setRegionNotes({});
                            setIsSelectingPoints(true);
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
                                    >
                                        {note.regions ? `${note.regions.length} region(s)` : 'No region data'}
                                    </div>
                                    <p className="note-date">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                    </p>
                                    {noteToDelete?.noteId === note.id ? (
                                        <div className="delete-confirmation">
                                            <p>Are you sure?</p>
                                            <button 
                                                className="confirm-delete-button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNoteToDelete({ noteId: note.id, imageUrl: note.imageUrl });
                                                }}
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

                <div className={`main-content ${isSidebarOpen ? '' : 'closed'}`}>
                    <h1>Notes Mode</h1>

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

                    {currentImageUrl && isSelectingPoints && (
                        <div className="point-selection-container">
                            <div className="mode-selection">
                                <button
                                    className={`mode-button ${selectionMode === 'foreground' ? 'active' : ''}`}
                                    onClick={() => setSelectionMode('foreground')}
                                >
                                    Foreground Points (Green)
                                </button>
                                <button
                                    className={`mode-button ${selectionMode === 'background' ? 'active' : ''}`}
                                    onClick={() => setSelectionMode('background')}
                                >
                                    Background Points (Red)
                                </button>
                            </div>
                            <div className="canvas-container" style={{ position: 'relative' }}>
                                <img
                                    ref={imageRef}
                                    src={currentImageUrl}
                                    alt="Upload preview"
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    onClick={handleCanvasClick}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        cursor: 'crosshair'
                                    }}
                                />
                            </div>
                            <div className="point-selection-controls">
                                <button onClick={handleUndoPoint} className="control-button" disabled={selectedPoints.length === 0}>
                                    Undo Last Point
                                </button>
                                <button onClick={handleResetPoints} className="control-button" disabled={selectedPoints.length === 0}>
                                    Reset All Points
                                </button>
                                <button onClick={handleDoneSelecting} className="control-button" disabled={selectedPoints.length === 0}>
                                    Segment Selected Points ({selectedPoints.length})
                                </button>
                            </div>
                        </div>
                    )}

                    {!isSelectingPoints && currentImageUrl && segmentationResults.length > 0 && (
                        <div className="combined-segments-container">
                            <h3>{isEditing ? 'Editing Notes - ' : ''}Click on a region to add/edit notes</h3>
                            <div className="interactive-image-container" style={{ position: 'relative', maxWidth: '100%', height: 'auto' }}>
                                <img
                                    ref={imageDisplayRef}
                                    src={currentImageUrl}
                                    alt="Segmented document base"
                                    className="combined-segments-image"
                                    onClick={handleRegionClick}
                                    style={{
                                        display: 'block',
                                        cursor: 'pointer',
                                        maxWidth: '100%',
                                        height: 'auto',
                                        opacity: 1
                                    }}
                                    onLoad={() => {
                                        if (imageDisplayRef.current) {
                                            setDisplayDimensions({
                                                width: imageDisplayRef.current.offsetWidth,
                                                height: imageDisplayRef.current.offsetHeight,
                                            });
                                        }
                                    }}
                                />
                                {/* Dimming Overlay - REMOVED */}
                                {/* 
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Adjust dim level here
                                    pointerEvents: 'none', // Ignore clicks
                                }}></div> 
                                */}

                                {/* Colored Region Overlays */}
                                {displayDimensions.width > 0 && segmentationResults.map((region, index) => {
                                    const scaleX = displayDimensions.width / (currentImageDimensions.width || 1);
                                    const scaleY = displayDimensions.height / (currentImageDimensions.height || 1);

                                    const { x1, y1, x2, y2 } = region.position;
                                    const style = {
                                        position: 'absolute',
                                        left: `${x1 * scaleX}px`,
                                        top: `${y1 * scaleY}px`,
                                        width: `${(x2 - x1) * scaleX}px`,
                                        height: `${(y2 - y1) * scaleY}px`,
                                        pointerEvents: 'none',
                                        backgroundColor: 'rgba(0, 150, 255, 0.4)', // Example: semi-transparent blue
                                    };

                                    return (
                                        <div
                                            key={region.region_id || index}
                                            style={style}
                                        ></div>
                                    );
                                })}
                            </div>
                            <button
                                onClick={handleSaveNote}
                                className="save-all-notes-button"
                                disabled={!hasAnyNotes() || isLoading}
                            >
                                {isEditing ? 'Update Note' : 'Save Note'}
                            </button>
                        </div>
                    )}

                    {!isSelectingPoints && currentImageUrl && segmentationResults.length === 0 && !isLoading && (
                        <div className="no-regions-message">
                            <p>Segmentation did not identify any regions from your selections, or there was an error.</p>
                            <button onClick={() => setIsSelectingPoints(true)}>Try Selecting Again</button>
                        </div>
                    )}

                    {isNotesPopupVisible && currentRegionForNotes !== null && (
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
                        <div className="loading-overlay">
                            <div className="loading-content">
                                <div className="loading-spinner"></div>
                                <div className="loading-message">Processing your image...</div>
                                <div className="neural-animation">
                                    <div className="neural-particles"></div>
                                    <div className="neural-particles"></div>
                                    <div className="neural-particles"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentImageUrl && !isSelectingPoints && (
                        <div className="preview-container">
                            <img
                                src={currentImageUrl}
                                alt="Uploaded document"
                                className="preview-image"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesMode;