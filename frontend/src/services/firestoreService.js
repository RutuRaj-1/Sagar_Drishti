// SAGAR-DRISHTI Firestore RBAC Service
// Manages user roles in Firestore: users/{uid} = { email, role, displayName, updatedAt }

import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { app } from "./firebase.js";

export const db = getFirestore(app);

// Admin emails — these users always get 'admin' role on first sign-in
export const ADMIN_EMAILS = [
  // Add your admin gmail(s) here, e.g.: "youradmin@gmail.com"
  // Leave empty to configure via Firestore only
];

// Helper for Firestore operations with a strict 1500ms timeout
// Prevents unprovisioned Firestore / offline WebChannel from freezing login
const withTimeout = (promise, ms = 1500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms))
  ]);
};

/**
 * Ensure a user document exists in Firestore.
 * If it doesn't exist, creates it with default role 'student'.
 * If it exists, does NOT overwrite the role (preserves admin assignments).
 * Always returns within 1.5s max to prevent UI freeze.
 */
export const ensureUserDoc = async (uid, email, displayName = "") => {
  const isAdmin = ADMIN_EMAILS.includes((email || "").toLowerCase());
  const fallbackRole = isAdmin ? "admin" : "student";

  try {
    const role = await withTimeout((async () => {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid,
          email: email || "",
          displayName: displayName || "",
          role: fallbackRole,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return fallbackRole;
      } else {
        // Update display metadata in background
        updateDoc(userRef, {
          displayName: displayName || snap.data().displayName || "",
          email: email || snap.data().email || "",
          updatedAt: serverTimestamp(),
        }).catch(() => {});
        return snap.data().role || fallbackRole;
      }
    })(), 1500);

    return role;
  } catch (err) {
    console.warn("Firestore ensureUserDoc using fallback (database pending/offline):", err.message);
    return fallbackRole;
  }
};

/**
 * Get the role for a user from Firestore.
 * Returns 'student' as a safe default if not found.
 */
export const getUserRole = async (uid) => {
  try {
    return await withTimeout((async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        return snap.data().role || "student";
      }
      return "student";
    })(), 1500);
  } catch (err) {
    console.warn("Firestore getUserRole timeout/fallback:", err.message);
    return "student";
  }
};

/**
 * Set the role for a specific user (admin only operation).
 */
export const setUserRole = async (uid, role) => {
  try {
    return await withTimeout((async () => {
      await updateDoc(doc(db, "users", uid), {
        role,
        updatedAt: serverTimestamp(),
      });
      return true;
    })(), 2500);
  } catch (err) {
    console.error("Firestore setUserRole failed:", err);
    return false;
  }
};

/**
 * Get all users for admin panel.
 */
export const getAllUsers = async () => {
  try {
    return await withTimeout((async () => {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    })(), 2500);
  } catch (err) {
    console.error("Firestore getAllUsers failed:", err);
    return [];
  }
};
