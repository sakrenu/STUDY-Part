import React, { useState } from 'react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Signup.css'; // Use the new Signup.css file

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student'); // Default role is Student
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('User Created:', userCredential.user);
            console.log('Role:', role); // Log the selected role
            setSuccess(true);
        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <h1 className="signup-title">Create an Account</h1>
                <p className="signup-subtitle">Sign up and start using our services</p>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">Sign-up successful! Please log in.</p>}
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
