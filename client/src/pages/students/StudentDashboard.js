import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './StudentDashboard.css';

const StudentsDashboard = ({ studentId }) => {
    const [originalImage, setOriginalImage] = useState(null);
    const [segmentedParts, setSegmentedParts] = useState([]);
    const [selectedNotes, setSelectedNotes] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentRef = doc(db, 'students_notes', studentId);
                const studentData = (await getDoc(studentRef)).data();

                if (studentData) {
                    setOriginalImage(studentData.originalImage);
                    setSegmentedParts(studentData.segmentedImages);
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            }
        };

        fetchData();
    }, [studentId]);

    const handlePartClick = (notes) => {
        setSelectedNotes(notes);
    };

    return (
        <div className="students-dashboard">
            <h1>Student's Dashboard</h1>
            {originalImage && (
                <div className="image-container">
                    <img src={originalImage} alt="Original" className="original-image" />
                    {segmentedParts.map((part, index) => (
                        <div
                            key={index}
                            className="segment-highlight"
                            style={{ top: part.top, left: part.left, width: part.width, height: part.height }}
                            onClick={() => handlePartClick(part.notes)}
                        />
                    ))}
                </div>
            )}
            {selectedNotes && (
                <div className="notes-section">
                    <h2>Notes</h2>
                    <p>{selectedNotes}</p>
                </div>
            )}
        </div>
    );
};

export default StudentsDashboard;