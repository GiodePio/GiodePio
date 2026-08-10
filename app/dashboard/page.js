'use client';

const colors = {
  bg: '#0a0a0f',
  panel: '#111218',
  border: '#1e1f28',
  text: '#ffffff',
  textDim: '#6b6e7b',
  green: '#22c55e',
};

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: colors.panel, borderRadius: 10, padding: '18px 20px', flex: 1, border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.textDim, fontSize: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{icon}</span> {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: colors.textDim, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 8,
      background: active ? '#1a1b24' : 'transparent',
      color: active ? colors.text : colors.textDim, fontSize: 14, cursor: 'pointer', marginBottom: 2,
    }}>
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222', overflow: 'hidden' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Modrinth</span>
        </div>

        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" active />
          <NavItem icon="⚡" label="Build" />
          <NavItem icon="📋" label="Plans" />
          <NavItem icon="⭐" label="+Rep" />
          <NavItem icon="📡" label="Servers" />
        </div>

        <div>
          <NavItem icon="⚙️" label="Settings" />
          <NavItem icon="🚪" label="Log out" />
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 36px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Good evening, bnn.</h1>
        <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 24 }}>Your workspace is ready.</p>

        <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
          <StatCard icon="👤" label="USERS" value="0" sub="No users yet" />
          <StatCard icon="💬" label="CONNECTIONS" value="0" sub="Connected with nobody" />
          <StatCard icon="🌐" label="HITS" value="0" sub="0 total entries" />
          <div style={{ background: colors.panel, borderRadius: 10, padding: '18px 20px', flex: 1, border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.textDim, fontSize: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>📡</span> SERVERS
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 13, color: colors.text }}>
              <span>💬 0</span>
              <span>⚡ 0</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase' }}>Recent Captures</span>
              <span style={{ fontSize: 12, color: colors.textDim, cursor: 'pointer' }}>View all →</span>
            </div>
            <div style={{ height: 160, background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
              <span style={{ fontSize: 28, marginBottom: 8 }}>🔒</span>
              <span style={{ fontSize: 13 }}>No captures yet</span>
            </div>
          </div>
          <div style={{ width: 240 }}>
            <div style={{ fontSize: 11, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Top Servers</div>
            <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, padding: 20, color: colors.textDim, fontSize: 13 }}>No servers yet</div>
          </div>
        </div>
      </main>
    </div>
  );
}
