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
        setCourseName(cls.courseName);
        setProfessorId(cls.professor);
        setSelectedStudents(cls.students || []);
    };

    const handleStudentToggle = (id) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const ref = doc(db, 'classes', editing);
        await updateDoc(ref, {
            courseName,
            professor: professorId,
            students: selectedStudents
        });
        alert('✅ Class updated!');
        setEditing(null);
        setCourseName('');
        setProfessorId('');
        setSelectedStudents([]);
        const refreshed = await getDocs(collection(db, 'classes'));
        setClasses(refreshed.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    return (
        <div className="user-management-container">
            <div className="header-container">
                <h2>Edit Class</h2>
                <button onClick={() => navigate('/admin-dashboard')} className="back-button">Back to Dashboard</button>
            </div>
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
                            {students.map(s => (
                                <div className="student-item" key={s.id}>
                                    <input
                                        type="checkbox"
                                        id={`student-${s.id}`}
                                        checked={selectedStudents.includes(s.id)}
                                        onChange={() => handleStudentToggle(s.id)}
                                    />
                                    <label htmlFor={`student-${s.id}`}>
                                        {s.email}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="cancel-button"
                            onClick={() => {
                                setEditing(null);
                                setCourseName('');
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
        </div>
    );
};

export default EditClassMode;