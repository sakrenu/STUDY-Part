import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
// import './StudentDashboard.css';

const StudentDashboard = () => {
    const [segmentedImages, setSegmentedImages] = useState([]);
    const [notes, setNotes] = useState({});

    useEffect(() => {
        const fetchLearningContent = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setSegmentedImages(userData.segmentedImages);
                    setNotes(userData.notes);
                }
            }
        };

        fetchLearningContent();
    }, []);

    return (
        <div className="student-dashboard">
            <h1>Student's Dashboard</h1>
            <div className="learning-mode">
                <h2>Learning Mode</h2>
                {segmentedImages.map((segmentedImage, index) => (
                    <div key={index}>
                        <img src={segmentedImage} alt={`Segmented ${index}`} />
                        <p>{notes[index]}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentDashboard;
