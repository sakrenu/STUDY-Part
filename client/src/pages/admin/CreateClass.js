import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateClass.css';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc
} from 'firebase/firestore';

const CreateClassMode = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [courseName, setCourseName] = useState('');
    const [className, setClassName] = useState('');
    const [professorId, setProfessorId] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const db = getFirestore();

    useEffect(() => {
        const fetchUsers = async () => {
            const snapshot = await getDocs(collection(db, 'users'));
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(list);
        };
        fetchUsers();
    }, [db]);

    const handleStudentToggle = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addDoc(collection(db, 'classes'), {
            courseName,
            className,
            professor: professorId,
            students: selectedStudents,
            createdAt: new Date()
        });
        alert('✅ Class created!');
        setCourseName('');
        setProfessorId('');
        setSelectedStudents([]);
    };

    const professors = users.filter(u => u.role === 'teacher');
    const students = users.filter(u => u.role === 'student');

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
                <h1>Create Class</h1>
                <h3>Create new classes and assign teachers and students</h3>
            </div>

            <main className="admin-main-content">
                <form onSubmit={handleSubmit} className="create-class-form">
                    <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Course Name" required />
                    <input type="text" value={className} onChange={e => setClassName(e.target.value)} placeholder="Class Name"required/>
                    <select value={professorId} onChange={e => setProfessorId(e.target.value)} required>
                        <option value="">Select Professor</option>
                        {professors.map(p => <option key={p.id} value={p.id}>{p.email}</option>)}
                    </select>
                    <div className="student-checkboxes">
                        <p>Select Students:</p>
                        <div className="student-list">
                            {students.map(s => (
                                <div 
                                    className={`student-item ${selectedStudents.includes(s.id) ? 'selected' : ''}`}
                                    key={s.id}
                                    // onClick={() => handleStudentToggle(s.id)}
                                >
                                    <input
                                        type="checkbox"
                                        id={`student-${s.id}`}
                                        checked={selectedStudents.includes(s.id)}
                                        onChange={() => handleStudentToggle(s.id)}
                                    />
                                    <label htmlFor={`student-${s.id}`}>
                                        <span className="student-email">{s.email}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit">Create Class</button>
                </form>
            </main>
        </div>
    );
};

export default CreateClassMode;
