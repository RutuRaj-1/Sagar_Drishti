import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// SAGAR-DRISHTI Firebase Configuration (SIH 26067 — Project: sagar-drishti)
const firebaseConfig = {
  apiKey: "AIzaSyBPtsERciFrLzAatwiXC7WsfEt6d7Y608I",
  authDomain: "sagar-drishti.firebaseapp.com",
  projectId: "sagar-drishti",
  storageBucket: "sagar-drishti.firebasestorage.app",
  messagingSenderId: "96599988403",
  appId: "1:96599988403:web:f54017370dcd667ca4f8c6",
  measurementId: "G-CNBNGQTX23"
};

// Guard against Vite HMR re-initializing a duplicate Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.debug("Firebase Analytics not available:", err.message);
  }
}

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, analytics, auth, db, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, firebaseConfig };
