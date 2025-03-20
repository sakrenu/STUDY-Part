import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import QuizCreation from './QuizCreation';
import PointSegmentation from './PointSegmentation';
import './QuizTeachingDashboard.css';

const QuizTeachingDashboard = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'manual' ? 'manual' : 'automatic';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="quiz-mode">
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
      <div className="content">
        {activeTab === 'automatic' && <QuizCreation />}
        {activeTab === 'manual' && <PointSegmentation />}
      </div>
    </div>
  );
};

export default QuizTeachingDashboard;