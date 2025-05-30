import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavLinkClick = (e, sectionId) => {
    e.preventDefault();
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollToSection(sectionId);
    }
    setIsMenuOpen(false); // Close the menu after clicking a link
  };

  const navigateToSignup = (role) => {
    navigate('/signup', { state: { role } });
  };

  return (
    <div className="landing-page">
      <div className="landing-container bg-gradient-shift">
        <nav className="nav-container">
          <div className="logo-container">
            <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
            <a href="/" className="logo">
              <span className="study">Study</span>
              <span className="part">Part</span>
            </a>
          </div>
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <a
              href="#top"
              className="nav-link"
              onClick={(e) => handleNavLinkClick(e, 'top')}
            >
              Home
            </a>
            <a
              href="#features-section"
              className="nav-link"
              onClick={(e) => handleNavLinkClick(e, 'features-section')}
            >
              Features
            </a>
            <a
              href="#products-section"
              className="nav-link"
              onClick={(e) => handleNavLinkClick(e, 'products-section')}
            >
              Products
            </a>
            <a
              href="#about-section"
              className="nav-link"
              onClick={(e) => handleNavLinkClick(e, 'about-section')}
            >
              About
            </a>
            <a href="/login" className="nav-link">Sign in</a>
            <a href="/signup" className="register-btn">Sign up</a>
          </div>
          <div className="menu-icon" onClick={toggleMenu}>
            ☰
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
                <span className="typed-line line1">Create engaging learning experiences with AI</span>
                <span className="typed-line line2"> enhanced image analysis and </span>
                <span className="typed-line line3"> content generation for both teachers and students.</span>
              </h2>
              <div className="cta-container">
                <button className="primary-btn" onClick={() => navigateToSignup('student')}>
                  Start learning
                </button>
                <button className="secondary-btn" onClick={() => navigateToSignup('teacher')}>
                  Become a teacher
                </button>
              </div>
            </div>
          </div>
        </main>

        <section id="features-section" className="features-section">
          <h2 className="section-title">Features</h2>
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
          <h2 className="section-title">Our Products</h2>
          <div className="products-grid">
            <div className="product-card">
              <h3 className="product-title">Learning Mode</h3>
              <p className="product-description">
                Teachers create interactive, image-based lessons with text and visuals. Students access these materials for dynamic, engaging learning experiences tailored to their courses.
              </p>
            </div>
            <div className="product-card">
              <h3 className="product-title">Talk to Notes</h3>
              <p className="product-description">
                Upload your notes (PDF or PPT), then ask questions about them using text or voice. Get instant, AI-powered answers and explanations based on your own study materials.
              </p>
            </div>
            <div className="product-card">
              <h3 className="product-title">Notes Mode</h3>
              <p className="product-description">
                Create personalized, interactive notes by segmenting images and annotating regions. Organize and review your study content visually for better retention and productivity.
              </p>
            </div>
          </div>
        </section>

        <section id="about-section" className="about-section">
          <h2 className="section-title">About Us</h2>
          <p className="about-description">
            At StudyPart, we believe that learning should be more than just passive consumption of video lectures or plain text notes. Our mission is to transform education by making it interactive, engaging, and accessible for everyone.
          </p>
          <p className="about-description">
            We understand the challenges faced by both teachers and students in maintaining engagement and ensuring consistent learning outcomes. StudyPart bridges this gap by offering tools that enable content-based interactive learning. Teachers can deliver immersive educational experiences, while students benefit from a fun and uniform learning curve.
          </p>
          <p className="about-description">Join us in reshaping the way knowledge is shared and absorbed, one interaction at a time.</p>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;