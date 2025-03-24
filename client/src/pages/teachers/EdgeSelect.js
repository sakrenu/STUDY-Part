import React, { useState, useRef, useEffect } from 'react';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; // Import Firebase auth and db
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import axios from 'axios'; // For Cloudinary upload
import './EdgeSelect.css'; // Renamed CSS file

const EdgeSelect = () => {
  const [image, setImage] = useState(null);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [isSelectingRegions, setIsSelectingRegions] = useState(true);
  const [currentNote, setCurrentNote] = useState('');
  const [activeRegion, setActiveRegion] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState(null); // Store teacher email
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const cropperRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTeacherEmail(user.email);
      } else {
        setError('You must be logged in as a teacher to use Edge Select.');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e) => {
    if (!teacherEmail) {
      setError('Please log in as a teacher to upload images.');
      return;
    }
    const file = e.target.files[0];
    if (file) {
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axios.post('http://127.0.0.1:8000/upload', formData);
        const imageUrl = response.data.image_url;
        setImage(imageUrl); // Use Cloudinary URL directly
      } catch (error) {
        setError('Failed to upload image: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Keep the original edge detection logic from BasicVersion.js
  const detectEdges = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new Uint8ClampedArray(data);

    // Convert to grayscale and apply edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Get surrounding pixels
        const top = ((y - 1) * width + x) * 4;
        const bottom = ((y + 1) * width + x) * 4;
        const left = (y * width + (x - 1)) * 4;
        const right = (y * width + (x + 1)) * 4;
        const topLeft = ((y - 1) * width + (x - 1)) * 4;
        const topRight = ((y - 1) * width + (x + 1)) * 4;
        const bottomLeft = ((y + 1) * width + (x - 1)) * 4;
        const bottomRight = ((y + 1) * width + (x + 1)) * 4;

        // Calculate Sobel gradients
        const gx = 
            -1 * ((data[topLeft] + data[topLeft + 1] + data[topLeft + 2]) / 3) +
            -2 * ((data[left] + data[left + 1] + data[left + 2]) / 3) +
            -1 * ((data[bottomLeft] + data[bottomLeft + 1] + data[bottomLeft + 2]) / 3) +
            1 * ((data[topRight] + data[topRight + 1] + data[topRight + 2]) / 3) +
            2 * ((data[right] + data[right + 1] + data[right + 2]) / 3) +
            1 * ((data[bottomRight] + data[bottomRight + 1] + data[bottomRight + 2]) / 3);

        const gy = 
            -1 * ((data[topLeft] + data[topLeft + 1] + data[topLeft + 2]) / 3) +
            -2 * ((data[top] + data[top + 1] + data[top + 2]) / 3) +
            -1 * ((data[topRight] + data[topRight + 1] + data[topRight + 2]) / 3) +
            1 * ((data[bottomLeft] + data[bottomLeft + 1] + data[bottomLeft + 2]) / 3) +
            2 * ((data[bottom] + data[bottom + 1] + data[bottom + 2]) / 3) +
            1 * ((data[bottomRight] + data[bottomRight + 1] + data[bottomRight + 2]) / 3);

        // Calculate magnitude
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        // Make edges green if magnitude is above threshold
        if (magnitude > 50) {
            output[idx] = 0;     // R
            output[idx + 1] = 255; // G
            output[idx + 2] = 0;   // B
            output[idx + 3] = 255; // A
        }
      }
    }

    return new ImageData(output, width, height);
  };

  const handleRegionSelect = async () => {
    if (!cropperRef.current || !teacherEmail) return;

    const cropper = cropperRef.current.cropper;
    const canvas = cropper.getCroppedCanvas();
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply edge detection (using original logic)
    const processedData = detectEdges(imageData);
    
    // Create a new canvas for the contour
    const contourCanvas = document.createElement('canvas');
    contourCanvas.width = canvas.width;
    contourCanvas.height = canvas.height;
    const contourCtx = contourCanvas.getContext('2d');
    contourCtx.putImageData(processedData, 0, 0);

    setIsLoading(true);
    try {
      // Convert canvas to blob and send to app.py
      const contourDataUrl = contourCanvas.toDataURL('image/png');
      const response = await fetch(contourDataUrl);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('image', blob, 'contour.png');

      // Send to app.py's /upload endpoint
      const cloudinaryResponse = await axios.post('http://127.0.0.1:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const highlightedOutlineUrl = cloudinaryResponse.data.image_url;

      const cropData = cropper.getData();
      const containerData = cropper.getContainerData();

      const newRegion = {
        id: selectedRegions.length,
        coordinates: {
          x: cropData.x / containerData.width,
          y: cropData.y / containerData.height,
          width: cropData.width / containerData.width,
          height: cropData.height / containerData.height
        },
        highlightedOutlineUrl, // Use Cloudinary URL
        notes: ''
      };

      setSelectedRegions([...selectedRegions, newRegion]);
      cropper.clear();
    } catch (error) {
      setError('Failed to process region: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionClick = (region) => {
    if (isSelectingRegions) return;
    
    if (isSubmitted) {
      setActiveRegion(region);
      setShowNotePopup(true);
    } else {
      setActiveRegion(region);
      setCurrentNote(region.notes || '');
    }
  };

  const handleNoteSubmit = () => {
    if (!currentNote.trim() || !activeRegion || !teacherEmail) return;

    const updatedRegions = selectedRegions.map(region => 
      region.id === activeRegion.id 
        ? { ...region, notes: currentNote }
        : region
    );

    setSelectedRegions(updatedRegions);
    setCurrentNote('');
    setActiveRegion(null);
  };

  const handleFinalSubmit = async () => {
    if (!teacherEmail || !image) {
      setError('Please log in and upload an image before submitting.');
      return;
    }
    setIsLoading(true);
    try {
      const lessonRef = await addDoc(
        collection(db, 'Teachers', teacherEmail, 'Lessons'),
        {
          originalImageUrl: image,
          createdAt: new Date().toISOString(),
          title: `Edge Select Lesson ${new Date().toLocaleDateString()}`,
          source: 'EdgeSelect' // Indicate this lesson comes from Edge Select
        }
      );

      await Promise.all(
        selectedRegions.map(async (region, index) => {
          const segmentData = {
            boundingBox: {
              xMin: region.coordinates.x,
              yMin: region.coordinates.y,
              xMax: region.coordinates.x + region.coordinates.width,
              yMax: region.coordinates.y + region.coordinates.height,
            },
            segmentCoordinates: [
              { x: region.coordinates.x, y: region.coordinates.y },
              { x: region.coordinates.x + region.coordinates.width, y: region.coordinates.y },
              { x: region.coordinates.x + region.coordinates.width, y: region.coordinates.y + region.coordinates.height },
              { x: region.coordinates.x, y: region.coordinates.y + region.coordinates.height },
            ],
            notes: region.notes,
            highlightedOutlineUrl: region.highlightedOutlineUrl,
          };
          await setDoc(
            doc(db, 'Teachers', teacherEmail, 'Lessons', lessonRef.id, 'Segments', `segment_${index}`),
            segmentData
          );
        })
      );

      setIsSubmitted(true);
      setIsSelectingRegions(false);
    } catch (error) {
      setError('Failed to submit lesson: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="edge-select-content">
      <h2>Edge Select</h2>
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading-message">Processing...</div>}

      <div className="upload-container">
        {!image ? (
          <div className="upload-section">
            <h3>Upload an Image</h3>
            <label className="upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
                style={{ display: 'none' }}
              />
              <div className="upload-button">
                Click to Upload Image
              </div>
            </label>
          </div>
        ) : (
          <div className="editor-section">
            {isSelectingRegions ? (
              <>
                <Cropper
                  src={image}
                  style={{ height: 'auto', width: '100%', maxWidth: '800px', margin: '0 auto' }}
                  guides={true}
                  ref={cropperRef}
                  zoomable={false}
                  scalable={false}
                  viewMode={1} // Ensure the Cropper maintains aspect ratio and fits within container
                  minContainerWidth={800}
                  minContainerHeight={600}
                />
                <div className="controls-container">
                  <button 
                    onClick={handleRegionSelect}
                    className="select-button"
                    disabled={isLoading}
                  >
                    Select Region
                  </button>
                  <button 
                    onClick={() => setIsSelectingRegions(false)}
                    className="done-button"
                    disabled={isLoading}
                  >
                    Done Selecting Regions
                  </button>
                </div>
              </>
            ) : (
              <div className="annotation-section">
                <div className="image-container" style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                  <img
                    src={image}
                    alt="Original"
                    style={{ width: '100%', maxWidth: '800px', height: 'auto', objectFit: 'contain' }}
                  />
                  {selectedRegions.map(region => (
                    <div
                      key={region.id}
                      onClick={() => handleRegionClick(region)}
                      style={{
                        position: 'absolute',
                        left: `${region.coordinates.x * 100}%`,
                        top: `${region.coordinates.y * 100}%`,
                        width: `${region.coordinates.width * 100}%`,
                        height: `${region.coordinates.height * 100}%`,
                        cursor: 'pointer'
                      }}
                    >
                      <img 
                        src={region.highlightedOutlineUrl}
                        alt={`Contour ${region.id}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          pointerEvents: 'none',
                          objectFit: 'contain' // Ensure the contour scales with the image
                        }}
                      />
                    </div>
                  ))}
                </div>

                {!isSubmitted && activeRegion && (
                  <div className="notes-input-container">
                    <textarea
                      value={currentNote}
                      onChange={(e) => setCurrentNote(e.target.value)}
                      placeholder="Add notes for this region..."
                      className="notes-textarea"
                      disabled={isLoading}
                    />
                    <div className="button-group">
                      <button onClick={handleNoteSubmit} disabled={isLoading}>Save Notes</button>
                      <button onClick={() => setActiveRegion(null)} disabled={isLoading}>Cancel</button>
                    </div>
                  </div>
                )}

                {!isSubmitted && (
                  <div className="controls-container">
                    <button 
                      onClick={handleFinalSubmit}
                      className="submit-button"
                      disabled={isLoading}
                    >
                      Submit All
                    </button>
                  </div>
                )}

                {showNotePopup && activeRegion && (
                  <div className="region-popup" style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}>
                    <div className="popup-content">
                      <div className="region-title">Region {activeRegion.id}</div>
                      <div className="region-notes">{activeRegion.notes}</div>
                      <button onClick={() => setShowNotePopup(false)} disabled={isLoading}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EdgeSelect;