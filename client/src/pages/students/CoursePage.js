import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './CoursePage.css';

const CoursePage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [courseData, setCourseData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const courseRef = doc(db, 'classes', courseId);
                const courseSnap = await getDoc(courseRef);
                
                if (courseSnap.exists()) {
                    setCourseData({ id: courseSnap.id, ...courseSnap.data() });
                }
            } catch (err) {
                console.error('Error fetching course:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [courseId]);

    if (loading) return <div className="loading">Loading course details...</div>;
    if (!courseData) return <div className="error">Course not found</div>;

    return (
        <div className="course-page">
            <nav className="top-nav">
                <div className="logo-container">
                    <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
                    <a href="/" className="logo">
                        <span className="study">Study</span>
                        <span className="part">Part</span>
                    </a>
                </div>
                <button className="back-btn" onClick={() => navigate(-1)}>
                    Back
                </button>
            </nav>
            
            <div className="course-content">
                <h1>{courseData.courseName}</h1>
                <div className="course-details">
                    <h2>Class Details</h2>
                    <p><strong>Class Name:</strong> {courseData.className}</p>
                    <p><strong>Students Enrolled:</strong> {courseData.students?.length || 0}</p>
                    <p><strong>Created:</strong> {courseData.createdAt?.toDate?.().toLocaleDateString()}</p>
                </div>

                {/* Add more course-specific content here */}
                <div className="course-materials">
                    <h2>Course Materials</h2>
                    {/* Add materials list, assignments, etc. */}
                </div>
            </div>
        </div>
    );
};

export default CoursePage;
