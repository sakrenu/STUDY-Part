// Library.js
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, getDocs, collection } from 'firebase/firestore';
import './Library.css';

const Library = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [libraryItems, setLibraryItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all past uploads and notes for the teacher
  useEffect(() => {
    if (loadingAuth) return; // Wait for auth state
    if (!user) {
      setError('Please sign in as a teacher to access the library.');
      setIsLoading(false);
      return;
    }

    const fetchLibraryItems = async () => {
      try {
        const teacherRef = doc(db, 'teachers', user.uid);
        const teacherDoc = await getDoc(teacherRef);
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data();
          const images = teacherData.images || {};
          
          // Transform images into a list of library items, using Cloudinary URLs
          const items = Object.entries(images).map(([imageUrl, imageData]) => ({
            imageUrl, // Cloudinary URL
            segments: imageData.segments || [],
            timestamp: imageData.timestamp || new Date().toISOString(),
          }));

          setLibraryItems(items);
        } else {
          setLibraryItems([]);
          setError(`No teacher document found for ID: ${user.uid}`);
        }
      } catch (err) {
        setError('Failed to fetch library items: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibraryItems();
  }, [user, loadingAuth]);

  // Handle selection of library items
  const handleSelectItem = (itemId, isChecked) => {
    setSelectedItems((prev) =>
      isChecked ? [...prev, itemId] : prev.filter((id) => id !== itemId)
    );
  };

  // Share selected library items with students, using Cloudinary URLs
  const handleShareLibraryItems = async () => {
    if (!user) {
      setError('Please sign in to share items.');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please select at least one item to share.');
      return;
    }

    try {
      const studentsQuery = await getDocs(collection(db, 'users'));
      const students = studentsQuery.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role === 'student');

      for (const student of students) {
        const studentRef = doc(db, 'users', student.id);
        await updateDoc(studentRef, {
          sharedNotes: arrayUnion(...selectedItems.map((itemId) => ({
            imageUrl: itemId, // Cloudinary URL
            notes: libraryItems.find((item) => item.imageUrl === itemId)?.segments || [],
          }))),
        });
      }

      setError('Items shared successfully with all students!');
      setSelectedItems([]);
    } catch (err) {
      setError('Failed to share library items: ' + err.message);
    }
  };

  if (loadingAuth) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!user || user.role !== 'teacher') return <div className="error-message">Access denied. Please sign in as a teacher.</div>;

  return (
    <div className="library-container">
      <h1>Library</h1>
      {libraryItems.length === 0 ? (
        <p>No items in library yet.</p>
      ) : (
        <>
          <div className="library-grid">
            {libraryItems.map((item) => (
              <div key={item.imageUrl} className="library-card">
                <img src={item.imageUrl} alt="Uploaded" className="library-image" />
                <div className="library-notes">
                  {item.segments.map((segment, index) => (
                    <div key={index} className="segment-note">
                      <p>Region {index + 1}: {segment.notes || 'No notes'}</p>
                    </div>
                  ))}
                </div>
                <label className="select-item">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.imageUrl)}
                    onChange={(e) => handleSelectItem(item.imageUrl, e.target.checked)}
                  />
                  Select
                </label>
              </div>
            ))}
          </div>
          <button onClick={handleShareLibraryItems} className="share-library-button">
            Share Selected Items with Students
          </button>
        </>
      )}
    </div>
  );
};

export default Library;