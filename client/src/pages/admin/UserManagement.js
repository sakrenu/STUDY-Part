import React from 'react';
import './UserManagement.css'; // Optional: for styling

const UserManagement = () => {
    return (
        <div className="user-management-container">
            <h1>User Management</h1>
            <p>Here you can view, add, edit, or remove users, and manage their roles and permissions.</p>

            {/* Example table for users */}
            <table className="user-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Jane Doe</td>
                        <td>jane@example.com</td>
                        <td>Admin</td>
                        <td>
                            <button>Edit</button>
                            <button>Delete</button>
                        </td>
                    </tr>
                    {/* Add more rows dynamically in the future */}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement;
