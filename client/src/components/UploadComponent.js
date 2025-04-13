// src/components/UploadComponent.js
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { MdUpload, MdArrowBack } from 'react-icons/md';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { Tooltip } from 'react-tooltip';
import '../pages/teachers/TeachByParts.css';

const UploadComponent = ({ onImageUploaded, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await uploadImage(file);
    } else {
      setError('Please drop an image file.');
      toast.error('Please drop an image file.', { theme: 'dark' });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadImage(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append('image', file);
      const response = await axios.post('http://127.0.0.1:8000/upload', formData);
      const imageUrl = response.data.image_url;
      onImageUploaded({ file, imageUrl });
      toast.success('Image uploaded successfully!', { theme: 'dark' });
    } catch (err) {
      setError('Failed to upload image: ' + err.message);
      toast.error('Failed to upload image.', { theme: 'dark' });
    }
  };

  return (
    <motion.div
      className="upload-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="upload-header">
        <motion.button
          className="back-button"
          onClick={onBack}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          data-tooltip-id="back-tooltip"
          data-tooltip-content="Go back to start"
        >
          <MdArrowBack size={24} />
        </motion.button>
        <h2>Upload Your Image</h2>
        <Tooltip id="back-tooltip" place="top" />
      </div>
      <p className="upload-description">
        Drag and drop an image or click to select one to start creating your lesson.
      </p>
      <motion.div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ borderColor: '#4DA8FF' }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <motion.div
          className="upload-placeholder"
          onClick={() => fileInputRef.current.click()}
          whileHover={{ scale: 1.05 }}
        >
          <MdUpload size={48} className="upload-icon" />
          <span>{isDragging ? 'Drop here!' : 'Drop an image or click to browse'}</span>
        </motion.div>
      </motion.div>
      {error && <div className="error-message">{error}</div>}
    </motion.div>
  );
};

export default UploadComponent;