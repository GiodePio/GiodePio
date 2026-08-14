'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const colors = {
  bg: '#050508',
  panel: 'rgba(13, 13, 18, 0.7)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
};

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className="btn-smooth" style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
      background: active ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
      color: active ? colors.green : colors.textDim, fontSize: 14, cursor: 'pointer', marginBottom: 2,
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = colors.text; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textDim; } }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [editingUsername, setEditingUsername] = useState(null);
  const [usernameEditValue, setUsernameEditValue] = useState('');

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (!d.user || d.user.email?.toLowerCase().trim() !== 'lifegrading@gmail.com') {
          setError('Unauthorized - Please log in as lifegrading@gmail.com');
          setLoading(false);
          return;
        }
        fetchUsers();
      })
      .catch(() => { setError('Auth check failed'); setLoading(false); });
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        if (data.columns_missing) {
          setError('Warning: Database columns not found. Run schema.sql in Supabase SQL Editor.');
        }
      } else {
        setError(data.error || 'Failed to load users: ' + (data.details || res.statusText));
      }
    } catch (e) {
      setError('Network error: ' + (e.message || 'Failed to load users'));
    }
    setLoading(false);
  }

  const handleTogglePro = async (email, currentIsPro) => {
    setUpdating(`toggle_${email}`);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, is_pro: !currentIsPro }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.email.toLowerCase() === email.toLowerCase() ? { ...u, is_pro: !currentIsPro, free_uses_remaining: !currentIsPro ? null : 3 } : u
        ));
      } else {
        setError(`Failed to update Pro status: ${data.error || res.statusText}`);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    }
    setUpdating(null);
  };

  const handleAdjustUses = async (email, action) => {
    setUpdating(`${email}_${action}`);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action }),
      });
      const data = await res.json();
      if (res.ok) {
        const newUses = data.free_uses_remaining;
        setUsers(prev => prev.map(u =>
          u.email.toLowerCase() === email.toLowerCase() ? { ...u, free_uses_remaining: newUses } : u
        ));
      } else {
        setError(`Failed to adjust uses: ${data.error || res.statusText}`);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    }
    setUpdating(null);
  };

  const handleDeleteUser = async (email) => {
    if (!confirm(`Delete user ${email}? This cannot be undone. Uses will NOT be refunded.`)) return;
    setUpdating(`delete_${email}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.email !== email));
      } else {
        setError(`Failed to delete: ${data.error || res.statusText}`);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    }
    setUpdating(null);
  };

  const saveUsernameEdit = async (email, value) => {
    if (!value.trim()) return;
    setUpdating(`username_${email}`);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, display_name: value.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.email.toLowerCase() === email.toLowerCase() ? { ...u, display_name: value.trim() } : u
        ));
      } else {
        setError(`Failed to update username: ${data.error || res.statusText}`);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    }
    setUpdating(null);
    setEditingUsername(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 10, 16, 0.8)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" onClick={() => router.push('/dashboard/grabs')} />
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
          <NavItem icon="👥" label="Admin" active onClick={() => {}} />
          <NavItem icon="📋" label="Plans" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⭐" label="+Rep" onClick={() => router.push('/dashboard/rep')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
          <NavItem icon="🖥" label="Remote Control" onClick={() => router.push('/dashboard/remote-control')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" onClick={() => router.push('/dashboard/settings')} />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 36px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Admin Panel</h1>
            <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4 }}>{users.length} users registered</p>
          </div>
          <button onClick={() => fetchUsers()} style={{ cursor: 'pointer', padding: '8px 16px', background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 8, fontSize: 13 }}>↻ Refresh</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid ' + colors.red, borderRadius: 8, padding: '12px 16px', color: colors.text, marginBottom: 20, fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        <div className="glass-card" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid ' + colors.border }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Username</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Pro Status</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Uses</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isPro = u.is_pro;
                const freeUses = u.free_uses_remaining;
                const displayFreeUses = isPro ? '∞ (Pro)' : (freeUses ?? 3) + ' remaining';
                const isOwner = u.email?.toLowerCase().trim() === 'lifegrading@gmail.com';

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid ' + colors.border }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: colors.text }}>
                      {u.email}
                      {isOwner && <span style={{ fontSize: 10, color: colors.green, fontWeight: 700 }}> (OWNER)</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      {editingUsername === u.email ? (
                        <input
                          type="text"
                          value={usernameEditValue}
                          onChange={e => setUsernameEditValue(e.target.value)}
                          onBlur={() => saveUsernameEdit(u.email, usernameEditValue)}
                          onKeyDown={e => { if (e.key === 'Enter') saveUsernameEdit(u.email, usernameEditValue); }}
                          placeholder="Edit username"
                          style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid ' + colors.border, borderRadius: 4, padding: '6px 10px', color: colors.text, fontSize: 12 }}
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => { setEditingUsername(u.email); setUsernameEditValue(u.display_name || ''); }}
                          style={{ cursor: 'pointer', color: colors.blue, fontSize: 13 }}
                        >
                          {u.display_name || '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {isPro ? (
                        <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: colors.green, fontSize: 11, padding: '4px 12px', borderRadius: 6, fontWeight: 700 }}>PRO</span>
                      ) : (
                        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: colors.red, fontSize: 11, padding: '4px 12px', borderRadius: 6, fontWeight: 600 }}>FREE TRIAL</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: isPro ? colors.green : colors.text }}>
                      {displayFreeUses}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {!isOwner && (
                          <>
                            <button
                              onClick={() => handleTogglePro(u.email, isPro)}
                              disabled={updating === `toggle_${u.email}`}
                              style={{
                                padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                background: isPro ? colors.red : colors.green, color: '#000',
                                opacity: updating === `toggle_${u.email}` ? 0.5 : 1,
                              }}
                            >
                              {updating === `toggle_${u.email}` ? '...' : (isPro ? 'Revoke Pro' : 'Grant Pro')}
                            </button>
                          </>
                        )}
                        {!isPro && !isOwner && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => handleAdjustUses(u.email, 'remove_use')}
                              disabled={updating === `${u.email}_remove_use`}
                              style={{
                                width: 28, height: 28, borderRadius: 5, border: '1px solid ' + colors.border,
                                background: 'rgba(239, 68, 68, 0.1)', color: colors.red, fontSize: 14, cursor: 'pointer',
                                opacity: updating === `${u.email}_remove_use` ? 0.5 : 1,
                              }}
                            >−</button>
                            <button
                              onClick={() => handleAdjustUses(u.email, 'add_use')}
                              disabled={updating === `${u.email}_add_use`}
                              style={{
                                width: 28, height: 28, borderRadius: 5, border: '1px solid ' + colors.border,
                                background: 'rgba(34, 197, 94, 0.1)', color: colors.green, fontSize: 14, cursor: 'pointer',
                                opacity: updating === `${u.email}_add_use` ? 0.5 : 1,
                              }}
                            >+</button>
                          </div>
                        )}
                        {!isOwner && (
                          <button
                            onClick={() => handleDeleteUser(u.email)}
                            disabled={updating === `delete_${u.email}`}
                            style={{
                              padding: '6px 10px', borderRadius: 6, border: '1px solid ' + colors.red,
                              background: 'transparent', color: colors.red, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              opacity: updating === `delete_${u.email}` ? 0.5 : 1,
                            }}
                          >
                            {updating === `delete_${u.email}` ? '...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: colors.textDim, fontSize: 13 }}>No users found</div>
          )}
        </div>
      </main>
    </div>
  );
}