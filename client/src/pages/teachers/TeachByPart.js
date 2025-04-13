
import React, { useState, useEffect } from 'react'; // Adjusted path assuming firebase.js is at src/
import UploadComponent from '../../components/UploadComponent'; // Assuming components/ is one level up
import { motion } from 'framer-motion';
import { MdUpload, MdLibraryBooks } from 'react-icons/md';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';// Assuming styles/ is one level up
import { auth } from '../../firebase';
import './TeachByParts.css';
import { Tooltip } from 'react-tooltip';
import SelectionComponent from '../../components/SelectionComponent';
import { MdCrop } from 'react-icons/md';

const TeachByParts = () => {
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [currentStep, setCurrentStep] = useState('welcome'); // welcome, upload, select, annotate, preview, library
  const [uploadedImage, setUploadedImage] = useState(null);
  const [segmentedRegions, setSegmentedRegions] = useState(null);
  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTeacherEmail(user.email);
      } else {
        setCurrentStep('welcome');
        alert('Please log in as a teacher to continue.');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUploaded = ({ file, imageUrl }) => {
    setUploadedImage({ file, url: imageUrl });
    setCurrentStep('select');
  };

  const handleBack = () => {
    if (currentStep === 'upload') {
      setCurrentStep('welcome');
      setUploadedImage(null);
    }
  };

  const handleStepChange = (step) => {
    if (step === 'library' || (step === 'upload' && !teacherEmail)) {
      setCurrentStep(step);
    } else if (teacherEmail) {
      setCurrentStep(step);
    }
  };

  const sidebarItems = [
    {
      name: 'Upload',
      icon: <MdUpload size={24} />,
      step: 'upload',
      description: 'Start by uploading an image for your lesson',
    },
    {
      name: 'Library',
      icon: <MdLibraryBooks size={24} />,
      step: 'library',
      description: 'View and manage your saved lessons',
    },
    {
      name: 'Select',
      icon: <MdCrop size={24} />,
      step: 'select',
      description: 'Choose regions or points to segment your image',
    },
    // Placeholder for Select, Annotate, Preview
  ];

  return (
    <div className="teach-by-parts-container">
      <motion.div
        className="sidebar"
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="sidebar-title">TeachByParts</h3>
        <ul className="sidebar-menu">
          {sidebarItems.map((item) => (
            <motion.li
              key={item.step}
              className={`sidebar-item ${currentStep === item.step ? 'active' : ''}`}
              onClick={() => handleStepChange(item.step)}
              whileHover={{ scale: 1.05 }}
              data-tooltip-id={`sidebar-${item.step}`}
              data-tooltip-content={item.description}
            >
              {item.icon}
              <span>{item.name}</span>
              <Tooltip id={`sidebar-${item.step}`} place="right" />
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <div className="main-content">
        <motion.header
          className="main-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="header-title">Interactive Lesson Creator</h1>
          <p className="header-subtitle">Create engaging lessons with annotations, audio, and more.</p>
        </motion.header>

        {currentStep === 'welcome' && (
          <motion.div
            className="welcome-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="welcome-title">Welcome to TeachByParts</h2>
            <p className="welcome-description">
              Upload an image to start building a lesson, or explore your saved lessons in the Library.
            </p>
            <motion.button
              className="start-button"
              onClick={() => setCurrentStep('upload')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              Start Creating
            </motion.button>
          </motion.div>
        )}

        {currentStep === 'upload' && (
          <UploadComponent
            onImageUploaded={handleImageUploaded}
            onBack={handleBack}
          />
        )}

        {currentStep === 'select' && (
          <SelectionComponent
            image={uploadedImage}
            teacherEmail={teacherEmail}
            onRegionsSegmented={(regions) => {
              setSegmentedRegions(regions);
              setCurrentStep('annotate');
            }}
            onBack={() => {
              setCurrentStep('upload');
              setUploadedImage(null);
            }}
          />
        )}
        
        
        {/* Placeholder for select, annotate, preview, library */}
      </div>

      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
    </div>
  );
};

export default TeachByParts;