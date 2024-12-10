import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <h1>Welcome to My App</h1>
            <p>Choose an option to proceed:</p>
            <div className="button-group">
                <button onClick={() => navigate('/login')} className="home-button">
                    Login
                </button>
                <button onClick={() => navigate('/signup')} className="home-button signup-button">
                    Sign Up
                </button>
            </div>
        </div>
    );
};

export default Home;
