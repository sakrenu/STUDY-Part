import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './PointSegmentation.css'; // You'll need to create this CSS file

const PointSegmentation = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [imageEmbeddingId, setImageEmbeddingId] = useState('');
  const [points, setPoints] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isGeneratingEmbedding, setIsGeneratingEmbedding] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [maskUrl, setMaskUrl] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectionMode, setSelectionMode] = useState('foreground'); // 'foreground' or 'background'
  
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const teacherId = "teacher_demo";

  // Handle image file selection
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Reset states
      setPoints([]);
      setLabels([]);
      setImageEmbeddingId('');
      setMaskUrl('');
      setError('');
      setSuccessMessage('');
      
      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
      };
      img.src = previewUrl;
    }
  };

  // Generate embeddings for the uploaded image
  const handleGenerateEmbeddings = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }
    
    try {
      setIsGeneratingEmbedding(true);
      setError('');
      
      // First upload the image
      const uploadForm = new FormData();
      uploadForm.append('image', selectedFile);
      const uploadResponse = await axios.post('http://127.0.0.1:8000/upload', uploadForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = uploadResponse.data.image_url;
      setUploadedImageUrl(imageUrl);
      
      // Then generate embeddings
      const embeddingResponse = await axios.post('http://127.0.0.1:8000/get_image_embedding', {
        image_url: imageUrl,
        teacher_id: teacherId
      });
      
      setImageEmbeddingId(embeddingResponse.data.embedding_id);
      setSuccessMessage('Embeddings generated successfully! Now select points on the image.');
    } catch (err) {
      setError('Failed to generate embeddings: ' + err.message);
    } finally {
      setIsGeneratingEmbedding(false);
    }
  };

  // Handle canvas click to add points
  const handleCanvasClick = (e) => {
    if (!imageEmbeddingId) {
      setError("Please generate embeddings first before selecting points.");
      return;
    }
    
    // Get click coordinates relative to the image
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Add the point with correct label (1 for foreground, 0 for background)
    const newPoints = [...points, { x, y }];
    const newLabels = [...labels, selectionMode === 'foreground' ? 1 : 0];
    
    setPoints(newPoints);
    setLabels(newLabels);
    
    // Redraw canvas
    drawPoints();
  };

  // Draw points on canvas
  const drawPoints = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set canvas dimensions to match the displayed image
    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;
    
    // Draw points
    points.forEach((point, index) => {
      const scaleX = canvas.width / imageSize.width;
      const scaleY = canvas.height / imageSize.height;
      
      ctx.beginPath();
      ctx.arc(point.x * scaleX, point.y * scaleY, 5, 0, 2 * Math.PI);
      
      // Different colors for foreground/background points
      if (labels[index] === 1) {
        ctx.fillStyle = 'green'; // Foreground points
      } else {
        ctx.fillStyle = 'red';   // Background points
      }
      
      ctx.fill();
      
      // Add point number
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.fillText(index + 1, point.x * scaleX + 7, point.y * scaleY + 7);
    });
  };

  // Effect to redraw points when they change
  useEffect(() => {
    drawPoints();
  }, [points, labels, imageSize]);

  // Reset the last point
  const handleUndoPoint = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
      setLabels(labels.slice(0, -1));
    }
  };

  // Reset all points
  const handleResetPoints = () => {
    setPoints([]);
    setLabels([]);
  };

  // Generate segmentation based on points
  const handleSegment = async () => {
    if (!imageEmbeddingId || points.length === 0) {
      setError("Please generate embeddings and select at least one point.");
      return;
    }
    
    try {
      setIsSegmenting(true);
      setError('');
      
      const segmentationResponse = await axios.post('http://127.0.0.1:8000/segment_with_points', {
        image_embedding_id: imageEmbeddingId,
        points: points,
        labels: labels,
        original_size: [imageSize.width, imageSize.height]
      });
      
      setMaskUrl(segmentationResponse.data.mask_url);
      setSuccessMessage('Segmentation completed successfully!');
    } catch (err) {
      setError('Segmentation failed: ' + err.message);
    } finally {
      setIsSegmenting(false);
    }
  };

  return (
    <div className="point-segmentation-container">
      <header className="segmentation-header">
        <h1>Point-Based Segmentation</h1>
      </header>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <section className="upload-section">
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
        </div>

        {imagePreview && (
          <button 
            onClick={handleGenerateEmbeddings} 
            className={`generate-button ${isGeneratingEmbedding ? 'disabled' : ''}`}
            disabled={isGeneratingEmbedding}
          >
            {isGeneratingEmbedding ? 'Generating Embeddings...' : 'Generate Embeddings'}
          </button>
        )}
      </section>

      {imageEmbeddingId && (
        <section className="selection-mode-section">
          <h2>Selection Mode</h2>
          <div className="mode-buttons">
            <button 
              className={`mode-button ${selectionMode === 'foreground' ? 'active' : ''}`}
              onClick={() => setSelectionMode('foreground')}
            >
              Foreground (Green)
            </button>
            <button 
              className={`mode-button ${selectionMode === 'background' ? 'active' : ''}`}
              onClick={() => setSelectionMode('background')}
            >
              Background (Red)
            </button>
          </div>
          <div className="selection-instructions">
            <p>Click on the image to add points. Green points select what to keep, red points select what to remove.</p>
          </div>
        </section>
      )}

      {imagePreview && (
        <section className="image-interaction-section">
          <div className="image-container">
            <div className="image-canvas-wrapper">
              <img 
                ref={imageRef}
                src={imagePreview} 
                alt="Uploaded preview" 
                className="segmentation-image"
              />
              <canvas 
                ref={canvasRef}
                className="selection-canvas"
                onClick={handleCanvasClick}
              />
            </div>
            
            {imageEmbeddingId && (
              <div className="control-buttons">
                <button onClick={handleUndoPoint} disabled={points.length === 0}>
                  Undo Last Point
                </button>
                <button onClick={handleResetPoints} disabled={points.length === 0}>
                  Reset All Points
                </button>
                <button 
                  onClick={handleSegment} 
                  className={`segment-button ${isSegmenting ? 'disabled' : ''}`}
                  disabled={isSegmenting || points.length === 0}
                >
                  {isSegmenting ? 'Segmenting...' : 'Generate Segment'}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {maskUrl && (
        <section className="result-section">
          <h2>Segmentation Result</h2>
          <div className="result-container">
            <img src={maskUrl} alt="Segmentation mask" className="mask-image" />
          </div>
          <div className="actions-buttons">
            <button onClick={() => window.open(maskUrl, '_blank')}>
              Download Full Size
            </button>
            {/* Add more actions as needed */}
          </div>
        </section>
      )}
    </div>
  );
};

export default PointSegmentation;