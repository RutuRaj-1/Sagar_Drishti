import React, { useState, useEffect } from 'react';

const FEATURES = [
  {
    icon: '🌐',
    title: '4D Volumetric Ocean Visualization',
    desc: 'Interactive 3D depth slicing from 0–5700m with temperature, salinity, and current vectors rendered via Cesium WebGL and deck.gl.',
    color: '#0ea5e9',
  },
  {
    icon: '🛰️',
    title: 'Argo Float & Glider Network',
    desc: '291+ autonomous profiling floats and 33 ocean glider missions providing real-time vertical CTD profiles across the Indian Ocean.',
    color: '#22c55e',
  },
  {
    icon: '📡',
    title: 'HF Radar & RAMA Buoy Integration',
    desc: '14 INCOIS coastal HF radar stations and 15 deep-moored RAMA buoys delivering live surface current vectors and thermistor profiles.',
    color: '#f59e0b',
  },
  {
    icon: '🤖',
    title: 'Dual-Role AI Copilot',
    desc: 'Ocean Explorer AI for student literacy and Dr. Sagar operational decision support for forecasters — tailored context per role.',
    color: '#8b5cf6',
  },
  {
    icon: '📊',
    title: 'Model vs Observed Analytics',
    desc: 'Pearson correlation matrices, bias/RMSE skill scores, and T-S water mass diagrams comparing CMEMS model with in-situ observations.',
    color: '#f43f5e',
  },
  {
    icon: '🔄',
    title: 'Automated Daily Sync Pipeline',
    desc: 'Layer-1 historical baseline (5.8 GB CMEMS 2D, 3.2 GB 4D depth) plus Layer-2 daily incremental sync — always current, offline-ready.',
    color: '#14b8a6',
  },
];

const DATASETS = [
  { name: 'CMEMS 2D Surface', value: '1,567 days', sub: '5.8 GB · 2022–2026', icon: '🌊' },
  { name: 'CMEMS 4D Depth', value: '7 months', sub: '3.2 GB · 30 depth levels', icon: '🔵' },
  { name: 'Argo Floats', value: '291 floats', sub: '765 profiles · INCOIS GDAC', icon: '🟢' },
  { name: 'Ocean Gliders', value: '33 missions', sub: '24,640 CTD obs · IOOS', icon: '🟡' },
  { name: 'HF Radar', value: '14 stations', sub: '768 current vectors · INCOIS', icon: '🔴' },
  { name: 'RAMA Buoys', value: '15 moorings', sub: 'Deep thermistor strings · PMEL', icon: '🟣' },
];

const TECH_STACK = [
  { name: 'CMEMS', role: 'Ocean Model Data', color: '#0ea5e9' },
  { name: 'INCOIS', role: 'HF Radar & Buoys', color: '#22c55e' },
  { name: 'Argo GDAC', role: 'Float Profiles', color: '#f59e0b' },
  { name: 'FastAPI', role: 'Backend API', color: '#8b5cf6' },
  { name: 'React + Vite', role: 'Frontend', color: '#38bdf8' },
  { name: 'Cesium JS', role: '3D Globe Render', color: '#f43f5e' },
  { name: 'Firebase', role: 'Auth & RBAC', color: '#fb923c' },
  { name: 'Python', role: 'Data Pipeline', color: '#facc15' },
];

const PROBLEM_POINTS = [
  'India\'s vast Exclusive Economic Zone (2.4M km²) lacks an integrated, publicly accessible 4D ocean visualization platform',
  'Operational duty forecasters lack real-time tools to correlate CMEMS model data with in-situ Argo/glider/buoy observations',
  'Ocean literacy among students and the public remains critically low despite India\'s maritime heritage',
  'No unified system exists to bridge model outputs, observational networks, and actionable decision support',
];

