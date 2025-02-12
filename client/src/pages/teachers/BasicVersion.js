import React, { useState, useRef } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './BasicVersion.css';

const BasicVersion = () => {
    const [image, setImage] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [currentNote, setCurrentNote] = useState('');
    const [showNotesInput, setShowNotesInput] = useState(false);
    const [showPopup, setShowPopup] = useState(null);
    const [isDone, setIsDone] = useState(false);
    const cropperRef = useRef(null);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

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

    const handleRegionSelect = () => {
        if (!cropperRef.current) return;

        const cropper = cropperRef.current.cropper;
        const canvas = cropper.getCroppedCanvas();
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Apply edge detection
        const processedData = detectEdges(imageData);
        ctx.putImageData(processedData, 0, 0);

        // Get region coordinates
        const cropData = cropper.getData();
        const containerData = cropper.getContainerData();
        
        const newRegion = {
            id: selectedRegions.length + 1,
            coordinates: {
                x: cropData.x / containerData.width,
                y: cropData.y / containerData.height,
                width: cropData.width / containerData.width,
                height: cropData.height / containerData.height
            },
            contourImage: canvas.toDataURL()
        };

        setSelectedRegions([...selectedRegions, newRegion]);
        setShowNotesInput(true);
        updateDisplayImage(newRegion);
    };

    const handleNoteSubmit = () => {
        if (!currentNote.trim()) return;

        const updatedRegions = [...selectedRegions];
        updatedRegions[updatedRegions.length - 1].notes = currentNote;
        setSelectedRegions(updatedRegions);
        setCurrentNote('');
        setShowNotesInput(false);
    };

    const updateDisplayImage = (newRegion) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Draw original image
            ctx.drawImage(img, 0, 0);

            // Draw contour
            const contourImg = new Image();
            contourImg.onload = () => {
                ctx.drawImage(
                    contourImg,
                    newRegion.coordinates.x * img.width,
                    newRegion.coordinates.y * img.height,
                    newRegion.coordinates.width * img.width,
                    newRegion.coordinates.height * img.height
                );
                setProcessedImage(canvas.toDataURL());
            };
            contourImg.src = newRegion.contourImage;
        };
        img.src = processedImage || image;
    };

    const handleImageClick = (e) => {
        if (!isDone) return;

        const rect = e.target.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        selectedRegions.forEach(region => {
            if (isPointInRegion(x, y, region.coordinates)) {
                setShowPopup({
                    id: region.id,
                    notes: region.notes,
                    x: e.clientX,
                    y: e.clientY
                });
            }
        });
    };

    const isPointInRegion = (x, y, coords) => {
        return (
            x >= coords.x &&
            x <= coords.x + coords.width &&
            y >= coords.y &&
            y <= coords.y + coords.height
        );
    };

    return (
        <div className="basic-version-content">
            <h2>Basic Version</h2>
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
                ) : !isDone ? (
                    <div className="editor-section">
                        <Cropper
                            src={image}
                            style={{ height: 'auto', width: '100%', maxWidth: '800px', margin: '0 auto' }}
                            guides={true}
                            ref={cropperRef}
                            zoomable={false}
                            scalable={false}
                        />
                        <div className="controls-container">
                            {!showNotesInput && (
                                <button 
                                    onClick={handleRegionSelect}
                                    className="select-button"
                                >
                                    Select Region
                                </button>
                            )}
                            {showNotesInput && (
                                <div className="notes-input-container">
                                    <textarea
                                        value={currentNote}
                                        onChange={(e) => setCurrentNote(e.target.value)}
                                        placeholder="Add notes for this region..."
                                        className="notes-textarea"
                                    />
                                    <div className="button-group">
                                        <button onClick={handleNoteSubmit}>Save Notes</button>
                                        <button onClick={() => setShowNotesInput(false)}>Cancel</button>
                                    </div>
                                </div>
                            )}
                            <button 
                                onClick={() => setIsDone(true)}
                                className="done-button"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="final-view">
                        <img
                            src={processedImage}
                            alt="Processed"
                            onClick={handleImageClick}
                            style={{ width: '100%', maxWidth: '800px', height: 'auto' }}
                        />
                    </div>
                )}

                {showPopup && (
                    <div
                        className="region-popup"
                        style={{
                            position: 'fixed',
                            left: showPopup.x + 10,
                            top: showPopup.y + 10
                        }}
                    >
                        <div className="popup-content">
                            <p className="region-title">Notes</p>
                            <p className="region-notes" style={{ color: 'black' }}>{showPopup.notes}</p>
                            <button onClick={() => setShowPopup(null)}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BasicVersion;
