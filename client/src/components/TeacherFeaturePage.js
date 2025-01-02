import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherFeaturePage.css'; // Import the updated CSS

const TeacherFeaturePage = () => {
  const navigate = useNavigate();

  return (
    <div className="teacher-feature-page-wrapper">
      <div className="teacher-feature-page">
        <h1>Teacher Feature Page</h1>
        <div className="mode-options">
          <button onClick={() => navigate('/dashboard/teaching')}>Teaching Mode</button>
          <button onClick={() => alert('Quiz Mode coming soon!')}>Quiz Mode</button>
          <button onClick={() => alert('Manage Students coming soon!')}>Manage Students</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherFeaturePage;
