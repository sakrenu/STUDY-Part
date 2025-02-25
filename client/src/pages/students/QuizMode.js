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

const PuzzlePiece = ({ id, index, imageUrl, isPlaced }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.PUZZLE_PIECE,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: !isPlaced,
  }));

  return (
    !isPlaced && (
      <div
        ref={drag}
        className="puzzle-piece"
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          width: '100px',
          height: '100px',
          opacity: isDragging ? 0.5 : 1,
          cursor: 'grab',
        }}
      />
    )
  );
};

const DropZone = ({ id, index, imageUrl, onDrop, isFilled }) => {
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
        width: '100px',
        height: '100px',
        border: isOver ? '2px solid green' : '2px dashed #ccc',
        backgroundColor: isFilled ? 'transparent' : '#2C2C54',
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

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadQuizData = useCallback(async () => {
    if (!quizId) {
      setError('Quiz ID is missing. Please select a valid quiz.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/get_quiz/${quizId}`);
      const data = response.data;

      if (!data.segments || !Array.isArray(data.segments) || data.segments.length === 0) {
        throw new Error('Missing or invalid segments in quiz data');
      }

      const originalSize = data.original_size || { width: 800, height: 600 };
      const gridSize = Math.ceil(Math.sqrt(data.segments.length));
      const pieceWidth = originalSize.width / gridSize;
      const pieceHeight = originalSize.height / gridSize;

      const initialPieces = data.segments.map((url, index) => ({
        id: `piece-${index}`,
        index,
        imageUrl: url,
        targetIndex: index,
        isPlaced: false,
      }));

      setQuizData({
        ...data,
        originalSize,
        gridSize,
        pieceWidth,
        pieceHeight,
      });
      setPieces(initialPieces);
    } catch (error) {
      console.error('Error loading quiz:', error);
      setError(`Failed to load quiz: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    loadQuizData();
  }, [loadQuizData]);

  const handleDrop = (draggedIndex, targetIndex) => {
    setPieces((prev) => {
      const newPieces = prev.map((piece) => {
        if (piece.index === draggedIndex && piece.targetIndex === targetIndex) {
          return { ...piece, isPlaced: true };
        }
        return piece;
      });

      if (newPieces.every((p) => p.isPlaced)) {
        setCompleted(true);
      }
      return newPieces;
    });
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
            {pieces.map((piece) => (
              <PuzzlePiece key={piece.id} {...piece} />
            ))}
          </div>
          <div className="puzzle-area">
            {quizData.puzzle_outline && (
              <img
                src={quizData.puzzle_outline}
                alt="Puzzle Outline"
                className="puzzle-outline"
                style={{ width: quizData.originalSize.width, height: quizData.originalSize.height }}
              />
            )}
            <div
              className="drop-zones-grid"
              style={{
                width: quizData.originalSize.width,
                height: quizData.originalSize.height,
                gridTemplateColumns: `repeat(${quizData.gridSize}, ${quizData.pieceWidth}px)`,
                gridTemplateRows: `repeat(${quizData.gridSize}, ${quizData.pieceHeight}px)`,
              }}
            >
              {pieces.map((piece) => (
                <DropZone
                  key={piece.index}
                  id={piece.id}
                  index={piece.targetIndex}
                  imageUrl={piece.imageUrl}
                  onDrop={handleDrop}
                  isFilled={piece.isPlaced}
                />
              ))}
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