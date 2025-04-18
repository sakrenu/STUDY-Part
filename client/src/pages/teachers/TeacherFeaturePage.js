import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherFeaturePage.css';

const TeacherFeaturePage = () => {
    const navigate = useNavigate();

    return (
        <div className="teacher-dashboard">
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
            <main className="dashboard-content">
                <div className="welcome-section">
                    <h1>Discover the Teacher Features</h1>
                    <h3>Explore Powerful Teaching Tools with StudyPart</h3>
                </div>

                <div className="mode-cards">
                    {/* Teaching Mode Card */}
                    <div className="mode-card" onClick={() => navigate('/dashboard/teaching')}>
                        <div className="card-icon">
                            <img src="teacher-teachingmode.jpg" alt="Teaching Mode" />
                        </div>
                        <h2>Teaching Mode</h2>
                        <p>Create engaging lessons, manage classroom interactions, and upload resources seamlessly.</p>
                    </div>

                    {/* Quiz Mode Card */}
                    <div className="mode-card" onClick={() => navigate('/dashboard/quiz-mode')}>
                        <div className="card-icon">
                            <img src="teacher-quizmode.jpg" alt="Quiz Mode" />
                        </div>
                        <h2>Quiz Mode</h2>
                        <p>Design custom quizzes, track student performance, and foster an interactive learning environment.</p>
                    </div>

                    {/* Manage Students Card */}
                    <div className="mode-card" onClick={() => navigate('/dashboard/manage-students')}>
                        <div className="card-icon">
                            <img src="teacher-managestudents.jpg" alt="Manage Students" />
                        </div>
                        <h2>Manage Students</h2>
                        <p>Organize student data, communicate effectively, and monitor individual progress in one place.</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherFeaturePage;
