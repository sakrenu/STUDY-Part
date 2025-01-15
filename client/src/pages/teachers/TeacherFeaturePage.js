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
  {/* Title at the top left */}
  <a href="http://localhost:3000/" className="study-part-title">
    Study Part
  </a>

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
    <div className="header-text">
      <h1>Discover the Teacher Features</h1>
      <h2>Explore Powerful Teaching Tools</h2>
      <p>Enhance your teaching experience with cutting-edge tools designed for modern educators.</p>
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