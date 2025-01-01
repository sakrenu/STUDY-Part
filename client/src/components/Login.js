// // import React, { useState } from 'react';
// // import { auth, googleProvider, db } from '../firebase'; // Import Firestore
// // import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
// // import { getDoc, doc } from 'firebase/firestore'; // Import Firestore functions
// // import { useNavigate } from 'react-router-dom';
// // import './Login.css';

// // const Login = () => {
// //     const [email, setEmail] = useState('');
// //     const [password, setPassword] = useState('');
// //     const [error, setError] = useState('');
// //     const [success, setSuccess] = useState(false);

// //     const navigate = useNavigate();

// //     const checkRoleExists = async (uid) => {
// //         try {
// //             const userDoc = await getDoc(doc(db, 'users', uid));
// //             if (userDoc.exists()) {
// //                 const userData = userDoc.data();
// //                 if (userData.role) {
// //                     console.log('Role found:', userData.role);
// //                     return true;
// //                 } else {
// //                     console.error('No role assigned to this account.');
// //                     setError('No role assigned. Please contact support.');
// //                     return false;
// //                 }
// //             } else {
// //                 console.error('User not found in Firestore.');
// //                 setError('User not found. Please sign up first.');
// //                 return false;
// //             }
// //         } catch (err) {
// //             console.error('Error checking role:', err);
// //             setError('An error occurred while checking role.');
// //             return false;
// //         }
// //     };

// //     const handleLogin = async (e) => {
// //         e.preventDefault();
// //         setError('');
// //         setSuccess(false);

// //         try {
// //             const userCredential = await signInWithEmailAndPassword(auth, email, password);
// //             const user = userCredential.user;
// //             console.log('Logged In:', user);

// //             const roleExists = await checkRoleExists(user.uid);
// //             if (roleExists) {
// //                 setSuccess(true);
// //                 navigate('/dashboard'); // Redirect to dashboard
// //             }
// //         } catch (err) {
// //             setError(err.message);
// //             console.error(err);
// //         }
// //     };

// //     const handleGoogleLogin = async () => {
// //         try {
// //             const result = await signInWithPopup(auth, googleProvider);
// //             const user = result.user;
// //             console.log('Google User Info:', user);

// //             const roleExists = await checkRoleExists(user.uid);
// //             if (roleExists) {
// //                 navigate('/dashboard'); // Redirect to dashboard
// //             }
// //         } catch (err) {
// //             console.error(err.message);
// //             setError('Failed to log in with Google.');
// //         }
// //     };

// //     return (
// //         <div className="login-container">
// //             <div className="login-card">
// //                 <h1 className="login-title">Welcome Back</h1>
// //                 <p className="login-subtitle">Log in to continue</p>
// //                 {error && <p className="error-message">{error}</p>}
// //                 {success && <p className="success-message">Login successful!</p>}
// //                 <form className="login-form" onSubmit={handleLogin}>
// //                     <div className="form-group">
// //                         <label>Email</label>
// //                         <input
// //                             type="email"
// //                             placeholder="Enter your email"
// //                             value={email}
// //                             onChange={(e) => setEmail(e.target.value)}
// //                             required
// //                         />
// //                     </div>
// //                     <div className="form-group">
// //                         <label>Password</label>
// //                         <input
// //                             type="password"
// //                             placeholder="Enter your password"
// //                             value={password}
// //                             onChange={(e) => setPassword(e.target.value)}
// //                             required
// //                         />
// //                     </div>
// //                     <button type="submit" className="login-button">
// //                         Log In
// //                     </button>
// //                 </form>
// //                 <button className="google-button" onClick={handleGoogleLogin}>
// //                     Sign in with Google
// //                 </button>
// //                 <p className="signup-link">
// //                     Don't have an account?{' '}
// //                     <span onClick={() => navigate('/signup')} className="link">
// //                         Sign up here
// //                     </span>
// //                 </p>
// //             </div>
// //         </div>
// //     );
// // };

// // export default Login;
// // client/src/components/Login.js
// import React, { useState } from 'react';
// import { auth, googleProvider, db } from '../firebase';
// import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
// import { getDoc, doc } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import './Login.css';

// const Login = () => {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState(false);

//     const navigate = useNavigate();

//     const checkRoleExists = async (uid) => {
//         try {
//             const userDoc = await getDoc(doc(db, 'users', uid));
//             if (userDoc.exists()) {
//                 const userData = userDoc.data();
//                 if (userData.role) {
//                     console.log('Role found:', userData.role);
//                     return userData.role;
//                 } else {
//                     console.error('No role assigned to this account.');
//                     setError('No role assigned. Please contact support.');
//                     return false;
//                 }
//             } else {
//                 console.error('User not found in Firestore.');
//                 setError('User not found. Please sign up first.');
//                 return false;
//             }
//         } catch (err) {
//             console.error('Error checking role:', err);
//             setError('An error occurred while checking role.');
//             return false;
//         }
//     };

