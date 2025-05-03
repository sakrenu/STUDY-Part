// import React, { useState, useEffect } from 'react';
// import UploadComponent from '../../components/UploadComponent';
// import { motion } from 'framer-motion';
// import { MdUpload, MdLibraryBooks, MdCrop } from 'react-icons/md';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { auth } from '../../firebase';
// import './TeachByParts.css';
// import { Tooltip } from 'react-tooltip';
// import SelectionComponent from '../../components/SelectionComponent';
// import { useNavigate } from 'react-router-dom';

// const TeachByParts = () => {
//   const navigate = useNavigate();
//   const [teacherEmail, setTeacherEmail] = useState(null);
//   const [currentStep, setCurrentStep] = useState('welcome');
//   const [uploadedImage, setUploadedImage] = useState(null);
//   const [uploadedImageId, setUploadedImageId] = useState(null);
//   const [segmentedRegions, setSegmentedRegions] = useState(null);
//   const [lessonWithFeatures, setLessonWithFeatures] = useState(null);

//   useEffect(() => {
//     const unsubscribe = auth.onAuthStateChanged((user) => {
//       if (user) {
//         setTeacherEmail(user.email);
//       } else {
//         setCurrentStep('welcome');
//         alert('Please log in as a teacher to continue.');
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   useEffect(() => {
//     console.log('TeachByParts state:', { currentStep, uploadedImageId, uploadedImage });
//   }, [currentStep, uploadedImageId, uploadedImage]);

//   const handleImageUploaded = ({ file, imageUrl, image_id }) => {
//     console.log('Image uploaded:', { file: file.name, imageUrl, image_id });
//     if (!image_id || typeof image_id !== 'string' || image_id.trim() === '') {
//       console.error('Invalid image_id received:', image_id);
//       toast.error('Failed to process image ID. Please try uploading again.');
//       return;
//     }
//     setUploadedImage({ file, url: imageUrl, width: 0, height: 0 });
//     setUploadedImageId(image_id);
//     setCurrentStep('select');
//   };

//   const handleBack = () => {
//     if (currentStep === 'upload') {
//       setCurrentStep('welcome');
//       setUploadedImage(null);
//       setUploadedImageId(null);
//     }
//   };

//   const handleStepChange = (step) => {
//     console.log('Changing step to:', step);
//     if (step === 'library' || (step === 'upload' && !teacherEmail)) {
//       setCurrentStep(step);
//     } else if (teacherEmail) {
//       setCurrentStep(step);
//     }
//   };

//   const handleRegionsSegmented = (data) => {
//     console.log('Regions segmented with features:', data);
//     setSegmentedRegions(data);
//     setLessonWithFeatures(data);
//     setCurrentStep('finalPreview');
//   };

//   const sidebarItems = [
//     {
//       name: 'Upload',
//       icon: <MdUpload size={24} />,
//       step: 'upload',
//       description: 'Start by uploading an image for your lesson',
//     },
//     {
//       name: 'Library',
//       icon: <MdLibraryBooks size={24} />,
//       step: 'library',
//       description: 'View and manage your saved lessons',
//     },
//     {
//       name: 'Select',
//       icon: <MdCrop size={24} />,
//       step: 'select',
//       description: 'Choose regions or points to segment your image',
//     },
//   ];

//   return (
//     <>
//       {/* Top Navigation */}
//       <nav className="top-nav">
//         <div className="logo-container">
//           <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
//           <a href="/" className="logo">
//             <span className="study">Study</span>
//             <span className="part">Part</span>
//           </a>
//         </div>
//         <button className="back-btn" onClick={() => navigate('/dashboard')}>Back</button>
//       </nav>

//       <div className="teach-by-parts-container">
//         <motion.div
//           className="sidebar"
//           initial={{ x: -250 }}
//           animate={{ x: 0 }}
//           transition={{ duration: 0.5 }}
//         >
//           <h3 className="sidebar-title">TeachByParts</h3>
//           <ul className="sidebar-menu">
//             {sidebarItems.map((item) => (
//               <motion.li
//                 key={item.step}
//                 className={`sidebar-item ${currentStep === item.step ? 'active' : ''}`}
//                 onClick={() => handleStepChange(item.step)}
//                 whileHover={{ scale: 1.05 }}
//                 data-tooltip-id={`sidebar-${item.step}`}
//                 data-tooltip-content={item.description}
//               >
//                 {item.icon}
//                 <span>{item.name}</span>
//                 <Tooltip id={`sidebar-${item.step}`} place="right" />
//               </motion.li>
//             ))}
//           </ul>
//         </motion.div>

//         <div className="main-content">
//           <motion.header
//             className="main-header"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.5 }}
//           >
//             <h1 className="header-title">Interactive Lesson Creator</h1>
//             <p className="header-subtitle">Create engaging lessons with annotations, audio, and more.</p>
//           </motion.header>

//           {currentStep === 'welcome' && (
//             <motion.div
//               className="welcome-card"
//               initial={{ opacity: 0, y: 50 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6 }}
//             >
//               <h2 className="welcome-title">Welcome to TeachByParts</h2>
//               <p className="welcome-description">
//                 Upload an image to start building a lesson, or explore your saved lessons in the Library.
//               </p>
//               <motion.button
//                 className="start-button"
//                 onClick={() => setCurrentStep('upload')}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 Start Creating
//               </motion.button>
//             </motion.div>
//           )}

//           {currentStep === 'upload' && (
//             <UploadComponent
//               onImageUploaded={handleImageUploaded}
//               onBack={handleBack}
//             />
//           )}

//           {currentStep === 'select' && uploadedImage && uploadedImageId && typeof uploadedImageId === 'string' && uploadedImageId.trim() !== '' && (
//             <SelectionComponent
//               image={uploadedImage}
//               image_id={uploadedImageId}
//               teacherEmail={teacherEmail}
//               onRegionsSegmented={handleRegionsSegmented}
//               onBack={() => {
//                 setCurrentStep('upload');
//                 setUploadedImage(null);
//                 setUploadedImageId(null);
//               }}
//             />
//           )}

//           {currentStep === 'select' && (!uploadedImage || !uploadedImageId) && (
//             <div>
//               <p>Error: No image uploaded. Please return to the upload step.</p>
//               <motion.button
//                 className="start-button"
//                 onClick={() => setCurrentStep('upload')}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 Back to Upload
//               </motion.button>
//             </div>
//           )}

//           {currentStep === 'finalPreview' && lessonWithFeatures && (
//             <div className="final-preview">
//               <h2>Lesson Created Successfully</h2>
//               <p>Your lesson with {lessonWithFeatures.regions.length} segments and features has been saved.</p>
//               <button
//                 className="start-button"
//                 onClick={() => setCurrentStep('welcome')}
//               >
//                 Create Another Lesson
//               </button>
//             </div>
//           )}
//         </div>

//         <ToastContainer position="top-right" autoClose={3000} theme="dark" />
//       </div>
//     </>
//   );
// };

// export default TeachByParts;
import React, { useState, useEffect } from 'react';
import UploadComponent from '../../components/UploadComponent';
import { motion } from 'framer-motion';
import { MdUpload, MdLibraryBooks, MdCrop, MdMenu } from 'react-icons/md';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth } from '../../firebase';
import './TeachByParts.css';
import { Tooltip } from 'react-tooltip';
import SelectionComponent from '../../components/SelectionComponent';
import { useNavigate } from 'react-router-dom';

const TeachByParts = () => {
  const navigate = useNavigate();
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageId, setUploadedImageId] = useState(null);
  const [segmentedRegions, setSegmentedRegions] = useState(null);
  const [lessonWithFeatures, setLessonWithFeatures] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  useEffect(() => {
    console.log('TeachByParts state:', { currentStep, uploadedImageId, uploadedImage });
  }, [currentStep, uploadedImageId, uploadedImage]);

  const handleImageUploaded = ({ file, imageUrl, image_id }) => {
    console.log('Image uploaded:', { file: file.name, imageUrl, image_id });
    if (!image_id || typeof image_id !== 'string' || image_id.trim() === '') {
      console.error('Invalid image_id received:', image_id);
      toast.error('Failed to process image ID. Please try uploading again.');
      return;
    }
    setUploadedImage({ file, url: imageUrl, width: 0, height: 0 });
    setUploadedImageId(image_id);
    setCurrentStep('select');
  };

  const handleBack = () => {
    if (currentStep === 'upload') {
      setCurrentStep('welcome');
      setUploadedImage(null);
      setUploadedImageId(null);
    }
  };

  const handleStepChange = (step) => {
    console.log('Changing step to:', step);
    if (step === 'library' || (step === 'upload' && !teacherEmail)) {
      setCurrentStep(step);
    } else if (teacherEmail) {
      setCurrentStep(step);
    }
    setIsSidebarOpen(false); // Close sidebar on step change
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleRegionsSegmented = (data) => {
    console.log('Regions segmented with features:', data);
    setSegmentedRegions(data);
    setLessonWithFeatures(data);
    setCurrentStep('finalPreview');
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
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="logo-container">
          <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
          <a href="/" className="logo">
            <span className="study">Study</span>
            <span className="part">Part</span>
          </a>
        </div>
        <div className="nav-buttons">
          <button className="hamburger-btn" onClick={toggleSidebar}>
            <MdMenu size={24} />
          </button>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>Back</button>
        </div>
      </nav>

      <div className="teach-by-parts-container">
        <motion.div
          className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
          initial={{ x: 0 }}
          animate={{ x: isSidebarOpen ? 0 : -250 }}
          transition={{ duration: 0.3 }}
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
            <div className="final-preview">
              <h2>Lesson Created Successfully</h2>
              <p>Your lesson with {lessonWithFeatures.regions.length} segments and features has been saved.</p>
              <button
                className="start-button"
                onClick={() => setCurrentStep('welcome')}
              >
                Create Another Lesson
              </button>
            </div>
          )}
        </div>

        <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      </div>
    </>
  );
};

export default TeachByParts;