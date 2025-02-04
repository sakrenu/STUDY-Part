import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherFeaturePage.css';

const TeacherFeaturePage = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showToggleText, setShowToggleText] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleMouseEnter = () => {
    setShowToggleText(true);
  };

  const handleMouseLeave = () => {
    setShowToggleText(false);
  };

  return (
    <div className="teacher-feature-page">
      {/* Logo and Title */}
      <div className="logo-container">
        <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
        <a href="/" className="logo">
          <span className="study">Study</span>
          <span className="part">Part</span>
        </a>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <nav className="menu">
          <button onClick={() => navigate('/dashboard/teaching')}>Teaching Mode</button>
          <button onClick={() => alert('Quiz Mode coming soon!')}>Quiz Mode</button>
          <button onClick={() => alert('Manage Students coming soon!')}>Manage Students</button>
        </nav>
        <div className="logout">
          <button onClick={() => alert('Settings are under development!')}>Settings</button>
          <button onClick={() => navigate('/')}>Logout</button>
        </div>
      </aside>

      {/* Toggle Button */}
      <div
        className={`toggle-button-container ${isSidebarOpen ? 'open' : 'closed'}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button className="toggle-button" onClick={toggleSidebar}>
          <img src={`${process.env.PUBLIC_URL}/toggle-icon.svg`} alt="Toggle" className="toggle-icon" />
        </button>
        {showToggleText && <span className="toggle-text">{isSidebarOpen ? 'Close' : 'Open'}</span>}
      </div>

      {/* Main Content */}
      <main className={`feature-info ${isSidebarOpen ? '' : 'closed'}`}>
        {/* Header Text (Outside of Boxes) */}
        <div>
          <h1 className="header-text">Discover the Teacher Features</h1>
          <h3>Explore Powerful Teaching Tools with StudyPart</h3>
          <h3>Enhance your teaching experience with cutting-edge AI tools</h3>
        </div>

        {/* Teaching Mode Box */}
        <div
          className="image-box"
          onClick={() => navigate('/dashboard/teaching')}
        >
          <div className="text-content">
            <h2>Teaching Mode</h2>
            <p>Create engaging lessons, manage classroom interactions, and upload resources seamlessly.</p>
          </div>
          <div className="image-content">
            <img src="teacher-teachingmode.jpg" alt="Teaching Mode" />
          </div>
        </div>

        {/* Quiz Mode Box */}
        <div
          className="image-box"
          onClick={() => alert('Quiz Mode coming soon!')}
        >
          <div className="text-content">
            <h2>Quiz Mode</h2>
            <p>Design custom quizzes, track student performance, and foster an interactive learning environment.</p>
          </div>
          <div className="image-content">
            <img src="teacher-quizmode.jpg" alt="Quiz Mode" />
          </div>
        </div>

        {/* Manage Students Box */}
        <div
          className="image-box"
          onClick={() => alert('Manage Students coming soon!')}
        >
          <div className="text-content">
            <h2>Manage Students</h2>
            <p>Organize student data, communicate effectively, and monitor individual progress in one place.</p>
          </div>
          <div className="image-content">
            <img src="teacher-managestudents.jpg" alt="Manage Students" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherFeaturePage;

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import './TeacherFeaturePage.css';

// const TeacherFeaturePage = () => {
//   const navigate = useNavigate();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [showToggleText, setShowToggleText] = useState(false);
//   const [imageUrl, setImageUrl] = useState('');
//   const [boundingBox, setBoundingBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
//   const [teacherId, setTeacherId] = useState('');
//   const [note, setNote] = useState('');
//   const [segmentIndex, setSegmentIndex] = useState('');

//   const toggleSidebar = () => {
//     setIsSidebarOpen(!isSidebarOpen);
//   };

//   const handleMouseEnter = () => {
//     setShowToggleText(true);
//   };

//   const handleMouseLeave = () => {
//     setShowToggleText(false);
//   };

//   const handleSegment = async () => {
//     try {
//       const response = await axios.post('/segment', {
//         image_url: imageUrl,
//         bounding_box: boundingBox,
//         teacher_id: teacherId
//       });
//       alert('Segmentation successful!');
//       console.log(response.data);
//     } catch (error) {
//       alert('Segmentation failed!');
//       console.error(error);
//     }
//   };

//   const handleAddNote = async () => {
//     try {
//       const response = await axios.post('/add_note', {
//         image_url: imageUrl,
//         segment_index: segmentIndex,
//         note: note,
//         teacher_id: teacherId
//       });
//       alert('Note added successfully!');
//       console.log(response.data);
//     } catch (error) {
//       alert('Failed to add note!');
//       console.error(error);
//     }
//   };

//   return (
//     <div className="teacher-feature-page">
//       {/* Logo and Title */}
//       <div className="logo-container">
//         <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
//         <a href="/" className="logo">
//           <span className="study">Study</span>
//           <span className="part">Part</span>
//         </a>
//       </div>

//       {/* Sidebar */}
//       <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
//         <nav className="menu">
//           <button onClick={() => navigate('/dashboard/teaching')}>Teaching Mode</button>
//           <button onClick={() => alert('Quiz Mode coming soon!')}>Quiz Mode</button>
//           <button onClick={() => alert('Manage Students coming soon!')}>Manage Students</button>
//         </nav>
//         <div className="logout">
//           <button onClick={() => alert('Settings are under development!')}>Settings</button>
//           <button onClick={() => navigate('/')}>Logout</button>
//         </div>
//       </aside>

//       {/* Toggle Button */}
//       <div
//         className={`toggle-button-container ${isSidebarOpen ? 'open' : 'closed'}`}
//         onMouseEnter={handleMouseEnter}
//         onMouseLeave={handleMouseLeave}
//       >
//         <button className="toggle-button" onClick={toggleSidebar}>
//           <img src={`${process.env.PUBLIC_URL}/toggle-icon.svg`} alt="Toggle" className="toggle-icon" />
//         </button>
//         {showToggleText && <span className="toggle-text">{isSidebarOpen ? 'Close' : 'Open'}</span>}
//       </div>

//       {/* Main Content */}
//       <main className={`feature-info ${isSidebarOpen ? '' : 'closed'}`}>
//         {/* Header Text (Outside of Boxes) */}
//         <div>
//           <h1 className="header-text">Discover the Teacher Features</h1>
//           <h3>Explore Powerful Teaching Tools with StudyPart</h3>
//           <h3>Enhance your teaching experience with cutting-edge AI tools</h3>
//         </div>

//         {/* Teaching Mode Box */}
//         <div
//           className="image-box"
//           onClick={() => navigate('/dashboard/teaching')}
//         >
//           <div className="text-content">
//             <h2>Teaching Mode</h2>
//             <p>Create engaging lessons, manage classroom interactions, and upload resources seamlessly.</p>
//           </div>
//           <div className="image-content">
//             <img src="teacher-teachingmode.jpg" alt="Teaching Mode" />
//           </div>
//         </div>

//         {/* Quiz Mode Box */}
//         <div
//           className="image-box"
//           onClick={() => alert('Quiz Mode coming soon!')}
//         >
//           <div className="text-content">
//             <h2>Quiz Mode</h2>
//             <p>Design custom quizzes, track student performance, and foster an interactive learning environment.</p>
//           </div>
//           <div className="image-content">
//             <img src="teacher-quizmode.jpg" alt="Quiz Mode" />
//           </div>
//         </div>

//         {/* Manage Students Box */}
//         <div
//           className="image-box"
//           onClick={() => alert('Manage Students coming soon!')}
//         >
//           <div className="text-content">
//             <h2>Manage Students</h2>
//             <p>Organize student data, communicate effectively, and monitor individual progress in one place.</p>
//           </div>
//           <div className="image-content">
//             <img src="teacher-managestudents.jpg" alt="Manage Students" />
//           </div>
//         </div>

//         {/* Segmentation and Note Adding Form */}
//         {/* <div className="segmentation-form">
//           <h2>Segment Image</h2>
//           <input
//             type="text"
//             placeholder="Image URL"
//             value={imageUrl}
//             onChange={(e) => setImageUrl(e.target.value)}
//           />
//           <input
//             type="text"
//             placeholder="Bounding Box (left, top, width, height)"
//             value={`${boundingBox.left}, ${boundingBox.top}, ${boundingBox.width}, ${boundingBox.height}`}
//             onChange={(e) => {
//               const [left, top, width, height] = e.target.value.split(',').map(Number);
//               setBoundingBox({ left, top, width, height });
//             }}
//           />
//           <input
//             type="text"
//             placeholder="Teacher ID"
//             value={teacherId}
//             onChange={(e) => setTeacherId(e.target.value)}
//           />
//           <button onClick={handleSegment}>Segment</button>
//         </div> */}

//         {/* <div className="note-form">
//           <h2>Add Note</h2>
//           <input
//             type="text"
//             placeholder="Image URL"
//             value={imageUrl}
//             onChange={(e) => setImageUrl(e.target.value)}
//           />
//           <input
//             type="text"
//             placeholder="Segment Index"
//             value={segmentIndex}
//             onChange={(e) => setSegmentIndex(e.target.value)}
//           />
//           <input
//             type="text"
//             placeholder="Note"
//             value={note}
//             onChange={(e) => setNote(e.target.value)}
//           />
//           <input
//             type="text"
//             placeholder="Teacher ID"
//             value={teacherId}
//             onChange={(e) => setTeacherId(e.target.value)}
//           />
//           <button onClick={handleAddNote}>Add Note</button>
//         </div> */}
//       </main>
//     </div>
//   );
// };

// export default TeacherFeaturePage;
