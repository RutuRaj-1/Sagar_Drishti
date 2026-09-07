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
          <div className="brand-logo-icon">🌊</div>
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
              <span className="pill-role">{currentRole === 'forecaster' ? '⚓ Duty Forecaster' : '🎓 Student'}</span>
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
              <div className="mode-card-icon">🎓</div>
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
              <div className="mode-card-icon">⚓</div>
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
            <div className="demo-banner-title">🔑 Quick Demo One-Click Access</div>
            <div className="demo-buttons-row">
              <button 
                className="demo-chip-btn student-chip"
                onClick={() => onOpenAuth('quick_student')}
              >
                <span className="chip-icon">🎓</span> Demo Student Login (student / student123)
              </button>
              <button 
                className="demo-chip-btn forecaster-chip"
                onClick={() => onOpenAuth('quick_forecaster')}
              >
                <span className="chip-icon">⚓</span> Demo Duty Forecaster Login (forecaster / forecast123)
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
