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
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </header>
            <main className="admin-main-content">
                <h2>Welcome, Admin!</h2>
                <p>This is your central control panel. Manage users, content, and settings from here.</p>
                
                <div className="admin-widgets">
                    <div className="widget">
                    <h3>User Management</h3>
                    <p>View and manage registered users, roles, and permissions.</p>
                    <button onClick={() => navigate('/user-management')} className="widget-button">
                    Go to User Management
                    </button>
                    </div>

                    <div className="widget">
                        <h3>Content Moderation</h3>
                        <p>Review and moderate user-generated content like notes or discussions.</p>
                         {/* Add link or button to content moderation section */}
                    </div>
                    <div className="widget">
                        <h3>System Settings</h3>
                        <p>Configure application settings and parameters.</p>
                         {/* Add link or button to system settings section */}
                    </div>
                    {/* Add more widgets as needed */}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard; 