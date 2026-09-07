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
          {currentMode === 'explore' ? 'Student Workspace' : 'Forecaster Console'}
        </span>
      </div>

      {/* Account / Role Badge */}
      <div className="user-profile-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
        <div className="user-avatar-circle">
          {user ? 'U' : role === 'forecaster' ? 'FC' : 'ST'}
        </div>
        <div className="user-info-text">
          <span className="user-name">{user ? user.name : 'Guest Visitor'}</span>
          <span className="user-role-tag">
            {role === 'forecaster' ? 'Forecaster' : role === 'student' ? 'Student' : 'Guest'}
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
                onOpenAuth('login');
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
