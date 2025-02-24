import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
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
  }));

  return (
    <div
      ref={drag}
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
        const rect = document.querySelector('.puzzle-container').getBoundingClientRect();
        const scaleX = currentSize.width / originalSize.width;
        const scaleY = currentSize.height / originalSize.height;
        
        const x = (offset.x - rect.left) / scaleX;
        const y = (offset.y - rect.top) / scaleY;
        
        onDrop(item.index, { x, y });
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
  const [error, setError] = useState(null);

  const loadQuizData = useCallback(async () => {
    try {
      const quizRef = doc(db, 'quizzes', quizId);
      const quizSnap = await getDoc(quizRef);
      
      if (quizSnap.exists()) {
        const data = quizSnap.data();
        setQuizData(data);
        
        // Initialize pieces with random positions on the right side
        const initialPieces = data.segments.map((url, index) => ({
          id: `piece-${index}`,
          index,
          imageUrl: url,
          originalPosition: data.positions[index],
          currentPosition: {
            x: window.innerWidth - 200 + Math.random() * 50,
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
    }
  }, [quizId]);

  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  const handleDrop = async (index, position) => {
    try {
      const response = await axios.post('http://localhost:5000/validate_placement', {
        quiz_id: quizId,
        segment_index: index,
        position: position
      });

      if (response.data.correct) {
        setPieces(prev => prev.map(piece => {
          if (piece.index === index) {
            return {
              ...piece,
              currentPosition: {
                x: piece.originalPosition.x * (puzzleSize.width / quizData.original_size.width),
                y: piece.originalPosition.y * (puzzleSize.height / quizData.original_size.height)
              },
              isPlaced: true
            };
          }
          return piece;
        }));

        // Check if all pieces are placed
        const allPlaced = pieces.every(p => p.isPlaced);
        if (allPlaced) {
          setCompleted(true);
          setTimeout(() => setCompleted(false), 5000); // Hide confetti after 5s
        }
      } else {
        // Return to original position with shake animation
        const piece = document.querySelector(`#piece-${index}`);
        piece.classList.add('shake');
        setTimeout(() => piece.classList.remove('shake'), 500);
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };

  const handlePuzzleSize = (width, height) => {
    const aspectRatio = quizData.original_size.width / quizData.original_size.height;
    const maxWidth = Math.min(800, window.innerWidth - 300);
    const calculatedHeight = maxWidth / aspectRatio;
    
    setPuzzleSize({
      width: maxWidth,
      height: calculatedHeight
    });
  };

  const handlePositionChange = (index, position) => {
    setPieces(prev => prev.map(piece => {
      if (piece.index === index) {
        return {
          ...piece,
          currentPosition: position
        };
      }
      return piece;
    }));
  };

  if (!quizData) return <div className="loading">Loading Puzzle...</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="quiz-mode-container">
        {completed && <Confetti recycle={false} numberOfPieces={400} />}
        
        <div className="puzzle-container">
          <div className="puzzle-toolbar">
            <h2>Drag the pieces to complete the puzzle!</h2>
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
              style={{ width: puzzleSize.width }}
              onLoad={(e) => handlePuzzleSize(e.target.naturalWidth, e.target.naturalHeight)}
            />
            
            {pieces.map((piece) => (
              <PuzzlePiece
                key={piece.id}
                {...piece}
                position={piece.currentPosition}
                onPositionChange={(pos) => handlePositionChange(piece.index, pos)}
                isPlaced={piece.isPlaced}
              />
            ))}
          </PuzzleArea>
        </div>

        {completed && (
          <div className="completion-message">
            <h2>Congratulations! Puzzle Completed!</h2>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default QuizMode;