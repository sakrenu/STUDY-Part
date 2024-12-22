// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore

const firebaseConfig = {
    apiKey: "AIzaSyB6dIhC36wiVfp4d2tCY6NluWxJ7QSG2Ik",
    authDomain: "react-auth-3a9f1.firebaseapp.com",
    projectId: "react-auth-3a9f1",
    storageBucket: "react-auth-3a9f1.firebasestorage.app",
    messagingSenderId: "372827823627",
    appId: "1:372827823627:web:18deaa8f2a3e28a77ab10e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Export Firebase Auth and Providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
