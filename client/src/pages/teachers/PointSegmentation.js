// src/pages/teachers/PointSegmentation.js

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
  const [isCuttingOut, setIsCuttingOut] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [maskUrl, setMaskUrl] = useState('');
  const [currentCutoutUrl, setCurrentCutoutUrl] = useState('');
  const [currentCutoutPosition, setCurrentCutoutPosition] = useState(null);
  const [savedCutouts, setSavedCutouts] = useState([]);
  const [cumulativePuzzleOutlineUrl, setCumulativePuzzleOutlineUrl] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [selectionMode, setSelectionMode] = useState('foreground'); // 'foreground' or 'background'
  const [simulationVisible, setSimulationVisible] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationMessage, setSimulationMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
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
      setCurrentCutoutUrl('');
      setCurrentCutoutPosition(null);
      // Note: We don't reset savedCutouts here to maintain them across uploads
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

  // Generate embeddings for the uploaded image with simulated progress
  const handleGenerateEmbeddings = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setIsGeneratingEmbedding(true);
    setSimulationVisible(true);
    setSimulationProgress(0);
    
    let apiFinished = false;
    let currentProgress = 0;
    
    const simulationPromise = new Promise(resolve => {
      const updateProgress = () => {
        if (apiFinished) {
          // When API is finished, quickly complete the progress
          const finishProgress = () => {
            currentProgress = Math.min(100, currentProgress + 5);
            setSimulationProgress(currentProgress);
            setSimulationMessage(`Finishing up (${Math.round(currentProgress)}%)`);
            
            if (currentProgress < 100) {
              setTimeout(finishProgress, 50); // Quick progress updates
            } else {
              resolve();
            }
          };
          finishProgress();
          return;
        }

        if (currentProgress < 25) {
          setSimulationMessage(`Loading your image... (${Math.round(currentProgress)}%)`);
          currentProgress = Math.min(25, currentProgress + 1);
        } else if (currentProgress < 50) {
          setSimulationMessage(`Generating image embeddings... (${Math.round(currentProgress)}%)`);
          currentProgress = Math.min(50, currentProgress + 0.5);
        } else if (currentProgress < 85) {
          setSimulationMessage(`Almost there (${Math.round(currentProgress)}%)`);
          currentProgress = Math.min(85, currentProgress + 0.3);
        }

        setSimulationProgress(currentProgress);
        
        if (!apiFinished) {
          setTimeout(updateProgress, 100);
        }
      };

      updateProgress();
    });
    
    // API calls in parallel with the simulation
    const apiPromise = (async () => {
      try {
        const uploadForm = new FormData();
        uploadForm.append('image', selectedFile);
        const uploadResponse = await axios.post('http://127.0.0.1:8000/upload', uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const imageUrl = uploadResponse.data.image_url;
        setUploadedImageUrl(imageUrl);
        
        const embeddingResponse = await axios.post('http://127.0.0.1:8000/get_image_embedding', {
          image_url: imageUrl,
          teacher_id: teacherId
        });
        
        setImageEmbeddingId(embeddingResponse.data.embedding_id);
      } catch (err) {
        setError('Failed to generate embeddings: ' + err.message);
      } finally {
        apiFinished = true;
      }
    })();
    
    await Promise.all([apiPromise, simulationPromise]);
    setSimulationVisible(false);
    
    if (!error) {
      setSuccessMessage('Embeddings generated successfully! Now select points on the image.');
    }
    setIsGeneratingEmbedding(false);
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

  // Reset all points and clear current segmentation
  const handleResetPoints = () => {
    setPoints([]);
    setLabels([]);
    setMaskUrl('');
    setCurrentCutoutUrl('');
    setCurrentCutoutPosition(null);
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
      setSuccessMessage('Segmentation completed successfully! Click "Save Cutout" if you\'re satisfied.');
    } catch (err) {
      setError('Segmentation failed: ' + err.message);
    } finally {
      setIsSegmenting(false);
    }
  };

  // Generate and save the current cutout based on the segmentation
  const handleSaveCutout = async () => {
    if (!maskUrl) {
      setError("Please generate a segmentation first.");
      return;
    }
    
    try {
      setIsCuttingOut(true);
      setError('');
      
      const cutoutResponse = await axios.post('http://127.0.0.1:8000/get_point_cutouts', {
        image_embedding_id: imageEmbeddingId,
        points: points,
        labels: labels,
        original_size: [imageSize.width, imageSize.height]
      });
      
      // Store the current cutout
      const cutoutUrl = cutoutResponse.data.segmented_urls[0];
      const position = cutoutResponse.data.positions[0];
      
      setCurrentCutoutUrl(cutoutUrl);
      setCurrentCutoutPosition(position);
      
      // Add the cutout to saved cutouts
      const newCutout = {
        id: Date.now(), // Unique ID for each cutout
        url: cutoutUrl,
        position: position
      };
      
      const updatedCutouts = [...savedCutouts, newCutout];
      setSavedCutouts(updatedCutouts);
      
      // Update the cumulative puzzle outline
      setCumulativePuzzleOutlineUrl(cutoutResponse.data.puzzle_outline_url);
      
      setSuccessMessage('Cutout saved successfully! You can now reset and create another segment.');
      
      // Reset points and segmentation for a new cutout
      setPoints([]);
      setLabels([]);
      setMaskUrl('');
    } catch (err) {
      setError('Failed to save cutout: ' + err.message);
    } finally {
      setIsCuttingOut(false);
    }
  };

  // Remove a cutout from the saved list
  const handleRemoveCutout = (cutoutId) => {
    const updatedCutouts = savedCutouts.filter(cutout => cutout.id !== cutoutId);
    setSavedCutouts(updatedCutouts);
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="point-segmentation-container">
      <header className="segmentation-header">
        <h1>Point-Based Segmentation</h1>
      </header>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="main-content-with-sidebar">
        {/* Sidebar for saved cutouts */}
        <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h2>Saved Cutouts</h2>
            <button 
              className="toggle-sidebar-button"
              onClick={toggleSidebar}
            >
              {sidebarOpen ? '❮' : '❯'}
            </button>
          </div>
          
          <div className="saved-cutouts-container">
            {savedCutouts.length === 0 ? (
              <div className="no-cutouts">
                <p>No cutouts saved yet</p>
              </div>
            ) : (
              savedCutouts.map((cutout) => (
                <div key={cutout.id} className="saved-cutout-item">
                  <img 
                    src={cutout.url}
                    alt="Saved cutout"
                    style={{
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />
                  <button 
                    className="remove-cutout-button"
                    onClick={() => handleRemoveCutout(cutout.id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
          
          {cumulativePuzzleOutlineUrl && (
            <div className="cumulative-outline-container">
              <h3>Puzzle Outline</h3>
              <img 
                src={cumulativePuzzleOutlineUrl}
                alt="Cumulative Puzzle Outline"
                style={{
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          )}
        </div>

        {/* Main content area */}
        <div className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
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
                  {maskUrl && (
                    <img
                      src={maskUrl}
                      alt="Segmentation mask"
                      className="mask-overlay"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: 0.5, // Translucent overlay
                        pointerEvents: 'none', // Allows clicks to pass through to the canvas
                      }}
                    />
                  )}
                  <canvas 
                    ref={canvasRef}
                    className="selection-canvas"
                    onClick={handleCanvasClick}
                  />
                  {simulationVisible && (
                    <>
                      <div className="simulation-overlay" style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        color: 'white',
                        zIndex: 10,
                        padding: '20px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(8px)',
                        width: '400px',
                      }}>
                        <div className="simulation-bar-container">
                          <div className="simulation-bar">
                            <div className="simulation-progress" style={{
                              width: `${simulationProgress}%`
                            }}></div>
                            <div className="simulation-glow"></div>
                          </div>
                        </div>
                        <div className="simulation-percentage">
                          {Math.round(simulationProgress)}%
                        </div>
                        <div className="simulation-message">
                          {simulationMessage}
                        </div>
                      </div>
                      <div className="neural-animation-overlay">
                        <div className="neural-particles"></div>
                        <div className="neural-particles"></div>
                        <div className="neural-particles"></div>
                      </div>
                    </>
                  )}
                </div>
                
                {imageEmbeddingId && (
                  <div className="control-buttons">
                    <button onClick={handleUndoPoint} disabled={points.length === 0}>
                      Undo Last Point
                    </button>
                    <button onClick={handleResetPoints} disabled={points.length === 0 && !maskUrl}>
                      Reset Selection
                    </button>
                    <button 
                      onClick={handleSegment} 
                      className={`segment-button ${isSegmenting ? 'disabled' : ''}`}
                      disabled={isSegmenting || points.length === 0}
                    >
                      {isSegmenting ? 'Segmenting...' : 'Generate Segment'}
                    </button>
                    {maskUrl && (
                      <button 
                        onClick={handleSaveCutout} 
                        className={`cutout-button ${isCuttingOut ? 'disabled' : ''}`}
                        disabled={isCuttingOut || !maskUrl}
                      >
                        {isCuttingOut ? 'Saving Cutout...' : 'Save Cutout'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default PointSegmentation;