import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './LearningMode.css';

const LearningMode = ({ studentId }) => {
    const [originalImage, setOriginalImage] = useState(null);
    const [segmentedParts, setSegmentedParts] = useState([]);
    const [selectedNotes, setSelectedNotes] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [professors, setProfessors] = useState({});
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

    // Add new useEffect to fetch professor details
    useEffect(() => {
        const fetchProfessors = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const profMap = {};
                usersSnap.docs.forEach(doc => {
                    const userData = doc.data();
                    if (userData.role === 'teacher') {
                        profMap[doc.id] = userData.email;
                    }
                });
                setProfessors(profMap);
            } catch (err) {
                console.error('Failed to fetch professors:', err);
            }
        };

        fetchProfessors();
    }, []);

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
                <button className="logout-btn" onClick={() => navigate('/student-dashboard')}>
                    Back
                </button>
            </nav>

            {/* Header */}
            <header className="dashboard-header">
                <h1 className="dashboard-title">Your Courses</h1>
                <p className="dashboard-subtitle">Access your enrolled courses</p>
            </header>

            {/* Main Content - Directly showing courses */}
            <div className="main-content">
                <div className="courses-overview">
                    <div className="courses-grid">
                        {enrolledCourses.map((course, index) => (
                            <div 
                                key={course.id} 
                                className="course-card"
                                onClick={() => navigate(`/course/${course.id}`)}
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
                                    <h3 className="course-name">{course.courseName}</h3>
                                    <p className="professor-name" style={{ 
                                        color: 'rgba(255, 255, 255, 0.8)', 
                                        fontSize: '0.9rem', 
                                        marginTop: '8px' 
                                    }}>
                                        Professor: {professors[course.professor] || 'Loading...'}
                                    </p>
                                </div>
                                <div className="course-details">
                                    <p>Class: {course.className}</p>
                                    <p>Students: {course.students?.length || 0}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LearningMode;