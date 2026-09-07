import React, { useState } from 'react';
import { loginWithCredentials, loginWithGoogle, DEMO_CREDENTIALS } from '../../services/authService';

const AuthModal = ({ isOpen, onClose, initialRole = 'student', onSuccess }) => {
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogle();
      if (res.success) {
        onSuccess(res.user, 'student');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Google Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'student') {
      setUsername('student');
      setPassword('student123');
    } else {
      setUsername('forecaster');
      setPassword('forecast123');
    }
  };

  const handleQuickFill = (roleKey) => {
    const creds = DEMO_CREDENTIALS[roleKey];
    setSelectedRole(roleKey);
    setUsername(creds.username);
    setPassword(creds.password);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginWithCredentials(username, password, selectedRole);
      if (res.success) {
        onSuccess(res.user, selectedRole);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>✕</button>

        <div className="auth-modal-header">
          <div className="auth-modal-logo">🌊 SAGAR-DRISHTI</div>
          <h2 className="auth-modal-title">Authentication Portal</h2>
          <p className="auth-modal-subtitle">
            Sign in to access specialized ocean intelligence features
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="auth-role-tabs">
          <button 
            type="button"
            className={`role-tab ${selectedRole === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleChange('student')}
          >
            <span className="tab-icon">🎓</span>
            <div>
              <div className="tab-title">Student / Explorer</div>
              <div className="tab-sub">Layman & Educational</div>
            </div>
          </button>

          <button 
            type="button"
            className={`role-tab ${selectedRole === 'forecaster' ? 'active' : ''}`}
            onClick={() => handleRoleChange('forecaster')}
          >
            <span className="tab-icon">⚓</span>
            <div>
              <div className="tab-title">Duty Forecaster</div>
              <div className="tab-sub">Operational Analytics</div>
            </div>
          </button>
        </div>

        {/* Google Sign-In Option for Explorer Mode */}
        {selectedRole === 'student' && (
          <div className="google-auth-box">
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
              <span>Continue with Google (Firebase)</span>
            </button>
            <div className="auth-divider-line">
              <span>OR USE USERNAME</span>
            </div>
          </div>
        )}

        {/* One-Click Quick Fill Demo Buttons */}
        <div className="auth-quick-fill-box">
          <div className="quick-fill-label">⚡ One-Click Demo Credentials:</div>
          <div className="quick-fill-btns">
            <button 
              type="button"
              className="btn-quick-fill student-fill"
              onClick={() => handleQuickFill('student')}
            >
              Fill Student (student / student123)
            </button>
            <button 
              type="button"
              className="btn-quick-fill forecaster-fill"
              onClick={() => handleQuickFill('forecaster')}
            >
              Fill Forecaster (forecaster / forecast123)
            </button>
          </div>
        </div>

        {error && (
          <div className="auth-error-banner">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username / INCOIS ID</label>
            <input 
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. student or forecaster"
              required
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
            />
          </div>

          <div className="auth-modal-actions">
            <button 
              type="submit" 
              className={`btn-auth-submit ${selectedRole === 'forecaster' ? 'forecaster-theme' : 'student-theme'}`}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : `Sign In as ${selectedRole === 'forecaster' ? 'Duty Forecaster' : 'Student Explorer'}`}
            </button>
          </div>
        </form>

        <div className="auth-modal-footer">
          <span>Protected by SAGAR-DRISHTI RBAC & Firebase Auth</span>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
