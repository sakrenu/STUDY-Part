import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TeacherFeaturePage.css'; // Import the corresponding CSS

const TeacherFeaturePage = () => {
  const navigate = useNavigate();

  return (
    <div className="teacher-feature-page">
      <header className="top-navigation">
        <button onClick={() => navigate('/dashboard/teaching')}>Teaching Mode</button>
        <button onClick={() => alert('Quiz Mode coming soon!')}>Quiz Mode</button>
        <button onClick={() => alert('Manage Students coming soon!')}>Manage Students</button>
      </header>
      <main className="feature-info">
        <h1>Discover the Teacher Features</h1>
        <p>
          Explore our powerful tools designed to enhance the teaching experience:
        </p>
        <div className="feature-details">
          <section>
            <h2>Teaching Mode</h2>
            <p>
              Create engaging lessons, manage classroom interactions, and
              upload resources seamlessly.
            </p>
          </section>
          <section>
            <h2>Quiz Mode</h2>
            <p>
              Design custom quizzes, track student performance, and foster
              an interactive learning environment.
            </p>
          </section>
          <section>
            <h2>Manage Students</h2>
            <p>
              Organize student data, communicate effectively, and monitor
              individual progress in one place.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TeacherFeaturePage;
