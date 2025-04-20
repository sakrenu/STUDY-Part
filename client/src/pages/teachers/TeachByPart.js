import React, { useState, useEffect } from 'react';
import UploadComponent from '../../components/UploadComponent';
import { motion } from 'framer-motion';
import { MdUpload, MdLibraryBooks, MdCrop } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './TeachByParts.css';
import { Tooltip } from 'react-tooltip';
import SelectionComponent from '../../components/SelectionComponent';
import { useNavigate } from 'react-router-dom';
import Library from './Library';
import axios from 'axios';

const TeachByParts = () => {
  const navigate = useNavigate();
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [teacherUid, setTeacherUid] = useState(null);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageId, setUploadedImageId] = useState(null);
  const [segmentedRegions, setSegmentedRegions] = useState(null);
  const [lessonWithFeatures, setLessonWithFeatures] = useState(null);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isSavingLesson, setIsSavingLesson] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTeacherEmail(user.email);
        setTeacherUid(user.uid);
      } else {
        setCurrentStep('welcome');
        setTeacherEmail(null);
        setTeacherUid(null);
        setTeacherCourses([]);
        alert('Please log in as a teacher to continue.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log('TeachByParts state:', { currentStep, uploadedImageId, uploadedImage });
  }, [currentStep, uploadedImageId, uploadedImage]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (currentStep === 'finalPreview' && teacherUid) {
        setIsLoadingCourses(true);
        setTeacherCourses([]);
        try {
          const q = query(collection(db, 'classes'), where('professor', '==', teacherUid));
          const querySnapshot = await getDocs(q);
          const courses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTeacherCourses(courses);
          if (courses.length > 0) {
            setSelectedCourse(courses[0].id);
          }
        } catch (error) {
          console.error("Error fetching teacher courses: ", error);
          toast.error('Failed to fetch your courses. Please try again later.');
        } finally {
          setIsLoadingCourses(false);
        }
      }
    };

    fetchCourses();
  }, [currentStep, teacherUid]);

  const handleImageUploaded = ({ file, imageUrl, image_id }) => {
    console.log('Image uploaded:', { file: file.name, imageUrl, image_id });
    if (!image_id || typeof image_id !== 'string' || image_id.trim() === '') {
      console.error('Invalid image_id received:', image_id);
      toast.error('Failed to process image ID. Please try uploading again.');
      return;
    }
    const img = new Image();
    img.onload = () => {
      setUploadedImage({ file, url: imageUrl, width: img.naturalWidth, height: img.naturalHeight });
      setUploadedImageId(image_id);
      setCurrentStep('select');
    };
    img.onerror = () => {
      toast.error('Failed to load uploaded image details.');
    };
    img.src = imageUrl;
  };

  const handleBack = () => {
    if (currentStep === 'upload') {
      setCurrentStep('welcome');
      setUploadedImage(null);
      setUploadedImageId(null);
      setLessonWithFeatures(null);
      setSegmentedRegions(null);
    } else if (currentStep === 'select') {
      setCurrentStep('upload');
    } else if (currentStep === 'finalPreview') {
      setCurrentStep('select');
      setLessonWithFeatures(null);
    }
  };

  const handleStepChange = (step) => {
    console.log('Changing step to:', step);
    if (step === 'library' || (step === 'upload' && !teacherEmail)) {
      setCurrentStep(step);
    } else if (teacherEmail) {
      if (step === 'select' && !uploadedImageId) {
        toast.info('Please upload an image first.');
        return;
      }
      if (step === 'finalPreview' && !lessonWithFeatures) {
        toast.info('Please complete segmentation first.');
        return;
      }
      setCurrentStep(step);
    }
  };

  const handleRegionsSegmented = (data) => {
    console.log('Regions segmented with features:', data);
    if (data && data.lessonId && data.regions) {
      setLessonWithFeatures(data);
      setSegmentedRegions(data.regions);
      setCurrentStep('finalPreview');
    } else {
      console.error("Invalid data received from FeatureAddition:", data);
      toast.error('An error occurred processing lesson features.');
      setCurrentStep('select');
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedCourse) {
      toast.error('Please select a course to save the lesson under.');
      return;
    }
    if (!lessonWithFeatures || !teacherEmail) {
      toast.error('Missing lesson data or teacher info. Cannot save.');
      return;
    }

    setIsSavingLesson(true);
    try {
      const payload = {
        teacher_id: teacherEmail,
        course_id: selectedCourse,
        lesson_data: lessonWithFeatures,
        original_image_url: uploadedImage.url,
        image_id: uploadedImageId
      };

      console.log("Saving lesson with payload:", payload);
      const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${API_URL}/save_lesson_to_course`, payload);

      if (response.data.success) {
        toast.success('Lesson saved successfully to your course!');
        setCurrentStep('welcome');
        setUploadedImage(null);
        setUploadedImageId(null);
        setLessonWithFeatures(null);
        setSegmentedRegions(null);
        setSelectedCourse('');
      } else {
        throw new Error(response.data.message || 'Failed to save lesson.');
      }

    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error(`Failed to save lesson: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSavingLesson(false);
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
  ];

  return (
    <>
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

          {currentStep === 'select' && uploadedImage && uploadedImageId && typeof uploadedImageId === 'string' && uploadedImageId.trim() !== '' && (
            <SelectionComponent
              image={uploadedImage}
              image_id={uploadedImageId}
              teacherEmail={teacherEmail}
              onRegionsSegmented={handleRegionsSegmented}
              onBack={() => {
                setCurrentStep('upload');
                setUploadedImage(null);
                setUploadedImageId(null);
              }}
            />
          )}

          {currentStep === 'select' && (!uploadedImage || !uploadedImageId) && (
            <div>
              <p>Error: No image uploaded. Please return to the upload step.</p>
              <motion.button
                className="start-button"
                onClick={() => setCurrentStep('upload')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                Back to Upload
              </motion.button>
            </div>
          )}

          {currentStep === 'finalPreview' && lessonWithFeatures && (
            <motion.div
              className="final-preview-card"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="preview-title">Lesson Preview & Save</h2>
              <div className="preview-content">
                <div className="preview-image-container">
                  {uploadedImage?.url && (
                    <img src={uploadedImage.url} alt="Lesson Preview" className="preview-image" />
                  )}
                </div>
                <div className="preview-details">
                  <p>Your lesson with <strong>{lessonWithFeatures.regions.length}</strong> segment(s) is ready.</p>
                  <p>Features added: Notes, Labels (and potentially others).</p>

                  {isLoadingCourses ? (
                    <p>Loading your courses...</p>
                  ) : teacherCourses.length > 0 ? (
                    <div className="course-selection">
                      <label htmlFor="courseSelect">Save to Course:</label>
                      <select
                        id="courseSelect"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        disabled={isSavingLesson}
                      >
                        {teacherCourses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.courseName} ({course.className})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="error-message">No courses found. You may need to create a class first.</p>
                  )}
                </div>
              </div>

              <div className="preview-actions">
                <motion.button
                  className="back-button-preview"
                  onClick={handleBack}
                  disabled={isSavingLesson}
                  whileHover={{ scale: 1.05 }}
                >
                  Back to Edit Features
                </motion.button>
                <motion.button
                  className="save-button-final"
                  onClick={handleSaveLesson}
                  disabled={isLoadingCourses || teacherCourses.length === 0 || isSavingLesson}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isSavingLesson ? 'Saving...' : 'Save Lesson to Course'}
                </motion.button>
              </div>
            </motion.div>
          )}

          {currentStep === 'library' && <Library />}
        </div>

        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </div>
    </>
  );
};

export default TeachByParts;