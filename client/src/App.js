import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Login from './components/Login';
import Signup from './components/Signup';
import TeacherFeaturePage from './pages/teachers/TeacherFeaturePage';
import TeachByPart from './pages/teachers/TeachByPart';
import StudentDashboard from './pages/students/StudentDashboard';
import LandingPage from './components/LandingPage';
import ManageStudents from './pages/teachers/ManageStudents';
import LearningMode from './pages/students/LearningMode';
import NotesMode from './pages/students/NotesMode';
import TalkToNotes from './pages/students/TalkToNotes';
import QuizTeachingDashboard from './pages/teachers/QuizTeachingDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateClass from './pages/admin/CreateClass';
import EditClass from './pages/admin/EditClass';
import ViewClass from './pages/admin/ViewClass';
import CoursePage from './pages/students/CoursePage';
import QuizDashboard from './pages/students/QuizDashboard';
import QuizMode from './pages/students/QuizMode';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<TeacherFeaturePage />} />
          <Route path="/dashboard/teaching" element={<TeachByPart />} />
          <Route path="/dashboard/manage-students" element={<ManageStudents />} />
          <Route path="/dashboard/quiz-mode" element={<QuizTeachingDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/learning-mode" element={<LearningMode />} />
          <Route path="/notes-mode" element={<NotesMode />} />

          {/* Student Quiz Routes */}
          <Route path="/student-dashboard/quiz-mode" element={<QuizDashboard />} />
          <Route path="/student-dashboard/quiz-mode/:quizId" element={<QuizMode />} />
          <Route path="/course/:courseId" element={<CoursePage />} />
          <Route path="/talk-to-notes" element={<TalkToNotes />} />

          {/* Admin Route */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/Create-Class" element={<CreateClass />} />
          <Route path="/Edit-Class" element={<EditClass />} />
          <Route path="/View-Class" element={<ViewClass />} />

          {/* Redirect any other path - consider a 404 page later */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;