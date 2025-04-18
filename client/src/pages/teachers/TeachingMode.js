// src/pages/teachers/TeachingMode.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import './TeachingMode.css';
import BasicVersion from './BasicVersion';
import ManageStudents from './ManageStudents';
import Home from './home';
import Library from './Library';
import Label from './Label';
import TeachByPart from './TeachByPart'; // New import

const TeachingMode = () => {
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [students, setStudents] = useState([]);
  const [uploadedLessons, setUploadedLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTeacherEmail(user.email);
      } else {
        console.log('No teacher logged in');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!teacherEmail) return;

    const fetchStudents = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const studentList = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role === 'student');
      setStudents(studentList);
    };

    const fetchUploadedLessons = async () => {
      const lessonsRef = collection(db, 'Teachers', teacherEmail, 'Lessons');
      const lessonsSnapshot = await getDocs(lessonsRef);
      const lessonsList = await Promise.all(
        lessonsSnapshot.docs.map(async (lessonDoc) => {
          const lessonData = lessonDoc.data();
          const segmentsRef = collection(db, 'Teachers', teacherEmail, 'Lessons', lessonDoc.id, 'Segments');
          const segmentsSnapshot = await getDocs(segmentsRef);
          const segments = segmentsSnapshot.docs.map((segDoc) => ({
            id: segDoc.id,
            ...segDoc.data(),
          }));
          return {
            id: lessonDoc.id,
            originalImageUrl: lessonData.originalImageUrl,
            title: lessonData.title || `Lesson ${new Date(lessonData.createdAt).toLocaleDateString()}`,
            createdAt: lessonData.createdAt,
            segments,
          };
        })
      );
      setUploadedLessons(lessonsList);
      console.log('Fetched lessons:', lessonsList);
    };

    const fetchGroups = async () => {
      const teacherRef = doc(db, 'Teachers', teacherEmail);
      const teacherData = (await getDoc(teacherRef)).data();
      if (teacherData && teacherData.groups) {
        setGroups(teacherData.groups);
      }
    };

    fetchStudents();
    fetchUploadedLessons();
    fetchGroups();
  }, [teacherEmail]);

  const handleCreateGroup = async () => {
    console.log('Create group:', newGroupName, selectedStudents);
  };

  const handleAddStudentsToGroup = async () => {
    console.log('Add students to group:', selectedGroup, selectedStudents);
  };

  const handleShareNotes = async (groupId = null) => {
    console.log('Share notes with group:', groupId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'manage':
        return <ManageStudents />;
      case 'library':
        return <Library teacherEmail={teacherEmail} />;
      case 'basicversion':
        return <BasicVersion />;
      case 'label':
        return <Label teacherEmail={teacherEmail} />;
      case 'teachbypart':
        return <TeachByPart teacherEmail={teacherEmail} />;
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
          <li className={activeTab === 'label' ? 'active' : ''} onClick={() => setActiveTab('label')}>
            Label
          </li>
          <li className={activeTab === 'teachbypart' ? 'active' : ''} onClick={() => setActiveTab('teachbypart')}>
            TeachByPart
          </li>
        </ul>
      </nav>
      {renderContent()}
    </div>
  );
};

export default TeachingMode;