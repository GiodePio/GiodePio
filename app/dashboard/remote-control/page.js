'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const colors = {
  bg: '#050508',
  panel: 'rgba(13, 13, 18, 0.7)',
  surface: 'rgba(10, 10, 16, 0.8)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  purple: '#a855f7',
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function RemoteControlPage() {
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [proChecked, setProChecked] = useState(false);

  useEffect(() => {
    const checkPro = () => {
      fetch('/api/user/pro?t=' + Date.now(), { cache: 'no-store' })
        .then(r => r.json())
        .then(p => { 
          setIsPro(p.is_pro); 
          setProChecked(true); 
        })
        .catch(() => { 
          setIsPro(false); 
          setProChecked(true); 
        });
    };

    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email) {
          setUserEmail(d.user.email);
          checkPro();
          const interval = setInterval(checkPro, 5000);
          return () => clearInterval(interval);
        } else {
          setProChecked(true);
        }
      })
      .catch(() => setProChecked(true));
  }, []);

  useEffect(() => {
    if (!proChecked || !isPro) return;

    const fetchAllStreams = async () => {
      try {
        const [streamRes, webrtcRes] = await Promise.all([
          fetch('/api/stream').then(r => r.json()).catch(() => ({ online: [] })),
          fetch('/api/livestream/webrtc?action=list').then(r => r.json()).catch(() => ({ streams: [] })),
        ]);

        const streamsMap = new Map();

        // Add standard ConsentMod streams
        if (streamRes.online && Array.isArray(streamRes.online)) {
          for (const u of streamRes.online) {
            streamsMap.set(u.username.toLowerCase(), {
              username: u.username,
              isWebRtc: false,
              type: 'ConsentMod Feed',
              timestamp: u.timestamp || Date.now(),
            });
          }
        }

        // Add active WebRTC broadcast streams
        if (webrtcRes.streams && Array.isArray(webrtcRes.streams)) {
          for (const s of webrtcRes.streams) {
            const name = s.metadata?.username || s.streamId || 'WebRTC Broadcaster';
            streamsMap.set(name.toLowerCase(), {
              username: name,
              streamId: s.streamId,
              isWebRtc: true,
              type: 'WebRTC P2P (60 FPS)',
              fps: s.metadata?.fps || 60,
              timestamp: s.lastSeen || Date.now(),
            });
          }
        }

        setOnlineUsers(Array.from(streamsMap.values()));
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchAllStreams();
    const iv = setInterval(fetchAllStreams, 2500);
    return () => clearInterval(iv);
  }, [proChecked, isPro]);

  if (!proChecked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Pro Required</div>
          <div style={{ fontSize: 14, color: colors.textDim, textAlign: 'center', maxWidth: 400 }}>
            Remote Control is only available for Pro users. Free trials cannot access this feature.
          </div>
          <button onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', background: colors.green, color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>Upgrade to Pro</button>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 14, marginTop: 8 }}>← Back to Dashboard</div>
        </div>
      </div>
    );
  }

  const filtered = onlineUsers.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 220, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column', background: colors.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" onClick={() => router.push('/dashboard/grabs')} />
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
          <NavItem icon="🖥" label="Remote Control" active onClick={() => router.push('/dashboard/remote-control')} />
          <NavItem icon="⚙️" label="Settings" onClick={() => router.push('/dashboard/settings')} />
        </div>
        <div>
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{getGreeting()}, there.</h1>
            <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 0 }}>
              Real-time WebRTC & ConsentMod remote device workspace.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/livestream')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 8,
                background: 'rgba(34, 197, 94, 0.15)',
                color: colors.green,
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>📡</span> WebRTC Livestream Hub
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 14, color: colors.textDim }}>
            {onlineUsers.length} active device / stream{onlineUsers.length !== 1 ? 's' : ''} available
          </span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textDim, fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Search devices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '8px 14px 8px 36px',
                color: colors.text,
                fontSize: 13,
                outline: 'none',
                width: 220,
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: colors.textDim, fontSize: 13 }}>Loading active streams...</div>
        ) : filtered.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: '40px',
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              maxWidth: 560,
              margin: '40px auto',
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              📹
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No Active Streams Detected</div>
              <div style={{ fontSize: 13, color: colors.textDim, lineHeight: 1.5 }}>
                Start a WebRTC screen broadcast now, or launch ConsentMod in Minecraft to establish a real-time stream.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button
                onClick={() => router.push('/livestream')}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: colors.green,
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Start WebRTC Broadcast
              </button>
              <button
                onClick={() => router.push('/dashboard/remote-control/consentmod')}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Open Device Monitor
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(u => (
              <div
                key={u.username}
                onClick={() => router.push(`/dashboard/remote-control/${encodeURIComponent(u.username)}`)}
                className="glass-card btn-smooth"
                style={{
                  padding: 20,
                  borderRadius: 12,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: colors.surface,
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img
                    src={`https://mc-heads.net/avatar/${u.username}/44`}
                    alt=""
                    style={{ width: 44, height: 44 }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{u.username}</div>
                  <div style={{ fontSize: 12, color: colors.green, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.green, display: 'inline-block' }} />
                    {u.type || 'WebRTC Live'}
                  </div>
                </div>
                <span style={{ fontSize: 16, color: colors.textDim }}>→</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}