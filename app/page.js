'use client';

import { useState } from 'react';

const colors = {
  bg: '#0f1114',
  card: '#161a1e',
  border: '#22272d',
  green: '#22c55e',
  greenDark: '#16a34a',
  text: '#ffffff',
  textDim: '#8b8f96',
  textMuted: '#5c6068',
};

function SignInModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 40, width: 380, position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: colors.textDim, fontSize: 20, cursor: 'pointer' }}>✕</button>
        <h2 style={{ fontSize: 22, fontWeight: 600, color: colors.text, margin: '0 0 24px 0', textAlign: 'center' }}>Sign in to Modrinth</h2>
        <button style={{ width: '100%', padding: '14px 0', background: '#fff', color: '#333', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <button style={{ width: '100%', padding: '14px 0', background: '#24292e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          Continue with GitHub
        </button>
        <p style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>By continuing, you agree to Modrinth's Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
}

function Navbar({ signedIn, onSignIn, onSignOut }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, background: colors.green, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: '#000' }}>M</div>
        <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>Modrinth</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <a href="#features" style={{ color: colors.textDim, textDecoration: 'none', fontSize: 14, cursor: 'pointer' }}>Features</a>
        <a href="#pricing" style={{ color: colors.textDim, textDecoration: 'none', fontSize: 14, cursor: 'pointer' }}>Pricing</a>
        {signedIn ? (
          <a href="#dashboard" style={{ background: colors.green, color: '#000', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Dashboard</a>
        ) : (
          <span onClick={onSignIn} style={{ color: colors.text, fontSize: 14, cursor: 'pointer', padding: '8px 16px', border: `1px solid ${colors.border}`, borderRadius: 8 }}>Sign in</span>
        )}
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ padding: '48px 32px 40px', display: 'flex', alignItems: 'center', gap: 40 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'inline-block', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 16, padding: '6px 12px', fontSize: 12, color: colors.textDim, marginBottom: 16 }}>
          <span style={{ color: colors.green, marginRight: 6 }}>●</span>Minecraft profile intelligence
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.15, margin: 0, color: colors.text }}>
          Look up any <span style={{ color: colors.green }}>Minecraft profile</span> in seconds.
        </h1>
        <p style={{ fontSize: 15, color: colors.textDim, marginTop: 14, lineHeight: 1.5, maxWidth: 400 }}>
          Search public usernames, UUIDs, skins and capes. Save the ones that matter as Hits and keep your full history with Pro.
        </p>
        <p style={{ fontSize: 12, color: colors.textMuted, marginTop: 16 }}>Free to start · No card required</p>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 400, height: 300, background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 200 160" width="300" height="220" style={{ opacity: 0.9 }}>
            <rect x="80" y="20" width="40" height="40" fill="#5b8c3e" stroke="#4a7a32" strokeWidth="1" />
            <rect x="70" y="30" width="40" height="40" fill="#6b9e4a" stroke="#5a8c3e" strokeWidth="1" />
            <rect x="90" y="30" width="40" height="40" fill="#4a7a32" stroke="#3d6628" strokeWidth="1" />
            <rect x="80" y="40" width="40" height="40" fill="#7aaf58" stroke="#6b9e4a" strokeWidth="1" />
            <rect x="60" y="50" width="40" height="40" fill="#5b8c3e" stroke="#4a7a32" strokeWidth="1" />
            <rect x="100" y="50" width="40" height="40" fill="#6b9e4a" stroke="#5a8c3e" strokeWidth="1" />
            <rect x="70" y="60" width="40" height="40" fill="#4a7a32" stroke="#3d6628" strokeWidth="1" />
            <rect x="90" y="60" width="40" height="40" fill="#7aaf58" stroke="#6b9e4a" strokeWidth="1" />
            <rect x="80" y="70" width="40" height="40" fill="#5b8c3e" stroke="#4a7a32" strokeWidth="1" />
            <rect x="110" y="40" width="30" height="30" fill="#8bc34a" stroke="#7aaf58" strokeWidth="1" />
            <rect x="50" y="70" width="30" height="30" fill="#6b9e4a" stroke="#5a8c3e" strokeWidth="1" />
            <rect x="75" y="85" width="20" height="15" fill="#3e8ad4" stroke="#2e7ac4" strokeWidth="1" rx="2" />
            <rect x="120" y="75" width="25" height="35" fill="#8b6b4a" stroke="#7a5a3a" strokeWidth="1" />
            <rect x="55" y="100" width="15" height="20" fill="#7aaf58" stroke="#6b9e4a" strokeWidth="1" />
            <rect x="130" y="95" width="20" height="15" fill="#6b9e4a" stroke="#5a8c3e" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: '🔍', title: 'Instant profile lookup', desc: 'Type any Minecraft username and pull public data in a second.' },
    { icon: '👤', title: 'Skins, capes & UUIDs', desc: 'See the full body render, avatar, and trimmed UUIDs, ready to copy.' },
    { icon: '📌', title: 'Saved Hits & history', desc: 'Pin the profiles you care about as Hits and keep a searchable history.' },
    { icon: '🛡️', title: 'Public data only', desc: 'Only reads public profile info. No passwords, no account access.' },
  ];
  return (
    <section id="features" style={{ padding: '40px 32px', borderTop: `1px solid ${colors.border}` }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 12, color: colors.green, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>What you get</p>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Everything you need to inspect a player</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 960, margin: '0 auto' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 20 }}>
            <div style={{ width: 36, height: 36, background: '#1a3a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 12 }}>{item.icon}</div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.text, margin: '0 0 6px 0' }}>{item.title}</h3>
            <p style={{ fontSize: 13, color: colors.textDim, margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" style={{ padding: '40px 32px', borderTop: `1px solid ${colors.border}` }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 12, color: colors.green, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Pricing</p>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: colors.text, margin: 0 }}>Start free. Go Pro when you need more.</h2>
        <p style={{ fontSize: 14, color: colors.textDim, marginTop: 6 }}>One simple plan. Cancel anytime.</p>
      </div>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <div style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 28, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: colors.green, color: '#000', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 10 }}>Most popular</div>
          <p style={{ fontSize: 12, color: colors.green, letterSpacing: 1, margin: '0 0 6px 0' }}>PRO</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: colors.text }}>$5</span>
            <span style={{ fontSize: 14, color: colors.textDim }}>/ month</span>
          </div>
          {[
            'Unlimited profile lookups',
            'Save unlimited profiles as Hits',
            'Full searchable lookup history',
            'Fast skin, cape & UUID exports',
            'Priority lookup queue',
          ].map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: colors.text }}>
              <span style={{ color: colors.green }}>✓</span> {feat}
            </div>
          ))}
          <button disabled style={{ width: '100%', marginTop: 20, padding: '12px 0', background: colors.green, color: '#000', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, opacity: 0.5, cursor: 'not-allowed' }}>Upgrade for $5/mo</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: '20px 32px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 20, height: 20, background: colors.green, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', color: '#000' }}>M</div>
        <span style={{ fontSize: 13, color: colors.textDim }}>Modrinth</span>
      </div>
      <p style={{ fontSize: 12, color: colors.textMuted }}>Reads public Minecraft profile data only. Not affiliated with Mojang or Microsoft.</p>
    </footer>
  );
}

export default function HomePage() {
  const [signedIn, setSignedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar signedIn={signedIn} onSignIn={() => setShowSignIn(true)} onSignOut={() => setSignedIn(false)} />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
      {showSignIn && <SignInModal onClose={() => { setShowSignIn(false); setSignedIn(true); }} />}
    </div>
  );
}
