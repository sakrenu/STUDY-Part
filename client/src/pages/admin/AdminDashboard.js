import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const auth = getAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login'); // Redirect to login page after logout
        } catch (error) {
            console.error("Error logging out: ", error);
            alert('Failed to log out.');
        }
    };

    return (
        <div className="admin-dashboard">
            {/* Top Navigation */}
            <nav className="top-nav">
                <div className="logo-container">
                    <img src="/studpartlogo.png" alt="StudyPart Logo" className="logo-image" />
                    <a href="/" className="logo">
                        <span className="study">Study</span>
                        <span className="part">Part</span>
                    </a>
                </div>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </nav>

            {/* Welcome Section with Centered Heading */}
            <div className="welcome-section">
                <h1>Admin Dashboard</h1>
                <h3>Manage your educational platform</h3>
            </div>

            <main className="admin-main-content">
                <div className="admin-widgets">
                    <div className="widget" onClick={() => navigate('/Create-Class')}>
                        <h3>Create Class</h3>
                        <p>Create Classes with this mode, assign teachers and students to classes</p>
                    </div>

                    <div className="widget" onClick={() => navigate('/Edit-Class')}>
                        <h3>Edit Class</h3>
                        <p>Edit Classes with this mode, change teachers and add students to classes</p>
                    </div>

                    <div className="widget" onClick={() => navigate('/View-Class')}>
                        <h3>View Class</h3>
                        <p>View Classes with this mode, view teachers and students in classes</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
