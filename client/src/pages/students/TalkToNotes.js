import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './TalkToNotes.css';

const TalkToNotes = () => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(() => {
        const fetchNotes = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setNotes(userData.notes || []);
                }
            }
        };

        fetchNotes();
    }, []);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Reset states
        setUploadLoading(true);
        setUploadError('');

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');

            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'image/jpeg',
                'image/png',
                'image/gif'
            ];

            if (!allowedTypes.includes(file.type)) {
                throw new Error('File type not supported. Please upload PDF, PPT, or image files.');
            }

            // Upload file to Firebase Storage
            const storageRef = ref(storage, `notes/${user.uid}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Process the file based on its type
            const formData = new FormData();
            formData.append('file', file);
            formData.append('user_id', user.uid);

            let endpoint;
            if (file.type.includes('pdf')) {
                endpoint = '/api/rag/process_pdf';
            } else if (file.type.includes('powerpoint')) {
                endpoint = '/api/rag/process_ppt';
            } else {
                endpoint = '/api/rag/process_image';
            }

            const response = await fetch(`http://127.0.0.1:8000${endpoint}`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            // Create new note object
            const newNote = {
                title: file.name,
                content: data.content,
                fileUrl: downloadURL,
                fileType: file.type,
                timestamp: Date.now()
            };

            // Update Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                notes: arrayUnion(newNote)
            });

            // Update local state
            setNotes(prevNotes => [...prevNotes, newNote]);
            
        } catch (error) {
            console.error('Error uploading file:', error);
            setUploadError(error.message);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleNoteSelect = (note) => {
        setSelectedNote(note);
        setResponse(''); // Clear previous responses
    };

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        if (!query.trim() || !selectedNote) return;

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');

            const response = await fetch('http://127.0.0.1:8000/api/rag/query_notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.uid,
                    query: query
                }),
            });

            const data = await response.json();
            setResponse(data.response);
        } catch (error) {
            console.error('Error querying notes:', error);
            setResponse('Sorry, there was an error processing your query. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="talk-to-notes">
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

            <div className="welcome-section">
                <h1>Talk to Your Notes</h1>
                <h3>Ask questions about your notes and get instant answers</h3>
            </div>

            <div className="upload-section">
                <input
                    type="file"
                    accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                    className="file-input"
                    id="file-input"
                />
                <label htmlFor="file-input" className="file-input-label">
                    {uploadLoading ? 'Uploading...' : 'Upload PDF, PPT, or Image'}
                </label>
                {uploadError && <p className="upload-error">{uploadError}</p>}
            </div>

            <div className="talk-to-notes-container">
                <div className="notes-list">
                    <h2>Your Notes</h2>
                    {notes.length === 0 ? (
                        <p className="no-notes">No notes available. Create some notes first!</p>
                    ) : (
                        notes.map((note, index) => (
                            <div
                                key={index}
                                className={`note-item ${selectedNote === note ? 'selected' : ''}`}
                                onClick={() => handleNoteSelect(note)}
                            >
                                <h3>{note.title || `Note ${index + 1}`}</h3>
                                <p>{note.content.substring(0, 100)}...</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="interaction-area">
                    {selectedNote ? (
                        <>
                            <div className="selected-note-content">
                                <h2>{selectedNote.title || 'Selected Note'}</h2>
                                <p>{selectedNote.content}</p>
                            </div>
                            <form onSubmit={handleQuerySubmit} className="query-form">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Ask a question about your notes..."
                                    disabled={loading}
                                />
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Processing...' : 'Ask'}
                                </button>
                            </form>
                            {response && (
                                <div className="response-area">
                                    <h3>Answer:</h3>
                                    <p>{response}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-note-selected">
                            <h2>Select a note to start asking questions</h2>
                            <p>Choose a note from the list on the left to begin interacting with your notes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TalkToNotes; 