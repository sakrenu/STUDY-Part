import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

const StudentDashboard = () => {
    const navigate = useNavigate();
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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="student-dashboard">
            {/* Top Navigation */}
            <nav className="top-nav">
                <div className="logo-container">
                    <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
                    <a href="/" className="logo">
                        <span className="study">Study</span>
                        <span className="part">Part</span>
                    </a>
                </div>
                <button className="logout-btn" onClick={() => navigate('/')}>Logout</button>
            </nav>

            {/* Main Content */}
            <div className="welcome-section">
                <h1>Welcome to Your Student Dashboard</h1>
                <h3>Explore Learning Resources and Tools</h3>
            </div>

            <div className="mode-cards">
                {/* Learning Mode Card */}
                <div className="mode-card" onClick={() => navigate('/learning-mode')}>
                    <div className="card-icon">
                        <img src="/student-learningmode.jpg" alt="Learning Mode" />
                    </div>
                    <h2>Learning Mode</h2>
                    <p>Explore segmented images, review notes, and dive into learning resources.</p>
                </div>

                {/* Talk to Notes Mode Card */}
                <div className="mode-card" onClick={() => navigate('/talk-to-notes')}>
                    <div className="card-icon">
                        <img src="/talktonotes.png" alt="Talk to Notes Mode" />
                    </div>
                    <h2>Talk to Notes</h2>
                    <p>Interact with your notes using AI to get instant answers and explanations.</p>
                </div>

                {/* Notes Mode Card */}
                <div className="mode-card" onClick={() => navigate('/notes-mode')}>
                    <div className="card-icon">
                        <img src="/student-notesmode.jpg" alt="Notes Mode" />
                    </div>
                    <h2>Notes Mode</h2>
                    <p>Organize and revisit your notes for quick study sessions.</p>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
