import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotesMode.css';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const NotesMode = () => {
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showToggleText, setShowToggleText] = useState(false);
    const [note, setNote] = useState('');
    const [savedNotes, setSavedNotes] = useState([]);
    const [noteToDelete, setNoteToDelete] = useState(null); // Track the note being deleted
    const [selectedNote, setSelectedNote] = useState(null); // Track the selected note

    // Quill editor modules configuration
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['blockquote', 'code-block'],
            ['link'],
            [{ 'header': [1, 2, 3, false] }],
            ['clean']
        ],
    };

    const formats = [
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'blockquote', 'code-block',
        'link',
        'header'
    ];

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.error('User is not authenticated');
            alert('Please sign in to upload images.');
            return;
        }

        try {
            setLoading(true);
            console.log('Starting image upload...');

            // Show preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);

            // Create a reference to the storage location
            const storageRef = ref(storage, `notes-images/${Date.now()}-${file.name}`);
            console.log('Storage reference created');

            // Upload the file
            console.log('Uploading file...');
            await uploadBytes(storageRef, file);
            console.log('File uploaded to storage');

            // Get the download URL
            console.log('Fetching download URL...');
            const downloadURL = await getDownloadURL(storageRef);
            console.log('Download URL obtained');

            setImage(downloadURL);

        } catch (error) {
            console.error("Error uploading image:", error);
            alert('Error uploading image: ' + error.message);
            setImagePreview(null);
        } finally {
            setLoading(false);
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

    const handleNoteChange = (content) => {
        setNote(content);
    };

    const handleSaveNote = async () => {
        if (!note.trim() || !image) {
            alert('Please add both an image and a note');
            return;
        }

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert('Please sign in to save notes');
            return;
        }

        try {
            const noteData = {
                userId: user.uid,
                imageUrl: image,
                note: note,
                createdAt: new Date().toISOString(),
            };

            await addDoc(collection(db, 'notes'), noteData);
            
            // Add the new note to the state
            setSavedNotes([...savedNotes, noteData]);
            
            // Clear the note input
            setNote('');
            setImage(null);
            setImagePreview(null);
            
            alert('Note saved successfully!');
            
            // Refresh notes
            fetchNotes();
        } catch (error) {
            console.error("Error saving note:", error);
            alert('Error saving note: ' + error.message);
        }
    };

    const fetchNotes = async () => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) return;

        try {
            const q = query(
                collection(db, 'notes'),
                where('userId', '==', user.uid)
            );
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

    const handleDeleteNote = async (noteId, imageUrl) => {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert('Please sign in to delete notes');
            return;
        }

        try {
            // Delete the note from Firestore
            await deleteDoc(doc(db, 'notes', noteId));

            // Delete the image from Firebase Storage
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);

            // Remove the note from the state
            setSavedNotes(savedNotes.filter(note => note.id !== noteId));

            alert('Note deleted successfully!');
        } catch (error) {
            console.error("Error deleting note:", error);
            alert('Error deleting note: ' + error.message);
        } finally {
            setNoteToDelete(null); // Reset the note to delete
        }
    };

    const confirmDelete = (noteId, imageUrl) => {
        setNoteToDelete({ noteId, imageUrl }); // Set the note to delete
    };

    const cancelDelete = () => {
        setNoteToDelete(null); // Cancel the deletion
    };

    const handleNoteClick = (note) => {
        setSelectedNote(note); // Set the selected note
        setImage(note.imageUrl); // Display the selected image
        setNote(note.note); // Display the selected note text
    };

    const handleUpdateNote = async () => {
        if (!selectedNote) return;

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            alert('Please sign in to update notes');
            return;
        }

        try {
            // Update the note in Firestore
            await updateDoc(doc(db, 'notes', selectedNote.id), {
                note: note,
            });

            // Update the note in the state
            const updatedNotes = savedNotes.map((n) =>
                n.id === selectedNote.id ? { ...n, note: note } : n
            );
            setSavedNotes(updatedNotes);

            alert('Note updated successfully!');
        } catch (error) {
            console.error("Error updating note:", error);
            alert('Error updating note: ' + error.message);
        }
    };

    useEffect(() => {
        const auth = getAuth();
        
        // Set up auth state listener
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('User is authenticated, fetching notes...');
                try {
                    const q = query(
                        collection(db, 'notes'),
                        where('userId', '==', user.uid)
                    );
                    const querySnapshot = await getDocs(q);
                    const notes = [];
                    querySnapshot.forEach((doc) => {
                        notes.push({ id: doc.id, ...doc.data() });
                    });
                    setSavedNotes(notes);
                } catch (error) {
                    console.error("Error fetching notes:", error);
                }
            } else {
                console.log('User is not authenticated');
                setSavedNotes([]); // Clear notes when user is not authenticated
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []); // Empty dependency array since we want this to run once on mount

    return (
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
                        setImagePreview(null);
                    }}
                >
                    New Note
                </button>
                <div className="sidebar-notes">
                    {savedNotes.length === 0 ? (
                        <p className="no-notes">No notes yet.</p>
                    ) : (
                        savedNotes.map((note, index) => (
                            <div key={note.id || index} className="sidebar-note-item" onClick={() => handleNoteClick(note)}>
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteNote(note.id, note.imageUrl);
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
                                    <button 
                                        className="delete-note-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            confirmDelete(note.id, note.imageUrl);
                                        }}
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

                {/* Image Display */}
                <div className="image-container">
                    {(image || imagePreview) && (
                        <div className="image-wrapper">
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
                        </div>
                    )}
                </div>

                {/* Add/Edit Notes Section */}
                {(image || imagePreview) && (
                    <div className="notes-input">
                        <ReactQuill 
                            value={note}
                            onChange={handleNoteChange}
                            modules={modules}
                            formats={formats}
                            placeholder="Add your notes here..."
                            theme="snow"
                        />
                        <button 
                            onClick={selectedNote ? handleUpdateNote : handleSaveNote}
                            className="save-note-button"
                            disabled={!note.trim() || (!image && !selectedNote)}
                        >
                            {selectedNote ? 'Update Note' : 'Save Note'}
                        </button>
                    </div>
                )}

                {!image && !imagePreview && (
                    <div className="no-image-message">
                        <p>Please select an image to upload</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesMode;