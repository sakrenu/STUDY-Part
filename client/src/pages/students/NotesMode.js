import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotesMode.css';
import { storage, db } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc, 
    query, 
    where,
    orderBy 
} from 'firebase/firestore';

const NotesMode = () => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState("");
    const [image, setImage] = useState(null);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [loading, setLoading] = useState(false);
    const imageContainerRef = useRef(null);
    const [imageId, setImageId] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showToggleText, setShowToggleText] = useState(false);

    // Fetch existing image and notes on component mount
    useEffect(() => {
        fetchImageAndNotes();
    }, []);

    const fetchImageAndNotes = async () => {
        try {
            // Get the most recent image document
            const imagesQuery = query(
                collection(db, 'images'),
                orderBy('timestamp', 'desc')
            );
            const imageSnapshot = await getDocs(imagesQuery);
            
            if (!imageSnapshot.empty) {
                const imageDoc = imageSnapshot.docs[0];
                setImageId(imageDoc.id);
                setImage(imageDoc.data().url);

                // Fetch notes for this image
                const notesQuery = query(
                    collection(db, 'notes'), 
                    where('imageId', '==', imageDoc.id),
                    orderBy('timestamp', 'asc')
                );
                const notesSnapshot = await getDocs(notesQuery);
                const notesData = notesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setNotes(notesData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            console.log('Starting image upload...'); // Debug log

            // Show preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);

            // Create a reference to the storage location
            const storageRef = ref(storage, `notes-images/${Date.now()}-${file.name}`);
            console.log('Storage reference created'); // Debug log
            
            // Upload the file
            const uploadTask = await uploadBytes(storageRef, file);
            console.log('File uploaded to storage', uploadTask); // Debug log

            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);
            console.log('Download URL obtained:', downloadURL); // Debug log

            // Save image reference to Firestore
            const imageDoc = await addDoc(collection(db, 'images'), {
                url: downloadURL,
                timestamp: new Date().toISOString(),
                fileName: file.name,
                uploadedAt: new Date().toISOString()
            });
            console.log('Image document created in Firestore:', imageDoc.id); // Debug log

            setImageId(imageDoc.id);
            setImage(downloadURL);
            setNotes([]); // Clear existing notes for new image

        } catch (error) {
            console.error("Error uploading image:", error);
            alert('Error uploading image: ' + error.message);
            setImagePreview(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle click on image to position note
    const handleImageClick = (e) => {
        if (!imageContainerRef.current || !image) {
            console.log('Cannot add note: No image or container reference');
            return;
        }

        // Get the image element's bounds
        const imgElement = imageContainerRef.current.querySelector('img');
        if (!imgElement) return;

        const rect = imgElement.getBoundingClientRect();
        
        // Calculate position relative to the image
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Only set position if click is within image bounds
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            setSelectedPosition({ x, y });
            console.log('Selected position:', { x, y });
        }
    };

    // Add a new note
    const handleAddNote = async () => {
        if (!newNote.trim() || !selectedPosition || !imageId) {
            console.log('Validation failed:', {
                hasText: !!newNote.trim(),
                hasPosition: !!selectedPosition,
                hasImageId: !!imageId
            });
            return;
        }

        try {
            // Create the note data
            const noteData = {
                text: newNote.trim(),
                position: {
                    x: selectedPosition.x,
                    y: selectedPosition.y
                },
                imageId: imageId,
                timestamp: new Date().toISOString()
            };

            // Add to Firestore
            const docRef = await addDoc(collection(db, 'notes'), noteData);
            
            // Add to local state
            const newNote = {
                id: docRef.id,
                ...noteData
            };
            
            setNotes(prevNotes => [...prevNotes, newNote]);
            setNewNote(''); // Clear input
            setSelectedPosition(null); // Reset position
            
            console.log('Note added successfully:', newNote);
        } catch (error) {
            console.error('Error adding note:', error);
            alert('Error adding note: ' + error.message);
        }
    };

    // Delete a note
    const handleDeleteNote = async (noteId) => {
        try {
            await deleteDoc(doc(db, 'notes', noteId));
            setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleMouseEnter = () => {
        setShowToggleText(true);
    };

    const handleMouseLeave = () => {
        setShowToggleText(false);
    };

    return (
        <div className="notes-mode-container">
            {/* Sidebar for Notes */}
            <div className={`notes-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <h2>Notes List</h2>
                <div className="sidebar-notes">
                    {notes.length === 0 ? (
                        <p className="no-notes">No notes yet. Click on the image to add notes.</p>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} className="sidebar-note-item">
                                <p>{note.text}</p>
                                <button 
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="delete-button"
                                >
                                    ✖
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <div
                className={`toggle-button-container ${isSidebarOpen ? 'open' : 'closed'}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <button className="toggle-button" onClick={toggleSidebar}>
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
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="image-input"
                        disabled={loading}
                    />
                    {loading && (
                        <div className="loading-indicator">
                            <p>Uploading image... Please wait.</p>
                        </div>
                    )}
                </div>

                {/* Image Display with Notes */}
                <div className="image-container" ref={imageContainerRef}>
                    {(image || imagePreview) && (
                        <div className="image-wrapper" onClick={handleImageClick}>
                            <img 
                                src={image || imagePreview} 
                                alt="Uploaded content" 
                                style={{ 
                                    maxWidth: '100%',
                                    maxHeight: '600px',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                            />
                            {/* Display Notes on Image */}
                            {notes.map((note) => (
                                <div
                                    key={note.id}
                                    className="note-on-image"
                                    style={{
                                        left: `${note.position.x}%`,
                                        top: `${note.position.y}%`
                                    }}
                                >
                                    <div className="note-content">
                                        {note.text}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNote(note.id);
                                            }} 
                                            className="delete-button"
                                        >
                                            ✖
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!image && !imagePreview && (
                    <div className="no-image-message">
                        <p>Please select an image to add notes</p>
                    </div>
                )}

                {/* Note Input */}
                <div className="notes-input">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder={selectedPosition 
                            ? "Write your note here..." 
                            : "Click on the image to place a note"}
                        disabled={!selectedPosition || !image}
                    />
                    <button 
                        onClick={handleAddNote} 
                        className="add-note-button"
                        disabled={!selectedPosition || !image || newNote.trim() === "" || loading}
                    >
                        Add Note
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotesMode;
