import React, { useEffect, useState, useCallback } from 'react';
import { getAllUsers, setUserRole } from '../../services/firestoreService';
import { getStoredUser, logout } from '../../services/authService';

const ROLES = ['student', 'forecaster', 'admin'];

const ROLE_COLORS = {
  student: { bg: '#0ea5e920', border: '#0ea5e9', text: '#0ea5e9' },
  forecaster: { bg: '#f59e0b20', border: '#f59e0b', text: '#f59e0b' },
  admin: { bg: '#8b5cf620', border: '#8b5cf6', text: '#8b5cf6' },
};

const AdminPanel = ({ onGoBack, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [changed, setChanged] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [search, setSearch] = useState('');

  const currentUser = getStoredUser();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const list = await getAllUsers();
    // Sort: admins first, then forecasters, then students
    list.sort((a, b) => {
      const order = { admin: 0, forecaster: 1, student: 2 };
      return (order[a.role] ?? 3) - (order[b.role] ?? 3);
    });
    setUsers(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = (uid, newRole) => {
    setChanged((prev) => ({ ...prev, [uid]: newRole }));
  };

  const handleSave = async (user) => {
    const newRole = changed[user.id];
    if (!newRole || newRole === user.role) return;

    setSaving((prev) => ({ ...prev, [user.id]: true }));
    const ok = await setUserRole(user.id, newRole);
    setSaving((prev) => ({ ...prev, [user.id]: false }));

    if (ok) {
      setSaveStatus((prev) => ({ ...prev, [user.id]: 'saved' }));
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
      );
      setChanged((prev) => { const n = { ...prev }; delete n[user.id]; return n; });
      setTimeout(() => setSaveStatus((prev) => { const n = { ...prev }; delete n[user.id]; return n; }), 2000);
    } else {
      setSaveStatus((prev) => ({ ...prev, [user.id]: 'error' }));
      setTimeout(() => setSaveStatus((prev) => { const n = { ...prev }; delete n[user.id]; return n; }), 3000);
    }
  };

  const filtered = users.filter((u) =>
    !search ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    students: users.filter((u) => u.role === 'student').length,
    forecasters: users.filter((u) => u.role === 'forecaster').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #0f172a 50%, #1a0a2e 100%)',
      color: '#e2e8f0',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(15,23,42,0.95)',
        borderBottom: '1px solid rgba(139,92,246,0.3)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', gap: 16, height: 60,
        backdropFilter: 'blur(12px)',
      }}>
        <button
          onClick={onGoBack}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            color: '#94a3b8', borderRadius: 8, padding: '6px 14px',
            cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🛡️</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#f1f5f9' }}>Admin Control Panel</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>SAGAR-DRISHTI · Role-Based Access Control</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Signed in as: <span style={{ color: '#8b5cf6' }}>{currentUser?.email}</span>
          </span>
          <button
            onClick={loadUsers}
            style={{
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)',
              color: '#a78bfa', borderRadius: 8, padding: '6px 14px',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            ↻ Refresh
          </button>
          <button
            onClick={async () => {
              if (onLogout) {
                onLogout();
              } else {
                await logout();
                onGoBack();
              }
            }}
            style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              color: '#f87171', borderRadius: 8, padding: '6px 14px',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Users', value: stats.total, color: '#e2e8f0', icon: '👥' },
            { label: 'Students', value: stats.students, color: '#0ea5e9', icon: '🎓' },
            { label: 'Forecasters', value: stats.forecasters, color: '#f59e0b', icon: '⚓' },
            { label: 'Admins', value: stats.admins, color: '#8b5cf6', icon: '🛡️' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>User Management</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Change user roles to control access. Changes take effect on next login.
            </p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '8px 14px', color: '#e2e8f0', fontSize: 13, width: 240,
              outline: 'none',
            }}
          />
        </div>

        {/* Info Banner */}
        <div style={{
          background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: 10, padding: '12px 18px', marginBottom: 20, fontSize: 12.5,
          color: '#a78bfa', display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span>ℹ️</span>
          <span>
            Role changes are saved to Firestore immediately. The user will be routed to the correct module on their
            next login. <strong>Student</strong> → Explorer Module · <strong>Forecaster</strong> → Forecaster Console · <strong>Admin</strong> → This panel + full access.
          </span>
        </div>

        {/* Users Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌊</div>
            Loading users from Firestore…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
            {users.length === 0
              ? 'No users found. Users appear here after their first sign-in.'
              : 'No users match your search.'}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {/* Table Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1.2fr 140px 120px 110px',
              padding: '12px 20px', background: 'rgba(255,255,255,0.05)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <div>User</div>
              <div>Email</div>
              <div>Current Role</div>
              <div>Change To</div>
              <div>Action</div>
            </div>

            {/* Table Rows */}
            {filtered.map((user, i) => {
              const rc = ROLE_COLORS[user.role] || ROLE_COLORS.student;
              const pendingRole = changed[user.id];
              const isSaving = saving[user.id];
              const status = saveStatus[user.id];
              const isCurrentUser = user.id === currentUser?.uid;

              return (
                <div
                  key={user.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 1.2fr 140px 120px 110px',
                    padding: '14px 20px',
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    alignItems: 'center',
                    background: isCurrentUser ? 'rgba(139,92,246,0.05)' : 'transparent',
                    transition: 'background 0.2s',
                  }}
                >
                  {/* Name */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>
                        {user.role === 'admin' ? '🛡️' : user.role === 'forecaster' ? '⚓' : '🎓'}
                      </span>
                      {user.displayName || user.email?.split('@')[0] || 'Unknown'}
                      {isCurrentUser && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: '#8b5cf6',
                          background: 'rgba(139,92,246,0.2)', padding: '2px 6px', borderRadius: 4,
                        }}>YOU</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>UID: {user.id?.slice(0, 12)}…</div>
                  </div>

                  {/* Email */}
                  <div style={{ fontSize: 13, color: '#94a3b8', wordBreak: 'break-all' }}>
                    {user.email || '—'}
                  </div>

                  {/* Current Role Badge */}
                  <div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '4px 12px',
                      borderRadius: 20, border: `1px solid ${rc.border}`,
                      background: rc.bg, color: rc.text, textTransform: 'capitalize',
                    }}>
                      {user.role || 'student'}
                    </span>
                  </div>

                  {/* Role Dropdown */}
                  <div>
                    <select
                      value={pendingRole ?? user.role ?? 'student'}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={isSaving}
                      style={{
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#e2e8f0', borderRadius: 7, padding: '6px 10px',
                        fontSize: 12, cursor: 'pointer', width: '100%', outline: 'none',
                      }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} style={{ background: '#1e293b' }}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Save Button */}
                  <div>
                    {status === 'saved' ? (
                      <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700 }}>✓ Saved</span>
                    ) : status === 'error' ? (
                      <span style={{ color: '#ef4444', fontSize: 12 }}>✗ Error</span>
                    ) : (
                      <button
                        onClick={() => handleSave(user)}
                        disabled={isSaving || !pendingRole || pendingRole === user.role}
                        style={{
                          background: (!pendingRole || pendingRole === user.role)
                            ? 'rgba(255,255,255,0.05)'
                            : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                          border: 'none', color: (!pendingRole || pendingRole === user.role) ? '#475569' : '#fff',
                          borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 700,
                          cursor: (!pendingRole || pendingRole === user.role) ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isSaving ? '…' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#334155' }}>
          SAGAR-DRISHTI Admin Panel · SIH 26067 · Powered by Firebase Firestore
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
