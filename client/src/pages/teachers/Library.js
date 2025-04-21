import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase'; // Still need auth for teacherEmail
import { collection, getDocs, query, where, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { MdNoteAdd, MdLabel, MdMic, MdPlayArrow, MdPause, MdDelete, MdInfo } from 'react-icons/md';
import './Library.css';

const Library = () => {
  const [teacherEmail, setTeacherEmail] = useState(null);
  const [teacherUid, setTeacherUid] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setTeacherEmail(user.email);
        setTeacherUid(user.uid);
      } else {
        setError('You must be logged in as a teacher to view the library.');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!teacherEmail) return;
    fetchLessons();
  }, [teacherEmail]);

  useEffect(() => {
    if (!teacherUid) return;
    setIsLoadingCourses(true);
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'classes'), where('professor', '==', teacherUid));
        const querySnapshot = await getDocs(q);
        const courses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeacherCourses(courses);
        if (courses.length > 0) setSelectedCourse(courses[0].id);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to fetch courses: ' + err.message);
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [teacherUid]);

  const fetchLessons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Query Firestore directly
      const lessonQuery = query(
        collection(db, 'Teachers', teacherEmail, 'Lessons')
      );
      const lessonDocs = await getDocs(lessonQuery);
      
      const lessonsData = [];
      
      // Process each lesson document
      for (const lessonDoc of lessonDocs.docs) {
        const lessonData = lessonDoc.data();
        
        // Get segments for this lesson
        const segmentsQuery = query(
          collection(db, 'Teachers', teacherEmail, 'Lessons', lessonDoc.id, 'Segments')
        );
        const segmentDocs = await getDocs(segmentsQuery);
        
        // Get student view data if available
        const studentViewRef = doc(db, 'Teachers', teacherEmail, 'Lessons', lessonDoc.id, 'StudentView', 'config');
        const studentViewDoc = await getDoc(studentViewRef);
        const studentViewData = studentViewDoc.exists() ? studentViewDoc.data() : null;
        
        const segments = segmentDocs.docs.map(segDoc => ({
          id: segDoc.id,
          ...segDoc.data()
        }));
        
        lessonsData.push({
          id: lessonDoc.id,
          title: lessonData.title || `Lesson ${new Date(lessonData.createdAt).toLocaleDateString()}`,
          createdAt: lessonData.createdAt,
          originalImageUrl: lessonData.originalImageUrl,
          thumbnailUrl: lessonData.thumbnailUrl || lessonData.originalImageUrl,
          previewUrl: studentViewData?.previewImageUrl || lessonData.previewUrl || lessonData.originalImageUrl,
          segments: segments,
          hasNotes: segments.some(seg => seg.notes),
          hasLabels: segments.some(seg => seg.label),
          hasAudio: segments.some(seg => seg.audioUrl),
          studentView: studentViewData,
          courseId: lessonData.course_id,
        });
      }
      
      // Sort by creation date (newest first)
      lessonsData.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setLessons(lessonsData);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setError('Failed to fetch lessons: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSegmentClick = (lesson, segment) => {
    setSelectedLesson(lesson);
    setSelectedSegment(segment);
    
    // Stop any playing audio
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaying(null);
    }
  };

  const handleClosePopup = () => {
    setSelectedLesson(null);
    setSelectedSegment(null);
    
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaying(null);
    }
  };
  
  const handlePlayPauseAudio = (audioUrl) => {
    if (playing === audioUrl) {
      // Currently playing this audio, so pause it
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlaying(null);
    } else {
      // Not playing this audio, so start it
      if (audioRef.current) {
        audioRef.current.pause(); // Pause any currently playing audio
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setPlaying(null);
      audioRef.current.play();
      setPlaying(audioUrl);
    }
  };
  
  const handleDeleteLesson = async (lessonId) => {
    if (!lessonId) return;
    
    setIsLoading(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId));
      
      // Update local state
      setLessons(prevLessons => prevLessons.filter(lesson => lesson.id !== lessonId));
      setShowConfirmDelete(false);
      
      if (selectedLesson?.id === lessonId) {
        setSelectedLesson(null);
        setSelectedSegment(null);
      }
    } catch (err) {
      console.error('Error deleting lesson:', err);
      setError('Failed to delete lesson: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute filtered lessons
  const displayedLessons = selectedCourse ? lessons.filter(lesson => lesson.courseId === selectedCourse) : lessons;

  return (
    <div className="library-container">
      <div className="library-header">
        <h1>Lesson Library</h1>
        <p>Access and manage your interactive lessons</p>
      </div>
      
      {!isLoadingCourses && teacherCourses.length > 0 && (
        <div className="course-filter">
          <label htmlFor="courseSelect">Filter by Course:</label>
          <select
            id="courseSelect"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={isLoading}
          >
            {teacherCourses.map(course => (
              <option key={course.id} value={course.id}>
                {course.courseName} ({course.className})
              </option>
            ))}
          </select>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {isLoading && !displayedLessons.length ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your lessons...</p>
        </div>
      ) : displayedLessons.length === 0 ? (
        <div className="empty-library">
          <MdInfo size={48} />
          <p>No lessons available for this course. Create a new lesson to get started.</p>
        </div>
      ) : (
        <div className="lessons-grid">
          {displayedLessons.map((lesson) => (
            <div key={lesson.id} className="lesson-card">
              <div className="lesson-thumbnail">
                <img src={lesson.thumbnailUrl || lesson.originalImageUrl} alt={lesson.title} />
                
                {/* Feature badges */}
                <div className="lesson-badges">
                  {lesson.hasNotes && (
                    <span className="lesson-badge notes">
                      <MdNoteAdd size={16} /> Notes
                    </span>
                  )}
                  {lesson.hasLabels && (
                    <span className="lesson-badge labels">
                      <MdLabel size={16} /> Labels
                    </span>
                  )}
                  {lesson.hasAudio && (
                    <span className="lesson-badge audio">
                      <MdMic size={16} /> Audio
                    </span>
                  )}
                </div>
              </div>
              
              <div className="lesson-info">
                <h3>{lesson.title}</h3>
                <p>Created: {new Date(lesson.createdAt).toLocaleDateString()}</p>
                <p>Segments: {lesson.segments.length}</p>
              </div>
              
              <div className="lesson-actions">
                <button 
                  className="view-button"
                  onClick={() => handleSegmentClick(lesson, null)}
                >
                  View Lesson
                </button>
                <button 
                  className="delete-button"
                  onClick={() => {
                    setSelectedLesson(lesson);
                    setShowConfirmDelete(true);
                  }}
                >
                  <MdDelete size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedLesson && !showConfirmDelete && (
          <motion.div
            className="lesson-detail-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="lesson-detail-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="lesson-detail-header">
                <h2>{selectedLesson.title}</h2>
                <p>Created on {new Date(selectedLesson.createdAt).toLocaleDateString()}</p>
                <button className="close-button" onClick={handleClosePopup}>×</button>
              </div>
              
              <div className="lesson-detail-content">
                <div className="lesson-detail-image">
                  <img 
                    src={selectedLesson.previewUrl || selectedLesson.originalImageUrl} 
                    alt={selectedLesson.title} 
                    className="base-image"
                  />
                  
                  {/* Overlay masks when no specific segment is selected */}
                  {!selectedSegment && selectedLesson.segments.map((segment) => (
                    <img
                      key={segment.id}
                      src={segment.mask_url}
                      alt={`Segment ${segment.segmentIndex + 1}`}
                      className="segment-mask-overlay"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        opacity: 0.6,
                        pointerEvents: 'auto',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSegmentClick(selectedLesson, segment)}
                      onError={() => console.error(`Failed to load mask: ${segment.mask_url}`)}
                    />
                  ))}
                </div>
                
                {selectedSegment ? (
                  <div className="segment-detail">
                    <div className="segment-detail-header">
                      <h3>Segment {selectedSegment.segmentIndex + 1}</h3>
                      <button 
                        className="back-button"
                        onClick={() => setSelectedSegment(null)}
                      >
                        Back to Lesson
                      </button>
                    </div>
                    
                    <div className="segment-features">
                      {selectedSegment.label && (
                        <div className="segment-feature label">
                          <h4><MdLabel /> Label</h4>
                          <p>{selectedSegment.label}</p>
                        </div>
                      )}
                      
                      {selectedSegment.notes && (
                        <div className="segment-feature notes">
                          <h4><MdNoteAdd /> Notes</h4>
                          <div className="segment-notes-content">{selectedSegment.notes}</div>
                        </div>
                      )}
                      
                      {selectedSegment.audioUrl && (
                        <div className="segment-feature audio">
                          <h4><MdMic /> Audio Notes</h4>
                          <button 
                            className="audio-play-button"
                            onClick={() => handlePlayPauseAudio(selectedSegment.audioUrl)}
                          >
                            {playing === selectedSegment.audioUrl ? (
                              <><MdPause size={20} /> Pause Audio</>
                            ) : (
                              <><MdPlayArrow size={20} /> Play Audio</>
                            )}
                          </button>
                        </div>
                      )}
                      
                      {!selectedSegment.label && !selectedSegment.notes && !selectedSegment.audioUrl && (
                        <div className="segment-no-features">
                          <p>No features available for this segment.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="lesson-segments-list">
                    <h3>Lesson Segments</h3>
                    <div className="segments-list">
                      {selectedLesson.segments.map((segment) => (
                        <div 
                          key={segment.id}
                          className="segment-list-item"
                          onClick={() => handleSegmentClick(selectedLesson, segment)}
                        >
                          <span className="segment-number">{segment.segmentIndex + 1}</span>
                          <div className="segment-list-info">
                            {segment.label ? (
                              <span className="segment-list-label">{segment.label}</span>
                            ) : (
                              <span className="segment-list-label-empty">No label</span>
                            )}
                            <div className="segment-list-badges">
                              {segment.notes && (
                                <span className="segment-list-badge notes">
                                  <MdNoteAdd size={14} />
                                </span>
                              )}
                              {segment.audioUrl && (
                                <span className="segment-list-badge audio">
                                  <MdMic size={14} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {showConfirmDelete && selectedLesson && (
          <motion.div
            className="confirm-delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="confirm-delete-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3>Delete Lesson</h3>
              <p>Are you sure you want to delete "{selectedLesson.title}"?</p>
              <p>This action cannot be undone.</p>
              
              <div className="confirm-delete-actions">
                <button 
                  className="cancel-button"
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setSelectedLesson(null);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-button"
                  onClick={() => handleDeleteLesson(selectedLesson.id)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Library;