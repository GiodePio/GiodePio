'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const colors = {
  bg: '#0a0a0d',
  sidebar: '#0d0d12',
  panel: 'rgba(18, 18, 26, 0.8)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  textMid: '#9ca0ae',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#f59e0b',
  purple: '#a855f7',
};

// ─── Sidebar NavItem ───────────────────────────────────────────────────────────
function NavItem({ icon, label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 7,
        background: active ? 'rgba(239,68,68,0.12)' : hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: active ? '2px solid #ef4444' : '2px solid transparent',
        color: active ? '#ef4444' : hovered ? colors.text : colors.textDim,
        fontSize: 13.5, cursor: 'pointer', marginBottom: 1, transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: 15, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );
}

function NavSection({ title }) {
  return (
    <div style={{
      fontSize: 10, color: colors.textDim, letterSpacing: 1.5, textTransform: 'uppercase',
      padding: '14px 12px 5px', fontWeight: 700, opacity: 0.7,
    }}>
      {title}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10,
      padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, color }}>{icon}</span>
        <span style={{ fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: colors.text, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ─── Section: Home ─────────────────────────────────────────────────────────────
function HomeView({ users }) {
  const proUsers = users.filter(u => u.is_pro);
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Home</h1>
        </div>
        <p style={{ color: colors.textDim, fontSize: 13, marginTop: 4 }}>Overview and quick actions.</p>
        <div style={{ height: 1, background: colors.border, marginTop: 16 }} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 15 }}>🏠</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Admin Home</div>
            <div style={{ fontSize: 12, color: colors.textDim }}>Overview, platform health, and quick links.</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard label="Total Users" value={users.length} icon="👥" color={colors.blue} />
        <StatCard label="+Rep Reviews" value="—" icon="💬" color={colors.green} />
        <StatCard label="Risk Cases" value="—" icon="⚠️" color={colors.yellow} />
        <StatCard label="Pro Users" value={proUsers.length} icon="👑" color={colors.purple} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 14 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            { icon: '👥', label: 'Manage Users', desc: 'View and edit user accounts' },
            { icon: '💬', label: 'Moderate +Rep', desc: 'Review reputation entries' },
            { icon: '⚠️', label: 'Review Abuse / Risk', desc: 'Handle flagged content' },
            { icon: '🌐', label: 'Capture API', desc: 'Manage API endpoints' },
            { icon: '⚙️', label: 'Platform Settings', desc: 'Global configuration' },
            { icon: '📦', label: 'Push Mod Update', desc: 'Deploy a new version' },
          ].map(a => (
            <div key={a.label} style={{
              background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 8,
              padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 15 }}>{a.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.label}</span>
              </div>
              <div style={{ fontSize: 11, color: colors.textDim }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Users ─────────────────────────────────────────────────────────────
function UsersView({ users, updating, secondsInput, setSecondsInput, onGrantPro, onRevokePro, onAdjustUses, onRefresh, error }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>👥</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Users</h1>
          </div>
          <p style={{ color: colors.textDim, fontSize: 13 }}>{users.length} registered users</p>
        </div>
        <button onClick={onRefresh} style={{ cursor: 'pointer', padding: '8px 16px', background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 8, fontSize: 12, color: colors.text, transition: 'all 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '12px 16px', color: colors.red, marginBottom: 20, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid ' + colors.border, background: colors.panel }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Email', 'Pro Status', 'Grant / Revoke', 'Free Uses', 'Adjust Uses'].map(h => (
                <th key={h} style={{ textAlign: h === 'Email' ? 'left' : 'center', padding: '12px 16px', fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border, fontWeight: 600 }}>{h}</th>
              ))}
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
                  <td style={{ padding: '14px 16px', fontSize: 13 }}>
                    <div style={{ color: colors.text }}>{u.email}</div>
                    {isOwner && <span style={{ fontSize: 10, color: colors.red, fontWeight: 700 }}>OWNER</span>}
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {isPro ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ background: 'rgba(34,197,94,0.15)', color: colors.green, fontSize: 11, padding: '4px 12px', borderRadius: 6, fontWeight: 700 }}>👑 PRO</span>
                        {typeof remainingSec === 'number' && (
                          <span style={{ fontSize: 11, color: colors.blue, fontFamily: 'monospace' }}>⏳ {remainingSec}s left</span>
                        )}
                        {remainingSec === null && !isOwner && (
                          <span style={{ fontSize: 10, color: colors.textDim }}>Permanent</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ background: 'rgba(239,68,68,0.15)', color: colors.red, fontSize: 11, padding: '4px 12px', borderRadius: 6, fontWeight: 600 }}>FREE TRIAL</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {isOwner ? (
                      <span style={{ fontSize: 11, color: colors.textDim }}>Permanent Owner</span>
                    ) : isPro ? (
                      <button onClick={() => onRevokePro(u.email)} disabled={updating === `${u.email}_pro`} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: colors.red, color: '#fff', opacity: updating === `${u.email}_pro` ? 0.5 : 1 }}>
                        Revoke Pro
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => onGrantPro(u.email, 0)} disabled={updating === `${u.email}_pro`} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(90deg,#22c55e,#16a34a)', color: '#000', opacity: updating === `${u.email}_pro` ? 0.5 : 1, width: '100%' }}>
                          ✓ Grant Permanent
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="number" placeholder="Sec" value={secondsInput[u.email] !== undefined ? secondsInput[u.email] : 60} onChange={e => setSecondsInput(p => ({ ...p, [u.email]: e.target.value }))} style={{ width: 60, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + colors.border, borderRadius: 6, padding: '6px 8px', color: colors.text, fontSize: 12, outline: 'none' }} />
                          <button onClick={() => onGrantPro(u.email)} disabled={updating === `${u.email}_pro`} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid ' + colors.border, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(34,197,94,0.12)', color: colors.green, opacity: updating === `${u.email}_pro` ? 0.5 : 1 }}>
                            Timed ({secondsInput[u.email] || 60}s)
                          </button>
                        </div>
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: isPro ? colors.green : colors.text }}>{displayFreeUses}</td>

                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {!isPro && !isOwner ? (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => onAdjustUses(u.email, 'remove_use')} disabled={updating === `${u.email}_remove_use`} style={{ width: 32, height: 28, borderRadius: 5, border: '1px solid ' + colors.border, background: 'rgba(239,68,68,0.1)', color: colors.red, fontSize: 14, cursor: 'pointer', opacity: updating === `${u.email}_remove_use` ? 0.5 : 1 }}>−</button>
                        <button onClick={() => onAdjustUses(u.email, 'add_use')} disabled={updating === `${u.email}_add_use`} style={{ width: 32, height: 28, borderRadius: 5, border: '1px solid ' + colors.border, background: 'rgba(34,197,94,0.1)', color: colors.green, fontSize: 14, cursor: 'pointer', opacity: updating === `${u.email}_add_use` ? 0.5 : 1 }}>+</button>
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
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: colors.textDim, fontSize: 13 }}>No users found in database.</div>
        )}
      </div>
    </div>
  );
}

