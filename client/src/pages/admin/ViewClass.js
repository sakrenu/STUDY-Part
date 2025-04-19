import React, { useEffect, useState } from 'react';
import './ViewClass.css';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ViewClassMode = () => {
    const navigate = useNavigate(); 
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [expandedClass, setExpandedClass] = useState(null);
    const db = getFirestore();

    useEffect(() => {
        const fetchData = async () => {
            const userSnap = await getDocs(collection(db, 'users'));
            const classSnap = await getDocs(collection(db, 'classes'));
            setUsers(userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setClasses(classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchData();
    }, [db]);

    const getEmail = (id) => users.find(u => u.id === id)?.email || 'Unknown';

    const toggleExpand = (classId) => {
        setExpandedClass(expandedClass === classId ? null : classId);
    };

    return (
        <div className="admin-dashboard  view-class-page">
            {/* Top Navigation */}
            <nav className="top-nav">
                <div className="logo-container">
                    <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
                    <a href="/" className="logo">
                        <span className="study">Study</span>
                        <span className="part">Part</span>
                    </a>
                </div>
                <button className="back-btn" onClick={() => navigate('/admin-dashboard')}>Back to Dashboard</button>
            </nav>

            {/* Welcome Section */}
            <div className="welcome-section">
                <h1>View Classes</h1>
                <h3>Overview of all classes and their assignments</h3>
            </div>

            <main className="admin-main-content">
                <div className="table-container">
                    <table className="class-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Class</th>
                                <th>Professor</th>
                                <th>Students</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classes.map(cls => (
                                <React.Fragment key={cls.id}>
                                    <tr>
                                        <td>{cls.courseName || '—'}</td>
                                        <td>{cls.className || '—'}</td>
                                        <td>{getEmail(cls.professor)}</td>
                                        <td>{cls.students?.length || 0}</td>
                                        <td className="date-column">
                                            {cls.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                                        </td>
                                        <td>
                                            <button 
                                                className="expand-btn"
                                                onClick={() => toggleExpand(cls.id)}
                                            >
                                                {expandedClass === cls.id ? '▲' : '▼'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedClass === cls.id && (
                                        <tr className="expanded-row">
                                            <td colSpan="6">
                                                <div className="expanded-content">
                                                    <div className="detail-section">
                                                        <h4>Course Details</h4>
                                                        <p><strong>Course Name:</strong> {cls.courseName || '—'}</p>
                                                        <p><strong>Class Name:</strong> {cls.className || '—'}</p>
                                                        <p><strong>Professor:</strong> {getEmail(cls.professor)}</p>
                                                        <p><strong>Created:</strong> {cls.createdAt?.toDate?.().toLocaleString() || 'N/A'}</p>
                                                    </div>
                                                    <div className="students-section">
                                                        <h4>Students ({cls.students?.length || 0})</h4>
                                                        {cls.students?.length > 0 ? (
                                                            <ul className="student-list">
                                                                {cls.students.map(studentId => (
                                                                    <li key={studentId}>
                                                                        {getEmail(studentId)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p>No students enrolled</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default ViewClassMode;