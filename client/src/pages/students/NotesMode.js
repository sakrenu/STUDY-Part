import React, { useState, useRef, useEffect } from 'react';
import './NotesMode.css';

const NotesMode = () => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [points, setPoints] = useState([]);
    const [error, setError] = useState(null);
    const [imageData, setImageData] = useState(null);
    const [simulationProgress, setSimulationProgress] = useState(0);
    const [simulationMessage, setSimulationMessage] = useState('');
    const fileInputRef = useRef(null);

    // Function to handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setError(null); // Clear any previous errors
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedImage(e.target.result);
                handleImageUpload(file);
            };
            reader.readAsDataURL(file);
        }
    };

    // Function to handle image upload to backend
    const handleImageUpload = async (file) => {
        setIsProcessing(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file); // Make sure to use 'file' as the field name

        // Start simulation progress
        let currentProgress = 0;
        const progressInterval = setInterval(() => {
            if (currentProgress < 85) {
                currentProgress += currentProgress < 25 ? 1 : 0.5;
                setSimulationProgress(currentProgress);
                setSimulationMessage(
                    currentProgress < 25 ? 
                    `Loading your image... (${Math.round(currentProgress)}%)` :
                    currentProgress < 50 ?
                    `Generating image embeddings... (${Math.round(currentProgress)}%)` :
                    `Almost there (${Math.round(currentProgress)}%)`
                );
            }
        }, 100);

        try {
            const response = await fetch('http://localhost:8000/upload_image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Complete the progress quickly after successful response
            clearInterval(progressInterval);
            const finishProgress = () => {
                currentProgress = Math.min(100, currentProgress + 5);
                setSimulationProgress(currentProgress);
                setSimulationMessage(`Finishing up (${Math.round(currentProgress)}%)`);
                
                if (currentProgress < 100) {
                    setTimeout(finishProgress, 50);
                }
            };
            finishProgress();

            const data = await response.json();
            setImageData(data);
            console.log('Upload successful:', data);
            // You can use the data.image_id and data.image_url here
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Error uploading image:', error);
            setError('Failed to upload image. Please try again.');
            setSelectedImage(null); // Clear the selected image on error
        } finally {
            setTimeout(() => {
                setIsProcessing(false);
                setSimulationProgress(0);
                setSimulationMessage('');
            }, 3000);
        }
    };

    // Effect to create random points for the segmentation animation
    useEffect(() => {
        if (isProcessing) {
            const numPoints = 10;
            const newPoints = [];

            for (let i = 0; i < numPoints; i++) {
                newPoints.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    delay: Math.random() * 2
                });
            }

            setPoints(newPoints);
        } else {
            setPoints([]);
        }
    }, [isProcessing]);

    // Function to trigger file input click
    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="notes-mode">
            <div className="notes-container">
                <h1 className="notes-title">Notes Mode</h1>

                <div className="upload-section">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <button 
                        className="upload-button" 
                        onClick={handleUploadClick}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Uploading...' : 'Upload Image'}
                    </button>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {selectedImage && (
                        <div className="image-preview">
                            <div className="processing-animation">
                                <img
                                    src={selectedImage}
                                    alt="Preview"
                                    className={`preview-image ${isProcessing ? 'dull-image' : ''}`}
                                />
                                {isProcessing && (
                                    <>
                                        <div className="processing-overlay" />
                                        <div className="simulation-overlay">
                                            <div className="simulation-bar-container">
                                                <div className="simulation-bar">
                                                    <div 
                                                        className="simulation-progress"
                                                        style={{ width: `${simulationProgress}%` }}
                                                    />
                                                    <div className="simulation-glow" />
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
                                        <div className="segmentation-points">
                                            {points.map((point) => (
                                                <div
                                                    key={point.id}
                                                    className="point"
                                                    style={{
                                                        left: `${point.x}%`,
                                                        top: `${point.y}%`,
                                                        animationDelay: `${point.delay}s`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                            {isProcessing && (
                                <p className="processing-text">Processing your image...</p>
                            )}
                            {imageData && (
                                <div className="image-info">
                                    <p>Image uploaded successfully!</p>
                                    <p>Image ID: {imageData.image_id}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotesMode;
