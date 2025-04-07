import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Confetti from 'react-confetti';
import './QuizMode.css';

// Multi-backend support for both mouse and touch devices
const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

const DndBackend = isTouchDevice() ? TouchBackend : HTML5Backend;

const ItemTypes = {
  PUZZLE_PIECE: 'puzzlePiece',
};

// PuzzlePiece component: Represents a draggable piece in the pieces tray
const PieceTray = ({ id, index, imageUrl, onDragStart, position }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PUZZLE_PIECE,
    item: () => {
      onDragStart(index);
      return { id, index, position };
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`puzzle-piece ${isDragging ? 'dragging' : ''}`}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        width: position.width,
        height: position.height,
        opacity: isDragging ? 0.7 : 1,
        cursor: 'grab',
        boxShadow: isDragging ? '0 0 15px rgba(52, 152, 219, 0.8)' : '0 2px 10px rgba(0, 0, 0, 0.2)',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
      }}
    />
  );
};

// Placed piece component that renders the positioned piece in the puzzle area
const PlacedPiece = ({ imageUrl, position, style }) => {
  return (
    <div
      className="puzzle-piece placed"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        width: position.width,
        height: position.height,
        position: 'absolute',
        left: position.x,
        top: position.y,
        ...style
      }}
    />
  );
};

