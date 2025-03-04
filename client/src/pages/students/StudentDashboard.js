import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';
import LearningMode from './LearningMode';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showToggleText, setShowToggleText] = useState(false);
    const [segmentedImages, setSegmentedImages] = useState([]);
    const [notes, setNotes] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLearningContent = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setSegmentedImages(userData.segmentedImages || []);
                    setNotes(userData.notes || {});
                }
            }
            setIsLoading(false);
        };

        fetchLearningContent();
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleMouseEnter = () => {
        setShowToggleText(true);
    };

    const handleMouseLeave = () => {
        setShowToggleText(false);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="teacher-feature-page">
            {/* Logo and Title */}
            <div className="logo-container">
                <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
                <a href="/" className="logo">
                    <span className="study">Study</span>
                    <span className="part">Part</span>
                </a>
            </div>

            {/* Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <nav className="menu">
                    <button onClick={() =>navigate('/learning-mode')}>Learning Mode</button>
                    <button onClick={() => navigate('/students/quiz-mode')}>Quiz Mode</button> {/* Updated */}
                    <button onClick={() => navigate('/notes-mode')}>Notes Mode</button>

                </nav>
                <div className="logout">
                    <button onClick={() => alert('Settings are under development!')}>Settings</button>
                    <button onClick={() => navigate('/')}>Logout</button>
                </div>
            </aside>

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
            <main className={`feature-info ${isSidebarOpen ? '' : 'closed'}`}>
                {/* Header Text */}
                <div>
                    <h1 className="header-text">Welcome to Your Student Dashboard</h1>
                    <h3>Explore Learning Resources and Tools</h3>
                </div>

                {/* Section 1: Learning Mode */}
                <div className="image-box" onClick={() => navigate('/learning-mode')}>
                    <div className="text-content">
                        <h2>Learning Mode</h2>
                        <p>Explore segmented images, review notes, and dive into learning resources.</p>
                    </div>
                    <div className="image-content">
                        <img src="student-learningmode.jpg" alt="Learning Mode" />
                    </div>
                </div>

                {/* Section 2: Quiz Mode */}
                <div className="image-box" onClick={() => navigate('/students/quiz-mode')}> {/* Updated */}
                    <div className="text-content">
                        <h2>Quiz Mode</h2>
                        <p>Test your knowledge with interactive quizzes and track progress.</p>
                    </div>
                    <div className="image-content">
                        <img src="student-quizmode.jpg" alt="Quiz Mode" />
                    </div>
                </div>

                {/* Section 3: Notes Mode */}
                <div className="image-box" onClick={() => navigate('/notes-mode')}>

                    <div className="text-content">
                        <h2>Notes Mode</h2>
                        <p>Organize and revisit your notes for quick study sessions.</p>
                    </div>
                    <div className="image-content">
                        <img src="student-notesmode.jpg" alt="Performance Tracking" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;
