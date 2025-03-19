import React, { useState, useRef, useEffect } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import axios from 'axios';
import { auth } from '../../firebase';
import './Label.css';

const Label = ({ teacherEmail }) => {
  const [image, setImage] = useState(null);
  const [isSelectingRegions, setIsSelectingRegions] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [processedOutput, setProcessedOutput] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  const [processedRegions, setProcessedRegions] = useState([]);
  const [isLabeling, setIsLabeling] = useState(false);
  const [labels, setLabels] = useState({});
  const [currentRegionForLabeling, setCurrentRegionForLabeling] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const cropperRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setError('You must be logged in as a teacher to use this page.');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        const response = await axios.post('http://127.0.0.1:8000/upload', formData);
        const imageUrl = response.data.image_url;
        setCurrentImageUrl(imageUrl);
        setImage(file);
        setIsSelectingRegions(true);
        setSelectedRegions([]);
      } catch (error) {
        setError('Failed to upload image: ' + error.message);
      }
    }
  };

  const handleSelectRegion = () => {
    if (cropperRef.current) {
      const cropData = cropperRef.current.cropper.getData();
      setSelectedRegions([...selectedRegions, cropData]);
      cropperRef.current.cropper.clear();
    }
  };

  const handleDoneSelecting = async () => {
    if (!teacherEmail) {
      setError('Teacher email not available. Please log in.');
      return;
    }
    try {
      if (!currentImageUrl) throw new Error('No image URL available');
      setIsLoading(true);
      const processedResults = await Promise.all(
        selectedRegions.map((region, index) =>
          axios.post('http://127.0.0.1:8000/segment_label', {  // Use the new endpoint
            image_url: currentImageUrl,
            bounding_box: {
              x: Math.round(region.x),
              y: Math.round(region.y),
              width: Math.round(region.width),
              height: Math.round(region.height),
              rotate: region.rotate || 0,
            },
            teacher_id: teacherEmail,
            region_index: index,
          })
        )
      );
      setProcessedRegions(processedResults.map((response) => response.data));
      setProcessedOutput({
        originalImage: currentImageUrl,
        regions: processedResults.map((response) => ({
          maskUrl: response.data.mask_url, // Use mask_url from the new endpoint
          position: response.data.position,
        })),
      });
      setIsSelectingRegions(false);
      setIsLabeling(true);
    } catch (error) {
      setError('Failed to process regions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionClick = (index) => {
    if (isLabeling) {
      setCurrentRegionForLabeling(index);
    }
  };

  const handleAddLabel = (index, label) => {
    setLabels((prev) => ({ ...prev, [index]: label }));
  };

  const handleDoneLabeling = () => {
    setIsLabeling(false);
  };

  const renderProcessedOutput = () => {
    return (
      <div className="processed-output-container">
        <div className="original-image-container">
          <img
            src={currentImageUrl}
            alt="Original"
            className="base-image"
            style={{ width: '800px', height: '600px', objectFit: 'contain' }}
          />
          {processedOutput.regions.map((region, index) => (
            <div
              key={index}
              className="region-overlay"
              onClick={() => handleRegionClick(index)}
            >
              <img
                src={region.maskUrl}
                alt={`Region ${index + 1}`}
                className="region-mask"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: 0.5, // Translucent mask
                }}
              />
              {labels[index] && (
                <div className="label-container">
                  <div className="label-line" />
                  <div className="label-text">{labels[index]}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {currentRegionForLabeling !== null && isLabeling && (
          <div className="label-popup">
            <h3>Add Label for Region {currentRegionForLabeling + 1}</h3>
            <input
              type="text"
              value={labels[currentRegionForLabeling] || ''}
              onChange={(e) =>
                handleAddLabel(currentRegionForLabeling, e.target.value)
              }
              placeholder="Enter label for this region..."
              className="label-input"
              disabled={isLoading}
            />
            <div className="label-popup-buttons">
              <button
                onClick={() => setCurrentRegionForLabeling(null)}
                className="close-button"
                disabled={isLoading}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {isLabeling && (
          <button onClick={handleDoneLabeling} className="done-labeling-button">
            Done Labeling
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="label-content">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Label Mode</h1>
        <p className="dashboard-subtitle">Upload an image, segment regions, and add labels.</p>
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
        </div>

        {image && isSelectingRegions && (
          <div className="cropper-container">
            <Cropper
              src={image instanceof File ? URL.createObjectURL(image) : image}
              style={{ height: 600, width: '100%', maxWidth: 800 }}
              initialAspectRatio={NaN}
              aspectRatio={NaN}
              guides={true}
              ref={cropperRef}
              zoomable={false}
              scalable={false}
              mouseWheelZoom={false}
              dragMode="crop"
              cropBoxMovable={true}
              cropBoxResizable={true}
              toggleDragModeOnDblclick={false}
              viewMode={1}
              minContainerWidth={800}
              minContainerHeight={600}
            />
            <div className="region-selection-controls">
              <button onClick={handleSelectRegion} className="select-region-button">
                Select Region
              </button>
              {selectedRegions.length > 0 && (
                <>
                  <button
                    onClick={() => cropperRef.current.cropper.clear()}
                    className="select-another-button"
                  >
                    Select Another Part
                  </button>
                  <button onClick={handleDoneSelecting} className="done-selecting-button">
                    Done Selecting ({selectedRegions.length} regions)
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {(isLabeling || !isSelectingRegions) && processedOutput && renderProcessedOutput()}
      </section>

      {isLoading && <div className="loading-message">Processing...</div>}
    </div>
  );
};

export default Label;