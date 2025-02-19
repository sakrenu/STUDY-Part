// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore
import { getStorage } from 'firebase/storage'; // Add this import

const firebaseConfig = {
  apiKey: "AIzaSyB6dIhC36wiVfp4d2tCY6NluWxJ7QSG2Ik",
  authDomain: "react-auth-3a9f1.firebaseapp.com",
  projectId: "react-auth-3a9f1",
  storageBucket: "react-auth-3a9f1.firebasestorage.app",
  messagingSenderId: "372827823627",
  appId: "1:372827823627:web:18deaa8f2a3e28a77ab10e",
  measurementId: "G-S3Z9STLH5D"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
console.log(app);
export{db ,auth  , googleProvider, storage};


export default app;
