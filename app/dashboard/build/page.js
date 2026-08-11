'use client';

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

export default function BuildPage() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Modrinth</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" onClick={() => router.push('/dashboard/grabs')} />
          <NavItem icon="🔨" label="Build" active onClick={() => {}} />
          <NavItem icon="📋" label="Plans" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⭐" label="+Rep" onClick={() => router.push('/dashboard')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>
      <div style={{ flex: 1, padding: '28px 36px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Build Center</h1>
        <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Build, download, and install your mods.</p>

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
                <div style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>consentmod-1.0.0.jar</div>
                <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>Latest build</div>
              </div>
            </div>
            <a href="/mods/consentmod-1.0.0.jar" download style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <span>↓</span> Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
