import React from 'react';

const AccessDenied = ({ onOpenAuth, onLaunchExplorer, onGoHome }) => {
  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="denied-icon">🔒</div>
        <div className="denied-code">ERROR 403 • RESTRICTED ACCESS</div>
        <h1 className="denied-title">Duty Forecaster Role Required</h1>
        
        <p className="denied-description">
          The <strong>Forecaster & Researcher Dashboard</strong> contains high-precision operational decision support tools, 4D volumetric depth slices, model correlation metrics, and scientific decision AI.
        </p>

        <div className="denied-requirements-box">
          <div className="req-header">Access Requirements:</div>
          <ul>
            <li><span className="bullet">●</span> Registered INCOIS Oceanographer or Duty Forecaster account</li>
            <li><span className="bullet">●</span> Authenticated role token matching <code>forecaster</code></li>
          </ul>
        </div>

        <div className="denied-actions">
          <button 
            className="btn-auth-switch"
            onClick={() => onOpenAuth('login', 'forecaster')}
          >
            ⚓ Sign In as Duty Forecaster
          </button>

          <button 
            className="btn-launch-explorer"
            onClick={onLaunchExplorer}
          >
            🎓 Switch to Student / Explorer Mode
          </button>

          <button 
            className="btn-return-home"
            onClick={onGoHome}
          >
            🏠 Return to Landing Page
          </button>
        </div>

        <div className="denied-hint">
          💡 <em>Demo Credential Hint: Use <code>forecaster</code> / <code>forecast123</code> to test Forecaster Mode.</em>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
