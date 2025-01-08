// client/src/components/LandingPage.js
import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-container">
      <nav className="nav-container">
        <a href="/" className="logo">StudyPart</a>
        <div className="nav-links">
          <a href="/" className="nav-link">Home</a>
          <a href="/products" className="nav-link">Products</a>
          <a href="/about" className="nav-link">About</a>
          <a href="/login" className="nav-link">Sign in</a>
          <a href="/signup" className="register-btn">Register</a>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Transform Learning with
              <span className="block">AI-Powered Interactivity</span>
            </h1>
            <h2 className="hero-subtitle">
              Create engaging learning experiences with AI-enhanced image analysis and interactive content generation for both teachers and students.
            </h2>
            <div className="cta-container">
              <button className="primary-btn">Start learning</button>
              <button className="secondary-btn">Become a teacher</button>
            </div>
          </div>
          <div className="hero-image">
            <img src="/StudyPartImage.jpg" alt="StudyPart" />
          </div>
        </div>
      </main>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <h3 className="feature-title">AI-Powered Analysis</h3>
            <p className="feature-description">Transform static images into interactive learning materials with our advanced AI analysis tools.</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Interactive Learning</h3>
            <p className="feature-description">Create engaging content with AI-generated explanations and interactive elements.</p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Teacher-Student Bridge</h3>
            <p className="feature-description">Connect educators and learners through an intuitive platform designed for collaboration.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
