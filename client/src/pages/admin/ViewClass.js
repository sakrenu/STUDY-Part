import React, { useEffect, useState } from 'react';
import './ViewClass.css';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ViewClassMode = () => {
    const navigate = useNavigate(); 
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
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

    return (
        <div className="admin-dashboard">
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

            {/* Welcome Section with Centered Heading */}
            <div className="welcome-section">
                <h1>View Classes</h1>
                <h3>Overview of all classes and their assignments</h3>
            </div>

            <main className="admin-main-content">
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>Course Name</th>
                            <th>Class Name</th>
                            <th>Professor</th>
                            <th>Students</th>
                            <th>Number of Students</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {classes.map(cls => (
                            <tr key={cls.id}>
                                <td>{cls.courseName}</td>
                                <td>{cls.className || '—'}</td>
                                <td>{getEmail(cls.professor)}</td>
                                <td>{cls.students?.map(getEmail).join(', ')}</td>
                                <td>{cls.students?.length ?? 0}</td>
                                <td>{cls.createdAt?.toDate?.().toLocaleString() ?? 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </main>
        </div>
    );
};

export default ViewClassMode;