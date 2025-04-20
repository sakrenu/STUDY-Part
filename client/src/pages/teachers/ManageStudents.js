// ManageStudents.js (Updated)
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { getAuth } from 'firebase/auth';
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import './ManageStudents.css';
import { useNavigate } from 'react-router-dom';

const ManageStudents = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        if (!auth.currentUser) {
          setError('Please login to view your classes');
          setLoading(false);
          return;
        }

        // Get the teacher's user document
        const teacherDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (!teacherDoc.exists() || teacherDoc.data().role !== 'teacher') {
          setError('Unauthorized: Only teachers can access this page');
          setLoading(false);
          return;
        }

        const usersSnap = await getDocs(collection(db, 'users'));
        const classesSnap = await getDocs(collection(db, 'classes'));

        const allStudents = usersSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => user.role === 'student');
        setStudents(allStudents);

        const allClasses = classesSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((cls) => cls.professor === auth.currentUser.uid);

        if (allClasses.length === 0) {
          setError('No classes assigned to you');
        }
        
        setClasses(allClasses);
      } catch (err) {
        setError('Failed to fetch data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth]);

  const getStudentEmail = (id) => students.find(s => s.id === id)?.email || 'Unknown';

  return (
    <div className="teacher-dashboard view-classes-page">
      <nav className="top-nav">
        <div className="logo-container">
          <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
          <a href="/" className="logo">
            <span className="study">Study</span>
            <span className="part">Part</span>
          </a>
        </div>
        <button className="back-btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </nav>

      <div className="welcome-section">
        <h1>Your Assigned Classes</h1>
        <h3>View and manage your class assignments</h3>
      </div>

      <main className="teacher-main-content">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <div className="table-container">
            <table className="class-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Class Name</th>
                  <th>Created</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <React.Fragment key={cls.id}>
                    <tr>
                      <td>{cls.courseName || 'Untitled Course'}</td>
                      <td>{cls.className || 'N/A'}</td>
                      <td className="date-column">
                        {cls.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                      </td>
                      <td>{cls.students?.length || 0}</td>
                      <td>
                        <button 
                          className="expand-btn"
                          onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
                        >
                          {expandedClass === cls.id ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>
                    {expandedClass === cls.id && (
                      <tr className="expanded-row">
                        <td colSpan="5">
                          <div className="expanded-content">
                            <div className="detail-section">
                              <h4>Course Details</h4>
                              <p><strong>Course Name:</strong> {cls.courseName}</p>
                              <p><strong>Class Name:</strong> {cls.className}</p>
                              <p><strong>Created:</strong> {cls.createdAt?.toDate?.().toLocaleDateString()}</p>
                            </div>
                            <div className="students-section">
                              <h4>Enrolled Students ({cls.students?.length || 0})</h4>
                              {cls.students?.length > 0 ? (
                                <ul className="student-list">
                                  {cls.students.map((sid) => (
                                    <li key={sid}>{getStudentEmail(sid)}</li>
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
        )}
      </main>
    </div>
  );
};

export default ManageStudents;