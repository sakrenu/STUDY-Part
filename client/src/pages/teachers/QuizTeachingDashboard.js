import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QuizCreation from './QuizCreation';
import PointSegmentation from './PointSegmentation';
import './QuizTeachingDashboard.css';

const QuizTeachingDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate(); // For navigation
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'manual' ? 'manual' : 'automatic';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Function to handle back navigation
  const handleBack = () => {
    navigate('/dashboard'); // Adjust this path as needed
  };

  return (
    <div className="quiz-mode">
      {/* Back Button */}
      <button className="back-button" onClick={handleBack}>
        Back to Dashboard
      </button>

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          className={activeTab === 'automatic' ? 'active' : ''}
          onClick={() => setActiveTab('automatic')}
        >
          Automatic Segmentation
        </button>
        <button
          className={activeTab === 'manual' ? 'active' : ''}
          onClick={() => setActiveTab('manual')}
        >
          Manual Segmentation
        </button>
      </div>

      {/* Content Area */}
      <div className="content">
        {activeTab === 'automatic' && <QuizCreation />}
        {activeTab === 'manual' && <PointSegmentation />}
      </div>
    </div>
  );
};

export default QuizTeachingDashboard;