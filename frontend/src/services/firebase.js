import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// SAGAR-DRISHTI Firebase Configuration (SIH 26067)
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeySagarDrishti2026INCOIS",
  authDomain: "sagar-drishti.firebaseapp.com",
  projectId: "sagar-drishti",
  storageBucket: "sagar-drishti.firebasestorage.app",
  messagingSenderId: "96599988403",
  appId: "1:96599988403:web:f54017370dcd667ca4f8c6",
  measurementId: "G-DEMOINCOIS2026"
};

const app = initializeApp(firebaseConfig);

let analytics = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (err) {
    console.debug("Firebase analytics initialized with fallback", err);
  }
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, analytics, auth, googleProvider, signInWithPopup, signOut, firebaseConfig };
