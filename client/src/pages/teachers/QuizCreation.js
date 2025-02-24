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
  const [quizMeta, setQuizMeta] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty: 'medium'
  });
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [segmentedUrls, setSegmentedUrls] = useState([]);
  const [puzzleOutlineUrl, setPuzzleOutlineUrl] = useState('');
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
      const uploadForm = new FormData();
      uploadForm.append('image', selectedFile);
      const uploadResponse = await axios.post('http://localhost:5000/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadResponse.data.image_url;
      setUploadedImageUrl(imageUrl); // Add this line
    
      const payload = { image_url: imageUrl, teacher_id: teacherId };
      const segmentResponse = await axios.post('http://localhost:5000/segment_quiz', payload);
    
      setSegmentedImages(segmentResponse.data.segmented_urls);
      setPuzzleOutline(segmentResponse.data.puzzle_outline_url);
      setSegmentedUrls(segmentResponse.data.segmented_urls); // Add this
      setPuzzleOutlineUrl(segmentResponse.data.puzzle_outline_url); // Add this
    } catch (err) {
      setError('Segmentation failed: ' + err.message);
    } finally {
      setIsSegmenting(false);
    }
  };

  const handleSaveQuiz = async () => {
    try {
      const response = await axios.post('http://localhost:5000/save_quiz', {
        teacher_id: teacherId,
        image_url: uploadedImageUrl,
        segments: segmentedUrls,
        puzzle_outline: puzzleOutlineUrl,
        meta: quizMeta
      });

      if (response.data.success) {
        alert('Quiz saved successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      setError('Failed to save quiz: ' + error.message);
    }
  };

  // Function to handle segmented URLs
  const handleSegmentedUrls = (urls) => {
    setSegmentedUrls(urls);
  };

  // Function to handle puzzle outline URL
  const handlePuzzleOutlineUrl = (url) => {
    setPuzzleOutlineUrl(url);
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
        <section className="metadata-section">
          <h2>Quiz Details</h2>
          <div className="metadata-form">
            <input
              type="text"
              placeholder="Quiz Title"
              value={quizMeta.title}
              onChange={(e) => setQuizMeta({...quizMeta, title: e.target.value})}
            />
            <textarea
              placeholder="Description"
              value={quizMeta.description}
              onChange={(e) => setQuizMeta({...quizMeta, description: e.target.value})}
            />
            <select
              value={quizMeta.difficulty}
              onChange={(e) => setQuizMeta({...quizMeta, difficulty: e.target.value})}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button 
              className="save-button"
              onClick={handleSaveQuiz}
              disabled={!quizMeta.title.trim()}
            >
              Save Quiz
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default QuizCreation;