// ─── Placeholder View ─────────────────────────────────────────────────────────
function PlaceholderView({ icon, title, subtitle }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{title}</h1>
        </div>
        <p style={{ color: colors.textDim, fontSize: 13 }}>{subtitle}</p>
        <div style={{ height: 1, background: colors.border, marginTop: 16 }} />
      </div>
      <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, padding: '60px', textAlign: 'center', color: colors.textDim, fontSize: 13 }}>
        🚧 This section is under construction.
      </div>
    </div>
  );
}

// ─── Section: Grabs (all platform grabs) ──────────────────────────────────────
function GrabsView() {
  const [grabs, setGrabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/grabs').then(r => r.json()).then(d => { setGrabs(d.grabs || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = grabs.filter(g => {
    const q = search.toLowerCase();
    return g.minecraft_username?.toLowerCase().includes(q) || g.discord_username?.toLowerCase().includes(q) || g.ip_address?.toLowerCase().includes(q) || g.owner_email?.toLowerCase().includes(q);
  });

  const fmtTime = (t) => { if (!t) return ''; const diff = Math.floor((Date.now() - new Date(t)) / 1000); if (diff < 60) return `${diff}s ago`; if (diff < 3600) return `${Math.floor(diff/60)}m ago`; if (diff < 86400) return `${Math.floor(diff/3600)}h ago`; return new Date(t).toLocaleDateString(); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>⚡</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Grabs</h1>
          </div>
          <p style={{ color: colors.textDim, fontSize: 13 }}>{grabs.length} total grabs across all users.</p>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid ' + colors.border, borderRadius: 8, padding: '8px 14px', color: colors.text, fontSize: 13, outline: 'none', width: 200 }} />
      </div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid ' + colors.border, background: colors.panel }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['Player', 'Owner', 'IP', 'Country', 'OS', 'Time'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid ' + colors.border, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g.id} style={{ borderBottom: '1px solid ' + colors.border, cursor: 'pointer' }} onClick={() => router.push(`/dashboard/grabs/${g.id}`)} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={`https://mc-heads.net/avatar/${g.minecraft_username}/32`} alt="" style={{ width: 28, height: 28, borderRadius: 6 }} onError={e => e.target.style.display='none'} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{g.minecraft_username || '—'}</div>
                      <div style={{ fontSize: 11, color: colors.textDim }}>{g.discord_username || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textDim }}>{g.owner_email?.split('@')[0] || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: colors.text, fontFamily: 'monospace' }}>{g.ip_address || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: colors.text }}>{g.country || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: colors.text }}>{g.os?.split(' ')[0] || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textDim }}>{fmtTime(g.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: colors.textDim, fontSize: 13 }}>{loading ? 'Loading...' : 'No grabs found.'}</div>
        )}
      </div>
    </div>
  );
}

