import React, { useState } from 'react';
import axios from 'axios';
import './QuizCreation.css';
import { useNavigate } from 'react-router-dom';

const QuizCreation = () => {
  const [image, setImage] = useState(null);
  const [segmentedImage, setSegmentedImage] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handle image file selection
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setSegmentedImage(null);
      setError('');
    }
  };

  // Handle segmentation
  const handleSegmentImage = async () => {
    if (image) {
      try {
        const response = await fetch(image);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append('image', blob, 'image.jpg');

        const segmentResponse = await axios.post('http://localhost:5000/segment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSegmentedImage(segmentResponse.data.segmented_url);
      } catch (err) {
        setError('Segmentation failed: ' + err.message);
      }
    }
  };

  return (
    <div className="teachers-dashboard">
      <header className="dashboard-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
        <h1 className="dashboard-title">Quiz Creation</h1>
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="upload-section card-neon">
        <h2>Upload your Image</h2>
        <div className="upload-container">
          <label className="file-upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            <span className="upload-button">Choose Image</span>
          </label>

          {image && (
            <div className="image-preview-container">
              <img 
                src={image} 
                alt="Uploaded preview" 
                className="uploaded-image"
              />
              <button 
                onClick={handleSegmentImage} 
                className="segment-button"
              >
                Segment Image
              </button>
            </div>
          )}
        </div>
      </section>

      {segmentedImage && (
        <section className="result-section">
          <h2>Segmented Image</h2>
          <img src={segmentedImage} alt="Segmented" className="segmented-image" />
        </section>
      )}
    </div>
  );
};

export default QuizCreation;
