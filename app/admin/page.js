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

const STATUS_COLORS = {
  online: colors.green,
  idle: colors.blue,
  offline: colors.textDim,
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email !== 'lifegrading@gmail.com') {
          setError('Unauthorized');
          setLoading(false);
          return;
        }
        fetchUsers();
      })
      .catch(() => { setError('Unauthorized'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      const iv = setInterval(() => setTick(t => t + 1), 30000);
      return () => clearInterval(iv);
    }
  }, [users, tick]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (e) {
      setError('Failed to load users');
    }
    setLoading(false);
  }

  const handleTogglePro = async (email, currentIsPro) => {
    setUpdating(`${email}_pro`);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, is_pro: !currentIsPro }),
      });
      const data = await res.json();
      if (res.ok) {
        const updated = users.map(u =>
          u.email === email ? { ...u, is_pro: !currentIsPro } : u
        );
        setUsers(updated);
      }
    } catch (e) { }
    setUpdating(null);
  };

  const handleAdjustUses = async (email, action) => {
    setUpdating(`${email}_${action}`);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, action }),
      });
      const data = await res.json();
      if (res.ok) {
        const newUses = data.free_uses_remaining;
        setUsers(users.map(u =>
          u.email === email ? { ...u, free_uses_remaining: newUses } : u
        ));
      }
    } catch (e) { }
    setUpdating(null);
  };

  const formatTime = (t) => {
    if (!t) return '—';
    const d = new Date(t);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
      </div>
    );
  }

  if (error === 'Unauthorized') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Access Denied</div>
          <div style={{ fontSize: 14, color: colors.textDim }}>Admin privileges required.</div>
        </div>
      </div>
    );
  }

  const isOwner = true;

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
          <NavItem icon="⭐" label="+Rep" onClick={() => router.push('/dashboard')} />
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
          <div onClick={() => fetchUsers()} style={{ cursor: 'pointer', padding: '8px 16px', background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 8, fontSize: 13 }}>↻ Refresh</div>
        </div>

        <div className="glass-card" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid ' + colors.border }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Email</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Display Name</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Pro</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Free Uses</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Adjust</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isPro = u.is_pro;
                const freeUses = u.free_uses_remaining;
                const displayFreeUses = isPro ? '∞' : (freeUses !== null && freeUses !== undefined ? String(freeUses) : '—');
                const canAdjust = !isPro;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid ' + colors.border }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: colors.text }}>{u.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: colors.text }}>{u.display_name || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleTogglePro(u.email, isPro)}
                        disabled={updating === `${u.email}_pro`}
                        style={{
                          padding: '6px 16px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          background: isPro ? colors.green : 'rgba(239, 68, 68, 0.15)',
                          color: isPro ? '#000' : colors.red,
                          opacity: updating === `${u.email}_pro` ? 0.5 : 1,
                        }}
                      >
                        {updating === `${u.email}_pro` ? '...' : (isPro ? 'Pro' : 'Set Pro')}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: isPro ? colors.green : colors.text }}>
                      {displayFreeUses}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {canAdjust ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAdjustUses(u.email, 'remove_use')}
                            disabled={updating === `${u.email}_remove_use` || !canAdjust}
                            style={{
                              width: 32, height: 28, borderRadius: 5, border: '1px solid ' + colors.border,
                              background: 'rgba(239, 68, 68, 0.1)', color: colors.red, fontSize: 14, cursor: 'pointer',
                              opacity: updating === `${u.email}_remove_use` ? 0.5 : 1,
                            }}
                          >−</button>
                          <button
                            onClick={() => handleAdjustUses(u.email, 'add_use')}
                            disabled={updating === `${u.email}_add_use` || !canAdjust}
                            style={{
                              width: 32, height: 28, borderRadius: 5, border: '1px solid ' + colors.border,
                              background: 'rgba(34, 197, 94, 0.1)', color: colors.green, fontSize: 14, cursor: 'pointer',
                              opacity: updating === `${u.email}_add_use` ? 0.5 : 1,
                            }}
                          >+</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: colors.textDim }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: colors.textDim }}>{formatTime(u.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '60px', color: colors.textDim, fontSize: 13 }}>No users found</div>
          )}
        </div>
      </main>
    </div>
  );
}
