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
import QuizTeachingDashboard from './pages/teachers/QuizTeachingDashboard';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<TeacherFeaturePage />} />
          <Route path="/dashboard/teaching" element={<TeachingMode />} />
          <Route path="/dashboard/manage-students" element={<ManageStudents />} />
          <Route path="/dashboard/quiz-mode" element={<QuizTeachingDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/learning-mode" element={<LearningMode />} />
          <Route path="/student-dashboard/quiz-mode" element={<QuizDashboard />} />
          <Route path="/student-dashboard/quiz-mode/:quizId" element={<QuizMode />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;