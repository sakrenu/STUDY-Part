// // 
// import React, { useState, useEffect } from 'react';
// import { db } from '../../firebase';
// import { collection, getDocs, doc, setDoc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
// import './ManageStudents.css';

// const ManageStudents = ({ teacherId }) => {
//     const [students, setStudents] = useState([]);
//     const [groups, setGroups] = useState([]);
//     const [selectedStudents, setSelectedStudents] = useState([]);
//     const [selectedGroup, setSelectedGroup] = useState('');
//     const [newGroupName, setNewGroupName] = useState('');
//     const [error, setError] = useState(null);
//     const [showExistingStudents, setShowExistingStudents] = useState(false); // New state for toggling existing students

//     // Fetch all students
//     useEffect(() => {
//         const fetchStudents = async () => {
//             try {
//                 const querySnapshot = await getDocs(collection(db, 'users'));
//                 const studentList = querySnapshot.docs
//                     .map(doc => ({ id: doc.id, ...doc.data() }))
//                     .filter(user => user.role === 'student');
//                 setStudents(studentList);
//             } catch (err) {
//                 setError('Failed to fetch students: ' + err.message);
//             }
//         };

//         fetchStudents();
//     }, []);

//     // Fetch all groups
//     useEffect(() => {
//         const fetchGroups = async () => {
//             try {
//                 const teacherRef = doc(db, 'teachers', teacherId);
//                 const teacherData = (await getDoc(teacherRef)).data();
//                 if (teacherData && teacherData.groups) {
//                     setGroups(teacherData.groups);
//                 }
//             } catch (err) {
//                 setError('Failed to fetch groups: ' + err.message);
//             }
//         };

//         fetchGroups();
//     }, [teacherId]);

//     // Create a new group
//     const handleCreateGroup = async () => {
//         if (!newGroupName) {
//             setError('Group name cannot be empty.');
//             return;
//         }

//         const groupId = `group_${Date.now()}`;
//         const newGroup = {
//             id: groupId,
//             name: newGroupName,
//             students: [],
//         };

//         try {
//             const teacherRef = doc(db, 'teachers', teacherId);
//             await updateDoc(teacherRef, {
//                 groups: arrayUnion(newGroup),
//             });

//             setGroups([...groups, newGroup]);
//             setNewGroupName('');
//         } catch (err) {
//             setError('Failed to create group: ' + err.message);
//         }
//     };

//     // Add selected students to a group
//     const handleAddStudentsToGroup = async () => {
//         if (!selectedGroup || selectedStudents.length === 0) {
//             setError('Please select a group and at least one student.');
//             return;
//         }

//         try {
//             const teacherRef = doc(db, 'teachers', teacherId);
//             const updatedGroups = groups.map(group => {
//                 if (group.id === selectedGroup) {
//                     return {
//                         ...group,
//                         students: [...group.students, ...selectedStudents],
//                     };
//                 }
//                 return group;
//             });

//             await updateDoc(teacherRef, {
//                 groups: updatedGroups,
//             });

//             setGroups(updatedGroups);
//             setSelectedStudents([]);
//         } catch (err) {
//             setError('Failed to add students to group: ' + err.message);
//         }
//     };

//     // Share notes with a group or all students
//     const handleShareNotes = async (groupId = null) => {
//         try {
//             const teacherRef = doc(db, 'teachers', teacherId);
//             const teacherData = (await getDoc(teacherRef)).data();

//             if (!teacherData || !teacherData.notes) {
//                 setError('No notes found to share.');
//                 return;
//             }

//             const notes = teacherData.notes;

//             if (groupId) {
//                 // Share notes with a specific group
//                 const group = groups.find(g => g.id === groupId);
//                 if (!group) {
//                     setError('Group not found.');
//                     return;
//                 }

//                 for (const studentId of group.students) {
//                     const studentRef = doc(db, 'users', studentId);
//                     await updateDoc(studentRef, {
//                         sharedNotes: arrayUnion(...notes),
//                     });
//                 }
//             } else {
//                 // Share notes with all students
//                 for (const student of students) {
//                     const studentRef = doc(db, 'users', student.id);
//                     await updateDoc(studentRef, {
//                         sharedNotes: arrayUnion(...notes),
//                     });
//                 }
//             }

//             alert('Notes shared successfully!');
//         } catch (err) {
//             setError('Failed to share notes: ' + err.message);
//         }
//     };

//     return (
//         <div className="manage-students">
//             <h1>Manage Students</h1>
//             {error && <div className="error-message">{error}</div>}

//             {/* Create Group Section */}
//             <section className="create-group-section">
//                 <h2>Create New Group</h2>
//                 <input
//                     type="text"
//                     placeholder="Enter group name"
//                     value={newGroupName}
//                     onChange={(e) => setNewGroupName(e.target.value)}
//                 />
//                 <button onClick={handleCreateGroup}>Create Group</button>
//                 <button onClick={() => setShowExistingStudents(!showExistingStudents)}>
//                     {showExistingStudents ? 'Hide Existing Students' : 'Show Existing Students'}
//                 </button>
//                 {showExistingStudents && (
//                     <div className="existing-students-list">
//                         <h3>Existing Students in Groups</h3>
//                         {groups.map(group => (
//                             <div key={group.id} className="group-students">
//                                 <h4>{group.name}</h4>
//                                 <ul>
//                                     {group.students.map(studentId => {
//                                         const student = students.find(s => s.id === studentId);
//                                         return <li key={studentId}>{student ? student.name : 'Unknown Student'}</li>;
//                                     })}
//                                 </ul>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </section>

