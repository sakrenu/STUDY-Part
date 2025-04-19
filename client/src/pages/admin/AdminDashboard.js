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
                        <h3>Create Class</h3>
                        <p>Create Classes with this mode, assign teachers and students to classes</p>
                        <button onClick={() => navigate('/Create-Class')} className="widget-button">
                            Go to Create Class Mode
                        </button>
                    </div>

                    <div className="widget">
                        <h3>Edit Class</h3>
                        <p>Edit Classes with this mode, change teachers and add students to classes</p>
                        <button onClick={() => navigate('/Edit-Class')} className="widget-button">
                            Go to Edit Class Mode
                        </button>
                    </div>

                    <div className="widget">
                        <h3>View Class</h3>
                        <p>View Classes with this mode, view teachers and students in classes</p>
                        <button onClick={() => navigate('/View-Class')} className="widget-button">
                            Go to View Class Mode
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
