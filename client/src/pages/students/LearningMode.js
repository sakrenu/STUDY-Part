import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';

const LearningMode = ({ studentId }) => {
    const [originalImage, setOriginalImage] = useState(null);
    const [segmentedParts, setSegmentedParts] = useState([]);
    const [selectedNotes, setSelectedNotes] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [notifications, setNotifications] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const auth = getAuth();
    const navigate = useNavigate();

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

    // Add new useEffect to fetch enrolled courses
    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            try {
                const classesSnap = await getDocs(collection(db, 'classes'));
                const userEmail = auth.currentUser?.email;
                
                // Get user's ID from email
                const usersQuery = query(collection(db, 'users'), where('email', '==', userEmail));
                const userSnapshot = await getDocs(usersQuery);
                const userId = userSnapshot.docs[0]?.id;

                // Filter classes where student is enrolled
                const enrolled = classesSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(cls => cls.students?.includes(userId));

                setEnrolledCourses(enrolled);
            } catch (err) {
                console.error('Failed to fetch enrolled courses:', err);
            }
        };

        if (auth.currentUser) {
            fetchEnrolledCourses();
        }
    }, [auth.currentUser]);

    // Handle segment click
    const handlePartClick = (notes) => {
        setSelectedNotes(notes);
    };

    const handleCourseClick = (courseId) => {
        navigate(`/course/${courseId}`);
    };

    // Add these background colors for course cards
    const cardColors = [
        'linear-gradient(135deg, #7367F0, #CE9FFC)', // Purple
        'linear-gradient(135deg, #45B8EA, #98E1F9)', // Blue
        'linear-gradient(135deg, #A8A8A8, #D6D6D6)', // Grey
        'linear-gradient(135deg, #FFA585, #FFEDA0)'  // Orange
    ];

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
            case 'courses':
                return (
                    <div className="courses-overview">
                        <div className="courses-header">
                            <h2>Course Overview</h2>
                        </div>
                        <div className="courses-grid">
                            {enrolledCourses.map((course, index) => (
                                <div 
                                    key={course.id} 
                                    className="course-card"
                                    onClick={() => handleCourseClick(course.id)}
                                    style={{ 
                                        background: cardColors[index % cardColors.length],
                                        padding: '20px',
                                        borderRadius: '10px',
                                        minHeight: '200px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                                    }}
                                >
                                    <div>
                                        <div className="course-department">Information Technology</div>
                                        <h3 className="course-name">{course.courseName}</h3>
                                    </div>
                                    <div className="course-details">
                                        <p>Class: {course.className}</p>
                                        <p>Students: {course.students?.length || 0}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                    <li
                        className={activeTab === 'courses' ? 'active' : ''}
                        onClick={() => setActiveTab('courses')}
                    >
                        My Courses
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