//             {/* Add Students to Group Section */}
//             <section className="add-students-section">
//                 <h2>Add Students to Group</h2>
//                 <select
//                     value={selectedGroup}
//                     onChange={(e) => setSelectedGroup(e.target.value)}
//                 >
//                     <option value="">Select a group</option>
//                     {groups.map(group => (
//                         <option key={group.id} value={group.id}>
//                             {group.name}
//                         </option>
//                     ))}
//                 </select>
//                 <div className="student-list">
//                     {students.map(student => (
//                         <div key={student.id} className="student-item">
//                             <input
//                                 type="checkbox"
//                                 checked={selectedStudents.includes(student.id)}
//                                 onChange={(e) =>
//                                     setSelectedStudents(
//                                         e.target.checked
//                                             ? [...selectedStudents, student.id]
//                                             : selectedStudents.filter(id => id !== student.id)
//                                     )
//                                 }
//                             />
//                             <span>{student.name}</span>
//                         </div>
//                     ))}
//                 </div>
//                 <button onClick={handleAddStudentsToGroup}>Add Selected Students to Group</button>
//             </section>

//             {/* Share Notes Section */}
//             <section className="share-notes-section">
//                 <h2>Share Notes</h2>
//                 <button onClick={() => handleShareNotes()}>Share Notes with All Students</button>
//                 <div className="group-list">
//                     {groups.map(group => (
//                         <div key={group.id} className="group-card">
//                             <h3>{group.name}</h3>
//                             <button onClick={() => handleShareNotes(group.id)}>
//                                 Share Notes with {group.name}
//                             </button>
//                         </div>
//                     ))}
//                 </div>
//             </section>
//         </div>
//     );
// };

// export default ManageStudents;
// ManageStudents.js
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import './ManageStudents.css';

const ManageStudents = ({ teacherId }) => {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]); // Default to empty array to avoid undefined
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(5); // Number of students per page

  // Fetch all students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const studentList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            enabled: true, // Default to true for consistency with image
            activated: true, // Default to true
            userGroup: 'Registered', // Default group as in the image
            lastVisit: new Date().toISOString().split('T')[0], // Today's date for demo
            registered: new Date().toISOString().split('T')[0], // Today's date for demo
          }))
          .filter((user) => user.role === 'student');
        setStudents(studentList);
      } catch (err) {
        setError('Failed to fetch students: ' + err.message);
      }
    };

    fetchStudents();
  }, []);

  // Fetch all groups with better error handling and default value
  useEffect(() => {
    if (!teacherId) {
      setError('Teacher ID is required to fetch groups.');
      return;
    }

    const fetchGroups = async () => {
      try {
        const teacherRef = doc(db, 'teachers', teacherId);
        const teacherDoc = await getDoc(teacherRef);
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data();
          // Default to empty array if groups is undefined
          setGroups(teacherData.groups || []);
        } else {
          // If the document doesn't exist, initialize with empty groups
          setGroups([]);
          setError(`No teacher document found for ID: ${teacherId}`);
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
      const updatedGroups = groups.map((group) => {
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
        const group = groups.find((g) => g.id === groupId);
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

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(students.length / studentsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="manage-students-container">
      <header className="dashboard-header">
        <h1>Manage Students</h1>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="manage-students-actions">
        <button className="add-user-button">Add User</button>
        <div className="actions-dropdown">Actions ▼</div>
        <input type="text" className="search-input" placeholder="Search..." />
        <div className="filter-options">Filter Options ▼</div>
        <div className="list-options">List Options ▼</div>
      </div>

      <table className="students-table">
        <thead>
          <tr>
            <th>Enabled</th>
            <th>Activated</th>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Usergroup</th>
            <th>Last Visit</th>
            <th>Registered</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {currentStudents.map((student) => (
            <tr key={student.id}>
              <td>
                <input
                  type="checkbox"
                  checked={student.enabled}
                  onChange={(e) => {
                    const updatedStudents = students.map((s) =>
                      s.id === student.id ? { ...s, enabled: e.target.checked } : s
                    );
                    setStudents(updatedStudents);
                  }}
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={student.activated}
                  onChange={(e) => {
                    const updatedStudents = students.map((s) =>
                      s.id === student.id ? { ...s, activated: e.target.checked } : s
                    );
                    setStudents(updatedStudents);
                  }}
                />
              </td>
              <td>{student.name}</td>
              <td>{student.username || 'N/A'}</td>
              <td>{student.email}</td>
              <td>{student.userGroup || 'Registered'}</td>
              <td>{student.lastVisit}</td>
              <td>{student.registered}</td>
              <td>{student.id}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous Page"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={currentPage === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
        >
          Next
        </button>
      </div>

      <section className="group-management">
        <h2>Group Management</h2>
        <div className="group-actions">
          <input
            type="text"
            placeholder="Enter group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="group-input"
          />
          <button onClick={handleCreateGroup} className="create-group-button">
            Create Group
          </button>
        </div>

        <div className="group-selection">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="group-select"
          >
            <option value="">Select a group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <div className="student-checkboxes">
            {students.map((student) => (
              <label key={student.id} className="student-checkbox">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={(e) =>
                    setSelectedStudents(
                      e.target.checked
                        ? [...selectedStudents, student.id]
                        : selectedStudents.filter((id) => id !== student.id)
                    )
                  }
                />
                {student.name}
              </label>
            ))}
          </div>
          <button onClick={handleAddStudentsToGroup} className="add-students-button">
            Add Selected Students to Group
          </button>
        </div>

        <div className="share-notes">
          <h3>Share Notes</h3>
          <button onClick={() => handleShareNotes()} className="share-all-button">
            Share Notes with All Students
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => handleShareNotes(group.id)}
              className="share-group-button"
            >
              Share Notes with {group.name}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ManageStudents;