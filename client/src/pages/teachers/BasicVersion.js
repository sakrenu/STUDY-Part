import React, { useState, useRef } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './BasicVersion.css';

const BasicVersion = () => {
    const [image, setImage] = useState(null);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [isSelectingRegions, setIsSelectingRegions] = useState(true);
    const [currentNote, setCurrentNote] = useState('');
    const [activeRegion, setActiveRegion] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showNotePopup, setShowNotePopup] = useState(false);
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
        
        // Create a new canvas for the contour
        const contourCanvas = document.createElement('canvas');
        contourCanvas.width = canvas.width;
        contourCanvas.height = canvas.height;
        const contourCtx = contourCanvas.getContext('2d');
        contourCtx.putImageData(processedData, 0, 0);

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
            contourImage: contourCanvas.toDataURL(),
            notes: ''
        };

        setSelectedRegions([...selectedRegions, newRegion]);
    };

    const handleRegionClick = (region) => {
        if (isSelectingRegions) return;
        
        if (isSubmitted) {
            // In view mode, show the saved notes
            setActiveRegion(region);
            setShowNotePopup(true);
        } else {
            // In edit mode, open the notes input
            setActiveRegion(region);
            setCurrentNote(region.notes || '');
        }
    };

    const handleNoteSubmit = () => {
        if (!currentNote.trim() || !activeRegion) return;

        const updatedRegions = selectedRegions.map(region => 
            region.id === activeRegion.id 
                ? { ...region, notes: currentNote }
                : region
        );

        setSelectedRegions(updatedRegions);
        setCurrentNote('');
        setActiveRegion(null);
    };

    const handleFinalSubmit = () => {
        setIsSubmitted(true);
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
                                />
                                <div className="controls-container">
                                    <button 
                                        onClick={handleRegionSelect}
                                        className="select-button"
                                    >
                                        Select Region
                                    </button>
                                    <button 
                                        onClick={() => setIsSelectingRegions(false)}
                                        className="done-button"
                                    >
                                        Done Selecting Regions
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="annotation-section">
                                <div className="image-container" style={{ position: 'relative' }}>
                                    <img
                                        src={image}
                                        alt="Original"
                                        style={{ width: '100%', maxWidth: '800px', height: 'auto' }}
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
                                                src={region.contourImage}
                                                alt={`Contour ${region.id}`}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    pointerEvents: 'none'
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
                                        />
                                        <div className="button-group">
                                            <button onClick={handleNoteSubmit}>Save Notes</button>
                                            <button onClick={() => setActiveRegion(null)}>Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {!isSubmitted && (
                                    <div className="controls-container">
                                        <button 
                                            onClick={handleFinalSubmit}
                                            className="submit-button"
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
                                            <button onClick={() => setShowNotePopup(false)}>Close</button>
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

export default BasicVersion;
