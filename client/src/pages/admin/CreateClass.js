import React, { useState, useEffect } from 'react';
import './CreateClass.css';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc
} from 'firebase/firestore';

const CreateClassMode = () => {
    const [users, setUsers] = useState([]);
    const [courseName, setCourseName] = useState('');
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
        <div className="user-management-container">
            <h2>Create Class</h2>
            <form onSubmit={handleSubmit} className="create-class-form">
                <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Course Name" required />
                <select value={professorId} onChange={e => setProfessorId(e.target.value)} required>
                    <option value="">Select Professor</option>
                    {professors.map(p => <option key={p.id} value={p.id}>{p.email}</option>)}
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



                <button type="submit">Create Class</button>
            </form>
        </div>
    );
};

export default CreateClassMode;
