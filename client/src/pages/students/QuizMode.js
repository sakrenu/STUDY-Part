import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Confetti from 'react-confetti';
import './QuizMode.css';

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
    canDrag: !isPlaced, // Prevent dragging if already placed correctly
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
          
          // Calculate scale if original size is available
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
  const [quizData, setQuizData] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [puzzleSize, setPuzzleSize] = useState({ width: 0, height: 0 });
  const [error, setError] = useState('');
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

  // Calculate original positions for puzzle pieces
  const calculatePositions = useCallback((segments, originalImage) => {
    // This is a placeholder. In a real implementation, 
    // you would use the segments data to determine original positions.
    // For this example, we'll create a grid layout
    
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
      const quizRef = doc(db, 'quizzes', quizId);
      const quizSnap = await getDoc(quizRef);
      
      if (quizSnap.exists()) {
        const data = quizSnap.data();
        
        // If we don't have original image size, we need to estimate it
        const originalSize = data.originalSize || { width: 800, height: 600 };
        
        // If we don't have positions data, we need to calculate them
        const positions = data.positions || 
                         calculatePositions(data.segments, originalSize);
        
        // Enhance the quizData with the calculated positions and size
        const enhancedData = {
          ...data,
          positions,
          original_size: originalSize,
          puzzle_outline: data.puzzleOutline || data.puzzle_outline
        };
        
        setQuizData(enhancedData);
        
        // Initialize pieces with random positions on the right side
        const initialPieces = data.segments.map((url, index) => ({
          id: `piece-${index}`,
          index,
          imageUrl: url,
          originalPosition: positions[index],
          currentPosition: {
            x: windowSize.width - 200 + Math.random() * 50,
            y: 100 + index * 120 + Math.random() * 50
          },
          isPlaced: false
        }));
        
        setPieces(initialPieces);
      } else {
        setError('Quiz not found');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError('Failed to load quiz data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [quizId, calculatePositions, windowSize]);

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
          // Record completion in database if needed
          updateCompletionStatus();
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

  const updateCompletionStatus = async () => {
    try {
      const quizRef = doc(db, 'quizzes', quizId);
      await updateDoc(quizRef, {
        completed: true, // or any other field you want to update
        completedAt: new Date() // optional: timestamp of completion
      });
    } catch (error) {
      console.error('Error updating completion status:', error);
    }
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (loading || !quizData) {
    return <div className="loading">Loading Puzzle...</div>;
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
            <h2>{quizData.meta?.title || 'Puzzle Challenge'}</h2>
            <p>{quizData.meta?.description || 'Drag the pieces to complete the puzzle!'}</p>
          </div>
          
          <PuzzleArea 
            onDrop={handleDrop}
            originalSize={quizData.original_size}
            currentSize={puzzleSize}
          >
            <img 
              src={quizData.puzzle_outline} 
              alt="Puzzle Outline"
              className="puzzle-outline"
              style={{ width: puzzleSize.width, height: puzzleSize.height }}
              onLoad={(e) => handlePuzzleSize(e.target.naturalWidth, e.target.naturalHeight)}
            />
            
            {pieces.map((piece) => (
              <PuzzlePiece
                key={piece.id}
                {...piece}
                position={piece.currentPosition}
                isPlaced={piece.isPlaced}
              />
            ))}
          </PuzzleArea>
        </div>

        {completed && (
          <div className="completion-message">
            <h2>Congratulations! Puzzle Completed!</h2>
            <button onClick={() => setCompleted(false)}>Play Again</button>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default QuizMode;