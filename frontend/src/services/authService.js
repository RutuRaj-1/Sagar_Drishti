// SAGAR-DRISHTI RBAC & Auth Service
// Role hierarchy: guest → student → forecaster → admin

import { ADMIN_EMAILS, isAdminEmail } from './adminEmails.js';

const STORAGE_KEY_USER = 'sagar_drishti_user';
const STORAGE_KEY_TOKEN = 'sagar_drishti_token';

export { ADMIN_EMAILS, isAdminEmail };

export const getStoredUser = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY_USER);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse stored user", err);
  }
  return null;
};

export const getStoredToken = () => {
  return localStorage.getItem(STORAGE_KEY_TOKEN) || null;
};

export const getCurrentRole = () => {
  const user = getStoredUser();
  return user ? user.role : 'guest';
};

export const isAuthenticated = () => {
  const user = getStoredUser();
  return !!user && user.role !== 'guest';
};

/**
 * Login with Email + Password via Firebase Auth.
 * After login, resolves role from Firestore.
 */
export const loginWithEmailPassword = async (email, password) => {
  try {
    const { auth, signInWithEmailAndPassword } = await import('./firebase.js');
    const { ensureUserDoc } = await import('./firestoreService.js');

    const cred = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;

    // Resolve role from Firestore (creates doc if first login)
    const resolved = await ensureUserDoc(fbUser.uid, fbUser.email, fbUser.displayName || email.split('@')[0]);
    const role = isAdminEmail(fbUser.email) ? 'admin' : resolved;

    const user = {
      uid: fbUser.uid,
      username: fbUser.email.split('@')[0],
      name: fbUser.displayName || email.split('@')[0],
      role,
      email: fbUser.email,
      avatar: fbUser.photoURL || (role === 'forecaster' ? '⚓' : role === 'admin' ? '🛡️' : '🎓'),
      title: role === 'forecaster' ? 'Duty Forecaster' : role === 'admin' ? 'System Administrator' : 'Student Explorer',
      provider: 'email',
    };

    const token = await fbUser.getIdToken().catch(() => `sd_email_token_${Date.now()}`);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    return { success: true, user, token, role };
  } catch (err) {
    throw new Error(err.message || 'Email/password authentication failed.');
  }
};

/**
 * Register new user with Email + Password via Firebase Auth.
 * Creates Firestore doc with default role 'student'.
 */
export const registerWithEmailPassword = async (email, password, displayName = '') => {
  try {
    const { auth, createUserWithEmailAndPassword } = await import('./firebase.js');
    const { ensureUserDoc } = await import('./firestoreService.js');

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = cred.user;

    const resolved = await ensureUserDoc(fbUser.uid, fbUser.email, displayName || email.split('@')[0]);
    const role = isAdminEmail(fbUser.email) ? 'admin' : resolved;

    const user = {
      uid: fbUser.uid,
      username: email.split('@')[0],
      name: displayName || email.split('@')[0],
      role,
      email: fbUser.email,
      avatar: role === 'admin' ? '🛡️' : role === 'forecaster' ? '⚓' : '🎓',
      title: role === 'admin' ? 'System Administrator' : role === 'forecaster' ? 'Duty Forecaster' : 'Student Explorer',
      provider: 'email',
    };

    const token = await fbUser.getIdToken().catch(() => `sd_email_token_${Date.now()}`);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    return { success: true, user, token, role };
  } catch (err) {
    throw new Error(err.message || 'Registration failed.');
  }
};

/**
 * Login with Google.
 * After auth, resolves/creates Firestore user doc and reads role.
 * Default role for new @gmail.com users = 'student'.
 * Admins can promote via Admin Panel → next login picks up new role.
 */
export const loginWithGoogle = async () => {
  try {
    const { auth, googleProvider, signInWithPopup } = await import('./firebase.js');
    const { ensureUserDoc } = await import('./firestoreService.js');

    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    // Resolve role from Firestore (failsafe to 'student' in <1.5s)
    let role = isAdminEmail(fbUser.email) ? 'admin' : 'student';
    try {
      const resolved = await ensureUserDoc(fbUser.uid, fbUser.email, fbUser.displayName || '');
      if (!isAdminEmail(fbUser.email)) role = resolved;
    } catch (e) {
      console.warn("ensureUserDoc fallback:", e);
    }

    const user = {
      uid: fbUser.uid,
      username: fbUser.email ? fbUser.email.split('@')[0] : 'google_user',
      name: fbUser.displayName || 'Google User',
      role,
      email: fbUser.email || '',
      avatar: fbUser.photoURL || (role === 'forecaster' ? '⚓' : role === 'admin' ? '🛡️' : '🎓'),
      title: role === 'forecaster' ? 'Duty Forecaster' : role === 'admin' ? 'System Administrator' : 'Ocean Explorer',
      provider: 'google',
    };

    const token = await fbUser.getIdToken().catch(() => `sd_google_token_${Date.now()}`);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    return { success: true, user, token, role };
  } catch (err) {
    console.error("Google login error:", err);
    throw new Error(err.message || 'Google authentication failed. Please try again.');
  }
};

export const logout = async () => {
  try {
    const { auth, signOut } = await import('./firebase.js');
    await signOut(auth).catch(() => {});
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  } finally {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
};

/**
 * Subscribes to Firebase onAuthStateChanged and syncs localStorage.
 * If user is logged in via Firebase Auth, resolves role and passes user to callback.
 */
export const subscribeAuthState = (callback) => {
  let unsubscribe = () => {};
  import('./firebase.js').then(async ({ auth }) => {
    const { onAuthStateChanged } = await import('firebase/auth');
    const { getUserRole } = await import('./firestoreService.js');

    unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const stored = getStoredUser();
        let role = stored?.role;
        if (!role || role === 'guest') {
          role = await getUserRole(fbUser.uid, fbUser.email).catch(() => 'student');
        }
        if (isAdminEmail(fbUser.email)) role = 'admin';
        const user = {
          uid: fbUser.uid,
          username: fbUser.email ? fbUser.email.split('@')[0] : 'user',
          name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Explorer'),
          role: role || 'student',
          email: fbUser.email || '',
          avatar: fbUser.photoURL || (role === 'forecaster' ? '⚓' : role === 'admin' ? '🛡️' : '🎓'),
          title: role === 'forecaster' ? 'Duty Forecaster' : role === 'admin' ? 'System Administrator' : 'Ocean Explorer',
          provider: fbUser.providerData?.[0]?.providerId || 'google',
        };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        callback(user, user.role);
      } else {
        callback(null, 'guest');
      }
    });
  }).catch(console.error);

  return () => unsubscribe();
};

export const canAccessMode = (mode, role = getCurrentRole()) => {
  if (mode === 'explore') return true;
  if (mode === 'forecaster') return role === 'forecaster' || role === 'admin';
  if (mode === 'admin') return role === 'admin';
  return true;
};
