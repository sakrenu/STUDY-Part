
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './StudentDashboard.css';

const LearningMode = ({ studentId }) => {
    const [originalImage, setOriginalImage] = useState(null);
    const [segmentedParts, setSegmentedParts] = useState([]);
    const [selectedNotes, setSelectedNotes] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard'); // Track active tab
    const [notifications, setNotifications] = useState([]); // State for notifications

    // Fetch student data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentRef = doc(db, 'students_notes', studentId);
                const studentData = (await getDoc(studentRef)).data();

                if (studentData) {
                    setOriginalImage(studentData.originalImage);
                    setSegmentedParts(studentData.segmentedImages);
                    setNotifications(studentData.notifications || []); // Fetch notifications
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            }
        };

        fetchData();
    }, [studentId]);

    // Handle segment click
    const handlePartClick = (notes) => {
        setSelectedNotes(notes);
    };

    // Render content based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <>
                        {originalImage && (
                            <div className="image-container">
                                <img src={originalImage} alt="Original" className="original-image" />
                                {segmentedParts.map((part, index) => (
                                    <div
                                        key={index}
                                        className="segment-highlight"
                                        style={{ top: part.top, left: part.left, width: part.width, height: part.height }}
                                        onClick={() => handlePartClick(part.notes)}
                                    />
                                ))}
                            </div>
                        )}

                        {selectedNotes && (
                            <div className="notes-section card-neon">
                                <h2>Notes</h2>
                                <p>{selectedNotes}</p>
                            </div>
                        )}
                    </>
                );
            case 'view-notes':
                return (
                    <div className="view-notes-section card-neon">
                        <h2>View Notes</h2>
                        {segmentedParts.length > 0 ? (
                            <div className="notes-grid">
                                {segmentedParts.map((part, index) => (
                                    <div key={index} className="note-card">
                                        <p>{part.notes}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No notes available.</p>
                        )}
                    </div>
                );
            case 'notifications':
                return (
                    <div className="notifications-section card-neon">
                        <h2>Notifications</h2>
                        {notifications.length > 0 ? (
                            <ul>
                                {notifications.map((notification, index) => (
                                    <li key={index} className="notification-item">
                                        <p>{notification}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No new notifications.</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="student-dashboard">
            {/* Navbar */}
            <nav className="navbar">
                <ul>
                    <li
                        className={activeTab === 'dashboard' ? 'active' : ''}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        Dashboard
                    </li>
                    <li
                        className={activeTab === 'view-notes' ? 'active' : ''}
                        onClick={() => setActiveTab('view-notes')}
                    >
                        View Notes
                    </li>
                    <li
                        className={activeTab === 'notifications' ? 'active' : ''}
                        onClick={() => setActiveTab('notifications')}
                    >
                        Notifications
                    </li>
                </ul>
            </nav>

            {/* Header */}
            <header className="dashboard-header">
                <h1 className="dashboard-title">Learning Mode</h1>
                <p className="dashboard-subtitle">Explore and learn from your teacher's notes.</p>
            </header>

            {/* Main Content */}
            <div className="main-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default LearningMode;