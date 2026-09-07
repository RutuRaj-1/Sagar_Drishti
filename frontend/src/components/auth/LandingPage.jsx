import React, { useState } from 'react';
import { getCurrentRole, DEMO_CREDENTIALS } from '../../services/authService';

const LandingPage = ({ onSelectMode, onOpenAuth }) => {
  const currentRole = getCurrentRole();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="landing-container">
      {/* Background Image Hero Layer */}
      <div 
        className="landing-bg-image"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(5, 15, 30, 0.45), rgba(3, 10, 22, 0.85)), url('/landing-bg.jpg')`
        }}
      />

      {/* Floating Animated Overlay Gradients */}
      <div className="landing-stars-overlay" />

      {/* Top Header Navigation */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="brand-logo-icon">SD</div>
          <div>
            <div className="brand-title">SAGAR-DRISHTI</div>
            <div className="brand-sub">सागर-दृष्टि • INCOIS Ocean Intelligence</div>
          </div>
        </div>

        <nav className="landing-nav-links">
          <button 
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-btn ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            Capabilities
          </button>
          <button 
            className={`nav-btn ${activeTab === 'datasets' ? 'active' : ''}`}
            onClick={() => setActiveTab('datasets')}
          >
            Data Sources
          </button>
        </nav>

        <div className="landing-header-actions">
          {currentRole !== 'guest' ? (
            <div className="logged-in-pill">
              <span className="pill-role">{currentRole === 'forecaster' ? 'Duty Forecaster' : 'Student'}</span>
              <button className="btn-secondary-sm" onClick={() => onOpenAuth()}>Change Account</button>
            </div>
          ) : (
            <div className="auth-btn-group">
              <button className="btn-sign-in" onClick={() => onOpenAuth('login')}>
                Sign In
              </button>
              <button className="btn-quick-demo" onClick={() => onOpenAuth('demo')}>
                Quick Demo
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="landing-main-content">
        <section className="landing-hero-section">
          <div className="hero-badge">
            <span className="badge-pulse">● LIVE DATA</span>
            <span>SIH 26067 • Copernicus Marine & INCOIS Observation Network</span>
          </div>

          <h1 className="landing-hero-title">
            Unveiling India's Ocean Depths Through <span className="text-gradient">3D Intelligence</span>
          </h1>

          <p className="landing-hero-description">
            Interactive 4D visualization, observational data synthesis, and AI-driven ocean analytics for Indian Ocean literacy and operational duty forecasting.
          </p>

          {/* Mode Selector Cards */}
          <div className="mode-cards-grid">
            {/* Student & Explorer Mode Card */}
            <div 
              className="mode-card student-card"
              onClick={() => onSelectMode('explore')}
            >
              <div className="mode-card-badge">Public & Educational</div>
              <h2 className="mode-card-title">Student / Explorer Mode</h2>
              <p className="mode-card-desc">
                Story-driven ocean literacy workspace. Explore 3D SST & salinity animations, track marine species, view guided climate tours, and converse with our educational AI chatbot.
              </p>
              
              <ul className="mode-card-features">
                <li><span className="check">✓</span> 3D Indian Ocean Interactive Globe & Layers</li>
                <li><span className="check">✓</span> Guided Ocean Climate & Cyclone Stories</li>
                <li><span className="check">✓</span> Educational AI Chatbot ("Ocean Explorer")</li>
                <li><span className="check">✓</span> Real-Time ARGO Float & Species Tracking</li>
              </ul>

              <div className="mode-card-footer">
                <button className="mode-launch-btn btn-explore">
                  Enter Explorer Workspace &rarr;
                </button>
                <span className="access-note">Open to All Visitors (No Login Required)</span>
              </div>
            </div>

            {/* Forecaster & Researcher Mode Card */}
            <div 
              className="mode-card forecaster-card"
              onClick={() => {
                if (currentRole === 'forecaster') {
                  onSelectMode('forecaster');
                } else {
                  onOpenAuth('login', 'forecaster');
                }
              }}
            >
              <div className="mode-card-badge pro-badge">Scientific & Operational</div>
              <h2 className="mode-card-title">Forecaster / Researcher Mode</h2>
              <p className="mode-card-desc">
                Deep decision-support system for oceanographers and duty forecasters. Perform skill score validation, Pearson correlation analysis, 4D volume depth slicers, and HF Radar stream analysis.
              </p>

              <ul className="mode-card-features">
                <li><span className="check">✓</span> 4D Volumetric Depth Slicing & Subsurface Salinity</li>
                <li><span className="check">✓</span> Model vs RAMA Buoy Pearson Correlation Matrix</li>
                <li><span className="check">✓</span> Operational Decision Support AI ("Dr. Sagar")</li>
                <li><span className="check">✓</span> INCOIS HF Radar & Glider Surface Currents</li>
              </ul>

              <div className="mode-card-footer">
                <button className="mode-launch-btn btn-forecaster">
                  {currentRole === 'forecaster' ? 'Enter Forecaster Console →' : 'Authenticate as Forecaster →'}
                </button>
                <span className="access-note">Requires Forecaster Role Credentials</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="demo-credentials-banner">
            <div className="demo-banner-title">Quick Auth & Demo Access</div>
            <div className="demo-buttons-row">
              <button 
                className="demo-chip-btn google-chip"
                onClick={() => onOpenAuth('google', 'student')}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" style={{ marginRight: 4 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Sign in with Google (Firebase)
              </button>
              <button 
                className="demo-chip-btn student-chip"
                onClick={() => onOpenAuth('quick_student')}
              >
                Demo Student (student / student123)
              </button>
              <button 
                className="demo-chip-btn forecaster-chip"
                onClick={() => onOpenAuth('quick_forecaster')}
              >
                Demo Forecaster (forecaster / forecast123)
              </button>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="landing-stats-row">
          <div className="stat-card">
            <div className="stat-value">5°N - 22°N</div>
            <div className="stat-label">Bay of Bengal & Arabian Sea Domain</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">4D Volumetric</div>
            <div className="stat-label">0m to 1000m Depth Depth Slices</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">CMEMS & INCOIS</div>
            <div className="stat-label">Validated High-Res Reanalysis Data</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">Dual-Role AI</div>
            <div className="stat-label">Tailored Explorer & Forecaster Copilot</div>
          </div>
        </section>
      </main>

      {/* Landing Footer */}
      <footer className="landing-footer">
        <div className="footer-left">
          <span>SAGAR-DRISHTI सागर-दृष्टि • Smart India Hackathon 2026 (Problem ID 26067)</span>
        </div>
        <div className="footer-right">
          <span>INCOIS • Ministry of Earth Sciences • Govt of India</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