// ─── Section: Updates (admin can delete entries) ───────────────────────────────
function UpdatesAdminView() {
  const [updates, setUpdates] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [newEntry, setNewEntry] = useState({ version:'', date: new Date().toISOString().split('T')[0], tag:'New', color:'#22c55e', title:'', body:'' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/updates').then(r => r.json()).then(d => {
      setUpdates(d.updates || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    setUpdates(p => p.filter(u => u.id !== id));
    await fetch(`/api/updates?id=${id}`, { method: 'DELETE' });
  };

  const handleAdd = async () => {
    if (!newEntry.title.trim() || !newEntry.version.trim()) return;
    const res = await fetch('/api/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    });
    if (res.ok) {
      const { update } = await res.json();
      setUpdates(p => [update, ...p]);
    }
    setShowNew(false);
    setNewEntry({ version:'', date: new Date().toISOString().split('T')[0], tag:'New', color:'#22c55e', title:'', body:'' });
  };

  const tagColors = { New:'#22c55e', Feature:'#3b82f6', Fix:'#f59e0b', Launch:'#a855f7', Security:'#ef4444' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>📦</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Deployments</h1>
          </div>
          <p style={{ color: colors.textDim, fontSize: 13 }}>Manage and delete update changelog entries shown to users.</p>
        </div>
        <button onClick={() => setShowNew(true)} style={{ padding: '10px 18px', background: colors.text, color: '#000', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ New Entry</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        {updates.map(u => (
          <div key={u.id} style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, padding: '18px 22px', borderLeft: `3px solid ${u.color}`, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, background: `${u.color}20`, color: u.color, padding: '2px 10px', borderRadius: 10, fontWeight: 700 }}>{u.tag}</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>{u.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: colors.textDim }}>{u.version} · {u.date}</span>
              </div>
              <p style={{ fontSize: 13, color: '#b0b3bc', margin: 0, lineHeight: 1.6 }}>{u.body}</p>
            </div>
            <button onClick={() => handleDelete(u.id)} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.12)', color: colors.red, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Delete</button>
          </div>
        ))}
        {updates.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: colors.textDim, fontSize: 13, background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10 }}>{loading ? 'Loading...' : 'No update entries. Add one above.'}</div>}
      </div>

      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#111218', border: '1px solid #2a2d38', borderRadius: 16, padding: 36, width: 500, position: 'relative' }}>
            <button onClick={() => setShowNew(false)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: colors.textDim, fontSize: 20, cursor: 'pointer' }}>✕</button>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>New Update Entry</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <input value={newEntry.version} onChange={e => setNewEntry(p => ({...p, version: e.target.value}))} placeholder="Version (e.g. v1.4.0)" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none' }} />
              <input value={newEntry.date} onChange={e => setNewEntry(p => ({...p, date: e.target.value}))} type="date" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <select value={newEntry.tag} onChange={e => setNewEntry(p => ({...p, tag: e.target.value, color: tagColors[e.target.value] || '#22c55e'}))} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none' }}>
                {Object.keys(tagColors).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input value={newEntry.title} onChange={e => setNewEntry(p => ({...p, title: e.target.value}))} placeholder="Title" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none' }} />
            </div>
            <textarea value={newEntry.body} onChange={e => setNewEntry(p => ({...p, body: e.target.value}))} placeholder="Description..." rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
            <button onClick={handleAdd} style={{ width: '100%', padding: '12px', background: colors.green, color: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add Entry</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Tickets (admin view of all tickets) ─────────────────────────────
function TicketsAdminView() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tickets').then(r => r.json()).then(d => {
      setTickets(d.tickets || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    const msg = { sender: 'support', text: reply, at: new Date().toISOString() };
    const updated = { ...selected, messages: [...(selected.messages || []), msg] };
    setSelected(updated);
    setTickets(p => p.map(t => t.id === selected.id ? updated : t));
    setReply('');
    await fetch('/api/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, message: msg })
    });
  };

  const timeAgo = (ts) => { const d = Math.floor((Date.now() - new Date(ts)) / 60000); if (d < 60) return `${d}m ago`; return `${Math.floor(d/60)}h ago`; };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 22 }}>🎫</span>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Tickets</h1>
      </div>
      <p style={{ color: colors.textDim, fontSize: 13, marginBottom: 24 }}>Support tickets from users. Reply and manage them here.</p>
      <div style={{ height: 1, background: colors.border, marginBottom: 20 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, height: 'calc(100vh - 280px)' }}>
        <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, overflow: 'auto' }}>
          <div style={{ padding: '10px 14px', fontSize: 10, color: colors.textDim, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600, borderBottom: '1px solid ' + colors.border }}>ALL TICKETS ({tickets.length})</div>
          {tickets.map(t => (
            <div key={t.id} onClick={() => setSelected(t)} style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: selected?.id === t.id ? 'rgba(59,130,246,0.08)' : 'transparent' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: colors.text }}>{t.subject}</div>
              <div style={{ fontSize: 11, color: colors.textDim, marginBottom: 4 }}>{t.email}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ background: 'rgba(34,197,94,0.12)', color: colors.green, padding: '1px 6px', borderRadius: 4 }}>{t.status}</span>
                <span style={{ color: colors.textDim }}>{timeAgo(t.created_at)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 13 }}>Select a ticket to reply</div>
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid ' + colors.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selected.subject}</div>
                <div style={{ fontSize: 12, color: colors.textDim }}>{selected.email}</div>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'support' ? 'flex-start' : 'flex-end' }}>
                    <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: 10, background: m.sender === 'support' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)', fontSize: 13, color: colors.text }}>{m.text}</div>
                    <div style={{ fontSize: 10, color: colors.textDim, marginTop: 2 }}>{m.sender === 'support' ? '🛡 Admin' : 'User'} · {timeAgo(m.at)}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid ' + colors.border, display: 'flex', gap: 10 }}>
                <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply as admin..." style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid ' + colors.border, borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none' }} />
                <button onClick={handleReply} style={{ padding: '10px 18px', background: colors.red, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Reply</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section: Abuse / Risk ─────────────────────────────────────────────────────
function AbuseRiskView({ users }) {
  const [warnings, setWarnings] = useState([]);
  const [showWarn, setShowWarn] = useState(false);
  const [warnEmail, setWarnEmail] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [warnType, setWarnType] = useState('abuse');

  // Show users whose pro got revoked (is_pro: false but had pro before, indicated by free_uses: 0 meaning they ran out)
  // For abuse: show any user in the warnings list
  const revokedUsers = users.filter(u => !u.is_pro && u.free_uses_remaining === 0 && u.email !== 'lifegrading@gmail.com');

  const handleWarn = () => {
    if (!warnEmail.trim() || !warnReason.trim()) return;
    setWarnings(p => [...p, { id: Date.now(), email: warnEmail.trim(), reason: warnReason.trim(), type: warnType, at: new Date().toISOString() }]);
    setShowWarn(false);
    setWarnEmail('');
    setWarnReason('');
  };

  const fmtTime = (t) => new Date(t).toLocaleString();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Abuse / Risk</h1>
          </div>
          <p style={{ color: colors.textDim, fontSize: 13 }}>Warn users, track rule violations, and monitor revoked-pro grabs.</p>
        </div>
        <button onClick={() => setShowWarn(true)} style={{ padding: '10px 18px', background: colors.red, color: '#fff', border: 'none', borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⚠ Issue Warning</button>
      </div>

      {/* Revoked users still with grabs */}
      {revokedUsers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: colors.yellow }}>⚠ Trial Exhausted / Pro Revoked — Still Has Grabs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {revokedUsers.map(u => (
              <div key={u.id} style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{u.email}</div>
                  <div style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>Trial exhausted — 0 free uses remaining</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setWarnEmail(u.email); setShowWarn(true); }} style={{ padding: '6px 12px', background: 'rgba(245,158,11,0.15)', color: colors.yellow, border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Warn</button>
                  <span style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.15)', color: colors.red, borderRadius: 6, fontSize: 11, fontWeight: 600 }}>ACCESS BLOCKED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active warnings */}
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Active Warnings ({warnings.length})</div>
      {warnings.length === 0 ? (
        <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, padding: '40px', textAlign: 'center', color: colors.textDim, fontSize: 13 }}>✓ No active warnings issued.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {warnings.map(w => (
            <div key={w.id} style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 8, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{w.email}</span>
                  <span style={{ fontSize: 10, background: w.type === 'abuse' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: w.type === 'abuse' ? colors.red : colors.yellow, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>{w.type.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 12, color: colors.textDim }}>{w.reason}</div>
                <div style={{ fontSize: 10, color: colors.textDim, marginTop: 4 }}>{fmtTime(w.at)}</div>
              </div>
              <button onClick={() => setWarnings(p => p.filter(x => x.id !== w.id))} style={{ padding: '5px 10px', background: 'transparent', color: colors.textDim, border: '1px solid ' + colors.border, borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {showWarn && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#111218', border: '1px solid #2a2d38', borderRadius: 16, padding: 36, width: 440, position: 'relative' }}>
            <button onClick={() => setShowWarn(false)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', color: colors.textDim, fontSize: 20, cursor: 'pointer' }}>✕</button>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 20px' }}>⚠ Issue Warning</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['abuse', 'risk', 'ban'].map(t => (
                <button key={t} onClick={() => setWarnType(t)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${warnType === t ? colors.red : 'rgba(255,255,255,0.08)'}`, background: warnType === t ? 'rgba(239,68,68,0.1)' : 'transparent', color: warnType === t ? colors.red : colors.textDim, fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase' }}>{t}</button>
              ))}
            </div>
            <input value={warnEmail} onChange={e => setWarnEmail(e.target.value)} placeholder="Player email" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} />
            <textarea value={warnReason} onChange={e => setWarnReason(e.target.value)} placeholder="Reason for warning..." rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
            <button onClick={handleWarn} style={{ width: '100%', padding: '12px', background: colors.red, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Issue Warning</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section: Platform ─────────────────────────────────────────────────────────
function PlatformView() {
  const [settings, setSettings] = useState({
    globalLockdown: false,
    maintenanceMode: false,
    lockBuilds: false,
    disableRemoteAccess: false,
  });
  const [disabledMsg, setDisabledMsg] = useState('Downloads and builds are temporarily disabled.');
  const [saving, setSaving] = useState(null);

  const Toggle = ({ id, value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? colors.red : 'rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left 0.2s' }} />
    </div>
  );

  const SettingRow = ({ icon, label, desc, settingKey, danger }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: danger && settings[settingKey] ? 'rgba(239,68,68,0.08)' : 'transparent', borderBottom: '1px solid ' + colors.border, borderLeft: danger && settings[settingKey] ? '3px solid ' + colors.red : '3px solid transparent', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: danger && settings[settingKey] ? colors.red : colors.text }}>{label}</div>
          <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>{desc}</div>
        </div>
      </div>
      <Toggle id={settingKey} value={settings[settingKey]} onChange={v => setSettings(p => ({ ...p, [settingKey]: v }))} />
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>⚙️</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Platform</h1>
        </div>
        <p style={{ color: colors.textDim, fontSize: 13 }}>Maintenance settings.</p>
        <div style={{ height: 1, background: colors.border, marginTop: 16 }} />
      </div>

      <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + colors.border, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚙️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Platform Settings</div>
            <div style={{ fontSize: 12, color: colors.textDim }}>Manage global dashboard behavior.</div>
          </div>
        </div>
        <SettingRow icon="🔴" label="Global Site Lockdown" desc="Completely disables EVERY access to the website (including the landing page and login) for all users except you." settingKey="globalLockdown" danger />
        <SettingRow icon="🟡" label="Maintenance Mode" desc="Lock the dashboard for everyone except you." settingKey="maintenanceMode" />
        <SettingRow icon="🟠" label="Lock Builds & Downloads" desc="Blocks building mods and downloading user/Auth Mods. Admin can still use both." settingKey="lockBuilds" />
        <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + colors.border }}>
          <div style={{ fontSize: 12, color: colors.textDim, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Disabled Message</div>
          <textarea value={disabledMsg} onChange={e => setDisabledMsg(e.target.value)} style={{ width: '100%', minHeight: 80, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + colors.border, borderRadius: 7, padding: '10px 12px', color: colors.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ fontSize: 11, color: colors.textDim, marginTop: 6 }}>This text is shown when a non-admin user tries to build or download a locked version.</div>
        </div>
        <SettingRow icon="🔴" label="Disable Remote Access (Global)" desc="Completely block all C2 requests and hide the feature from users." settingKey="disableRemoteAccess" danger />
      </div>
    </div>
  );
}

// ─── Section: Deployments ─────────────────────────────────────────────────────
function DeploymentsView() {
  const [targetVersion, setTargetVersion] = useState('Global');
  const [changelog, setChangelog] = useState('- Added new feature\n- Fixed rendering bug...');
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const handleDeploy = async () => {
    setDeploying(true);
    await new Promise(r => setTimeout(r, 1500));
    setDeploying(false);
    setDeployed(true);
    setTimeout(() => setDeployed(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>📡</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Deployments</h1>
        </div>
        <p style={{ color: colors.textDim, fontSize: 13 }}>Push mod updates.</p>
        <div style={{ height: 1, background: colors.border, marginTop: 16 }} />
      </div>

      <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, padding: '24px', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 16 }}>📡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Push Mod Update</div>
            <div style={{ fontSize: 12, color: colors.textDim }}>Increment version mappings and publish a changelog entry.</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: colors.textDim, marginBottom: 6, fontWeight: 600 }}>Target Version</label>
          <select value={targetVersion} onChange={e => setTargetVersion(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid ' + colors.border, borderRadius: 7, padding: '10px 12px', color: colors.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="Global">Global</option>
            <option value="Beta">Beta</option>
            <option value="Alpha">Alpha</option>
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: colors.textDim, marginBottom: 6, fontWeight: 600 }}>Changelog</label>
          <textarea value={changelog} onChange={e => setChangelog(e.target.value)} style={{ width: '100%', minHeight: 140, background: 'rgba(255,255,255,0.03)', border: '1px solid ' + colors.border, borderRadius: 7, padding: '10px 12px', color: colors.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'monospace' }} />
        </div>

        <button onClick={handleDeploy} disabled={deploying} style={{
          width: '100%', padding: '13px 0', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 700, cursor: deploying ? 'not-allowed' : 'pointer',
          background: deployed ? colors.green : 'linear-gradient(90deg,#3b82f6,#2563eb)', color: '#fff',
          opacity: deploying ? 0.7 : 1, transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {deploying ? '⏳ Deploying...' : deployed ? '✓ Deployed!' : '📡 Deploy Update'}
        </button>
      </div>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [view, setView] = useState('home');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [secondsInput, setSecondsInput] = useState({});
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (!d.user || d.user.email?.toLowerCase().trim() !== 'lifegrading@gmail.com') {
          setError('Unauthorized');
          setLoading(false);
          setAuthChecked(true);
          return;
        }
        setAuthChecked(true);
        fetchUsers();
      })
      .catch(() => { setError('Auth check failed'); setLoading(false); setAuthChecked(true); });
  }, []);

  // countdown timer for timed pro
  useEffect(() => {
    const iv = setInterval(() => {
      setUsers(prev => prev.map(u => {
        if (u.is_pro && typeof u.remaining_pro_seconds === 'number' && u.remaining_pro_seconds > 0) {
          const next = u.remaining_pro_seconds - 1;
          return { ...u, remaining_pro_seconds: next, is_pro: next > 0, free_uses_remaining: next > 0 ? null : 3 };
        }
        return u;
      }));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
      else setError(data.error || 'Failed to load users');
    } catch (e) {
      setError('Network error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleGrantPro = async (email, durationSec) => {
    const permanent = durationSec === 0;
    const sec = permanent ? undefined : (durationSec !== undefined ? durationSec : Number(secondsInput[email] || 60));
    setUpdating(`${email}_pro`);
    setError(null);
    try {
      const body = permanent ? { email, is_pro: true } : { email, is_pro: true, duration_seconds: sec };
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, is_pro: true, pro_expires_at: data.pro_expires_at, remaining_pro_seconds: data.remaining_pro_seconds, free_uses_remaining: null } : u));
      } else {
        const errorMsg = `Failed to grant Pro for ${email}: ${data.error || res.statusText}`;
        setError(errorMsg);
        alert(errorMsg);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleRevokePro = async (email) => {
    setUpdating(`${email}_pro`);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, is_pro: false }) });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, is_pro: false, pro_expires_at: null, remaining_pro_seconds: null, free_uses_remaining: 3 } : u));
      } else {
        setError(`Failed to revoke Pro: ${data.error}`);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setUpdating(null);
    }
  };

  const handleAdjustUses = async (email, action) => {
    setUpdating(`${email}_${action}`);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, action }) });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(u => u.email.toLowerCase() === email.toLowerCase() ? { ...u, is_pro: false, free_uses_remaining: data.free_uses_remaining } : u));
      } else {
        setError(`Failed to adjust uses: ${data.error}`);
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setUpdating(null);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (!authChecked || loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: colors.textDim, fontSize: 14 }}>Loading admin panel...</div>
      </div>
    );
  }

  // ─── Unauthorized ──────────────────────────────────────────────────────────
  if (error === 'Unauthorized' || error === 'Auth check failed') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Access Denied</div>
        <div style={{ fontSize: 14, color: colors.textDim }}>You must be signed in as owner to access this panel.</div>
      </div>
    );
  }

  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'users', icon: '👥', label: 'Users' },
    { id: 'tickets', icon: '🎫', label: 'Tickets' },
    { id: 'rep', icon: '⭐', label: '+Rep' },
    { id: 'abuse', icon: '⚠️', label: 'Abuse / Risk' },
    { id: 'capture-api', icon: '🌐', label: 'Capture API' },
    { id: 'platform', icon: '⚙️', label: 'Platform' },
    { id: 'deployments', icon: '📡', label: 'Deployments' },
    { id: 'grabs', icon: '⚡', label: 'Grabs' },
    { id: 'purchases', icon: '💰', label: 'Purchases' },
    { id: 'updates', icon: '📦', label: 'Updates' },
    { id: 'crypto', icon: '₿', label: 'Crypto' },
  ];

  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView users={users} />;
      case 'users': return <UsersView users={users} updating={updating} secondsInput={secondsInput} setSecondsInput={setSecondsInput} onGrantPro={handleGrantPro} onRevokePro={handleRevokePro} onAdjustUses={handleAdjustUses} onRefresh={fetchUsers} error={error} />;
      case 'platform': return <PlatformView />;
      case 'deployments': return <UpdatesAdminView />;
      case 'tickets': return <TicketsAdminView />;
      case 'grabs': return <GrabsView />;
      case 'updates': return <UpdatesAdminView />;
      case 'abuse': return <AbuseRiskView users={users} />;
      case 'rep': return <PlaceholderView icon="⭐" title="+Rep" subtitle="Review and moderate reputation entries." />;
      case 'capture-api': return <PlaceholderView icon="🌐" title="Capture API" subtitle="Manage capture API endpoints and submissions." />;
      case 'purchases': return <PlaceholderView icon="💰" title="Purchases" subtitle="Transaction and purchase history." />;
      case 'crypto': return <PlaceholderView icon="₿" title="Crypto" subtitle="Cryptocurrency payment management." />;
      default: return <HomeView users={users} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ─── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: 210, minWidth: 210, borderRight: '1px solid ' + colors.border,
        padding: '16px 10px', display: 'flex', flexDirection: 'column',
        background: colors.sidebar, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* App header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>X</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>Xgrabber</div>
            <div style={{ fontSize: 10, color: colors.red, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>ADMIN</div>
          </div>
        </div>

        {/* Owner Panel badge */}
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: colors.red }}>⊙</span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.text }}>Owner Panel</div>
            <div style={{ fontSize: 10.5, color: colors.textDim }}>Signed in</div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1 }}>
          {navItems.map(item => (
            <NavItem key={item.id} icon={item.icon} label={item.label} active={view === item.id} onClick={() => setView(item.id)} />
          ))}
        </div>

        {/* Bottom actions */}
        <div style={{ borderTop: '1px solid ' + colors.border, paddingTop: 10, marginTop: 8 }}>
          <NavItem icon="🏠" label="Back to Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 36px', overflow: 'auto', minHeight: '100vh' }}>
        {renderView()}
      </main>
    </div>
  );
}
