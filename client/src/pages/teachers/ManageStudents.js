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
  const [selectedClass, setSelectedClass] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
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
  
  const getSortedStudents = (studentIds) => {
    if (!studentIds || !studentIds.length) return [];
    
    return [...studentIds].sort((a, b) => {
      const emailA = getStudentEmail(a).toLowerCase();
      const emailB = getStudentEmail(b).toLowerCase();
      return emailA.localeCompare(emailB);
    });
  };

  const handleClassSelect = (cls) => {
    setSelectedClass(cls);
    setShowDetails(true);
  };
  
  const closeDetails = () => {
    setShowDetails(false);
  };

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
        <button className="back-btn" onClick={() => navigate('/dashboard')}>Back</button>
      </nav>

      <div className="welcome-section">
        <h1>Your Assigned Classes</h1>
        <h3>View and manage your class assignments</h3>
      </div>

      <main className="teacher-main-content">
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <div className="classes-grid">
            {classes.map((cls) => (
              <div 
                key={cls.id} 
                className="class-card"
                onClick={() => handleClassSelect(cls)}
              >
                <div className="class-card-header">
                  <h3>{cls.courseName || 'Untitled Course'}</h3>
                  <span className="students-badge">{cls.students?.length || 0} Students</span>
                </div>
                <div className="class-card-content">
                  <p><strong>Class Name:</strong> {cls.className || 'N/A'}</p>
                  <p><strong>Created:</strong> {cls.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</p>
                </div>
                <div className="class-card-footer">
                  <button className="view-details-btn">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showDetails && selectedClass && (
          <div className="details-overlay">
            <div className="details-panel">
              <button className="close-btn" onClick={closeDetails}>×</button>
              
              <div className="details-header">
                <h2>{selectedClass.courseName}</h2>
                <span className="class-name">{selectedClass.className}</span>
              </div>
              
              <div className="details-content">
                <div className="details-section">
                  <h3>Course Details</h3>
                  <div className="details-info">
                    <p><strong>Course Name:</strong> {selectedClass.courseName}</p>
                    <p><strong>Class Name:</strong> {selectedClass.className}</p>
                    <p><strong>Created:</strong> {selectedClass.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</p>
                    <p><strong>Total Students:</strong> {selectedClass.students?.length || 0}</p>
                  </div>
                </div>
                
                <div className="students-section">
                  <h3>Enrolled Students</h3>
                  {selectedClass.students?.length > 0 ? (
                    <div className="students-grid">
                      {getSortedStudents(selectedClass.students).map((sid, index) => (
                        <div key={sid} className="student-card">
                          <div className="student-number">{index + 1}</div>
                          <div className="student-avatar">
                            {getStudentEmail(sid).charAt(0).toUpperCase()}
                          </div>
                          <span className="student-email">{getStudentEmail(sid)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-students">No students enrolled</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageStudents;