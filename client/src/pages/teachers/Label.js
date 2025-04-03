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
  const [labels, setLabels] = useState([]);
  const [currentLabel, setCurrentLabel] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStudyByPart, setIsStudyByPart] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState(-1);
  const cropperRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setError('You must be logged in as a teacher to use this page.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isStudyByPart && currentPartIndex >= 0 && processedOutput) {
      const parts = processedOutput.regions.map((region, index) => ({
        ...region,
        label: labels.find((l) => l.regionIndex === region.regionIndex)?.text || `Part ${index + 1}`,
      }));
      if (currentPartIndex < parts.length) {
        const timer = setTimeout(() => {
          setCurrentPartIndex((prev) => prev + 1);
        }, 4000); // 4 seconds as requested earlier
        return () => clearTimeout(timer);
      }
    }
  }, [isStudyByPart, currentPartIndex, processedOutput, labels]);

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
        setLabels([]);
        setCurrentLabel(null);
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
          axios.post('http://127.0.0.1:8000/segment_label', {
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
        regions: processedResults.map((response, index) => ({
          maskUrl: response.data.mask_url,
          position: response.data.position,
          regionIndex: index,
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

  const handleImageClick = (e) => {
    if (!isLabeling || !processedOutput) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const normalizedX = (x / displayWidth) * imageWidth;
    const normalizedY = (y / displayHeight) * imageHeight;

    const clickedRegion = processedOutput.regions.find((region) => {
      const { x: regionX, y: regionY, width, height } = region.position;
      return (
        normalizedX >= regionX &&
        normalizedX <= regionX + width &&
        normalizedY >= regionY &&
        normalizedY <= regionY + height
      );
    });

    if (clickedRegion) {
      const existingLabel = labels.find((label) => label.regionIndex === clickedRegion.regionIndex);
      if (existingLabel) {
        setLabels((prev) =>
          prev.map((label) =>
            label.regionIndex === clickedRegion.regionIndex
              ? { ...label, clickX: x, clickY: y }
              : label
          )
        );
      } else {
        setCurrentLabel({
          clickX: x,
          clickY: y,
          regionIndex: clickedRegion.regionIndex,
          text: '',
        });
      }
    }
  };

  const handleLabelChange = (text) => {
    setCurrentLabel((prev) => ({ ...prev, text }));
  };

  const handleLabelSubmit = () => {
    if (currentLabel && currentLabel.text.trim()) {
      setLabels((prev) => [...prev, currentLabel]);
      setCurrentLabel(null);
    }
  };

  const handleDoneLabeling = () => {
    setIsLabeling(false);
    setCurrentLabel(null);
  };

  const handleStudyByPart = () => {
    setIsStudyByPart(true);
    setCurrentPartIndex(0);
  };

  const renderStudyByPart = () => {
    if (!processedOutput) return null;

    const parts = processedOutput.regions.map((region, index) => ({
      ...region,
      label: labels.find((l) => l.regionIndex === region.regionIndex)?.text || `Part ${index + 1}`,
    }));

    return (
      <div className="study-by-part-container" style={{ display: 'flex', gap: '20px' }}>
        <div className="original-image-study" style={{ position: 'relative', width: '800px', height: '600px' }}>
          <img
            src={currentImageUrl}
            alt="Original with empty parts"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
          {parts.map((part, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              {index > currentPartIndex && (
                <img
                  src={part.maskUrl}
                  alt={`Mask ${index}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: 0.5,
                    filter: 'grayscale(100%)',
                  }}
                />
              )}
              {index <= currentPartIndex && (
                <img
                  src={part.maskUrl}
                  alt={`Part ${index}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: index === currentPartIndex ? 'calc(100% + 320px)' : 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: 1,
                    transition: index === currentPartIndex ? 'left 1s ease-in-out' : 'none',
                    animation: index === currentPartIndex ? 'slideIn 1s ease-in-out forwards' : 'none',
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="parts-list" style={{ width: '300px' }}>
          <h3>Parts</h3>
          {parts.map((part, index) => (
            <div
              key={index}
              style={{
                marginBottom: '10px',
                opacity: index > currentPartIndex ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            >
              <img
                src={part.maskUrl}
                alt={`Part ${index}`}
                style={{
                  width: '100px',
                  height: 'auto',
                  display: index > currentPartIndex ? 'block' : 'none',
                }}
              />
              <p
                style={{
                  fontWeight: index === currentPartIndex ? 'bold' : 'normal',
                  color: index === currentPartIndex ? '#ffffff' : '#cccccc',
                }}
              >
                {part.label}
              </p>
            </div>
          ))}
          {currentPartIndex >= parts.length && (
            <button onClick={() => setIsStudyByPart(false)} className="exit-study-button">
              Exit Study-by-Part
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderProcessedOutput = () => {
    return (
      <div className="processed-output-container">
        <div className="original-image-container" onClick={handleImageClick}>
          <img
            ref={imageRef}
            src={currentImageUrl}
            alt="Original"
            className="base-image"
            style={{ width: '800px', height: '600px', objectFit: 'contain', cursor: isLabeling ? 'crosshair' : 'default' }}
          />
          {processedOutput.regions.map((region, index) => (
            <div key={index} className="region-overlay">
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
                  opacity: 0.5,
                  pointerEvents: 'none',
                }}
              />
            </div>
          ))}
          {labels.map((label, index) => {
            const labelX = label.clickX + 100;
            const labelY = label.clickY - 20;
            return (
              <div key={index} className="label-wrapper">
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '800px',
                    height: '600px',
                    pointerEvents: 'none',
                  }}
                >
                  <line
                    x1={label.clickX}
                    y1={label.clickY}
                    x2={labelX}
                    y2={labelY}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </svg>
                <div
                  className="label-text"
                  style={{
                    position: 'absolute',
                    top: labelY,
                    left: labelX,
                    backgroundColor: '#2a2a2a',
                    color: '#ffffff',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label.text}
                </div>
              </div>
            );
          })}
          {currentLabel && (
            <div
              className="label-input-wrapper"
              style={{
                position: 'absolute',
                top: currentLabel.clickY - 20,
                left: currentLabel.clickX + 100,
              }}
            >
              <input
                type="text"
                value={currentLabel.text}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Enter label..."
                className="label-input"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleLabelSubmit();
                }}
              />
              <button onClick={handleLabelSubmit} className="submit-label-button">
                Add
              </button>
              <button onClick={() => setCurrentLabel(null)} className="close-button">
                Cancel
              </button>
            </div>
          )}
        </div>
        {isLabeling && (
          <button onClick={handleDoneLabeling} className="done-labeling-button">
            Done Labeling
          </button>
        )}
        {!isLabeling && !isStudyByPart && (
          <button onClick={handleStudyByPart} className="study-by-part-button">
            Study-by-Part
          </button>
        )}
        {isStudyByPart && renderStudyByPart()}
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