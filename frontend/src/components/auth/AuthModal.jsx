import React, { useState } from 'react';
import { loginWithGoogle, loginWithEmailPassword, registerWithEmailPassword } from '../../services/authService';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const reset = () => {
    setEmail(''); setPassword(''); setDisplayName(''); setError(null);
  };

  const switchMode = (m) => { setMode(m); reset(); };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        onSuccess(res.user, res.role);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Make sure popups are allowed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    try {
      let res;
      if (mode === 'signin') {
        res = await loginWithEmailPassword(email, password);
      } else {
        res = await registerWithEmailPassword(email, password, displayName);
      }
      if (res.success) {
        onSuccess(res.user, res.role);
        onClose();
      }
    } catch (err) {
      // Friendly Firebase error messages
      let msg = err.message || 'Authentication failed.';
      if (msg.includes('user-not-found')) msg = 'No account found with this email. Please sign up.';
      else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) msg = 'Incorrect password. Please try again.';
      else if (msg.includes('email-already-in-use')) msg = 'An account already exists with this email. Sign in instead.';
      else if (msg.includes('weak-password')) msg = 'Password must be at least 6 characters.';
      else if (msg.includes('invalid-email')) msg = 'Please enter a valid email address.';
      else if (msg.includes('network-request-failed') || msg.includes('auth/') === false) {
        msg = 'Firebase not configured. Please set up a real Firebase project.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card auth-modal-card--v2" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-logo">
            <span className="auth-logo-icon">🌊</span>
            <span>SAGAR-DRISHTI</span>
          </div>
          <h2 className="auth-modal-title">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="auth-modal-subtitle">
            {mode === 'signin'
              ? 'Sign in to access ocean intelligence features'
              : 'Join SAGAR-DRISHTI ocean intelligence platform'}
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="auth-mode-tabs">
          <button
            className={`auth-mode-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => switchMode('signin')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-mode-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          className="btn-google-auth"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className="auth-error-banner">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading || !email || !password}
          >
            {loading
              ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
              : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-modal-footer">
          <span>
            {mode === 'signin'
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              className="auth-link-btn"
              onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
              type="button"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </span>
          <div className="auth-footer-badge">
            🔒 Secured by Firebase Auth · Role-based by SAGAR-DRISHTI RBAC
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
