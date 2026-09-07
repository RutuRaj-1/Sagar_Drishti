import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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
    // Analytics fallback for SSR or local environments
    console.debug("Firebase analytics initialized with fallback", err);
  }
}

export { app, analytics, firebaseConfig };
