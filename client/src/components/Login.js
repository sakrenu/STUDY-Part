import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Logged In:', userCredential.user);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
            console.error(err);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">Welcome Back</h1>
                <p className="login-subtitle">Log in to continue</p>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">Login successful!</p>}
                <form className="login-form" onSubmit={handleLogin}>
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
                    <button type="submit" className="login-button">
                        Log In
                    </button>
                </form>
                <p className="signup-link">
                    Don't have an account?{' '}
                    <span onClick={() => navigate('/signup')} className="link">
                        Sign up here
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Login;
