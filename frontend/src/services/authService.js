// SAGAR-DRISHTI RBAC & Auth Service

const STORAGE_KEY_USER = 'sagar_drishti_user';
const STORAGE_KEY_TOKEN = 'sagar_drishti_token';

export const DEMO_CREDENTIALS = {
  student: {
    username: 'student',
    password: 'student123',
    name: 'Arjun Sharma',
    role: 'student',
    email: 'arjun.student@incois.gov.in',
    avatar: '🎓',
    title: 'Ocean Explorer & Student'
  },
  forecaster: {
    username: 'forecaster',
    password: 'forecast123',
    name: 'Dr. Aditi Verma',
    role: 'forecaster',
    email: 'aditi.verma@incois.gov.in',
    avatar: '⚓',
    title: 'Senior Oceanographer & Duty Forecaster'
  }
};

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

export const loginWithCredentials = async (username, password, preferredRole = 'student') => {
  const cleanUsername = (username || '').trim().toLowerCase();
  
  // 1. Try local demo fallback first for rapid offline testing
  let matchedUser = null;
  if (cleanUsername === 'student' && password === 'student123') {
    matchedUser = DEMO_CREDENTIALS.student;
  } else if (cleanUsername === 'forecaster' && password === 'forecast123') {
    matchedUser = DEMO_CREDENTIALS.forecaster;
  }

  if (matchedUser) {
    const token = `sd_demo_token_${matchedUser.username}_${Date.now()}`;
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(matchedUser));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    return { success: true, user: matchedUser, token };
  }

  // 2. Query FastAPI Backend auth endpoint
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        password: password,
        preferred_role: preferredRole
      })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      return { success: true, user: data.user, token: data.token };
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Authentication failed. Check credentials.");
    }
  } catch (backendError) {
    // If backend is un-reachable or errors out, fallback if password matches demo rule
    if (password === 'student123' || password === 'forecast123' || password === 'demo123') {
      const role = (preferredRole === 'forecaster') ? 'forecaster' : 'student';
      const fallbackUser = {
        username: cleanUsername || role,
        name: (cleanUsername || role).toUpperCase(),
        role: role,
        email: `${cleanUsername || role}@sagar-drishti.in`,
        avatar: role === 'student' ? '🎓' : '⚓',
        title: role === 'student' ? 'Student Explorer' : 'Duty Forecaster'
      };
      const token = `sd_fallback_token_${role}_${Date.now()}`;
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(fallbackUser));
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      return { success: true, user: fallbackUser, token };
    }
    throw backendError;
  }
};

export const logout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  } finally {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
};

export const canAccessMode = (mode, role = getCurrentRole()) => {
  if (mode === 'explore') return true; // Accessible by student, forecaster, and guest
  if (mode === 'forecaster') return role === 'forecaster';
  return true;
};
