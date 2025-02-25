// // src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Import Firestore
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
  apiKey: "AIzaSyD5VgYKSost4MSmvyKfBwSCWm4SrgPo6F0",
  authDomain: "study-part.firebaseapp.com",
  projectId: "study-part",
  storageBucket: "study-part.firebasestorage.app",
  messagingSenderId: "939764130888",
  appId: "1:939764130888:web:25276d5a3d472f00f9a47d",
  measurementId: "G-2FW3DNKY3G"
  };
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
export const storage = getStorage(app);
// Export Firebase Auth and Providers
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
console.log(app);
export{db ,auth  , googleProvider};



// // src/firebase.js
// import { initializeApp } from 'firebase/app';
// import { getAuth, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';

// const firebaseConfig = {
//   apiKey: "AIzaSyD5VgYKSost4MSmvyKfBwSCWm4SrgPo6F0",
//   authDomain: "study-part.firebaseapp.com",
//   projectId: "study-part",
//   storageBucket: "study-part.firebasestorage.app",
//   messagingSenderId: "939764130888",
//   appId: "1:939764130888:web:25276d5a3d472f00f9a47d",
//   measurementId: "G-2FW3DNKY3G"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Firestore and Storage
// const db = getFirestore(app);
// export const storage = getStorage(app);

// // Export Firebase Auth, Providers, Authentication methods, and Firestore
// export const auth = getAuth(app);
// export const googleProvider = new GoogleAuthProvider();
// export {
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signInWithPopup,
//   db, // Add db to the exports
// };