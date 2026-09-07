import React, { useState } from 'react';
import { getStoredUser, getCurrentRole, logout } from '../../services/authService';

const UserHeaderMenu = ({ currentMode, onNavigateMode, onOpenAuth, onLogoutSuccess }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = getStoredUser();
  const role = getCurrentRole();

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    if (onLogoutSuccess) onLogoutSuccess();
  };

  return (
    <div className="user-header-menu">
      {/* Mode Status Pill */}
      <div className="header-mode-indicator">
        <span className="mode-dot">●</span>
        <span className="mode-name">
          {currentMode === 'explore' ? 'Student Workspace' : currentMode === 'admin' ? 'Admin Console' : 'Forecaster Console'}
        </span>
      </div>

      {/* Account / Role Badge */}
      <div className="user-profile-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
        <div className="user-avatar-circle" style={{
          background: role === 'admin' ? '#8b5cf6' : role === 'forecaster' ? '#f59e0b' : '#0284c7'
        }}>
          {role === 'admin' ? '🛡️' : role === 'forecaster' ? '⚓' : user ? '🎓' : 'ST'}
        </div>
        <div className="user-info-text">
          <span className="user-name">{user ? user.name : 'Guest Visitor'}</span>
          <span className="user-role-tag" style={{
            color: role === 'admin' ? '#a78bfa' : role === 'forecaster' ? '#f59e0b' : '#38bdf8'
          }}>
            {role === 'admin' ? 'Admin' : role === 'forecaster' ? 'Forecaster' : role === 'student' ? 'Student' : 'Guest'}
          </span>
        </div>
        <span className="dropdown-arrow">{dropdownOpen ? '^' : 'v'}</span>
      </div>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="user-dropdown-menu" onClick={(e) => e.stopPropagation()}>
          <div className="dropdown-header">
            <div className="dd-user-title">{user ? user.title : 'Public Explorer'}</div>
            <div className="dd-user-email">{user ? user.email : 'guest@sagar-drishti.in'}</div>
          </div>

          <div className="dropdown-divider" />

          <div className="dropdown-section-title">NAVIGATE WORKSPACES</div>

          <button 
            className={`dd-item ${currentMode === 'explore' ? 'active-mode' : ''}`}
            onClick={() => {
              onNavigateMode('explore');
              setDropdownOpen(false);
            }}
          >
            <div>
              <div className="dd-item-title">Student / Explorer Mode</div>
              <div className="dd-item-desc">Educational story-driven 3D ocean literacy</div>
            </div>
          </button>

          {/* Forecaster Mode: ONLY visible to Forecasters and Admins */}
          {(role === 'forecaster' || role === 'admin') && (
            <button 
              className={`dd-item ${currentMode === 'forecaster' ? 'active-mode' : ''}`}
              onClick={() => {
                onNavigateMode('forecaster');
                setDropdownOpen(false);
              }}
            >
              <div>
                <div className="dd-item-title">Forecaster / Researcher Mode</div>
                <div className="dd-item-desc">4D depth slices, skill score & AI validation</div>
              </div>
            </button>
          )}

          {/* Admin Panel: ONLY visible to Admins */}
          {role === 'admin' && (
            <button 
              className={`dd-item ${currentMode === 'admin' ? 'active-mode' : ''}`}
              onClick={() => {
                onNavigateMode('admin');
                setDropdownOpen(false);
              }}
              style={{ borderLeft: '3px solid #8b5cf6' }}
            >
              <div>
                <div className="dd-item-title" style={{ color: '#a78bfa' }}>🛡️ Admin Panel</div>
                <div className="dd-item-desc">Manage user roles & RBAC database</div>
              </div>
            </button>
          )}

          <button 
            className="dd-item"
            onClick={() => {
              onNavigateMode('landing');
              setDropdownOpen(false);
            }}
          >
            <div>
              <div className="dd-item-title">Landing Page Overview</div>
              <div className="dd-item-desc">Return to main SAGAR-DRISHTI hub</div>
            </div>
          </button>

          <div className="dropdown-divider" />

          {role !== 'guest' ? (
            <button className="dd-item logout-item" onClick={handleLogout}>
              <span className="dd-item-title">Sign Out Account</span>
            </button>
          ) : (
            <button 
              className="dd-item login-item"
              onClick={() => {
                setDropdownOpen(false);
                onOpenAuth();
              }}
            >
              <span className="dd-item-title">Sign In / Switch Role</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UserHeaderMenu;
