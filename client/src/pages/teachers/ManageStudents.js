import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import './ManageStudents.css';

const ManageStudents = ({ teacherId }) => {
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [newGroupName, setNewGroupName] = useState('');

    // Fetch all students and groups
    useEffect(() => {
        const fetchData = async () => {
            const studentsSnapshot = await getDocs(collection(db, 'students'));
            const studentsData = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentsData);

            const groupsSnapshot = await getDocs(collection(db, 'groups'));
            const groupsData = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGroups(groupsData);
        };

        fetchData();
    }, [teacherId]);

    // Create a new group
    const handleCreateGroup = async () => {
        if (!newGroupName) return;

        const groupId = `group_${Date.now()}`;
        await setDoc(doc(db, 'groups', groupId), {
            groupId,
            groupName: newGroupName,
            teacherId,
            studentIds: [],
        });

        setGroups([...groups, { groupId, groupName: newGroupName, teacherId, studentIds: [] }]);
        setNewGroupName('');
    };

    // Add students to a group
    const handleAddStudentsToGroup = async () => {
        if (!selectedGroup || selectedStudents.length === 0) return;

        const groupRef = doc(db, 'groups', selectedGroup);
        await updateDoc(groupRef, {
            studentIds: arrayUnion(...selectedStudents),
        });

        // Update local state
        const updatedGroups = groups.map(group =>
            group.groupId === selectedGroup
                ? { ...group, studentIds: [...group.studentIds, ...selectedStudents] }
                : group
        );
        setGroups(updatedGroups);
        setSelectedStudents([]);
    };

    // Remove a student from a group
    const handleRemoveStudentFromGroup = async (groupId, studentId) => {
        const groupRef = doc(db, 'groups', groupId);
        const groupData = (await getDoc(groupRef)).data();

        const updatedStudentIds = groupData.studentIds.filter(id => id !== studentId);
        await updateDoc(groupRef, {
            studentIds: updatedStudentIds,
        });

        // Update local state
        const updatedGroups = groups.map(group =>
            group.groupId === groupId ? { ...group, studentIds: updatedStudentIds } : group
        );
        setGroups(updatedGroups);
    };

    return (
        <div className="manage-students">
            <h1>Manage Students</h1>

            {/* Create Group Section */}
            <div className="create-group-section">
                <h2>Create New Group</h2>
                <input
                    type="text"
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                />
                <button onClick={handleCreateGroup}>Create Group</button>
            </div>

            {/* Add Students to Group Section */}
            <div className="add-students-section">
                <h2>Add Students to Group</h2>
                <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                >
                    <option value="">Select a group</option>
                    {groups.map(group => (
                        <option key={group.groupId} value={group.groupId}>
                            {group.groupName}
                        </option>
                    ))}
                </select>
                <div className="student-list">
                    {students.map(student => (
                        <div key={student.id} className="student-item">
                            <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={(e) =>
                                    setSelectedStudents(
                                        e.target.checked
                                            ? [...selectedStudents, student.id]
                                            : selectedStudents.filter(id => id !== student.id)
                                    )
                                }
                            />
                            <span>{student.name}</span>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddStudentsToGroup}>Add Selected Students to Group</button>
            </div>

            {/* Group Management Section */}
            <div className="group-management-section">
                <h2>Group Management</h2>
                {groups.map(group => (
                    <div key={group.groupId} className="group-card">
                        <h3>{group.groupName}</h3>
                        <ul>
                            {group.studentIds.map(studentId => {
                                const student = students.find(s => s.id === studentId);
                                return (
                                    <li key={studentId}>
                                        {student?.name}
                                        <button
                                            onClick={() => handleRemoveStudentFromGroup(group.groupId, studentId)}
                                        >
                                            Remove
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageStudents;