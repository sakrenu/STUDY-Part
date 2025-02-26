import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizDashboard.css';

const QuizDashboard = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Refactored fetchQuizzes to be reusable for initial load and error recovery.
  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      // Optionally pass pagination params; here we get page 1 with 10 quizzes.
      const response = await axios.get('http://localhost:5000/get_all_quizzes', {
        params: { page: 1, limit: 10 }
      });
      setQuizzes(response.data.quizzes);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleQuizSelect = (quizId) => {
    navigate(`/student-dashboard/quiz-mode/${quizId}`);
  };

  if (loading) {
    return (
      <div className="quiz-dashboard loading">
        <div className="spinner"></div>
        <p>Loading quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-dashboard error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchQuizzes}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="quiz-dashboard">
      <header className="dashboard-header">
        <h1>Quiz Mode</h1>
        <p>Select a quiz to start solving puzzles</p>
      </header>

      {quizzes.length === 0 ? (
        <div className="no-quizzes">
          <p>No quizzes available yet. Check back later!</p>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map((quiz) => (
            <div 
              key={quiz.id} 
              className="quiz-tile" 
              onClick={() => handleQuizSelect(quiz.id)}
            >
              <h2>{quiz.meta.title || 'Untitled Quiz'}</h2>
              <p>{quiz.meta.description || 'No description provided'}</p>
              <div className="quiz-info">
                <span className="difficulty">
                  {quiz.meta.difficulty
                    ? `Difficulty: ${quiz.meta.difficulty.charAt(0).toUpperCase() + quiz.meta.difficulty.slice(1)}`
                    : ''}
                </span>
                {quiz.meta.subject && <span className="subject">Subject: {quiz.meta.subject}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizDashboard;