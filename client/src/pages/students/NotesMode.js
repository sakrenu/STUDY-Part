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

    const auth = getAuth();
    const user = auth.currentUser;

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

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setIsLoading(true);
                const formData = new FormData();
                formData.append('image', file);
                
                const response = await axios.post('http://localhost:5000/upload', formData);
                const imageUrl = response.data.image_url;
                
                setCurrentImageUrl(imageUrl);
                setImage(file);
                setIsSelectingRegions(true);
                setSelectedRegions([]);
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

            const processedResults = await Promise.all(
                selectedRegions.map((region, index) => 
                    axios.post('http://localhost:5000/segment', {
                        image_url: currentImageUrl,
                        bounding_box: region,
                        teacher_id: 'student_mode', // or use actual user ID
                        region_index: index
                    })
                )
            );

            const processedData = processedResults.map(response => ({
                cutout: response.data.cutout,
                highlighted_outline: response.data.highlighted_outline,
                position: response.data.position,
                originalSize: response.data.originalSize
            }));

            setProcessedRegions(processedData);
            setIsSelectingRegions(false);
        } catch (error) {
            console.error('Error:', error);
            alert('Error processing image: ' + error.message);
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
            const noteData = {
                userId: user.uid,
                imageUrl: currentImageUrl,
                note: note, // This can be empty now
                createdAt: new Date().toISOString(),
                regions: processedRegions.map((region, index) => ({
                    cutout: region.cutout,
                    highlighted_outline: region.highlighted_outline,
                    position: region.position,
                    notes: regionNotes[index] || '',
                }))
            };

            await addDoc(collection(db, 'notes'), noteData);
            setSavedNotes([...savedNotes, noteData]);
            
            // Reset states
            setNote('');
            setImage(null);
            setCurrentImageUrl(null);
            setProcessedRegions([]);
            setRegionNotes({});
            setSelectedRegions([]);
            setIsSelectingRegions(true);
            
            alert('Note saved successfully!');
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

    // Handle note selection
    const handleNoteSelection = (note) => {
        setSelectedNote(note);
        setNote(note.note);
        setCurrentImageUrl(note.imageUrl);
        setProcessedRegions(note.regions || []);
        setRegionNotes(note.regions.reduce((acc, region, index) => {
            acc[index] = region.notes;
            return acc;
        }, {}));
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

    // Render the component
    return (
        <div className="notes-mode">
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
                                        <button 
                                            className="delete-note-button"
                                            onClick={() => setNoteToDelete({ noteId: note.id, imageUrl: note.imageUrl })}
                                        >
                                            Delete
                                        </button>
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
                        <img src={`${process.env.PUBLIC_URL}/toggle-icon.svg`} alt="Toggle" className="toggle-icon" />
                    </button>
                    {showToggleText && <span className="toggle-text">{isSidebarOpen ? 'Close' : 'Open'}</span>}
                </div>

                {/* Main Content */}
                <div className={`main-content ${isSidebarOpen ? '' : 'closed'}`}>
                    <h1>Notes Mode</h1>

                    <button onClick={() => navigate('/student-dashboard')} className="back-button">
                        ← Back to Dashboard
                    </button>

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
                    {processedRegions.length > 0 && (
                        <div className="segmented-regions-container">
                            <h3>Segmented Regions</h3>
                            {processedRegions.map((region, index) => (
                                <div key={index} className="segmented-region">
                                    <img 
                                        src={region.highlighted_outline} 
                                        alt={`Segment ${index + 1}`} 
                                        className="segment-image"
                                    />
                                    <textarea
                                        value={regionNotes[index] || ''}
                                        onChange={(e) => setRegionNotes({...regionNotes, [index]: e.target.value})}
                                        placeholder={`Add notes for region ${index + 1}...`}
                                        className="notes-textarea"
                                    />
                                </div>
                            ))}
                            <button 
                                onClick={selectedNote ? handleUpdateNote : handleSaveNote}
                                className="save-note-button"
                                disabled={!currentImageUrl || isLoading}
                            >
                                {selectedNote ? 'Update Note' : 'Save Notes'}
                            </button>
                        </div>
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