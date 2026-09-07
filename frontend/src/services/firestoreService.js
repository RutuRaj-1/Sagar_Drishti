// SAGAR-DRISHTI Firestore RBAC Service
// Manages user roles in Firestore: users/{uid} = { email, role, displayName, updatedAt }

import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { app } from "./firebase.js";
import { ADMIN_EMAILS, isAdminEmail } from "./adminEmails.js";

export { ADMIN_EMAILS, isAdminEmail };

export const db = getFirestore(app);

// Helper for Firestore operations with a strict 1500ms timeout
// Prevents unprovisioned Firestore / offline WebChannel from freezing login
const withTimeout = (promise, ms = 1500) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms))
  ]);
};

// Admin-panel operations are user-initiated and may tolerate a slower network.
const ADMIN_TIMEOUT = 8000;

const ROLE_ASSIGNMENTS = "roleAssignments";

const assignmentId = (email) => (email || "").trim().toLowerCase();

const describeError = (err) => {
  const code = err?.code || "";
  if (err?.message === "Firestore timeout") {
    return "Firestore did not respond. The Cloud Firestore database may not be created yet for this Firebase project.";
  }
  if (code === "permission-denied") {
    return "Firestore security rules rejected this request. Allow authenticated reads/writes on the users collection.";
  }
  if (code === "unavailable" || code === "not-found") {
    return "Firestore is unreachable. Create the default Cloud Firestore database in the Firebase console.";
  }
  return err?.message || "Unknown Firestore error.";
};

/**
 * Look up a role pre-assigned by an admin for an email that may not have
 * signed in yet. Returns null when there is no pending assignment.
 */
const consumeRoleAssignment = async (email) => {
  const id = assignmentId(email);
  if (!id) return null;
  const snap = await getDoc(doc(db, ROLE_ASSIGNMENTS, id));
  if (!snap.exists()) return null;
  const role = snap.data().role;
  deleteDoc(doc(db, ROLE_ASSIGNMENTS, id)).catch(() => {});
  return role || null;
};

/**
 * Ensure a user document exists in Firestore.
 * If it doesn't exist, creates it with default role 'student'.
 * If it exists, does NOT overwrite the role (preserves admin assignments),
 * except for ADMIN_EMAILS which are always promoted to 'admin' and emails with
 * a pending admin-granted role assignment.
 * Always returns within 4s max to prevent UI freeze.
 */
export const ensureUserDoc = async (uid, email, displayName = "") => {
  const isAdmin = isAdminEmail(email);
  const fallbackRole = isAdmin ? "admin" : "student";

  try {
    const role = await withTimeout((async () => {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      const assignedRole = isAdmin ? null : await consumeRoleAssignment(email).catch(() => null);

      if (!snap.exists()) {
        const initialRole = assignedRole || fallbackRole;
        await setDoc(userRef, {
          uid,
          email: email || "",
          displayName: displayName || "",
          role: initialRole,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return initialRole;
      } else {
        // Update display metadata in background
        updateDoc(userRef, {
          displayName: displayName || snap.data().displayName || "",
          email: email || snap.data().email || "",
          updatedAt: serverTimestamp(),
        }).catch(() => {});
        if (isAdmin && snap.data().role !== "admin") {
          updateDoc(userRef, { role: "admin", updatedAt: serverTimestamp() }).catch(() => {});
          return "admin";
        }
        if (assignedRole && assignedRole !== snap.data().role) {
          updateDoc(userRef, { role: assignedRole, updatedAt: serverTimestamp() }).catch(() => {});
          return assignedRole;
        }
        return snap.data().role || fallbackRole;
      }
    })(), 4000);

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
export const getUserRole = async (uid, email = "") => {
  if (isAdminEmail(email)) return "admin";
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
      return { ok: true };
    })(), ADMIN_TIMEOUT);
  } catch (err) {
    console.error("Firestore setUserRole failed:", err);
    return { ok: false, error: describeError(err) };
  }
};

/**
 * Get all users for admin panel.
 * Returns { users, error } so the panel can distinguish "no accounts yet"
 * from "Firestore is unreachable".
 */
export const getAllUsers = async () => {
  try {
    return await withTimeout((async () => {
      const snap = await getDocs(collection(db, "users"));
      return { users: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null };
    })(), ADMIN_TIMEOUT);
  } catch (err) {
    console.error("Firestore getAllUsers failed:", err);
    return { users: [], error: describeError(err) };
  }
};

/**
 * Roles granted ahead of a user's first sign-in, keyed by lowercased email.
 */
export const getRoleAssignments = async () => {
  try {
    return await withTimeout((async () => {
      const snap = await getDocs(collection(db, ROLE_ASSIGNMENTS));
      return { assignments: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null };
    })(), ADMIN_TIMEOUT);
  } catch (err) {
    console.error("Firestore getRoleAssignments failed:", err);
    return { assignments: [], error: describeError(err) };
  }
};

export const grantRoleByEmail = async (email, role, grantedBy = "") => {
  const id = assignmentId(email);
  if (!id) return { ok: false, error: "Enter an email address." };

  try {
    return await withTimeout((async () => {
      const existing = await getDocs(collection(db, "users"));
      const match = existing.docs.find((d) => (d.data().email || "").toLowerCase() === id);

      if (match) {
        await updateDoc(doc(db, "users", match.id), { role, updatedAt: serverTimestamp() });
        return { ok: true, applied: "immediate" };
      }

      await setDoc(doc(db, ROLE_ASSIGNMENTS, id), {
        email: id,
        role,
        grantedBy,
        createdAt: serverTimestamp(),
      });
      return { ok: true, applied: "pending" };
    })(), ADMIN_TIMEOUT);
  } catch (err) {
    console.error("Firestore grantRoleByEmail failed:", err);
    return { ok: false, error: describeError(err) };
  }
};

export const revokeRoleAssignment = async (email) => {
  try {
    return await withTimeout((async () => {
      await deleteDoc(doc(db, ROLE_ASSIGNMENTS, assignmentId(email)));
      return { ok: true };
    })(), ADMIN_TIMEOUT);
  } catch (err) {
    console.error("Firestore revokeRoleAssignment failed:", err);
    return { ok: false, error: describeError(err) };
  }
};
