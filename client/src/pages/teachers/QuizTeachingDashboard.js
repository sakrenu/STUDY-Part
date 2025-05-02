import React from 'react';
import { useNavigate } from 'react-router-dom';
import PointSegmentation from './PointSegmentation';
import './QuizTeachingDashboard.css';

const QuizTeachingDashboard = () => {
  const navigate = useNavigate();

  // Function to handle back navigation
  const handleBack = () => {
    navigate('/dashboard'); // Adjust this path as needed
  };

  return (
    <div className="quiz-mode">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="logo-container">
          <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
          <a href="/" className="logo">
            <span className="study">Study</span>
            <span className="part">Part</span>
          </a>
        </div>
        <div className="nav-actions">
          <button className="back-btn" onClick={handleBack}>Back</button>
        </div>
      </nav>

      <PointSegmentation />
    </div>
  );
};

export default QuizTeachingDashboard;