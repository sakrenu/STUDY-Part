import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-container">
      <nav className="nav-container">
        <div className="logo-container">
          <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
          <a href="/" className="logo">
            <span className="study">Study</span>
            <span className="part">Part</span>
          </a>
        </div>
        <div className="nav-links">
          <a href="/" className="nav-link">Home</a>
          <a href="#" className="nav-link" onClick={() => scrollToSection('products-section')}>Products</a>
          <a href="#" className="nav-link" onClick={() => scrollToSection('about-section')}>About</a>
          <a href="/login" className="nav-link">Sign in</a>
          <a href="/signup" className="register-btn">Register</a>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Transform Learning with
              <span className="block"> AI-Powered Interactivity</span>
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

      <section id="products-section" className="products-section">
        <h2 className="product-title">Our Products</h2>
        <div className="products-grid">
          <div className="product-card">
            <h3 className="product-title">Learning Mode</h3>
            <p className="product-description">Helps teachers create interactive image and text-based content for their students which can be then seen by their students.</p>
          </div>
          <div className="product-card">
            <h3 className="product-title">Quiz Mode</h3>
            <p className="product-description">Helps teachers conduct image interactive quizzes with images and text.</p>
          </div>
          <div className="product-card">
            <h3 className="product-title">Notes Mode</h3>
            <p className="product-description">Helps students create interactive notes for their own use.</p>
          </div>
        </div>
      </section>

      <section id="about-section" className="about-section">
        <h2 className="about-title">About Us</h2>
        <p className="about-description">
          There is a lot of learning content on the internet but all of them are mostly video lectures or just textual notes. So we bring in direct content-based interactive learning into the picture which generates interest in learning tasks. As teachers will be enabled to deliver content-based interactive learning to their students, all students can have a uniform learning curve while enjoying it as well.
        </p>
      </section>
    </div>
  );
};

export default LandingPage;