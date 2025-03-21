import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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
import NotesMode from './pages/students/NotesMode';

import QuizCreation from './pages/teachers/QuizCreation';

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

          {/* Student Routes */}
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/learning-mode" element={<LearningMode />} />
          <Route path="/notes-mode" element={<NotesMode />} />

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