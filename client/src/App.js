// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import TeacherDashboard from './pages/teachers/TeacherDashboard';
import StudentDashboard from './pages/students/StudentDashboard';
import LandingPage from './components/LandingPage'; 

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} /> 
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard/teaching" element={<TeacherDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="*" element={<Navigate to="/login" />} /> {/* Redirect unknown paths to login */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
