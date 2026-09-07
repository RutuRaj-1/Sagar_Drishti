import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllUsers,
  setUserRole,
  getRoleAssignments,
  grantRoleByEmail,
  revokeRoleAssignment,
  isAdminEmail,
} from '../../services/firestoreService';
import { getStoredUser, logout } from '../../services/authService';

const ROLES = ['student', 'forecaster', 'admin'];

const ROLE_ICON = { student: '🎓', forecaster: '⚓', admin: '🛡️' };

const AdminPanel = ({ onGoBack, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [changed, setChanged] = useState({});
  const [saveStatus, setSaveStatus] = useState({});
  const [search, setSearch] = useState('');
  const [grantEmail, setGrantEmail] = useState('');
  const [grantRole, setGrantRole] = useState('forecaster');
  const [granting, setGranting] = useState(false);
  const [grantMessage, setGrantMessage] = useState(null);

  const currentUser = getStoredUser();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const [userResult, assignmentResult] = await Promise.all([
      getAllUsers(),
      getRoleAssignments(),
    ]);

    const order = { admin: 0, forecaster: 1, student: 2 };
    const list = [...userResult.users].sort(
      (a, b) => (order[a.role] ?? 3) - (order[b.role] ?? 3)
    );

    setUsers(list);
    setAssignments(assignmentResult.assignments);
    setLoadError(userResult.error || assignmentResult.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRoleChange = (uid, newRole) => {
    setChanged((prev) => ({ ...prev, [uid]: newRole }));
  };

  const clearStatusLater = (uid, delay) => {
    setTimeout(() => setSaveStatus((prev) => {
      const next = { ...prev };
      delete next[uid];
      return next;
    }), delay);
  };

  const handleSave = async (user) => {
    const newRole = changed[user.id];
    if (!newRole || newRole === user.role) return;

    setSaving((prev) => ({ ...prev, [user.id]: true }));
    const result = await setUserRole(user.id, newRole);
    setSaving((prev) => ({ ...prev, [user.id]: false }));

    if (result.ok) {
      setSaveStatus((prev) => ({ ...prev, [user.id]: { kind: 'saved' } }));
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      setChanged((prev) => { const n = { ...prev }; delete n[user.id]; return n; });
      clearStatusLater(user.id, 2000);
    } else {
      setSaveStatus((prev) => ({ ...prev, [user.id]: { kind: 'error', message: result.error } }));
      clearStatusLater(user.id, 6000);
    }
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    const email = grantEmail.trim().toLowerCase();
    if (!email) return;

    if (isAdminEmail(email)) {
      setGrantMessage({ kind: 'error', text: `${email} is a built-in project administrator and always signs in as admin.` });
      return;
    }

    setGranting(true);
    const result = await grantRoleByEmail(email, grantRole, currentUser?.email || '');
    setGranting(false);

    if (!result.ok) {
      setGrantMessage({ kind: 'error', text: result.error });
      return;
    }

    setGrantEmail('');
    setGrantMessage({
      kind: 'ok',
      text: result.applied === 'immediate'
        ? `${email} is now a ${grantRole}. The change applies on their next login.`
        : `${email} has not signed in yet — they will become a ${grantRole} on first sign-in.`,
    });
    loadUsers();
  };

  const handleRevoke = async (email) => {
    const result = await revokeRoleAssignment(email);
    if (result.ok) {
      setAssignments((prev) => prev.filter((a) => a.id !== email));
    } else {
      setGrantMessage({ kind: 'error', text: result.error });
    }
  };

  const filtered = users.filter((u) =>
    !search ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total Users', value: users.length, key: 'total' },
    { label: 'Students', value: users.filter((u) => u.role === 'student').length, key: 'student' },
    { label: 'Forecasters', value: users.filter((u) => u.role === 'forecaster').length, key: 'forecaster' },
    { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, key: 'admin' },
  ];

  return (
    <div className="admin-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">🛡️</div>
          <div className="brand-text">
            <h1>Admin <span className="accent">Control</span></h1>
            <div className="subtitle">SAGAR-DRISHTI · ROLE-BASED ACCESS CONTROL</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="admin-signed-in">
            Signed in as <strong>{currentUser?.email || '—'}</strong>
          </span>
          <button className="btn btn-secondary" onClick={loadUsers}>↻ Refresh</button>
          <button className="btn btn-secondary" onClick={onGoBack}>← Workspace</button>
          <button
            className="btn admin-btn-danger"
            onClick={async () => {
              if (onLogout) {
                onLogout();
              } else {
                await logout();
                onGoBack();
              }
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="admin-body">
        <div className="admin-stats">
          {stats.map((s) => (
            <div key={s.key} className={`admin-stat admin-stat-${s.key}`}>
              <div className="admin-stat-value">{s.value}</div>
              <div className="admin-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {loadError && (
          <div className="admin-alert admin-alert-error">
            <strong>Firestore unavailable — the user list cannot be loaded.</strong>
            <span>{loadError}</span>
            <span>
              Open the Firebase console for project <code>sagar-drishti</code> → Build → Firestore Database →
              Create database, then allow authenticated access to the <code>users</code> and
              <code> roleAssignments</code> collections. Accounts appear here after their first sign-in once the
              database exists.
            </span>
          </div>
        )}

        <section className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>Grant Access</h2>
              <p>Assign a role by email. Works even before that person has ever signed in.</p>
            </div>
          </div>
          <form className="admin-grant-form" onSubmit={handleGrant}>
            <input
              className="admin-input"
              type="email"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="person@example.com"
            />
            <select
              className="admin-input admin-select"
              value={grantRole}
              onChange={(e) => setGrantRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <button className="btn btn-primary" type="submit" disabled={granting || !grantEmail.trim()}>
              {granting ? 'Granting…' : 'Grant Role'}
            </button>
          </form>
          {grantMessage && (
            <div className={`admin-alert ${grantMessage.kind === 'ok' ? 'admin-alert-ok' : 'admin-alert-error'}`}>
              {grantMessage.text}
            </div>
          )}

          {assignments.length > 0 && (
            <div className="admin-pending">
              <div className="admin-pending-title">Pending invitations</div>
              {assignments.map((a) => (
                <div className="admin-pending-row" key={a.id}>
                  <span className="admin-pending-email">{a.email || a.id}</span>
                  <span className={`admin-role-pill admin-role-${a.role}`}>
                    {ROLE_ICON[a.role]} {a.role}
                  </span>
                  <button className="btn btn-secondary admin-btn-sm" onClick={() => handleRevoke(a.id)}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>User Management</h2>
              <p>
                Roles apply on the user&apos;s next login. <strong>Student</strong> → Explorer Module ·{' '}
                <strong>Forecaster</strong> → Forecaster Console + Live Data Pipeline · <strong>Admin</strong> →
                every module plus this panel.
              </p>
            </div>
            <input
              className="admin-input admin-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or name…"
            />
          </div>

          {loading ? (
            <div className="admin-empty">Loading users from Firestore…</div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">
              {users.length === 0
                ? loadError
                  ? 'User list could not be read — see the Firestore error above.'
                  : 'No users yet. Accounts appear here after their first sign-in.'
                : 'No users match your search.'}
            </div>
          ) : (
            <div className="admin-table">
              <div className="admin-row admin-row-head">
                <div>User</div>
                <div>Email</div>
                <div>Current Role</div>
                <div>Change To</div>
                <div>Action</div>
              </div>

              {filtered.map((user) => {
                const pendingRole = changed[user.id];
                const isSaving = saving[user.id];
                const status = saveStatus[user.id];
                const isCurrentUser = user.id === currentUser?.uid;
                const locked = isAdminEmail(user.email);

                return (
                  <div className={`admin-row${isCurrentUser ? ' admin-row-self' : ''}`} key={user.id}>
                    <div className="admin-user">
                      <span className="admin-user-icon">{ROLE_ICON[user.role] || ROLE_ICON.student}</span>
                      <div>
                        <div className="admin-user-name">
                          {user.displayName || user.email?.split('@')[0] || 'Unknown'}
                          {isCurrentUser && <span className="admin-you">YOU</span>}
                        </div>
                        <div className="admin-uid">UID {user.id?.slice(0, 12)}…</div>
                      </div>
                    </div>

                    <div className="admin-email">{user.email || '—'}</div>

                    <div>
                      <span className={`admin-role-pill admin-role-${user.role || 'student'}`}>
                        {user.role || 'student'}
                      </span>
                    </div>

                    <div>
                      <select
                        className="admin-input admin-select"
                        value={pendingRole ?? user.role ?? 'student'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={isSaving || locked}
                        title={locked ? 'Built-in project administrator' : undefined}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-action">
                      {locked ? (
                        <span className="admin-note">Locked</span>
                      ) : status?.kind === 'saved' ? (
                        <span className="admin-ok">✓ Saved</span>
                      ) : status?.kind === 'error' ? (
                        <span className="admin-err" title={status.message}>✗ Failed</span>
                      ) : (
                        <button
                          className="btn btn-primary admin-btn-sm"
                          onClick={() => handleSave(user)}
                          disabled={isSaving || !pendingRole || pendingRole === user.role}
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
        </section>

        <div className="admin-footer">SAGAR-DRISHTI Admin Panel · SIH 26067 · Firebase Authentication + Firestore</div>
      </div>
    </div>
  );
};

export default AdminPanel;
