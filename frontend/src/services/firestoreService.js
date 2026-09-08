// SAGAR-DRISHTI Firestore RBAC Service
// Manages user roles in Firestore: users/{uid} = { email, role, displayName, updatedAt }

import { doc, getDoc, setDoc, updateDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

export { db };

// ── Admin email list ────────────────────────────────────────────────────────
// Users whose email is in this list are ALWAYS assigned the 'admin' role,
// both on first sign-in AND on every subsequent login (upgrades existing docs).
// This is the single source of truth for super-admin accounts.
export const ADMIN_EMAILS = [
  "bhomeruturaj@gmail.com",   // Project owner / system administrator — SIH 26067
];

// ── Forecaster email list ───────────────────────────────────────────────────
// Users in this list are assigned 'forecaster' role on first sign-in.
// Admins can also promote any user to forecaster via the Admin Panel.
export const FORECASTER_EMAILS = [
  "forecaster.incois.in@gmail.com",  // INCOIS duty forecaster demo account
];

// Helper: resolve the canonical role for an email address
export const getCanonicalRole = (email) => {
  const e = (email || "").toLowerCase().trim();
  if (ADMIN_EMAILS.includes(e)) return "admin";
  if (FORECASTER_EMAILS.includes(e)) return "forecaster";
  return null; // no hardcoded role — defer to Firestore
};

// Allow the browser enough time to establish the first Firestore connection.
const withTimeout = (promise, ms = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => {
      const error = new Error(
        typeof navigator !== 'undefined' && !navigator.onLine
          ? 'Firestore timeout: browser is offline'
          : 'Firestore timeout: no response from Firestore. Check browser network/VPN/firewall and the Firebase project configuration.'
      );
      error.code = 'firestore-timeout';
      reject(error);
    }, ms))
  ]);
};

/**
 * Ensure a user document exists in Firestore.
 *
 * Logic:
 *   - If the email is in ADMIN_EMAILS → always write 'admin' role (new AND existing docs)
 *   - If the email is in FORECASTER_EMAILS → write 'forecaster' only on new docs
 *   - Otherwise → create as 'student' on new doc, preserve existing role
 *
 * Fails loudly when the Firestore write is rejected so login cannot appear
 * successful while the user document is missing.
 */
export const ensureUserDoc = async (uid, email, displayName = "") => {
  const hardcodedRole = getCanonicalRole(email);
  const fallbackRole  = hardcodedRole || "student";

  try {
    const role = await withTimeout((async () => {
      const userRef = doc(db, "users", uid);
      const snap    = await getDoc(userRef);

      if (!snap.exists()) {
        // Create safely as student first. Bootstrap admins are promoted by the
        // update below, which keeps the create rule independent of role data.
        await setDoc(userRef, {
          uid,
          email:       email || "",
          displayName: displayName || "",
          role:        hardcodedRole === "admin" ? "student" : fallbackRole,
          createdAt:   serverTimestamp(),
          updatedAt:   serverTimestamp(),
        });

        if (hardcodedRole === "admin") {
          await updateDoc(userRef, {
            role: "admin",
            updatedAt: serverTimestamp(),
          });
        }

        return fallbackRole;

      } else {
        // ── Existing user ──────────────────────────────────────────────────
        const currentRole  = snap.data().role || "student";
        const resolvedRole = hardcodedRole ?? currentRole; // admin emails always win

        // Upgrade role in Firestore if it has changed (e.g. email was just added to list)
        const updates = {
          displayName: displayName || snap.data().displayName || "",
          email:       email       || snap.data().email       || "",
          updatedAt:   serverTimestamp(),
        };
        if (resolvedRole !== currentRole) {
          updates.role = resolvedRole;
        }
        await updateDoc(userRef, updates);

        return resolvedRole;
      }
    })(), 1500);

    return role;
  } catch (err) {
    console.error("Firestore ensureUserDoc failed:", err);
    throw err;
  }
};

/**
 * Get the role for a user from Firestore.
 * Admin-email users always return 'admin' regardless of what's stored.
 * Returns 'student' as a safe default if not found.
 */
export const getUserRole = async (uid, email = "") => {
  // If we have the email at call time, honour the hardcoded list immediately
  const hardcoded = email ? getCanonicalRole(email) : null;
  if (hardcoded) return hardcoded;

  try {
    return await withTimeout((async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        const data = snap.data();
        // Double-check: if the stored email is in admin list, always return admin
        const canonical = getCanonicalRole(data.email || "");
        return canonical ?? (data.role || "student");
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
  return withTimeout((async () => {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  })(), 2500);
};