// DropZone component: Defines the position where a piece should snap
const DropZone = ({ index, position, onDrop, isFilled, currentDraggingIndex, hint }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.PUZZLE_PIECE,
    drop: (item) => onDrop(item.index, index),
    canDrop: (item) => item.index === index,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  // Highlight effect when hovering with correct piece
  const isCorrectHover = isOver && canDrop;
  const isActive = currentDraggingIndex === index && !isFilled;

  return (
    <div
      ref={drop}
      className={`drop-zone ${isCorrectHover ? 'correct-hover' : ''} ${isActive ? 'active' : ''} ${hint ? 'hint' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
        border: isFilled 
          ? 'none' 
          : isCorrectHover 
            ? '2px solid #27ae60' 
            : isActive 
              ? '2px dashed #3498db' 
              : hint 
                ? '2px dashed #f39c12' 
                : '1px dashed rgba(255,255,255,0.2)',
        backgroundColor: isFilled ? 'transparent' : isCorrectHover ? 'rgba(39, 174, 96, 0.2)' : 'rgba(0,0,0,0.1)',
        boxShadow: isCorrectHover ? '0 0 10px rgba(39, 174, 96, 0.5)' : 'none',
        transition: 'all 0.2s ease',
        zIndex: 1,
      }}
    />
  );
};

const QuizMode = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [placedPieces, setPlacedPieces] = useState({});
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [currentDraggingIndex, setCurrentDraggingIndex] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const puzzleAreaRef = useRef(null);

  // Calculate appropriate scale for the puzzle
  const calculateScale = useCallback(() => {
    if (!quizData || !puzzleAreaRef.current) return 1;
    
    const containerWidth = puzzleAreaRef.current.clientWidth;
    const containerHeight = puzzleAreaRef.current.clientHeight;
    const puzzleWidth = quizData.original_size.width;
    const puzzleHeight = quizData.original_size.height;
    
    const widthScale = containerWidth / puzzleWidth;
    const heightScale = containerHeight / puzzleHeight;
    
    // Use the smaller scale to ensure puzzle fits in container
    return Math.min(widthScale, heightScale, 1); // Never scale up beyond 1
  }, [quizData]);

  // Handle window resize for confetti and responsive layout
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      setScale(calculateScale());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateScale]);

  // Update scale when puzzle area is available
  useEffect(() => {
    if (puzzleAreaRef.current && quizData) {
      setScale(calculateScale());
    }
  }, [quizData, calculateScale]);

  // Load quiz data from the server
  const loadQuizData = useCallback(async () => {
    if (!quizId) {
      setError('Quiz ID is missing. Please select a valid quiz.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:8000/get_quiz/${quizId}`);
      const data = response.data;

      if (!data.segments || !Array.isArray(data.segments) || data.segments.length === 0) {
        throw new Error('Missing or invalid segments in quiz data');
      }
      if (!data.positions || !Array.isArray(data.positions)) {
        throw new Error('Missing positions data');
      }

      // Check if positions data is valid
      data.positions.forEach((pos, idx) => {
        if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number' || 
            typeof pos.width !== 'number' || typeof pos.height !== 'number') {
          throw new Error(`Invalid position data for piece ${idx}`);
        }
      });

      const originalSize = data.original_size || { width: 800, height: 600 };

      // Create pieces array for initial placement
      const initialPieces = data.segments.map((url, index) => ({
        id: `piece-${index}`,
        index,
        imageUrl: url,
        position: data.positions[index],
      }));

      // Shuffle the pieces to make the game more challenging
      const shuffledPieces = [...initialPieces].sort(() => Math.random() - 0.5);
      
      setQuizData({ ...data, originalSize });
      setPieces(shuffledPieces);
      setPlacedPieces({});
      setCurrentDraggingIndex(null);
      setShowHint(false);
    } catch (error) {
      setError(`Failed to load quiz: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  // Handle dropping a piece into its correct position
  const handleDrop = (draggedIndex, targetIndex) => {
    if (draggedIndex === targetIndex) {
      // Add to placed pieces
      setPlacedPieces(prev => ({
        ...prev,
        [draggedIndex]: true
      }));
      
      // Check if all pieces are placed
      const newPlacedPieces = {
        ...placedPieces, 
        [draggedIndex]: true
      };
      
      if (Object.keys(newPlacedPieces).length === pieces.length) {
        setCompleted(true);
      }
      
      // Play sound effect for successful placement
      const audio = new Audio('/sounds/success.mp3');
      audio.play().catch(e => console.log('Error playing sound:', e));
    } else {
      // Play error sound for incorrect placement attempt
      const audio = new Audio('/sounds/error.mp3');
      audio.play().catch(e => console.log('Error playing sound:', e));
    }
    
    setCurrentDraggingIndex(null);
  };

  const handleDragStart = (index) => {
    setCurrentDraggingIndex(index);
    setShowHint(false);
  };

  const showHints = () => {
    setShowHint(true);
    // Hide hint after 2 seconds
    setTimeout(() => setShowHint(false), 2000);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleBackToDashboard = () => navigate('/student-dashboard');
  
  const handlePlayAgain = () => {
    setCompleted(false);
    loadQuizData();
  };

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadQuizData}>Try Again</button>
          <button onClick={handleBackToDashboard}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (loading || !quizData) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading Puzzle...</p>
      </div>
    );
  }

  // Filter out placed pieces from the tray
  const unplacedPieces = pieces.filter(piece => !placedPieces[piece.index]);
  const placedCount = Object.keys(placedPieces).length;
  const totalPieces = pieces.length;

  return (
    <DndProvider backend={DndBackend}>
      <div className="quiz-mode-container">
        {completed && (
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={400} />
        )}
        <div className="puzzle-toolbar">
          <button className="back-button" onClick={handleBackToDashboard}>
            ← Back to Dashboard
          </button>
          <h2>{quizData.meta?.title || 'Puzzle Challenge'}</h2>
          <p>{quizData.meta?.description || 'Drag the pieces to complete the puzzle!'}</p>
        </div>
        
        <div className="puzzle-stats">
          <div className="progress-container">
            <div className="progress-label">
              Progress: {placedCount}/{totalPieces} pieces placed ({Math.floor((placedCount/totalPieces)*100)}%)
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${(placedCount/totalPieces)*100}%`}}
              ></div>
            </div>
          </div>
          
          <div className="puzzle-actions">
            <button className="hint-button" onClick={showHints} disabled={completed}>
              <span role="img" aria-label="Hint">💡</span> Hint
            </button>
            <button className="zoom-button" onClick={toggleZoom}>
              <span role="img" aria-label="Zoom">{isZoomed ? '🔍-' : '🔍+'}</span>
            </button>
          </div>
        </div>
        
        <div className="puzzle-container">
          <div className="pieces-area">
            <h3>Remaining Pieces: {unplacedPieces.length}</h3>
            {unplacedPieces.map((piece) => (
              <PieceTray
                key={piece.id} 
                {...piece} 
                onDragStart={handleDragStart} 
              />
            ))}
            {unplacedPieces.length === 0 && (
              <div className="all-pieces-used">
                All pieces placed!
              </div>
            )}
          </div>
          
          <div 
            ref={puzzleAreaRef}
            className={`puzzle-area ${isZoomed ? 'zoomed' : ''}`}
            style={{
              position: 'relative',
              width: quizData.originalSize.width * scale,
              height: quizData.originalSize.height * scale,
              transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
              transformOrigin: 'center center',
              transition: 'transform 0.3s ease'
            }}
          >
            <div className="puzzle-scale-container" style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: quizData.originalSize.width,
              height: quizData.originalSize.height,
              position: 'absolute'
            }}>
              <img
                src={quizData.puzzle_outline}
                alt="Puzzle Outline"
                className="puzzle-outline"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  position: 'absolute',
                  opacity: 0.7
                }}
              />
              
              {/* Drop zones for all pieces */}
              {pieces.map((piece) => (
                <DropZone
                  key={`dropzone-${piece.index}`}
                  index={piece.index}
                  position={piece.position}
                  onDrop={handleDrop}
                  isFilled={!!placedPieces[piece.index]}
                  currentDraggingIndex={currentDraggingIndex}
                  hint={showHint && !placedPieces[piece.index] && currentDraggingIndex === null}
                />
              ))}
              
              {/* Render placed pieces */}
              {pieces.map((piece) => {
                if (placedPieces[piece.index]) {
                  return (
                    <PlacedPiece
                      key={`placed-${piece.id}`}
                      imageUrl={piece.imageUrl}
                      position={piece.position}
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
        
        {completed && (
          <div className="completion-message">
            <h2>Congratulations! Puzzle Completed!</h2>
            <div className="completion-buttons">
              <button onClick={handlePlayAgain}>Play Again</button>
              <button onClick={handleBackToDashboard}>Back to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default QuizMode;