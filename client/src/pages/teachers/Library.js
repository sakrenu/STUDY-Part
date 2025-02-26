import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase'; // Still need auth for teacherEmail
import axios from 'axios';
import './Library.css';

const Library = () => {
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLessonForNotes, setCurrentLessonForNotes] = useState(null);
  const [currentSegmentForNotes, setCurrentSegmentForNotes] = useState(null);
  const [editNote, setEditNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTeacherEmail(user.email);
      } else {
        setError('You must be logged in as a teacher to view the library.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!teacherEmail) return;

    const fetchLessons = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/get_lessons', {
          params: { teacher_id: teacherEmail },
        });
        setLessons(response.data.lessons);
      } catch (err) {
        setError('Failed to fetch lessons: ' + (err.response?.data?.error || err.message));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, [teacherEmail]);

  const handleSegmentClick = (lessonId, segmentId) => {
    setCurrentLessonForNotes(lessonId);
    setCurrentSegmentForNotes(segmentId);
    const lesson = lessons.find((l) => l.id === lessonId);
    const segment = lesson.segments.find((s) => s.id === segmentId);
    setEditNote(segment.notes || '');
    setIsEditing(false);
  };

  const handleEditNote = () => {
    setIsEditing(true);
  };

  const handleSaveNote = async () => {
    if (!teacherEmail || !currentLessonForNotes || !currentSegmentForNotes) {
      setError('Missing required data to save note.');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/add_note', {
        image_url: lessons.find((l) => l.id === currentLessonForNotes).originalImageUrl,
        segment_index: parseInt(currentSegmentForNotes.split('_')[1]),
        note: editNote,
        teacher_id: teacherEmail,
        lesson_id: currentLessonForNotes,
      });

      setLessons((prevLessons) =>
        prevLessons.map((lesson) =>
          lesson.id === currentLessonForNotes
            ? {
                ...lesson,
                segments: lesson.segments.map((segment) =>
                  segment.id === currentSegmentForNotes ? { ...segment, notes: editNote } : segment
                ),
              }
            : lesson
        )
      );
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save note: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePopup = () => {
    setCurrentLessonForNotes(null);
    setCurrentSegmentForNotes(null);
    setIsEditing(false);
  };

  return (
    <div className="library-container">
      <h1>Lesson Library</h1>
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading-message">Loading...</div>}

      {lessons.length === 0 ? (
        <p>No lessons available.</p>
      ) : (
        lessons.map((lesson) => (
          <div key={lesson.id} className="lesson-item">
            <h2>{lesson.title}</h2>
            <p>Created on {new Date(lesson.createdAt).toLocaleDateString()}</p>
            <div className="image-container" style={{ position: 'relative', width: '800px', height: '600px' }}>
              <img
                src={lesson.originalImageUrl}
                alt={lesson.title}
                className="original-image"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              {lesson.segments.map((segment) => (
                <div
                  key={segment.id}
                  className="segment-overlay"
                  onClick={() => handleSegmentClick(lesson.id, segment.id)}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                >
                  <img
                    src={segment.highlightedOutlineUrl}
                    alt={`Segment ${segment.id}`}
                    className="highlighted-outline"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {currentLessonForNotes && currentSegmentForNotes && (
        <div className="notes-popup">
          <h3>
            Notes for {lessons.find((l) => l.id === currentLessonForNotes)?.title} - {currentSegmentForNotes}
          </h3>
          {isEditing ? (
            <>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="notes-textarea"
                placeholder="Edit your notes here..."
                disabled={isLoading}
              />
              <div className="popup-buttons">
                <button onClick={handleSaveNote} className="save-button" disabled={isLoading}>
                  Save
                </button>
                <button onClick={handleClosePopup} className="close-button" disabled={isLoading}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="notes-content">{editNote || 'No notes added'}</div>
              <div className="popup-buttons">
                <button onClick={handleEditNote} className="edit-button">
                  Edit Notes
                </button>
                <button onClick={handleClosePopup} className="close-button">
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Library;