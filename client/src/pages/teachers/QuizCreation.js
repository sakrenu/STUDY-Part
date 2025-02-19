import React, { useState } from 'react';
import axios from 'axios';
import './QuizCreation.css';
import { useNavigate } from 'react-router-dom';

const QuizCreation = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [segmentedImages, setSegmentedImages] = useState([]);
  const [puzzleOutline, setPuzzleOutline] = useState(null);
  const [error, setError] = useState('');
  const [isSegmenting, setIsSegmenting] = useState(false);
  const navigate = useNavigate();

  const teacherId = "teacher_demo";

  // Handle image file selection
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setSegmentedImages([]);
      setPuzzleOutline(null);
      setError('');
    }
  };

  // Handle segmentation
  const handleSegmentImage = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }
    try {
      setIsSegmenting(true);
      // First, upload the image to /upload to get a publicly accessible URL
      const uploadForm = new FormData();
      uploadForm.append('image', selectedFile);
      const uploadResponse = await axios.post('http://localhost:5000/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadResponse.data.image_url;

      // Now, call the /segment_quiz endpoint with the image URL and teacher ID
      const payload = { image_url: imageUrl, teacher_id: teacherId };
      const segmentResponse = await axios.post('http://localhost:5000/segment_quiz', payload);

      // Update state with both segmented cutout URLs and the puzzle outline URL
      setSegmentedImages(segmentResponse.data.segmented_urls);
      setPuzzleOutline(segmentResponse.data.puzzle_outline_url);
    } catch (err) {
      setError('Segmentation failed: ' + err.message);
    } finally {
      setIsSegmenting(false);
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

          {imagePreview && (
            <div className="image-preview-container">
              <div className={`preview-wrapper ${isSegmenting ? 'segmenting' : ''}`}>
                <img 
                  src={imagePreview} 
                  alt="Uploaded preview" 
                  className="uploaded-image"
                />
                {isSegmenting && (
                  <div className="scanning-overlay">
                    <div className="scanner-line"></div>
                    <div className="scanning-text">Creating Puzzle...</div>
                  </div>
                )}
              </div>
              <button 
                onClick={handleSegmentImage} 
                className={`segment-button ${isSegmenting ? 'disabled' : ''}`}
                disabled={isSegmenting}
              >
                {isSegmenting ? 'Processing segmentation and puzzle outline...' : 'Segment Image & Create Puzzle'}
              </button>
            </div>
          )}
        </div>
      </section>

      {(segmentedImages.length > 0 || puzzleOutline) && (
        <section className="result-section">
          <h2>Segmented Cutouts</h2>
          <div className="segmented-container">
            {segmentedImages.map((url, index) => (
              <img key={index} src={url} alt={`Segmented ${index}`} className="segmented-floating" />
            ))}
          </div>
          {puzzleOutline && (
            <>
              <h2>Puzzle Outline</h2>
              <img src={puzzleOutline} alt="Puzzle Outline" className="puzzle-outline-image" />
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default QuizCreation;
