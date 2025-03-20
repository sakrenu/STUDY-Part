// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import TeacherFeaturePage from './pages/teachers/TeacherFeaturePage';
import TeachingMode from './pages/teachers/TeachingMode';
import StudentDashboard from './pages/students/StudentDashboard';
import QuizMode from './pages/students/QuizMode';
import QuizDashboard from './pages/students/QuizDashboard';
import LandingPage from './components/LandingPage'; 
import ManageStudents from './pages/teachers/ManageStudents';
import LearningMode from './pages/students/LearningMode';
import QuizCreation from './pages/teachers/QuizCreation';
import PointSegmentation from './pages/teachers/PointSegmentation';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Teacher Routes */}
          <Route path="/dashboard" element={<TeacherFeaturePage />} />
          <Route path="/dashboard/teaching" element={<TeachingMode />} />
          <Route path="/dashboard/manage-students" element={<ManageStudents />} />
          <Route path="/dashboard/quiz-creation" element={<QuizCreation />} />
          <Route path="/point-segmentation" element={<PointSegmentation />} />

          {/* Student Routes */}
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/learning-mode" element={<LearningMode />} />

          {/* Student Quiz Routes */}
          <Route path="/student-dashboard/quiz-mode" element={<QuizDashboard />} />
          <Route path="/student-dashboard/quiz-mode/:quizId" element={<QuizMode />} />

          {/* Redirect Unknown Paths to Login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;