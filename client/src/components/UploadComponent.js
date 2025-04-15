
import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './UploadComponent.css';
import { toast } from 'react-toastify';

const UploadComponent = ({ onImageUploaded, onBack }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${API_URL}/upload_image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log("Upload response:", response.data);

      onImageUploaded({
        file,
        imageUrl: response.data.image_url,
        image_id: response.data.image_id // 🟢 send image_id
      });
    } catch (error) {
      console.error('Upload error:', error, error.response?.data || 'No response data');
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div className="upload-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h2>Upload an Image</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      {previewUrl && <img src={previewUrl} alt="Preview" style={{ maxWidth: '300px', marginTop: '10px' }} />}
      <div className="upload-controls">
        <motion.button onClick={handleUpload} disabled={!file || uploading} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          {uploading ? 'Uploading...' : 'Upload'}
        </motion.button>
        <motion.button onClick={onBack} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          Back
        </motion.button>
      </div>
    </motion.div>
  );
};

export default UploadComponent;
