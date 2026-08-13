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
  const [secondsInput, setSecondsInput] = useState({});

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email?.toLowerCase() !== 'lifegrading@gmail.com') {
          setError('Unauthorized');
          setLoading(false);
          return;
        }
        fetchUsers();
      })
      .catch(() => { setError('Auth check failed'); setLoading(false); });
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setUsers(prevUsers =>
        prevUsers.map(u => {
          if (u.is_pro && typeof u.remaining_pro_seconds === 'number' && u.remaining_pro_seconds > 0) {
            const nextSec = u.remaining_pro_seconds - 1;
            return {
              ...u,
              remaining_pro_seconds: nextSec,
              is_pro: nextSec > 0,
              free_uses_remaining: nextSec > 0 ? null : 3,
            };
          }
          return u;
        })
      );
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || 'Failed to load users (HTTP ' + res.status + ')');
      }
    } catch (e) {
      setError('Network error: ' + (e.message || 'Failed to load users'));
    }
    setLoading(false);
  }

  const handleGrantPro = async (email, durationSec) => {
    const sec = durationSec !== undefined ? durationSec : Number(secondsInput[email] || 60);
    setUpdating(`${email}_pro`);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, is_pro: true, duration_seconds: sec }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.email.toLowerCase() === email.toLowerCase()
            ? {
                ...u,
                is_pro: true,
                pro_expires_at: data.pro_expires_at,
                remaining_pro_seconds: data.remaining_pro_seconds,
                free_uses_remaining: null,
              }
            : u
        ));
      } else {
        setError(`Failed to grant Pro for ${email}: ${data.error || res.statusText}`);
      }
    } catch (e) {
      setError(`Network error granting Pro: ${e.message}`);
    }
    setUpdating(null);
  };

  const handleRevokePro = async (email) => {
    setUpdating(`${email}_pro`);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, is_pro: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.email.toLowerCase() === email.toLowerCase()
            ? {
                ...u,
                is_pro: false,
                pro_expires_at: null,
                remaining_pro_seconds: null,
                free_uses_remaining: 3,
              }
            : u
        ));
      } else {
        setError(`Failed to revoke Pro for ${email}: ${data.error || res.statusText}`);
      }
    } catch (e) {
      setError(`Network error revoking Pro: ${e.message}`);
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
        setUsers(prev => prev.map(u =>
          u.email.toLowerCase() === email.toLowerCase()
            ? { ...u, is_pro: false, free_uses_remaining: data.free_uses_remaining }
            : u
        ));
      } else {
        setError(`Failed to adjust uses for ${email}: ${data.error || res.statusText}`);
      }
    } catch (e) {
      setError(`Network error adjusting uses: ${e.message}`);
    }
    setUpdating(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
      </div>
    );
  }

  if (error === 'Unauthorized' || error === 'Auth check failed') {
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

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 8, padding: '12px 16px', color: colors.text, marginBottom: 20, fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        <div className="glass-card" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid ' + colors.border }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Email</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Pro Status</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Grant / Revoke Pro (in Seconds)</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Free Uses Remaining</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 12, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border }}>Adjust Uses</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isPro = u.is_pro;
                const remainingSec = u.remaining_pro_seconds;
                const freeUses = u.free_uses_remaining;
                const displayFreeUses = isPro ? '∞ (Pro)' : (freeUses !== null && freeUses !== undefined ? `${freeUses} remaining` : '3 remaining');
                const isOwner = u.email?.toLowerCase().trim() === 'lifegrading@gmail.com';

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid ' + colors.border }}>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: colors.text }}>
                      <div>{u.email}</div>
                      {isOwner && <span style={{ fontSize: 10, color: colors.green, fontWeight: 700 }}>OWNER</span>}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {isPro ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: colors.green, fontSize: 11, padding: '4px 12px', borderRadius: 6, fontWeight: 700 }}>👑 PRO</span>
                          {typeof remainingSec === 'number' && (
                            <span style={{ fontSize: 11, color: colors.blue, fontFamily: 'monospace' }}>⏳ {remainingSec}s left</span>
                          )}
                          {remainingSec === null && !isOwner && (
                            <span style={{ fontSize: 10, color: colors.textDim }}>Permanent Pro</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: colors.red, fontSize: 11, padding: '4px 12px', borderRadius: 6, fontWeight: 600 }}>FREE TRIAL</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {isOwner ? (
                        <span style={{ fontSize: 11, color: colors.textDim }}>Permanent Owner</span>
                      ) : isPro ? (
                        <button
                          onClick={() => handleRevokePro(u.email)}
                          disabled={updating === `${u.email}_pro`}
                          style={{
                            padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: colors.red, color: '#fff', opacity: updating === `${u.email}_pro` ? 0.5 : 1,
                          }}
                        >
                          Revoke Pro
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <input
                            type="number"
                            placeholder="Sec"
                            value={secondsInput[u.email] !== undefined ? secondsInput[u.email] : 60}
                            onChange={e => setSecondsInput({ ...secondsInput, [u.email]: e.target.value })}
                            style={{ width: 60, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + colors.border, borderRadius: 6, padding: '6px 8px', color: colors.text, fontSize: 12, outline: 'none' }}
                          />
                          <button
                            onClick={() => handleGrantPro(u.email)}
                            disabled={updating === `${u.email}_pro`}
                            style={{
                              padding: '6px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              background: colors.green, color: '#000', opacity: updating === `${u.email}_pro` ? 0.5 : 1,
                            }}
                          >
                            Grant Pro ({secondsInput[u.email] || 60}s)
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: isPro ? colors.green : colors.text }}>
                      {displayFreeUses}
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {!isPro && !isOwner ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleAdjustUses(u.email, 'remove_use')}
                            disabled={updating === `${u.email}_remove_use`}
                            style={{
                              width: 32, height: 28, borderRadius: 5, border: '1px solid ' + colors.border,
                              background: 'rgba(239, 68, 68, 0.1)', color: colors.red, fontSize: 14, cursor: 'pointer',
                              opacity: updating === `${u.email}_remove_use` ? 0.5 : 1,
                            }}
                          >−</button>
                          <button
                            onClick={() => handleAdjustUses(u.email, 'add_use')}
                            disabled={updating === `${u.email}_add_use`}
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
