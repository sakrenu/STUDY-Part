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
  const [successMessage, setSuccessMessage] = useState('');
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quizMeta, setQuizMeta] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty: 'medium'
  });
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [segmentedUrls, setSegmentedUrls] = useState([]);
  const [puzzleOutlineUrl, setPuzzleOutlineUrl] = useState('');
  const [positions, setPositions] = useState([]); // New state for positions
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
      setPositions([]); // Reset positions
      setError('');
      setSuccessMessage('');
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
      setError('');
      setSuccessMessage('');
      
      const uploadForm = new FormData();
      uploadForm.append('image', selectedFile);
      const uploadResponse = await axios.post('http://127.0.0.1:8000/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadResponse.data.image_url;
      setUploadedImageUrl(imageUrl);
    
      const payload = { image_url: imageUrl, teacher_id: teacherId };
      const segmentResponse = await axios.post('http://127.0.0.1:8000/segment_quiz', payload);
    
      setSegmentedImages(segmentResponse.data.segmented_urls);
      setPuzzleOutline(segmentResponse.data.puzzle_outline_url);
      setSegmentedUrls(segmentResponse.data.segmented_urls);
      setPuzzleOutlineUrl(segmentResponse.data.puzzle_outline_url);
      setPositions(segmentResponse.data.positions); // Store positions in state
      
      setSuccessMessage('Puzzle created successfully! Please fill in the quiz details below.');
    } catch (err) {
      setError('Segmentation failed: ' + err.message);
    } finally {
      setIsSegmenting(false);
    }
  };

  // Handle saving the quiz
  const handleSaveQuiz = async () => {
    if (!quizMeta.title.trim()) {
      setError('Please enter a quiz title');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      setSuccessMessage('');
      
      // Create quiz data object
      const quizData = {
        teacher_id: teacherId,
        image_url: uploadedImageUrl,
        segmented_urls: segmentedUrls,
        puzzle_outline_url: puzzleOutlineUrl,
        positions: positions, // Include positions
        meta: quizMeta
      };
      
      // Send to the new /save_quiz endpoint
      const response = await axios.post('http://127.0.0.1:8000/save_quiz', quizData);
      
      setSuccessMessage('Quiz saved successfully!');
      
      setTimeout(() => {
        navigate('/student-dashboard');
      }, 2000);
    } catch (error) {
      console.error("Error saving quiz: ", error);
      setError('Failed to save quiz: ' + error.message);
    } finally {
      setIsSaving(false);
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
      {successMessage && <div className="success-message">{successMessage}</div>}

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
                {isSegmenting ? 'Processing...' : 'Segment Image & Create Puzzle'}
              </button>
            </div>
          )}
        </div>
      </section>

      {segmentedImages.length > 0 && (
        <section className="segmented-preview-section card-neon">
          <h2>Puzzle Preview</h2>
          <div className="segments-container">
            {puzzleOutline && (
              <div className="puzzle-outline">
                <h3>Puzzle Outline</h3>
                <img src={puzzleOutline} alt="Puzzle Outline" className="puzzle-outline-image" />
              </div>
            )}
            <div className="segments-grid">
              <h3>Puzzle Pieces ({segmentedImages.length})</h3>
              <div className="segments-gallery">
                {segmentedImages.map((segment, index) => (
                  <div key={index} className="segment-item">
                    <img src={segment} alt={`Segment ${index + 1}`} className="segment-image" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {segmentedImages.length > 0 && (
        <section className="metadata-section card-neon">
          <h2>Quiz Details</h2>
          <div className="metadata-form">
            <div className="form-group">
              <label htmlFor="quiz-title">Quiz Title</label>
              <input
                id="quiz-title"
                type="text"
                placeholder="Enter a title for your quiz"
                value={quizMeta.title}
                onChange={(e) => setQuizMeta({...quizMeta, title: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="quiz-description">Description</label>
              <textarea
                id="quiz-description"
                placeholder="Describe what this quiz is about"
                value={quizMeta.description}
                onChange={(e) => setQuizMeta({...quizMeta, description: e.target.value})}
                rows="4"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="quiz-subject">Subject (Optional)</label>
              <input
                id="quiz-subject"
                type="text"
                placeholder="E.g., Science, History, Math"
                value={quizMeta.subject}
                onChange={(e) => setQuizMeta({...quizMeta, subject: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="quiz-difficulty">Difficulty Level</label>
              <select
                id="quiz-difficulty"
                value={quizMeta.difficulty}
                onChange={(e) => setQuizMeta({...quizMeta, difficulty: e.target.value})}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <button 
              className="save-button"
              onClick={handleSaveQuiz}
              disabled={!quizMeta.title.trim() || isSaving}
            >
              {isSaving ? 'Saving Quiz...' : 'Save Quiz'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default QuizCreation;