// Students/LearningMode.js
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import './LearningMode.css';

const LearningMode = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (loadingAuth) return; // Wait for auth state
    if (!user) {
      setError('Please sign in as a student to access this page.');
      setIsLoading(false);
      return;
    }

    const checkStudentRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'student') {
          setError('Only students can access this page.');
        }
      } catch (err) {
        setError('Error verifying user role: ' + err.message);
      }
    };
    checkStudentRole();

    const studentRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(studentRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const studentData = docSnapshot.data();
        setSharedNotes(studentData.sharedNotes || []);
      } else {
        setSharedNotes([]);
        setError(`No student document found for ID: ${user.uid}`);
      }
      setIsLoading(false);
    }, (err) => {
      setError('Failed to fetch shared notes: ' + err.message);
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription
  }, [user, loadingAuth]);

  if (loadingAuth) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user || user.role !== 'student') return <div className="error-message">Access denied. Please sign in as a student.</div>;

  return (
    <div className="learning-mode-container">
      <h1>Learning Mode</h1>
      {sharedNotes.length === 0 ? (
        <p>No shared notes from teachers yet.</p>
      ) : (
        sharedNotes.map((note, index) => (
          <div key={index} className="shared-note">
            <h2>Shared Material {index + 1}</h2>
            <img src={note.imageUrl} alt={`Shared Material ${index + 1}`} className="shared-image" />
            <div className="shared-notes">
              {note.notes.map((segment, segIndex) => (
                <div
                  key={segIndex}
                  className="note-region"
                  onClick={() => alert(`Notes for Region ${segIndex + 1}: ${segment.notes || 'No notes'}`)}
                >
                  <img
                    src={segment.highlighted_outline}
                    alt={`Region ${segIndex + 1}`}
                    className="region-outline"
                  />
                  <p>{segment.notes || 'Click to view notes'}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default LearningMode;