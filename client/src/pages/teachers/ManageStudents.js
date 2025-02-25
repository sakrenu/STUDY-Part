// 
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import './ManageStudents.css';

const ManageStudents = ({ teacherId }) => {
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [error, setError] = useState(null);
    const [showExistingStudents, setShowExistingStudents] = useState(false); // New state for toggling existing students
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all students
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const studentList = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(user => user.role === 'student');
                setStudents(studentList);
            } catch (err) {
                setError('Failed to fetch students: ' + err.message);
            }
        };

        fetchStudents();
    }, []);

    // Fetch all groups
    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const teacherRef = doc(db, 'teachers', teacherId);
                const teacherData = (await getDoc(teacherRef)).data();
                if (teacherData && teacherData.groups) {
                    setGroups(teacherData.groups);
                }
            } catch (err) {
                setError('Failed to fetch groups: ' + err.message);
            }
        };

        fetchGroups();
    }, [teacherId]);

    // Create a new group
    const handleCreateGroup = async () => {
        if (!newGroupName) {
            setError('Group name cannot be empty.');
            return;
        }

        const groupId = `group_${Date.now()}`;
        const newGroup = {
            id: groupId,
            name: newGroupName,
            students: [],
        };

        try {
            const teacherRef = doc(db, 'teachers', teacherId);
            await updateDoc(teacherRef, {
                groups: arrayUnion(newGroup),
            });

            setGroups([...groups, newGroup]);
            setNewGroupName('');
        } catch (err) {
            setError('Failed to create group: ' + err.message);
        }
    };

    // Add selected students to a group
    const handleAddStudentsToGroup = async () => {
        if (!selectedGroup || selectedStudents.length === 0) {
            setError('Please select a group and at least one student.');
            return;
        }

        try {
            const teacherRef = doc(db, 'teachers', teacherId);
            const updatedGroups = groups.map(group => {
                if (group.id === selectedGroup) {
                    return {
                        ...group,
                        students: [...group.students, ...selectedStudents],
                    };
                }
                return group;
            });

            await updateDoc(teacherRef, {
                groups: updatedGroups,
            });

            setGroups(updatedGroups);
            setSelectedStudents([]);
        } catch (err) {
            setError('Failed to add students to group: ' + err.message);
        }
    };

    // Share notes with a group or all students
    const handleShareNotes = async (groupId = null) => {
        try {
            const teacherRef = doc(db, 'teachers', teacherId);
            const teacherData = (await getDoc(teacherRef)).data();

            if (!teacherData || !teacherData.notes) {
                setError('No notes found to share.');
                return;
            }

            const notes = teacherData.notes;

            if (groupId) {
                // Share notes with a specific group
                const group = groups.find(g => g.id === groupId);
                if (!group) {
                    setError('Group not found.');
                    return;
                }

                for (const studentId of group.students) {
                    const studentRef = doc(db, 'users', studentId);
                    await updateDoc(studentRef, {
                        sharedNotes: arrayUnion(...notes),
                    });
                }
            } else {
                // Share notes with all students
                for (const student of students) {
                    const studentRef = doc(db, 'users', student.id);
                    await updateDoc(studentRef, {
                        sharedNotes: arrayUnion(...notes),
                    });
                }
            }

            alert('Notes shared successfully!');
        } catch (err) {
            setError('Failed to share notes: ' + err.message);
        }
    };

    const handleSelectStudent = (id) => {
        setSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(studentId => studentId !== id) : [...prev, id]
        );
    };

    const handleAddUser = () => {
        // Logic to add a new user
    };

    const filteredStudents = students.filter(student => 
        student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="manage-students">
            <h1>Manage Students</h1>
            {error && <div className="error-message">{error}</div>}

            <div className="actions">
                <input 
                    type="text" 
                    placeholder="Search by name..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="search-input"
                />
                <button onClick={handleAddUser} className="add-user-button">Add User</button>
            </div>

            {/* Create Group Section */}
            <section className="create-group-section">
                <h2>Create New Group</h2>
                <input
                    type="text"
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                />
                <button onClick={handleCreateGroup}>Create Group</button>
                <button onClick={() => setShowExistingStudents(!showExistingStudents)}>
                    {showExistingStudents ? 'Hide Existing Students' : 'Show Existing Students'}
                </button>
                {showExistingStudents && (
                    <div className="existing-students-list">
                        <h3>Existing Students in Groups</h3>
                        {groups.map(group => (
                            <div key={group.id} className="group-students">
                                <h4>{group.name}</h4>
                                <ul>
                                    {group.students.map(studentId => {
                                        const student = students.find(s => s.id === studentId);
                                        return <li key={studentId}>{student ? student.name : 'Unknown Student'}</li>;
                                    })}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Add Students to Group Section */}
            <section className="add-students-section">
                <h2>Add Students to Group</h2>
                <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                >
                    <option value="">Select a group</option>
                    {groups.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.name}
                        </option>
                    ))}
                </select>
                <div className="student-list">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="student-item">
                            <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleSelectStudent(student.id)}
                            />
                            <span>{student.name}</span>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddStudentsToGroup}>Add Selected Students to Group</button>
            </section>

            {/* Share Notes Section */}
            <section className="share-notes-section">
                <h2>Share Notes</h2>
                <button onClick={() => handleShareNotes()}>Share Notes with All Students</button>
                <div className="group-list">
                    {groups.map(group => (
                        <div key={group.id} className="group-card">
                            <h3>{group.name}</h3>
                            <button onClick={() => handleShareNotes(group.id)}>
                                Share Notes with {group.name}
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ManageStudents;