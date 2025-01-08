import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavLinkClick = (e, sectionId) => {
    e.preventDefault(); // Prevent default anchor behavior
    if (sectionId === 'top') {
      // Scroll to the top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollToSection(sectionId); // Scroll to the section
    }
  };

  // Function to navigate to the Signup page with a pre-selected role
  const navigateToSignup = (role) => {
    navigate('/signup', { state: { role } }); // Pass the role as state
  };

  return (
    <div className="landing-container bg-gradient-shift">
      <nav className="nav-container">
        <div className="logo-container">
          <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
          <a href="/" className="logo">
            <span className="study">Study</span>
            <span className="part">Part</span>
          </a>
        </div>
        <div className="nav-links">
          <a
            href="#top" // Use #top to indicate scrolling to the top
            className="nav-link"
            onClick={(e) => handleNavLinkClick(e, 'top')} // Scroll to top
          >
            Home
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
              {/* Update the buttons to navigate to Signup with role */}
              <button className="primary-btn" onClick={() => navigateToSignup('student')}>
                Start learning
              </button>
              <button className="secondary-btn" onClick={() => navigateToSignup('teacher')}>
                Become a teacher
              </button>
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
        <h2 className="section-title">Our Products</h2>
        <div className="products-grid">
          <div className="product-card">
            <h3 className="product-title">Learning Mode</h3>
            <p className="product-description">
              Empower teachers to create engaging and interactive content using a combination of text and images. Students can access these materials to enhance their understanding in a dynamic and visually appealing way.
            </p>
          </div>
          <div className="product-card">
            <h3 className="product-title">Quiz Mode</h3>
            <p className="product-description">
              Reimagine assessments with interactive image-based and text-based quizzes. Teachers can design creative quizzes that challenge students while keeping them engaged in the learning process.
            </p>
          </div>
          <div className="product-card">
            <h3 className="product-title">Notes Mode</h3>
            <p className="product-description">
              Enable students to create their own personalized, interactive notes. These notes integrate text and visuals seamlessly, helping learners retain information more effectively and making study sessions more productive.
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
  );
};

export default LandingPage;