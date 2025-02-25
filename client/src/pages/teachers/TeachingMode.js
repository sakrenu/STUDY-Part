
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import './TeachingMode.css';
import BasicVersion from './BasicVersion';
import ManageStudents from './ManageStudents';
import Home from './home';

const TeachingMode = () => {
  const [teacherId] = useState('teacher_1');
  const [activeTab, setActiveTab] = useState('home');
  const [students, setStudents] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const studentList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role === 'student');
      setStudents(studentList);
    };

    const fetchUploadedImages = async () => {
      const teacherRef = doc(db, 'teachers', teacherId);
      const teacherData = (await getDoc(teacherRef)).data();
      if (teacherData && teacherData.images) {
        setUploadedImages(Object.entries(teacherData.images));
      }
    };

    const fetchGroups = async () => {
      const teacherRef = doc(db, 'teachers', teacherId);
      const teacherData = (await getDoc(teacherRef)).data();
      if (teacherData && teacherData.groups) {
        setGroups(teacherData.groups);
      }
    };

    fetchStudents();
    fetchUploadedImages();
    fetchGroups();
  }, [teacherId]);

  const handleCreateGroup = async () => {/* unchanged */};
  const handleAddStudentsToGroup = async () => {/* unchanged */};
  const handleShareNotes = async (groupId = null) => {/* unchanged */};

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'manage':
        return <ManageStudents />;
      case 'library':
        return (
          <div className="library-content">
            <h2>Library</h2>
            <div className="library-grid">
              {uploadedImages.map(([imageUrl, imageData]) => {
                const segments = imageData?.segments || [];
                return (
                  <div key={imageUrl} className="library-card">
                    <img src={imageUrl} alt="Uploaded" className="library-image" />
                    <div className="library-notes">
                      {segments.map((segment, index) => (
                        <div key={index} className="segment-note">
                          <img
                            src={segment.segment_url}
                            alt={`Segment ${index}`}
                            className="segment-image"
                          />
                          <p>{segment.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'basicversion':
        return <BasicVersion />;
      default:
        return null;
    }
  };

  return (
    <div className="teachers-dashboard">
      <nav className="navbar">
        <ul>
          <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
            Home
          </li>
          <li className={activeTab === 'tutorial' ? 'active' : ''} onClick={() => setActiveTab('tutorial')}>
            Tutorial
          </li>
          <li className={activeTab === 'manage' ? 'active' : ''} onClick={() => setActiveTab('manage')}>
            Manage Students
          </li>
          <li className={activeTab === 'library' ? 'active' : ''} onClick={() => setActiveTab('library')}>
            Library
          </li>
          <li className={activeTab === 'basicversion' ? 'active' : ''} onClick={() => setActiveTab('basicversion')}>
            Basic Version
          </li>
        </ul>
      </nav>
      {renderContent()}
    </div>
  );
};

export default TeachingMode;