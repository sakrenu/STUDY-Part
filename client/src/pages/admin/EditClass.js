import React, { useState, useEffect } from 'react';
import './EditClass.css';
import {
    getFirestore,
    collection,
    getDocs,
    updateDoc,
    doc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const EditClassMode = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [editing, setEditing] = useState(null);
    const [courseName, setCourseName] = useState('');
    const [className, setClassName] = useState('');
    const [professorId, setProfessorId] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const db = getFirestore();

    useEffect(() => {
        const fetchData = async () => {
            const usersSnap = await getDocs(collection(db, 'users'));
            const userList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
            const classSnap = await getDocs(collection(db, 'classes'));
            const classList = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setClasses(classList);
        };
        fetchData();
    }, [db]);

    const professors = users.filter(u => u.role === 'teacher');
    const students = users.filter(u => u.role === 'student');

    const loadClass = (cls) => {
        setEditing(cls.id);
        setClassName(cls.className); 
        setCourseName(cls.courseName);
        setProfessorId(cls.professor);
        // Ensure students array is properly initialized
        const validStudentIds = Array.isArray(cls.students) 
        ? cls.students.filter(id => typeof id === 'string' || typeof id === 'number')
        : [];
        setSelectedStudents(validStudentIds);
    };

    const handleStudentToggle = (studentId) => {
        setSelectedStudents(prevSelected => {
            // Create a new array to avoid state mutation
            const newSelected = [...prevSelected];
            const index = newSelected.indexOf(studentId);
            
            if (index > -1) {
                // Remove the student if already selected
                newSelected.splice(index, 1);
            } else {
                // Add the student if not selected
                newSelected.push(studentId);
            }
            
            return newSelected;
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const ref = doc(db, 'classes', editing);
        await updateDoc(ref, {
            courseName,
            className,
            professor: professorId,
            students: selectedStudents
        });
        alert('✅ Class updated!');
        setEditing(null);
        setCourseName('');
        setClassName('');
        setProfessorId('');
        setSelectedStudents([]);
        const refreshed = await getDocs(collection(db, 'classes'));
        setClasses(refreshed.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

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
                <h1>Edit Class</h1>
                <h3>Modify existing classes and update assignments</h3>
            </div>

            <main className="admin-main-content">
                <div className="class-list">
                    {classes.map(cls => (
                        <div key={cls.id} className="class-item">
                            <span className="class-name">{cls.courseName}</span>
                            <button className="edit-button" onClick={() => loadClass(cls)}>
                                Edit
                            </button>
                        </div>
                    ))}
                </div>

                {editing && (
                    <form onSubmit={handleUpdate} className="create-class-form">
                        <input 
                            type="text" 
                            value={courseName} 
                            onChange={e => setCourseName(e.target.value)} 
                            placeholder="Course Name"
                            required 
                        />
                        <input 
                            type="text" 
                            value={className} 
                            onChange={e => setClassName(e.target.value)} 
                            placeholder="Class Name"
                            required 
                        />

                        <select 
                            value={professorId} 
                            onChange={e => setProfessorId(e.target.value)} 
                            required
                        >
                            <option value="">Select Professor</option>
                            {professors.map(p => (
                                <option key={p.id} value={p.id}>{p.email}</option>
                            ))}
                        </select>
                        <div className="student-checkboxes">
                            <p>Select Students:</p>
                            <div className="student-list">
                            {students.map(student => (
                            <div 
                                className={`student-item ${selectedStudents.includes(student.id) ? 'selected' : ''}`}
                                key={student.id}
                                onClick={() => handleStudentToggle(student.id)}
                            >
                                <input
                                    type="checkbox"
                                    id={`student-${student.id}`}
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => handleStudentToggle(student.id)}
                                    className="student-checkbox"
                                />
                                <label htmlFor={`student-${student.id}`} className="student-label">
                                    {student.email}
                                </label>
                            </div>
                        ))}
                            </div>
                        </div>
                        <div className="button-group">
                            <button 
                                type="button" 
                                className="cancel-button"
                                onClick={() => {
                                    setEditing(null);
                                    setCourseName('');
                                    setClassName('');
                                    setProfessorId('');
                                    setSelectedStudents([]);
                                }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="update-button">
                                Update Class
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
};

export default EditClassMode;