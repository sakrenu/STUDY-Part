// src/pages/teachers/QuizCreation.js

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './QuizCreation.css';
import { useNavigate } from 'react-router-dom';

const QuizCreation = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [segmentedImages, setSegmentedImages] = useState([]);
  const [puzzleOutline, setPuzzleOutline] = useState(null);
  const [positions, setPositions] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [quizMeta, setQuizMeta] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty: 'medium',
  });
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [segmentedUrls, setSegmentedUrls] = useState([]);
  const [puzzleOutlineUrl, setPuzzleOutlineUrl] = useState('');
  const [segmentationMethod, setSegmentationMethod] = useState('automatic');
  const [embeddingId, setEmbeddingId] = useState('');
  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false);
  // Point segmentation states
  const [points, setPoints] = useState([]);
  const [labels, setLabels] = useState([]);
  const [masks, setMasks] = useState([]);
  const [selectionMode, setSelectionMode] = useState('foreground');
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const navigate = useNavigate();
  const teacherId = 'teacher_demo';

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setSegmentedImages([]);
      setPuzzleOutline(null);
      setPositions([]);
      setError('');
      setSuccessMessage('');
      setEmbeddingId('');
      setPoints([]);
      setLabels([]);
      setMasks([]);
      setSegmentationMethod('automatic');
    }
  };

  // Handle automatic segmentation
  const handleSegmentImage = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
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
      setPositions(segmentResponse.data.positions);

      setSuccessMessage('Puzzle created successfully! Please fill in the quiz details below.');
    } catch (err) {
      setError('Segmentation failed: ' + err.message);
    } finally {
      setIsSegmenting(false);
    }
  };

  // Generate embeddings for point-based segmentation
  const handleGenerateEmbeddings = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }
    try {
      setIsGeneratingEmbedding(true);
      setError('');

      const uploadForm = new FormData();
      uploadForm.append('image', selectedFile);
      const uploadResponse = await axios.post('http://127.0.0.1:8000/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadResponse.data.image_url;
      setUploadedImageUrl(imageUrl);

      const embeddingResponse = await axios.post('http://127.0.0.1:8000/get_image_embedding', {
        image_url: imageUrl,
        teacher_id: teacherId,
      });
      setEmbeddingId(embeddingResponse.data.embedding_id);
    } catch (err) {
      setError('Failed to generate embeddings: ' + err.message);
    } finally {
      setIsGeneratingEmbedding(false);
    }
  };

  // Canvas setup for point selection
  useEffect(() => {
    if (imageRef.current && canvasRef.current && embeddingId) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        drawPoints(ctx);
      };
    }
  }, [imagePreview, points, embeddingId]);

  const drawPoints = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);
    points.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = labels[index] === 1 ? 'green' : 'red';
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.stroke();
    });
  };

  // Handle canvas click for point selection
  const handleCanvasClick = (e) => {
    if (!embeddingId) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPoints([...points, { x, y }]);
    setLabels([...labels, selectionMode === 'foreground' ? 1 : 0]);
  };

  // Generate segment for point-based segmentation
  const handleGenerateSegment = async () => {
    if (!embeddingId || points.length === 0) {
      setError('Please generate embeddings and add points first.');
      return;
    }
    try {
      setIsSegmenting(true);
      setError('');

      const response = await axios.post('http://127.0.0.1:8000/segment_with_points', {
        embedding_id: embeddingId,
        points: points.map(p => [p.x, p.y]),
        labels,
      });
      const maskUrl = response.data.mask_url;
      setMasks([...masks, maskUrl]);
      setPoints([]);
      setLabels([]);
    } catch (err) {
      setError('Failed to generate segment: ' + err.message);
    } finally {
      setIsSegmenting(false);
    }
  };

  // Finish point-based segmentation
  const handleFinishSegmentation = () => {
    if (masks.length === 0) {
      setError('Please generate at least one segment.');
      return;
    }
    setSegmentedImages(masks);
    setSegmentedUrls(masks);
    setPuzzleOutline(null);
    setPuzzleOutlineUrl(null);
    setPositions([]);
    setSuccessMessage('Point-based segmentation completed! Please fill in the quiz details below.');
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

      const quizData = {
        teacher_id: teacherId,
        image_url: uploadedImageUrl,
        segmented_urls: segmentedUrls,
        puzzle_outline_url: puzzleOutlineUrl || null,
        positions: positions || [],
        meta: quizMeta,
      };

      await axios.post('http://127.0.0.1:8000/save_quiz', quizData);
      setSuccessMessage('Quiz saved successfully!');
      setTimeout(() => navigate('/student-dashboard'), 2000);
    } catch (err) {
      setError('Failed to save quiz: ' + err.message);
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
              <img
                src={imagePreview}
                alt="Uploaded preview"
                className="uploaded-image"
                ref={imageRef}
                style={{ display: segmentationMethod === 'point-based' && embeddingId ? 'none' : 'block' }}
              />
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="segmentation-method">
            <h3>Segmentation Method</h3>
            <div className="method-options">
              <label>
                <input
                  type="radio"
                  value="automatic"
                  checked={segmentationMethod === 'automatic'}
                  onChange={() => setSegmentationMethod('automatic')}
                />
                Automatic Segmentation
              </label>
              <label>
                <input
                  type="radio"
                  value="point-based"
                  checked={segmentationMethod === 'point-based'}
                  onChange={() => setSegmentationMethod('point-based')}
                />
                Point-Based Segmentation
              </label>
            </div>
          </div>
        )}

        {selectedFile && segmentationMethod === 'automatic' && (
          <button
            onClick={handleSegmentImage}
            className={`segment-button ${isSegmenting ? 'disabled' : ''}`}
            disabled={isSegmenting}
          >
            {isSegmenting ? 'Processing...' : 'Segment Image & Create Puzzle'}
          </button>
        )}

        {selectedFile && segmentationMethod === 'point-based' && !embeddingId && (
          <button
            onClick={handleGenerateEmbeddings}
            className={`generate-button ${isGeneratingEmbedding ? 'disabled' : ''}`}
            disabled={isGeneratingEmbedding}
          >
            {isGeneratingEmbedding ? 'Generating Embeddings...' : 'Generate Embeddings'}
          </button>
        )}

        {selectedFile && segmentationMethod === 'point-based' && embeddingId && (
          <div className="point-segmentation-interface">
            <h3>Select Points on Image</h3>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{ position: 'absolute', top: 0, left: 0 }}
              />
              <img
                src={imagePreview}
                alt="Point selection"
                style={{ opacity: 0 }}
                ref={imageRef}
              />
            </div>
            <div className="controls">
              <label>
                Selection Mode:
                <select
                  value={selectionMode}
                  onChange={(e) => setSelectionMode(e.target.value)}
                >
                  <option value="foreground">Foreground (Green)</option>
                  <option value="background">Background (Red)</option>
                </select>
              </label>
              <button onClick={handleGenerateSegment} disabled={isSegmenting}>
                {isSegmenting ? 'Generating...' : 'Generate Segment'}
              </button>
              <button onClick={() => { setPoints([]); setLabels([]); }}>Reset Points</button>
              <button onClick={handleFinishSegmentation}>Finish Segmentation</button>
            </div>
            {masks.length > 0 && (
              <div>
                <h4>Generated Segments ({masks.length})</h4>
                <div className="masks-gallery">
                  {masks.map((mask, index) => (
                    <img key={index} src={mask} alt={`Mask ${index + 1}`} className="mask-image" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {segmentedImages.length > 0 && (
        <section className="segmented-preview-section card-neon">
          <h2>Preview</h2>
          <div className="segments-container">
            {puzzleOutline && (
              <div className="puzzle-outline">
                <h3>Puzzle Outline</h3>
                <img src={puzzleOutline} alt="Puzzle Outline" className="puzzle-outline-image" />
              </div>
            )}
            <div className="segments-grid">
              <h3>{puzzleOutline ? 'Puzzle Pieces' : 'Segmented Regions'} ({segmentedImages.length})</h3>
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
                onChange={(e) => setQuizMeta({ ...quizMeta, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="quiz-description">Description</label>
              <textarea
                id="quiz-description"
                placeholder="Describe what this quiz is about"
                value={quizMeta.description}
                onChange={(e) => setQuizMeta({ ...quizMeta, description: e.target.value })}
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
                onChange={(e) => setQuizMeta({ ...quizMeta, subject: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="quiz-difficulty">Difficulty Level</label>
              <select
                id="quiz-difficulty"
                value={quizMeta.difficulty}
                onChange={(e) => setQuizMeta({ ...quizMeta, difficulty: e.target.value })}
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