import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import Confetti from 'react-confetti';
import './QuizMode.css';

// For debugging
const DEBUG = true;

const ItemTypes = {
  PUZZLE_PIECE: 'puzzlePiece'
};

const PuzzlePiece = ({ id, index, imageUrl, position, onPositionChange, isPlaced }) => {
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
        const puzzleContainer = document.querySelector('.puzzle-container');
        if (puzzleContainer) {
          const rect = puzzleContainer.getBoundingClientRect();
          
          const scaleX = originalSize?.width ? currentSize.width / originalSize.width : 1;
          const scaleY = originalSize?.height ? currentSize.height / originalSize.height : 1;
          
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
    height: window.innerHeight
  });

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fallback function to check if Firestore is properly initialized
  const checkFirestore = useCallback(async () => {
    try {
      // Try to access a collection to verify Firestore connection
      const quizzesRef = collection(db, 'quizzes');
      const snapshot = await getDocs(quizzesRef);
      
      if (snapshot.empty) {
        return { success: true, message: "Firestore connected, but 'quizzes' collection is empty" };
      }
      
      return { success: true, message: `Firestore connected, found ${snapshot.size} quizzes` };
    } catch (error) {
      return { 
        success: false, 
        message: `Firestore connection failed: ${error.message}`,
        error 
      };
    }
  }, []);

  // Calculate original positions for puzzle pieces
  const calculatePositions = useCallback((segments, originalImage) => {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(segments.length));
    const rows = Math.ceil(segments.length / cols);
    
    const pieceWidth = originalImage.width / cols;
    const pieceHeight = originalImage.height / rows;
    
    for (let i = 0; i < segments.length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      positions.push({
        x: col * pieceWidth,
        y: row * pieceHeight,
        width: pieceWidth,
        height: pieceHeight
      });
    }
    
    return positions;
  }, []);

  const loadQuizData = useCallback(async () => {
    try {
      setLoading(true);
      setDebugInfo('Starting to load quiz data...');
      
      // First check if Firestore is properly initialized
      const firestoreCheck = await checkFirestore();
      setDebugInfo(prev => `${prev}\n${firestoreCheck.message}`);
      
      if (!firestoreCheck.success) {
        throw new Error(firestoreCheck.message);
      }

      // Debug: Log the quiz ID we're trying to fetch
      setDebugInfo(prev => `${prev}\nAttempting to fetch quiz with ID: ${quizId}`);
      
      // Try to get the document
      const quizRef = doc(db, 'quizzes', quizId);
      const quizSnap = await getDoc(quizRef);
      
      if (!quizSnap.exists()) {
        setDebugInfo(prev => `${prev}\nQuiz with ID ${quizId} not found in Firestore`);
        throw new Error(`Quiz with ID ${quizId} not found`);
      }
      
      setDebugInfo(prev => `${prev}\nQuiz document found, extracting data...`);
      
      // Got the data, now process it
      const data = quizSnap.data();
      setDebugInfo(prev => `${prev}\nData fields: ${Object.keys(data).join(', ')}`);
      
      // Check for required fields
      if (!data.segments || !Array.isArray(data.segments) || data.segments.length === 0) {
        setDebugInfo(prev => `${prev}\nMissing or empty segments array in quiz data`);
        throw new Error('Quiz data is missing required segments');
      }
      
      // Get or calculate original image size
      let originalSize;
      if (data.originalSize) {
        originalSize = data.originalSize;
      } else if (data.original_size) {
        originalSize = data.original_size;
      } else {
        // Default size if none provided
        originalSize = { width: 800, height: 600 };
        setDebugInfo(prev => `${prev}\nUsing default original size: 800x600`);
      }
      
      // Get puzzle outline URL
      const outlineUrl = data.puzzleOutline || data.puzzle_outline;
      if (!outlineUrl) {
        setDebugInfo(prev => `${prev}\nWarning: No puzzle outline URL found`);
      }
      
      // Get or calculate positions
      let positions;
      if (data.positions && Array.isArray(data.positions)) {
        positions = data.positions;
        setDebugInfo(prev => `${prev}\nUsing provided positions data for ${positions.length} pieces`);
      } else {
        positions = calculatePositions(data.segments, originalSize);
        setDebugInfo(prev => `${prev}\nCalculated positions for ${positions.length} pieces`);
      }
      
      // Enhance the quizData with the calculated positions and size
      const enhancedData = {
        ...data,
        positions,
        original_size: originalSize,
        puzzle_outline: outlineUrl
      };
      
      setQuizData(enhancedData);
      setDebugInfo(prev => `${prev}\nQuiz data processed successfully`);
      
      // Initialize pieces with random positions on the right side
      const initialPieces = data.segments.map((url, index) => {
        // Verify URL is valid
        if (!url || typeof url !== 'string') {
          setDebugInfo(prev => `${prev}\nWarning: Invalid URL for piece ${index}`);
        }
        
        return {
          id: `piece-${index}`,
          index,
          imageUrl: url,
          originalPosition: positions[index],
          currentPosition: {
            x: windowSize.width - 200 + Math.random() * 50,
            y: 100 + index * 120 + Math.random() * 50
          },
          isPlaced: false
        };
      });
      
      setPieces(initialPieces);
      setDebugInfo(prev => `${prev}\nInitialized ${initialPieces.length} puzzle pieces`);
      
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError(`Failed to load quiz data: ${error.message}`);
      setDebugInfo(prev => `${prev}\nERROR: ${error.message}\n${error.stack || ''}`);
    } finally {
      setLoading(false);
    }
  }, [quizId, calculatePositions, windowSize, checkFirestore]);

  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  // Validate if a piece is placed correctly
  const validatePlacement = (index, position) => {
    if (!quizData || !quizData.positions || !quizData.positions[index]) {
      return false;
    }
    
    const targetPosition = quizData.positions[index];
    const tolerance = 30; // Pixels of tolerance for placement
    
    const distanceX = Math.abs(position.x - targetPosition.x);
    const distanceY = Math.abs(position.y - targetPosition.y);
    
    return distanceX < tolerance && distanceY < tolerance;
  };

  const handleDrop = (index, position) => {
    // Check if the position is close to the correct position
    const isCorrect = validatePlacement(index, position);
    
    if (isCorrect) {
      // If correct, snap to the exact position and mark as placed
      setPieces(prev => {
        const newPieces = prev.map(piece => {
          if (piece.index === index) {
            return {
              ...piece,
              currentPosition: {
                x: quizData.positions[index].x,
                y: quizData.positions[index].y
              },
              isPlaced: true
            };
          }
          return piece;
        });
        
        // Check if all pieces are placed correctly
        const allPlaced = newPieces.every(p => p.isPlaced);
        if (allPlaced) {
          setCompleted(true);
        }
        
        return newPieces;
      });
    } else {
      // Apply shake animation for incorrect placement
      const piece = document.querySelector(`#piece-${index}`);
      if (piece) {
        piece.classList.add('shake');
        setTimeout(() => {
          if (piece) piece.classList.remove('shake');
        }, 500);
      }
      
      // Update position anyway (but not marking as placed)
      setPieces(prev => prev.map(piece => {
        if (piece.index === index) {
          return {
            ...piece,
            currentPosition: position
          };
        }
        return piece;
      }));
    }
  };

  const handlePuzzleSize = (width, height) => {
    if (!width || !height) return;
    
    const maxWidth = Math.min(800, windowSize.width - 300);
    const aspectRatio = width / height;
    const calculatedHeight = maxWidth / aspectRatio;
    
    setPuzzleSize({
      width: maxWidth,
      height: calculatedHeight
    });
  };

  const resetError = () => {
    setError('');
    loadQuizData();
  };

  // Return to student dashboard
  const handleBackToDashboard = () => {
    navigate('/student-dashboard');
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
        {completed && <Confetti 
          width={windowSize.width} 
          height={windowSize.height} 
          recycle={false} 
          numberOfPieces={400} 
        />}
        
        <div className="puzzle-container">
          <div className="puzzle-toolbar">
            <button className="back-button" onClick={handleBackToDashboard}>
              Back to Dashboard
            </button>
            <h2>{quizData.meta?.title || 'Puzzle Challenge'}</h2>
            <p>{quizData.meta?.description || 'Drag the pieces to complete the puzzle!'}</p>
          </div>
          
          <PuzzleArea 
            onDrop={handleDrop}
            originalSize={quizData.original_size}
            currentSize={puzzleSize}
          >
            {quizData.puzzle_outline ? (
              <img 
                src={quizData.puzzle_outline} 
                alt="Puzzle Outline"
                className="puzzle-outline"
                style={{ width: puzzleSize.width, height: puzzleSize.height }}
                onLoad={(e) => handlePuzzleSize(e.target.naturalWidth, e.target.naturalHeight)}
              />
            ) : (
              <div 
                className="puzzle-outline-placeholder"
                style={{ width: puzzleSize.width, height: puzzleSize.height }}
              >
                <p>No puzzle outline available</p>
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
              <button onClick={() => setCompleted(false)}>Play Again</button>
              <button onClick={handleBackToDashboard}>Back to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default QuizMode;