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
    const [savedNotes, setSavedNotes] = useState([]);
    const [noteToDelete, setNoteToDelete] = useState(null);
    const [selectedNote, setSelectedNote] = useState(null);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [isSelectingRegions, setIsSelectingRegions] = useState(true);
    const [currentRegionForNotes, setCurrentRegionForNotes] = useState(null);
    const [regionNotes, setRegionNotes] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const cropperRef = useRef(null);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [currentImageId, setCurrentImageId] = useState(null);
    const [currentImageDimensions, setCurrentImageDimensions] = useState({ width: 0, height: 0 });
    const [isNotesPopupVisible, setIsNotesPopupVisible] = useState(false);
    const [segmentationResults, setSegmentationResults] = useState([]);
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
        setSelectedRegions([]);
        setSegmentationResults([]);
        setRegionNotes({});
        setIsSelectingRegions(true);
        setIsEditing(false);
    }, []);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setIsLoading(true);
                setSelectedNote(null);
                setIsEditing(false);
                setImage(file);
                setCurrentImageUrl(null);
                setCurrentImageId(null);
                setCurrentImageDimensions({ width: 0, height: 0 });
                setSelectedRegions([]);
                setSegmentationResults([]);
                setRegionNotes({});

                const formData = new FormData();
                formData.append('file', file);
                
                const response = await axios.post('http://127.0.0.1:8000/upload_image', formData);

                setCurrentImageUrl(response.data.image_url);
                setCurrentImageId(response.data.image_id);
                setCurrentImageDimensions({ width: response.data.width, height: response.data.height });

                setIsSelectingRegions(true);
            } catch (error) {
                console.error('Failed to upload image:', error);
                alert('Error uploading image: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

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

    const handleDoneSelecting = async () => {
        if (!currentImageId) {
            alert('Image ID is missing. Please upload the image again.');
            return;
        }
        if (selectedRegions.length === 0) {
            alert('Please select at least one region.');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Processing regions:', selectedRegions);
            const allSegmentedRegions = [];
            let lessonId = null;

            for (const region of selectedRegions) {
                const box = [
                    Math.round(region.x),
                    Math.round(region.y),
                    Math.round(region.x + region.width),
                    Math.round(region.y + region.height)
                ];

                const response = await axios.post('http://127.0.0.1:8000/segment', {
                    image_id: currentImageId,
                    box: box,
                });

                if (response.data.regions && response.data.regions.length > 0) {
                    const regionData = {
                        ...response.data.regions[0],
                        originalSelectionIndex: allSegmentedRegions.length
                    };
                    allSegmentedRegions.push(regionData);
                    if (!lessonId) {
                        lessonId = response.data.lesson_id;
                    }
                } else {
                     console.warn(`Segmentation for region ${allSegmentedRegions.length} returned no regions.`);
                }
            }

            setSegmentationResults(allSegmentedRegions);
            const initialNotes = {};
            allSegmentedRegions.forEach((_, index) => {
                initialNotes[index] = '';
            });
            setRegionNotes(initialNotes);

            setIsSelectingRegions(false);

        } catch (error) {
            console.error('Error during segmentation:', error);
            alert('Error processing regions: ' + (error.response?.data?.detail || error.message));
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
            setSelectedRegions([]);
            setSegmentationResults([]);
            setRegionNotes({});
            setIsSelectingRegions(true);
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
        setIsSelectingRegions(false);
        setIsEditing(true);

        setSegmentationResults(note.regions || []);

        const notesObj = (note.regions || []).reduce((acc, region, index) => {
            acc[index] = region.notes || '';
            return acc;
        }, {});
        setRegionNotes(notesObj);

        setSelectedRegions([]);
    };

    const handleRegionClick = (event) => {
        if (!segmentationResults || segmentationResults.length === 0) {
            console.warn('No segmentation data available to handle click.');
            return;
        }
        if (isSelectingRegions) {
            console.warn('Cannot select regions for notes while in selection mode.');
            return;
        }

        const imageElement = event.target;
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
                            setSelectedRegions([]);
                            setSegmentationResults([]);
                            setRegionNotes({});
                            setIsSelectingRegions(true);
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
                                <button onClick={handleSelectRegion} className="select-region-button" disabled={isLoading}>
                                    Add Selection Box
                                </button>
                                {selectedRegions.length > 0 && (
                                    <button onClick={() => setSelectedRegions(prev => prev.slice(0, -1))} className="clear-last-button" disabled={isLoading}>
                                        Clear Last Box ({selectedRegions.length})
                                    </button>
                                )}
                                {selectedRegions.length > 0 && (
                                    <button onClick={handleDoneSelecting} className="done-selecting-button" disabled={isLoading}>
                                        Segment Selected Regions ({selectedRegions.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {!isSelectingRegions && currentImageUrl && segmentationResults.length > 0 && (
                        <div className="combined-segments-container">
                            <h3>{isEditing ? 'Editing Notes - ' : ''}Click on a region to add/edit notes</h3>
                            <div className="interactive-image-container">
                                <img
                                    src={currentImageUrl}
                                    alt="Segmented document"
                                    className="combined-segments-image"
                                    onClick={handleRegionClick}
                                    style={{ cursor: 'pointer', maxWidth: '100%', height: 'auto' }}
                                    width={currentImageDimensions.width || undefined}
                                    height={currentImageDimensions.height || undefined}
                                />
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

                    {!isSelectingRegions && currentImageUrl && segmentationResults.length === 0 && !isLoading && (
                        <div className="no-regions-message">
                            <p>Segmentation did not identify any regions from your selections, or there was an error.</p>
                            <button onClick={() => setIsSelectingRegions(true)}>Try Selecting Again</button>
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