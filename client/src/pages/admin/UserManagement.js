import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc
} from 'firebase/firestore';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [courseName, setCourseName] = useState('');
    const [professorId, setProfessorId] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingClassId, setEditingClassId] = useState(null);

    const db = getFirestore();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userSnapshot = await getDocs(collection(db, 'users'));
                const userList = userSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(userList);

                const classSnapshot = await getDocs(collection(db, 'classes'));
                const classList = classSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setClasses(classList);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const getUserEmailById = (id) => {
        const user = users.find(u => u.id === id);
        return user ? user.email : 'Unknown';
    };

    const professors = users.filter(user => user.role === 'teacher');
    const students = users.filter(user => user.role === 'student');

    const handleStudentToggle = (uid) => {
        setSelectedStudents(prev =>
            prev.includes(uid)
                ? prev.filter(id => id !== uid)
                : [...prev, uid]
        );
    };

    const handleEditClass = (cls) => {
        setCourseName(cls.courseName);
        setProfessorId(cls.professor);
        setSelectedStudents(cls.students || []);
        setIsEditing(true);
        setEditingClassId(cls.id);
    };

    const handleCreateOrEditClass = async (e) => {
        e.preventDefault();

        if (!courseName || !professorId || selectedStudents.length === 0) {
            alert('Please fill in all class details');
            return;
        }

        const classData = {
            courseName,
            professor: professorId,
            students: selectedStudents,
            createdAt: new Date()
        };

        try {
            if (isEditing && editingClassId) {
                const classRef = doc(db, 'classes', editingClassId);
                await updateDoc(classRef, classData);
                alert('✅ Class updated!');
            } else {
                await addDoc(collection(db, 'classes'), classData);
                alert('✅ Class created!');
            }

            // Reset form
            setCourseName('');
            setProfessorId('');
            setSelectedStudents([]);
            setIsEditing(false);
            setEditingClassId(null);

            // Refresh classes
            const classSnapshot = await getDocs(collection(db, 'classes'));
            const classList = classSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setClasses(classList);

        } catch (error) {
            console.error('Error saving class:', error);
            alert('❌ Failed to save class');
        }
    };

    const handleCancelEdit = () => {
        setCourseName('');
        setProfessorId('');
        setSelectedStudents([]);
        setIsEditing(false);
        setEditingClassId(null);
    };

    return (
        <div className="user-management-container">
            <h1>User Management</h1>
            <p>Manage users and create or edit classes.</p>

            <table className="user-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.createdAt?.toDate?.().toLocaleString?.() ?? 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h2>{isEditing ? 'Edit Class' : 'Create Class'}</h2>
            <form onSubmit={handleCreateOrEditClass} className="create-class-form">
                <input
                    type="text"
                    placeholder="Course Name"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    required
                />

                <select
                    value={professorId}
                    onChange={(e) => setProfessorId(e.target.value)}
                    required
                >
                    <option value="">Select Professor</option>
                    {professors.map(prof => (
                        <option key={prof.id} value={prof.id}>
                            {prof.email}
                        </option>
                    ))}
                </select>

                <div className="student-checkboxes">
                    <p>Select Students:</p>
                    {students.map(student => (
                        <label key={student.id}>
                            <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleStudentToggle(student.id)}
                            />
                            {student.email}
                        </label>
                    ))}
                </div>

                <button type="submit">{isEditing ? 'Update Class' : 'Create Class'}</button>
                {isEditing && (
                    <button type="button" onClick={handleCancelEdit} style={{ marginLeft: '10px' }}>
                        Cancel
                    </button>
                )}
            </form>

            <h2>All Classes</h2>
<table className="user-table">
    <thead>
        <tr>
            <th>Course Name</th>
            <th>Professor</th>
            <th>Students</th>
            <th>Number of Students</th> {/* ✅ NEW */}
            <th>Created At</th>
            <th>Actions</th>
        </tr>
    </thead>
    <tbody>
        {classes.map(cls => (
            <tr key={cls.id}>
                <td>{cls.courseName}</td>
                <td>{getUserEmailById(cls.professor)}</td>
                <td>{cls.students?.map(id => getUserEmailById(id)).join(', ')}</td>
                <td>{cls.students?.length ?? 0}</td> {/* ✅ NEW */}
                <td>{cls.createdAt?.toDate?.().toLocaleString?.() ?? 'N/A'}</td>
                <td>
                    <button onClick={() => handleEditClass(cls)}>Edit</button>
                </td>
            </tr>
        ))}
    </tbody>
</table>

        </div>
    );
};

export default UserManagement;
