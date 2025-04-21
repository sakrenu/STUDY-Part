import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import './TalkToNotes.css';

// Check for browser support for SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    recognition.continuous = false; // Process single utterances
    recognition.interimResults = false; // We only want final results
    recognition.lang = 'en-US'; // Set language to English
}

const TalkToNotes = () => {
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const chatMessagesRef = useRef(null);
    const recognitionRef = useRef(recognition); // Store recognition instance in ref

    useEffect(() => {
        // Initialize notes as empty array - they will be stored in local state
        setNotes([]);
        
        // Clear vector stores when component mounts (page refresh)
        const clearVectorStores = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.log('No user logged in, skipping vector store clear');
                    return;
                }
                
                console.log('Clearing vector stores...');
                const response = await fetch('http://57.159.24.129:8000/api/rag/clear_vector_store', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: user.uid
                    }),
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Failed to clear vector stores:', errorData.detail);
                } else {
                    const data = await response.json();
                    console.log('Vector stores cleared:', data.message);
                }
            } catch (error) {
                console.error('Error clearing vector stores:', error);
            }
        };
        
        // Call the function
        clearVectorStores();

        // Setup recognition event listeners
        const currentRecognition = recognitionRef.current;
        if (currentRecognition) {
            currentRecognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                console.log('Transcript:', transcript);
                setQuery(transcript); // Update query input with transcript
                setIsRecording(false); // Stop recording state after result
            };

            currentRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                // Add user feedback for error
                if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
                    setChatHistory(prev => [...prev, { type: 'bot', content: `<p>Mic Error: ${event.error}. Please check permissions or try again.</p>` }]);
                }
                setIsRecording(false);
            };

            currentRecognition.onend = () => {
                console.log('Speech recognition ended.');
                setIsRecording(false); // Ensure recording state is off when recognition ends
            };
        }

        // Cleanup listeners on unmount
        return () => {
            if (currentRecognition) {
                currentRecognition.onresult = null;
                currentRecognition.onerror = null;
                currentRecognition.onend = null;
                currentRecognition.stop(); // Ensure it stops if component unmounts mid-recording
            }
            // Cancel any ongoing speech synthesis on unmount
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };

    }, []); // Run only on mount

    // Auto-scroll to the bottom when chat history updates
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadLoading(true);
        setUploadError('');

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');

            const allowedTypes = [
                'application/pdf',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            ];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('File type not supported. Please upload PDF or PPT files only.');
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('user_id', user.uid);

            let endpoint = file.type.includes('pdf') ? '/api/rag/process_pdf' : '/api/rag/process_ppt';

            const response = await fetch(`http://57.159.24.129:8000${endpoint}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to process file');
            }

            const data = await response.json();

            // Include document_id in the new note object
            const newNote = {
                title: file.name,
                content: data.content,
                cloudinaryUrl: data.cloudinary_url,
                document_id: data.document_id,
                fileType: data.filetype,
                timestamp: Date.now()
            };

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
        setChatHistory([]); // Clear chat when a new note is selected
        setQuery(''); // Clear query input
    };

    const handleQuerySubmit = async (e) => {
        e.preventDefault();
        if (!query.trim() || !selectedNote || !selectedNote.document_id) {
            // Display message if no note selected or query is empty
            if (!selectedNote || !selectedNote.document_id) {
                 setChatHistory(prev => [...prev, { type: 'bot', content: '<p>Please select a processed note first.</p>' }]);
            } else if (!query.trim()) {
                 setChatHistory(prev => [...prev, { type: 'bot', content: '<p>Please enter a question.</p>' }]);
            }
            return;
        }

        const userMessage = query.trim();
        setQuery(''); // Clear input after sending
        setLoading(true);

        // Prepare history for backend (last 6 messages, excluding typing indicators)
        const historyToSend = chatHistory
            .filter(msg => msg.type !== 'typing') // Remove typing indicators
            .slice(-6) // Get last 6 messages (3 turns)
            .map(msg => ({ type: msg.type, content: msg.content })); // Ensure correct format

        // Add user message to local history immediately
        const newUserMessageEntry = { type: 'user', content: userMessage };
        setChatHistory(prev => [...prev, newUserMessageEntry]);

        // Add typing indicator immediately
        setChatHistory(prev => [...prev, { type: 'typing', content: '' }]);

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');

            const response = await fetch('http://57.159.24.129:8000/api/rag/query_notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user.uid,
                    query: userMessage,
                    document_id: selectedNote.document_id,
                    chat_history: historyToSend // Send the prepared history
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to query notes');
            }

            const data = await response.json();

            // Replace typing indicator with bot response
            setChatHistory(prev => {
                const newHistory = prev.filter(msg => msg.type !== 'typing');
                return [...newHistory, { type: 'bot', content: data.response }];
            });
        } catch (error) {
            console.error('Error querying notes:', error);
            setChatHistory(prev => {
                const newHistory = prev.filter(msg => msg.type !== 'typing');
                // Send error message formatted as HTML paragraph
                return [...newHistory, { type: 'bot', content: '<p>Sorry, there was an error processing your query. Please try again.</p>' }];
            });
        } finally {
            setLoading(false);
        }
    };

    const handleMicClick = () => {
        const currentRecognition = recognitionRef.current;
        if (!currentRecognition) {
            console.error("Speech Recognition not supported by this browser.");
            setChatHistory(prev => [...prev, { type: 'bot', content: '<p>Sorry, voice input is not supported by your browser.</p>' }]);
            return;
        }

        if (isRecording) {
            currentRecognition.stop();
            console.log("Stopping recording manually.");
            setIsRecording(false);
        } else {
            try {
                currentRecognition.start();
                console.log("Starting recording...");
                setIsRecording(true);
            } catch (err) {
                // Handle cases where start() might fail immediately (e.g., already started)
                console.error("Error starting recognition:", err);
                setIsRecording(false);
            }
        }
    };

    // Function to handle speaking text
    const handleSpeakClick = (htmlContent) => {
        if (!('speechSynthesis' in window)) {
            console.error("Speech Synthesis not supported by this browser.");
            // Optionally show a message to the user
            alert("Sorry, your browser doesn\'t support text-to-speech.");
            return;
        }

        // Extract text content from HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textToSpeak = tempDiv.textContent || tempDiv.innerText || "";

        if (!textToSpeak.trim()) {
            console.log("No text content to speak.");
            return;
        }

        // Stop any currently speaking utterance before starting a new one
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US'; // Ensure English voice if possible
        // You could add options here to select voice, pitch, rate etc.
        // utterance.voice = window.speechSynthesis.getVoices().find(voice => voice.lang === 'en-US');
        
        window.speechSynthesis.speak(utterance);
    };

    // Typing indicator component
    const TypingIndicator = () => (
        <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    );

    // Specific message content indicating RAG failed
    const notFoundMessage = "<p>I couldn't find the information for that question in this document or conversation history.</p>";

    // Function to handle general knowledge query
    const handleGeneralKnowledgeQuery = async (originalQuery) => {
        if (!originalQuery) {
            console.error("Original query not found for general knowledge search.");
            setChatHistory(prev => [...prev, { type: 'bot', content: '<p>Error: Could not find the original question to ask.</p>' }]);
            return;
        }

        setLoading(true);

        // Add a temporary user message indicating the action
        const generalQueryUserPrompt = { type: 'user', content: `(Attempting general search) ${originalQuery}` };
        setChatHistory(prev => [...prev, generalQueryUserPrompt]);

        // Add typing indicator
        setChatHistory(prev => [...prev, { type: 'typing', content: '' }]);

        try {
            const response = await fetch('http://57.159.24.129:8000/api/rag/general_query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: originalQuery }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to fetch general knowledge answer');
            }

            const data = await response.json();

            // Replace typing indicator with bot response
            setChatHistory(prev => {
                const newHistory = prev.filter(msg => msg.type !== 'typing');
                return [...newHistory, { type: 'bot', content: data.response }];
            });

        } catch (error) {
            console.error('Error querying general knowledge:', error);
            setChatHistory(prev => {
                const newHistory = prev.filter(msg => msg.type !== 'typing');
                return [...newHistory, { type: 'bot', content: `<p>Sorry, there was an error fetching the general knowledge answer: ${error.message}</p>` }];
            });
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
                    accept=".pdf,.ppt,.pptx"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                    className="file-input"
                    id="file-input"
                />
                <label htmlFor="file-input" className="file-input-label">
                    {uploadLoading ? 'Uploading...' : 'Upload PDF or PPT'}
                </label>
                {uploadError && <p className="upload-error">{uploadError}</p>}
            </div>

            <div className="talk-to-notes-container">
                <div className="notes-list">
                    <h2>Your Notes</h2>
                    {notes.length === 0 ? (
                        <p className="no-notes">No notes available. Upload some notes first!</p>
                    ) : (
                        notes.map((note, index) => (
                            <div
                                key={index}
                                className={`note-item ${selectedNote === note ? 'selected' : ''}`}
                                onClick={() => handleNoteSelect(note)}
                            >
                                <h3>{note.title || `Note ${index + 1}`}</h3>
                                <p>{note.content ? note.content.substring(0, 100) : 'Processing...'}...</p>
                            </div>
                        ))
                    )}
                </div>

                <div className="interaction-area">
                    {selectedNote ? (
                        <>
                            <div className="chat-container">
                                <div className="chat-messages" ref={chatMessagesRef}>
                                    {chatHistory.length === 0 && (
                                        <div className="message bot selected-note-info">
                                            <div className="message-content">
                                                <p><b>Selected Note: {selectedNote.title}</b></p>
                                                <p>{selectedNote.content ? selectedNote.content.substring(0, 150) + '...' : 'Loading content...'}</p>
                                            </div>
                                        </div>
                                    )}
                                    {chatHistory.map((message, index) => (
                                        message.type === 'typing' ? (
                                            <div key={index} className="message bot typing-message">
                                                <div className="message-content">
                                                    <TypingIndicator />
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={index} className={`message ${message.type}`}>
                                                {message.type === 'user' ? (
                                                    <div className="message-content">
                                                        {message.content}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div
                                                            className="message-content bot-html-content"
                                                            dangerouslySetInnerHTML={{ __html: message.content }}
                                                        />
                                                        {/* Conditionally render Speak button */}
                                                        {message.content && !message.content.includes('Sorry, there was an error') && !message.content.includes('Please select a processed note') && !message.content.includes('Please enter a question') && !message.content.includes('Mic Error') && message.content !== notFoundMessage && (
                                                            <button
                                                                className="speak-button"
                                                                onClick={() => handleSpeakClick(message.content)}
                                                                title="Speak this message aloud"
                                                                aria-label="Speak this message aloud"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16px" height="16px">
                                                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {/* Conditionally render General Knowledge button */}
                                                        {message.content === notFoundMessage && index > 0 && chatHistory[index - 1]?.type === 'user' && (
                                                            <button
                                                                className="general-knowledge-button"
                                                                onClick={() => handleGeneralKnowledgeQuery(chatHistory[index - 1].content)}
                                                                title="Ask AI based on general knowledge"
                                                                aria-label="Ask AI based on general knowledge"
                                                                disabled={loading}
                                                            >
                                                                Try General Search
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )
                                    ))}
                                </div>
                                
                                <form onSubmit={handleQuerySubmit} className="query-form">
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder={isRecording ? "Listening..." : "Ask a question about your notes..."}
                                        disabled={loading || isRecording}
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleMicClick}
                                        className={`mic-button ${isRecording ? 'recording' : ''}`}
                                        disabled={loading || !SpeechRecognition}
                                        title={SpeechRecognition ? (isRecording ? "Stop Recording" : "Start Recording") : "Voice input not supported"}
                                    >
                                        <svg 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            viewBox="0 0 24 24" 
                                            fill="currentColor" 
                                            width="18px" 
                                            height="18px"
                                            aria-hidden="true"
                                        >
                                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                          <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V22h-3v2h8v-2h-3v-1.06A9 9 0 0 0 21 12v-2h-2z"/>
                                        </svg>
                                    </button>
                                    <button type="submit" disabled={loading || isRecording}>
                                        Ask
                                    </button>
                                </form>
                            </div>
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