//     const handleLogin = async (e) => {
//         e.preventDefault();
//         setError('');
//         setSuccess(false);

//         try {
//             const userCredential = await signInWithEmailAndPassword(auth, email, password);
//             const user = userCredential.user;
//             console.log('Logged In:', user);

//             const role = await checkRoleExists(user.uid);
//             if (role) {
//                 setSuccess(true);
//                 if (role === 'teacher') {
//                     navigate('/dashboard'); // Redirect to teacher dashboard
//                 } else {
//                     navigate('/student-dashboard'); // Redirect to student dashboard
//                 }
//             }
//         } catch (err) {
//             setError(err.message);
//             console.error(err);
//         }
//     };

//     const handleGoogleLogin = async () => {
//         try {
//             const result = await signInWithPopup(auth, googleProvider);
//             const user = result.user;
//             console.log('Google User Info:', user);

//             const role = await checkRoleExists(user.uid);
//             if (role) {
//                 if (role === 'teacher') {
//                     navigate('/dashboard'); // Redirect to teacher dashboard
//                 } else {
//                     navigate('/student-dashboard'); // Redirect to student dashboard
//                 }
//             }
//         } catch (err) {
//             console.error(err.message);
//             setError('Failed to log in with Google.');
//         }
//     };

//     return (
//         <div className="login-container">
//             <div className="login-card">
//                 <h1 className="login-title">Welcome Back</h1>
//                 <p className="login-subtitle">Log in to continue</p>
//                 {error && <p className="error-message">{error}</p>}
//                 {success && <p className="success-message">Login successful!</p>}
//                 <form className="login-form" onSubmit={handleLogin}>
//                     <div className="form-group">
//                         <label>Email</label>
//                         <input
//                             type="email"
//                             placeholder="Enter your email"
//                             value={email}
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                         />
//                     </div>
//                     <div className="form-group">
//                         <label>Password</label>
//                         <input
//                             type="password"
//                             placeholder="Enter your password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                             required
//                         />
//                     </div>
//                     <button type="submit" className="login-button">
//                         Log In
//                     </button>
//                 </form>
//                 <button className="google-button" onClick={handleGoogleLogin}>
//                     Sign in with Google
//                 </button>
//                 <p className="signup-link">
//                     Don't have an account?{' '}
//                     <span onClick={() => navigate('/signup')} className="link">
//                         Sign up here
//                     </span>
//                 </p>
//             </div>
//         </div>
//     );
// };

// export default Login;
import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const checkRoleExists = async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.role) {
                    console.log('Role found:', userData.role);
                    return userData.role;
                } else {
                    console.error('No role assigned to this account.');
                    setError('No role assigned. Please contact support.');
                    return false;
                }
            } else {
                console.error('User not found in Firestore.');
                setError('User not found. Please sign up first.');
                return false;
            }
        } catch (err) {
            console.error('Error checking role:', err);
            setError('An error occurred while checking role.');
            return false;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Logged In:', user);

            const role = await checkRoleExists(user.uid);
            if (role) {
                setSuccess(true);
                if (role === 'teacher') {
                    navigate('/dashboard'); // Redirect to teacher dashboard
                } else {
                    navigate('/student-dashboard'); // Redirect to student dashboard
                }
            }
        } 
        catch (err) {
            console.error('Unexpected Error:', err); // Log the full error object
            console.error('Error Code:', err.code);
            console.error('Error Message:', err.message);

            switch (err.code) {
                case 'auth/invalid-credential':
                    setError('No account found with this email. Please sign up first.');
                    break;
                case 'auth/wrong-password':
                    setError('Incorrect password. Please try again.');
                    break;
                case 'auth/invalid-email':
                    setError('Invalid email format. Please enter a valid email.');
                    break;
                default:
                    setError('An unexpected error occurred. Please try again later.');
            }
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            console.log('Google User Info:', user);

            const role = await checkRoleExists(user.uid);
            if (role) {
                if (role === 'teacher') {
                    navigate('/dashboard'); // Redirect to teacher dashboard
                } else {
                    navigate('/student-dashboard'); // Redirect to student dashboard
                }
            }
        } catch (err) {
            console.error(err.message);
            setError('Failed to log in with Google.');
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
                <button className="google-button" onClick={handleGoogleLogin}>
                    Sign in with Google
                </button>
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

