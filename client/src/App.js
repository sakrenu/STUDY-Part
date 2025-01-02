<<<<<<< HEAD
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Home from './components/Home';
// import Login from './components/Login';
// import Signup from './components/Signup';

// const App = () => {
//     return (
//         <Router>
//             <Routes>
//                 <Route path="/" element={<Home />} />
//                 <Route path="/login" element={<Login />} />
//                 <Route path="/signup" element={<Signup />} />
//             </Routes>
//         </Router>
//     );
// };

// export default App;
=======
>>>>>>> 8510df784f7b8c423c958a9c05ac60bea0f29a2a
// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
<<<<<<< HEAD
import TeacherFeaturePage from './components/TeacherFeaturePage';
=======
>>>>>>> 8510df784f7b8c423c958a9c05ac60bea0f29a2a
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard'; // Assuming you have a StudentDashboard component

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
        <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
<<<<<<< HEAD
          <Route path="/dashboard" element={<TeacherFeaturePage />} />
          <Route path="/dashboard/teaching" element={<TeacherDashboard />} />
=======
          <Route path="/dashboard" element={<TeacherDashboard />} />
>>>>>>> 8510df784f7b8c423c958a9c05ac60bea0f29a2a
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
