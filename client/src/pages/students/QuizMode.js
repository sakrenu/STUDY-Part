import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './QuizMode.css';

const ItemTypes = {
    IMAGE_PART: 'image_part',
};

const DraggableImagePart = ({ id, src, isDropped }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.IMAGE_PART,
        item: { id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        !isDropped && (
            <img
                ref={drag}
                src={src}
                alt={`Part ${id}`}
                className="image-part"
                style={{ opacity: isDragging ? 0.5 : 1, width: '100px', height: '100px' }}
            />
        )
    );
};

const DropZone = ({ id, onDrop, children }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.IMAGE_PART,
        drop: (item) => onDrop(item.id, id),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={drop}
            className="drop-zone"
            style={{
                border: isOver ? '2px solid green' : '2px solid black',
                width: '100px',
                height: '100px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {children}
        </div>
    );
};

const QuizMode = () => {
    const [image, setImage] = useState(null);
    const [cropper, setCropper] = useState(null);
    const [squares, setSquares] = useState([
        { id: 1, src: null, isDropped: false },
        { id: 2, src: null, isDropped: false },
        { id: 3, src: null, isDropped: false },
        { id: 4, src: null, isDropped: false },
    ]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        setImage(file);
    };

    const handleSegmentation = async () => {
        if (!cropper) {
            console.error('Cropper not initialized');
            return;
        }
    
        const canvas = cropper.getCroppedCanvas();
        const croppedImageUrl = canvas.toDataURL('image/jpeg');
    
        try {
            console.log('Splitting image...');
            const parts = await splitImage(croppedImageUrl); // Wait for the image to be split
            console.log('Image split into parts:', parts);
    
            setSquares((prev) =>
                prev.map((square, index) => ({ ...square, src: parts[index] }))
            );
        } catch (error) {
            console.error('Error during segmentation:', error);
        }
    };
    

    const splitImage = (imageUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = imageUrl;
    
            img.onload = () => {
                const parts = [];
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const width = img.width / 2;
                const height = img.height / 2;
    
                for (let y = 0; y < 2; y++) {
                    for (let x = 0; x < 2; x++) {
                        canvas.width = width;
                        canvas.height = height;
                        ctx.clearRect(0, 0, width, height); // Clear the canvas for the next part
                        ctx.drawImage(img, x * width, y * height, width, height, 0, 0, width, height);
                        parts.push(canvas.toDataURL()); // Store the part as a Base64 string
                    }
                }
    
                resolve(parts); // Resolve the promise with the parts array
            };
    
            img.onerror = () => {
                console.error('Failed to load the image for segmentation.');
                resolve([]); // Return an empty array if there's an error
            };
        });
    };
    
     

    const handleDrop = (squareId, targetId) => {
        setSquares((prevSquares) =>
            prevSquares.map((square) =>
                square.id === squareId && squareId === targetId
                    ? { ...square, isDropped: true }
                    : square
            )
        );
    };

    const completed = squares.every((square) => square.isDropped);

    return (
        <div className="quiz-mode-container">
            <h1>Quiz Mode</h1>

            <div>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {image && (
                    <Cropper
                        src={URL.createObjectURL(image)}
                        style={{ height: 400, width: '100%' }}
                        aspectRatio={1}
                        guides={true}
                        onInitialized={(instance) => {
                            setCropper(instance);
                        }}
                    />
                )}
            </div>

            <button className="dashboard-action-button" onClick={handleSegmentation}>
                Segment Image
            </button>

            <DndProvider backend={HTML5Backend}>
                <div className="small-squares">
                    {squares.map((square) => (
                        <DraggableImagePart
                            key={square.id}
                            id={square.id}
                            src={square.src}
                            isDropped={square.isDropped}
                        />
                    ))}
                </div>

                <div className="big-square">
                    {squares.map((square) => (
                        <DropZone key={square.id} id={square.id} onDrop={handleDrop}>
                            {square.isDropped && (
                                <img
                                    src={square.src}
                                    alt={`Part ${square.id}`}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            )}
                        </DropZone>
                    ))}
                </div>
            </DndProvider>

            {completed && <h2>Congratulations! Puzzle Completed!</h2>}
        </div>
    );
};

export default QuizMode;