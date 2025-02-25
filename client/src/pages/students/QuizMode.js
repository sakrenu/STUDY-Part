import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Confetti from 'react-confetti';
import './QuizMode.css';

// For debugging (toggleable)
const DEBUG = false;

const ItemTypes = {
  PUZZLE_PIECE: 'puzzlePiece',
};

const PuzzlePiece = ({ id, index, imageUrl, position, isPlaced }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PUZZLE_PIECE,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isPlaced,
  }));

  return (
    <div
      ref={drag}
      id={`piece-${index}`}
      className={`puzzle-piece ${isDragging ? 'dragging' : ''} ${isPlaced ? 'placed' : ''}`}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        left: position.x,
        top: position.y,
        opacity: isDragging ? 0.5 : 1,
      }}
    />
  );
};

const PuzzleArea = ({ children, onDrop, originalSize, currentSize }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.PUZZLE_PIECE,
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        const puzzleArea = document.querySelector('.puzzle-area');
        if (puzzleArea) {
          const rect = puzzleArea.getBoundingClientRect();
          const scaleX = originalSize.width ? currentSize.width / originalSize.width : 1;
          const scaleY = originalSize.height ? currentSize.height / originalSize.height : 1;

          const x = (offset.x - rect.left) / scaleX;
          const y = (offset.y - rect.top) / scaleY;

          onDrop(item.index, { x, y });
        }
      }
    },
  }));

  return (
    <div ref={drop} className="puzzle-area">
      {children}
    </div>
  );
};

const QuizMode = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [puzzleSize, setPuzzleSize] = useState({ width: 0, height: 0 });
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate positions if not provided
  const calculatePositions = useCallback((segments, originalSize) => {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(segments.length));
    const rows = Math.ceil(segments.length / cols);
    const pieceWidth = originalSize.width / cols;
    const pieceHeight = originalSize.height / rows;

    for (let i = 0; i < segments.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      positions.push({
        x: col * pieceWidth,
        y: row * pieceHeight,
        width: pieceWidth,
        height: pieceHeight,
      });
    }
    return positions;
  }, []);

  const loadQuizData = useCallback(async () => {
    if (!quizId) {
      setError('Quiz ID is missing. Please select a valid quiz.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setDebugInfo('Starting to load quiz data...');

      // Using axios to fetch quiz data
      const response = await axios.get(`http://localhost:5000/get_quiz/${quizId}`);
      const data = response.data;
      
      setDebugInfo((prev) => `${prev}\nData fields: ${Object.keys(data).join(', ')}`);

      // Validate required fields
      if (!data.segments || !Array.isArray(data.segments) || data.segments.length === 0) {
        throw new Error('Missing or invalid segments in quiz data');
      }

      // Standardize field names
      const originalSize = data.original_size || { width: 800, height: 600 };
      const outlineUrl = data.puzzle_outline || '';
      const positions = data.positions && Array.isArray(data.positions) 
        ? data.positions 
        : calculatePositions(data.segments, originalSize);

      setQuizData({
        ...data,
        original_size: originalSize,
        puzzle_outline: outlineUrl,
        positions,
      });

      // Initialize pieces with non-overlapping positions on the right
      const pieceAreaWidth = 200; // Width of the piece area on the right
      const pieceHeight = originalSize.height / Math.ceil(Math.sqrt(data.segments.length));
      const initialPieces = data.segments.map((url, index) => ({
        id: `piece-${index}`,
        index,
        imageUrl: url,
        originalPosition: positions[index],
        currentPosition: {
          x: windowSize.width - pieceAreaWidth + Math.random() * (pieceAreaWidth - positions[index].width || 50),
          y: 100 + (index * (pieceHeight + 10)) % (windowSize.height - 200),
        },
        isPlaced: false,
      }));

      setPieces(initialPieces);
      setDebugInfo((prev) => `${prev}\nInitialized ${initialPieces.length} pieces`);

    } catch (error) {
      console.error('Error loading quiz:', error);
      setError(`Failed to load quiz: ${error.response?.data?.error || error.message}`);
      setDebugInfo((prev) => `${prev}\nERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [quizId, calculatePositions, windowSize]);

  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  const validatePlacement = (index, position) => {
    if (!quizData || !quizData.positions[index]) return false;
    const target = quizData.positions[index];
    const tolerance = 30;
    return Math.abs(position.x - target.x) < tolerance && Math.abs(position.y - target.y) < tolerance;
  };

  const handleDrop = (index, position) => {
    const isCorrect = validatePlacement(index, position);
    setPieces((prev) => {
      const newPieces = prev.map((piece) => {
        if (piece.index === index) {
          if (isCorrect) {
            return {
              ...piece,
              currentPosition: quizData.positions[index],
              isPlaced: true,
            };
          }
          const pieceEl = document.querySelector(`#piece-${index}`);
          if (pieceEl) {
            pieceEl.classList.add('shake');
            setTimeout(() => pieceEl.classList.remove('shake'), 500);
          }
          return { ...piece, currentPosition: position };
        }
        return piece;
      });

      if (newPieces.every((p) => p.isPlaced)) {
        setCompleted(true);
      }
      return newPieces;
    });
  };

  const handlePuzzleSize = (width, height) => {
    if (!width || !height) return;
    const maxWidth = Math.min(800, windowSize.width - 300);
    const aspectRatio = width / height;
    const calculatedHeight = maxWidth / aspectRatio;
    setPuzzleSize({ width: maxWidth, height: calculatedHeight });
  };

  const resetError = () => {
    setError('');
    loadQuizData();
  };

  const handleBackToDashboard = () => {
    navigate('/student-dashboard');
  };

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
          <button onClick={resetError}>Try Again</button>
          <button onClick={handleBackToDashboard}>Back to Dashboard</button>
          {DEBUG && debugInfo && (
            <div className="debug-info">
              <h3>Debug Information</h3>
              <pre>{debugInfo}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading || !quizData) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading Puzzle...</p>
        {DEBUG && debugInfo && (
          <div className="debug-info">
            <h3>Debug Information</h3>
            <pre>{debugInfo}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="quiz-mode-container" ref={containerRef}>
        {completed && (
          <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={400} />
        )}
        <div className="puzzle-container">
          <div className="puzzle-toolbar">
            <button className="back-button" onClick={handleBackToDashboard}>Back to Dashboard</button>
            <h2>{quizData.meta?.title || 'Puzzle Challenge'}</h2>
            <p>{quizData.meta?.description || 'Drag the pieces to complete the puzzle!'}</p>
          </div>
          <PuzzleArea onDrop={handleDrop} originalSize={quizData.original_size} currentSize={puzzleSize}>
            {quizData.puzzle_outline ? (
              <img
                src={quizData.puzzle_outline}
                alt="Puzzle Outline"
                className="puzzle-outline"
                style={{ width: puzzleSize.width, height: puzzleSize.height }}
                onLoad={(e) => handlePuzzleSize(e.target.naturalWidth, e.target.naturalHeight)}
              />
            ) : (
              <div className="puzzle-outline-placeholder" style={{ width: puzzleSize.width, height: puzzleSize.height }}>
                <p>No outline available</p>
              </div>
            )}
            {pieces.map((piece) => (
              <PuzzlePiece
                key={piece.id}
                {...piece}
                position={piece.currentPosition}
                isPlaced={piece.isPlaced}
              />
            ))}
          </PuzzleArea>
          {DEBUG && (
            <div className="debug-panel">
              <h3>Debug Information</h3>
              <pre>{debugInfo}</pre>
            </div>
          )}
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