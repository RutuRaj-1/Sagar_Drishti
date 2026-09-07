import React, { useState } from 'react';
import { loginWithCredentials, DEMO_CREDENTIALS } from '../../services/authService';

const AuthModal = ({ isOpen, onClose, initialRole = 'student', onSuccess }) => {
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

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
