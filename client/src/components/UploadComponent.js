import React, { useState, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './UploadComponent.css';
import { toast } from 'react-toastify';

const UploadComponent = ({ onImageUploaded, onBack }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [simulationMessage, setSimulationMessage] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleChooseFileClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    // Start simulation progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += progress < 25 ? 2 : 1;
        setSimulationProgress(progress);
        setSimulationMessage(
          progress < 25 ? 
          `Preparing your image... (${Math.round(progress)}%)` :
          progress < 50 ?
          `Analyzing content... (${Math.round(progress)}%)` :
          `Processing upload... (${Math.round(progress)}%)`
        );
      }
    }, 50);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${API_URL}/upload_image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("Upload response:", response.data);

      // Complete the progress animation
      clearInterval(progressInterval);
      setSimulationProgress(100);
      setSimulationMessage('Upload complete!');

      setTimeout(() => {
        setUploading(false);
        setSimulationProgress(0);
        setSimulationMessage('');
        onImageUploaded({
          file,
          imageUrl: response.data.image_url,
          image_id: response.data.image_id
        });
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Upload error:', error, error.response?.data || 'No response data');
      toast.error("Failed to upload image.");
      setUploading(false);
      setSimulationProgress(0);
      setSimulationMessage('');
    }
  };

  return (
    <motion.div className="upload-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h2>Upload an Image</h2>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        disabled={uploading} 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
      />
      
      {!previewUrl && (
        <div className="choose-file-area">
          <motion.button 
            className="choose-file-button" 
            onClick={handleChooseFileClick} 
            disabled={uploading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Choose File
          </motion.button>
          <p className="no-image-message">Select an image to start</p>
        </div>
      )}
      
      {previewUrl && (
        <div className="image-preview-container">
          <div className="processing-animation">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className={`preview-image ${uploading ? 'dull-image' : ''}`}
            />
            {uploading && (
              <>
                <div className="processing-overlay" />
                <div className="simulation-overlay">
                  <div className="simulation-bar-container">
                    <div className="simulation-bar">
                      <div 
                        className="simulation-progress"
                        style={{ width: `${simulationProgress}%` }}
                      />
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
                  <div className="neural-particles" />
                  <div className="neural-particles" />
                  <div className="neural-particles" />
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="upload-controls">
        {previewUrl && (
             <motion.button onClick={handleUpload} disabled={!file || uploading} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
               {uploading ? 'Uploading...' : 'Upload'}
             </motion.button>
        )}
        <motion.button onClick={onBack} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          Back
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UploadComponent;