export default function LandingPage({ onOpenAuth, onSelectMode, currentUser, userRole = 'guest' }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#06090f', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ── Galaxy Background ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: `url('/galaxy-bg.jpg')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.35) saturate(1.4)',
      }} />
      {/* gradient veil */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1,
        background: 'linear-gradient(to bottom, rgba(6,9,15,0.3) 0%, rgba(6,9,15,0.6) 60%, rgba(6,9,15,0.97) 100%)',
      }} />

      {/* ── Sticky Navbar ─────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(6,9,15,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'all 0.3s',
        padding: '0 40px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 16, color: '#fff', boxShadow: '0 0 20px rgba(14,165,233,0.4)',
          }}>SD</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em', color: '#f1f5f9' }}>
              SAGAR-DRISHTI
            </div>
            <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.05em' }}>
              सागर-दृष्टि · INCOIS Ocean Intelligence
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {[['overview', 'Overview'], ['features', 'Features'], ['datasets', 'Datasets'], ['tech', 'Tech Stack']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                setActiveSection(id);
                document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: activeSection === id ? 'rgba(14,165,233,0.15)' : 'transparent',
                border: activeSection === id ? '1px solid rgba(14,165,233,0.4)' : '1px solid transparent',
                color: activeSection === id ? '#38bdf8' : '#94a3b8',
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* User state / Sign In button */}
        {currentUser && userRole !== 'guest' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => onSelectMode(userRole === 'forecaster' ? 'forecaster' : userRole === 'admin' ? 'admin' : 'explore')}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0d9488)',
                border: 'none', borderRadius: 10, padding: '9px 20px',
                color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
                boxShadow: '0 0 20px rgba(2,132,199,0.4)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <span>{userRole === 'forecaster' ? '⚓ Forecaster Console' : userRole === 'admin' ? '🛡️ Admin Panel' : '🎓 Open Student Explorer'}</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onOpenAuth()}
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              border: 'none', borderRadius: 10, padding: '9px 22px',
              color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer',
              boxShadow: '0 0 20px rgba(14,165,233,0.35)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Sign In / Sign Up
          </button>
        )}
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section id="section-overview" style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '100px 24px 80px' }}>
        {/* Live badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.35)',
          borderRadius: 30, padding: '6px 18px', marginBottom: 28,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600, letterSpacing: '0.05em' }}>
            LIVE · SIH 26067 · Problem ID: OCEANS-07 · Ministry of Earth Sciences
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.1,
          margin: '0 auto 24px', maxWidth: 800,
          background: 'linear-gradient(135deg, #f1f5f9 0%, #38bdf8 50%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.03em',
        }}>
          Unveiling India's Ocean Depths Through 4D Intelligence
        </h1>

        <p style={{ fontSize: 17, color: '#94a3b8', maxWidth: 680, margin: '0 auto 16px', lineHeight: 1.7 }}>
          SAGAR-DRISHTI is a production-grade Indian Ocean Intelligence Platform combining
          4D volumetric visualization, multi-source observational data synthesis, and role-aware
          AI decision support — built for INCOIS duty forecasters and ocean literacy.
        </p>
        <p style={{ fontSize: 13, color: '#475569', marginBottom: 48 }}>
          Team RutuRaj-1 · VIT · Smart India Hackathon 2026
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => onSelectMode('explore')}
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              border: 'none', borderRadius: 12, padding: '13px 30px',
              color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 0 30px rgba(14,165,233,0.4)',
            }}
          >
            🌊 Open Student Explorer Module →
          </button>
          {!currentUser || userRole === 'guest' ? (
            <button
              onClick={() => onOpenAuth()}
              style={{
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12,
                padding: '13px 30px', color: '#e2e8f0', fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
              }}
            >
              🔐 Sign In / Create Account
            </button>
          ) : (
            <button
              onClick={() => onSelectMode(userRole === 'forecaster' ? 'forecaster' : userRole === 'admin' ? 'admin' : 'explore')}
              style={{
                background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.18)', borderRadius: 12,
                padding: '13px 30px', color: '#e2e8f0', fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
              }}
            >
              👤 Signed in as {currentUser.name} ({userRole})
            </button>
          )}
        </div>

        {/* Scroll hint */}
        <div style={{ marginTop: 64, color: '#334155', fontSize: 12, animation: 'bounce 2s infinite' }}>
          ↓ Scroll to discover
        </div>
      </section>

      {/* ── Stats Banner ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '0 24px 60px' }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16,
        }}>
          {[
            { val: '6', label: 'Live Datasets' },
            { val: '5.8 GB', label: 'CMEMS 2D Archive' },
            { val: '291+', label: 'Argo Floats' },
            { val: '33', label: 'Glider Missions' },
            { val: '14', label: 'HF Radar Stations' },
            { val: '1,567', label: 'Daily Timesteps' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '20px 16px', textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#38bdf8', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem Statement ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '60px 24px', background: 'rgba(14,165,233,0.04)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>The Problem We Solve</span>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, margin: '12px 0 0', color: '#f1f5f9' }}>
              India's Ocean Intelligence Gap
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px,1fr))', gap: 16 }}>
            {PROBLEM_POINTS.map((pt, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(14,165,233,0.15)',
                borderRadius: 12, padding: '18px 20px',
              }}>
                <div style={{
                  minWidth: 28, height: 28, borderRadius: 8,
                  background: 'rgba(14,165,233,0.2)', border: '1px solid rgba(14,165,233,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 12, color: '#38bdf8',
                }}>{i + 1}</div>
                <p style={{ margin: 0, fontSize: 13.5, color: '#94a3b8', lineHeight: 1.6 }}>{pt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────── */}
      <section id="section-features" style={{ position: 'relative', zIndex: 2, padding: '80px 24px' }}
        onMouseEnter={() => setActiveSection('features')}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Platform Capabilities
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.4rem)', fontWeight: 800, margin: '12px 0 8px', color: '#f1f5f9' }}>
              What SAGAR-DRISHTI Does
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, maxWidth: 540, margin: '0 auto' }}>
              Six integrated modules covering the complete ocean intelligence lifecycle from raw data ingestion to decision support.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${f.color}25`,
                borderRadius: 16, padding: '28px 24px',
                backdropFilter: 'blur(8px)',
                transition: 'transform 0.2s, border-color 0.2s',
                cursor: 'default',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = f.color + '60';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = f.color + '25';
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `${f.color}18`, border: `1px solid ${f.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, marginBottom: 16,
                }}>{f.icon}</div>
                <h3 style={{ margin: '0 0 10px', fontSize: 15.5, fontWeight: 700, color: '#f1f5f9' }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{f.desc}</p>
                <div style={{ width: 32, height: 2, background: f.color, borderRadius: 2, marginTop: 16, opacity: 0.6 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture Section ─────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '60px 24px', background: 'rgba(139,92,246,0.04)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            System Architecture
          </span>
          <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, margin: '12px 0 40px', color: '#f1f5f9' }}>
            3-Layer Intelligence Pipeline
          </h2>
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { num: '01', title: 'Data Acquisition', desc: 'CMEMS API, Argo GDAC, INCOIS HF Radar, IOOS ERDDAP, RAMA PMEL — automated daily sync pipeline with historical baseline', color: '#0ea5e9', icon: '🛰️' },
              { num: '02', title: 'Processing Engine', desc: 'FastAPI backend with NetCDF parsing, spatial interpolation, model-observation co-location, Pearson correlation engine', color: '#8b5cf6', icon: '⚙️' },
              { num: '03', title: 'Intelligence Layer', desc: 'React + Cesium 3D visualization, role-aware AI copilot, real-time analytics dashboard, Firebase RBAC access control', color: '#22c55e', icon: '🧠' },
            ].map((step, i, arr) => (
              <React.Fragment key={step.num}>
                <div style={{
                  flex: '1 1 220px', maxWidth: 280,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${step.color}30`,
                  borderRadius: 16, padding: '28px 20px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{step.icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: step.color, letterSpacing: '0.1em', marginBottom: 8 }}>
                    LAYER {step.num}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', marginBottom: 10 }}>{step.title}</div>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</p>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: '#334155', fontSize: 20 }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Datasets Grid ─────────────────────────────────────────────── */}
      <section id="section-datasets" style={{ position: 'relative', zIndex: 2, padding: '80px 24px' }}
        onMouseEnter={() => setActiveSection('datasets')}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Scientific Data Sources
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, margin: '12px 0 8px', color: '#f1f5f9' }}>
              6 Live Ocean Datasets
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              All data is sourced from official scientific providers — no mock data, no placeholders.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16 }}>
            {DATASETS.map((d) => (
              <div key={d.name} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'center',
              }}>
                <div style={{ fontSize: 28 }}>{d.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{d.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#38bdf8', margin: '2px 0' }}>{d.value}</div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{d.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ────────────────────────────────────────────────── */}
      <section id="section-tech" style={{ position: 'relative', zIndex: 2, padding: '60px 24px 80px', background: 'rgba(255,255,255,0.02)' }}
        onMouseEnter={() => setActiveSection('tech')}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Technology Stack
          </span>
          <h2 style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 800, margin: '12px 0 36px', color: '#f1f5f9' }}>
            Built With Production-Grade Tools
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {TECH_STACK.map((t) => (
              <div key={t.name} style={{
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${t.color}30`,
                borderRadius: 12, padding: '12px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 100,
              }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: t.color }}>{t.name}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Access Info ─────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '60px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 800, margin: '0 0 8px', color: '#f1f5f9' }}>
              Role-Based Access
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Sign in with your Google account. Role is assigned by the system admin.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16 }}>
            {[
              { role: 'Student / Explorer', icon: '🎓', color: '#0ea5e9', desc: 'Ocean literacy workspace with guided tours, 2D/3D maps, Argo float explorer, and Ocean AI chatbot. Default for all @gmail.com users.' },
              { role: 'Forecaster', icon: '⚓', color: '#f59e0b', desc: 'Full analytics suite: 4D depth slicer, Pearson skill scores, HF Radar currents, RAMA buoy profiles, Dr. Sagar AI copilot.' },
              { role: 'Admin', icon: '🛡️', color: '#8b5cf6', desc: 'User management panel. Assign roles to any registered user. Changes take effect on next login.' },
            ].map((r) => (
              <div key={r.role} style={{
                background: `${r.color}0a`, border: `1px solid ${r.color}30`,
                borderRadius: 16, padding: '24px 20px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{r.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: r.color, marginBottom: 8 }}>{r.role}</div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', lineHeight: 1.6 }}>{r.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <button
              onClick={() => onOpenAuth()}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                border: 'none', borderRadius: 12, padding: '13px 36px',
                color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                boxShadow: '0 0 30px rgba(14,165,233,0.35)',
              }}
            >
              Sign In / Sign Up to Get Started →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{
        position: 'relative', zIndex: 2,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 40px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
        background: 'rgba(6,9,15,0.8)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: 12, color: '#334155' }}>
          <span style={{ color: '#475569', fontWeight: 600 }}>SAGAR-DRISHTI सागर-दृष्टि</span>
          {' · '}Smart India Hackathon 2026 · Problem ID: SIH-26067
        </div>
        <div style={{ fontSize: 12, color: '#334155' }}>
          INCOIS · Ministry of Earth Sciences · Government of India
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
      `}</style>
    </div>
  );
}
