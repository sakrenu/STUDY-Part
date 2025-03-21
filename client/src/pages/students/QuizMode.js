import React, { useState, useEffect, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Confetti from 'react-confetti';
import './QuizMode.css';

const ItemTypes = {
  PUZZLE_PIECE: 'puzzlePiece',
};

// PuzzlePiece component: Represents a draggable piece
const PuzzlePiece = ({ id, index, imageUrl, isPlaced, position }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PUZZLE_PIECE,
    item: { id, index, position },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !isPlaced,
  }));

  return (
    <div
      ref={drag}
      className="puzzle-piece"
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        width: position.width,
        height: position.height,
        opacity: isDragging ? 0.5 : 1,
        cursor: isPlaced ? 'default' : 'grab',
        position: isPlaced ? 'absolute' : 'relative',
        left: isPlaced ? position.x : 0,
        top: isPlaced ? position.y : 0,
      }}
    />
  );
};

// DropZone component: Defines the exact position where a piece should snap
const DropZone = ({ index, position, onDrop, isFilled, imageUrl }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.PUZZLE_PIECE,
    drop: (item) => onDrop(item.index, index),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className="drop-zone"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
        border: isOver ? '2px solid green' : 'none',
        backgroundColor: isFilled ? 'transparent' : 'rgba(0,0,0,0.1)',
        backgroundImage: isFilled ? `url(${imageUrl})` : 'none',
        backgroundSize: 'cover',
      }}
    />
  );
};

const QuizMode = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

      const originalSize = data.original_size || { width: 1024, height: 768 }; // Default from your data

      const initialPieces = data.segments.map((url, index) => ({
        id: `piece-${index}`,
        index,
        imageUrl: url,
        position: data.positions[index], // { x, y, height, width, original_height, original_width }
        isPlaced: false,
      }));

      setQuizData({ ...data, originalSize });
      setPieces(initialPieces);
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
      setPieces((prev) => {
        const newPieces = prev.map((piece) =>
          piece.index === draggedIndex ? { ...piece, isPlaced: true } : piece
        );
        if (newPieces.every((p) => p.isPlaced)) {
          setCompleted(true);
        }
        return newPieces;
      });
    }
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

  return (
    <DndProvider backend={HTML5Backend}>
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
        <div className="puzzle-container">
          <div className="pieces-area">
            {pieces
              .filter((piece) => !piece.isPlaced)
              .map((piece) => (
                <PuzzlePiece key={piece.id} {...piece} />
              ))}
          </div>
          <div
            className="puzzle-area"
            style={{
              position: 'relative',
              width: quizData.originalSize.width,
              height: quizData.originalSize.height,
            }}
          >
            <img
              src={quizData.puzzle_outline}
              alt="Puzzle Outline"
              style={{ width: '100%', height: '100%' }}
              onLoad={(e) => console.log('Natural size:', e.target.naturalWidth, e.target.naturalHeight)}
            />
            {pieces.map((piece) => (
              <DropZone
                key={piece.index}
                index={piece.index}
                position={piece.position}
                onDrop={handleDrop}
                isFilled={piece.isPlaced}
                imageUrl={piece.imageUrl}
              />
            ))}
            {pieces
              .filter((piece) => piece.isPlaced)
              .map((piece) => (
                <PuzzlePiece key={piece.id} {...piece} />
              ))}
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