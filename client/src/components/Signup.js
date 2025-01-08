import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase'; // Import Google Provider and Firestore
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); // Confirm Password field
    const [role, setRole] = useState(''); // No default to ensure selection
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Check if passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Check if a role is selected
        if (!role) {
            setError('Please select a role before signing up.');
            return;
        }

        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save user details (email and role) to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                role: role, // 'student' or 'teacher'
            });

            console.log('User Created:', user);
            console.log('Role:', role); // Log the selected role
            setSuccess(true);
            navigate('/login'); // Redirect to login page after success
        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    };

    const handleGoogleSignup = async () => {
        setError('');
        setSuccess(false);

        // Check if a role is selected
        if (!role) {
            setError('Please select a role before signing up with Google.');
            return;
        }

        try {
            // Authenticate with Google
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Save user details (email and role) to Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                role: role, // 'student' or 'teacher'
            });

            console.log('Google User Created:', user);
            console.log('Role:', role); // Log the selected role
            setSuccess(true);
            navigate('/login'); // Redirect to login page after success
        } catch (err) {
            setError('Failed to sign up with Google.');
            console.error(err);
        }
    };

    // Function to handle the close/back button click
    const handleClose = () => {
        navigate('/'); // Navigate back to the landing page
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                {/* Close Button */}
                <button className="close-button" onClick={handleClose}>
                    &times; {/* Unicode for close symbol */}
                </button>
                <h1 className="signup-title">Create an Account</h1>
                <p className="signup-subtitle">Sign up and start using our services</p>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">Sign-up successful! Redirecting to login...</p>}
                <form className="signup-form" onSubmit={handleSignup}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Sign up as:</label>
                        <div className="role-selector">
                            <label>
                                <input
                                    type="radio"
                                    name="role"
                                    value="student"
                                    checked={role === 'student'}
                                    onChange={(e) => setRole(e.target.value)}
                                />
                                Student
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="role"
                                    value="teacher"
                                    checked={role === 'teacher'}
                                    onChange={(e) => setRole(e.target.value)}
                                />
                                Teacher
                            </label>
                        </div>
                    </div>
                    <button type="submit" className="signup-button">
                        Sign Up
                    </button>
                </form>
                <button className="google-button" onClick={handleGoogleSignup}>
                    Sign up with Google
                </button>
                <p className="login-link">
                    Already have an account?{' '}
                    <span onClick={() => navigate('/login')} className="link">
                        Log in here
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Signup;