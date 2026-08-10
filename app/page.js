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

function Navbar({ signedIn, onSignIn, onSignOut }) {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', borderBottom: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: colors.green, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 'bold', color: '#000' }}>M</div>
        <span style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>Modrinth</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14 }}>
        <a href="#features" style={{ color: colors.textDim, textDecoration: 'none', cursor: 'pointer' }}>Features</a>
        <a href="#pricing" style={{ color: colors.textDim, textDecoration: 'none', cursor: 'pointer' }}>Pricing</a>
        <a href="#lookup" style={{ color: colors.textDim, textDecoration: 'none', cursor: 'pointer' }}>Lookup</a>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {signedIn ? (
          <a href="#dashboard" style={{ background: colors.green, color: '#000', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Get started</a>
        ) : (
          <>
            <span onClick={onSignIn} style={{ color: colors.text, fontSize: 14, cursor: 'pointer' }}>Sign in</span>
            <a href="#dashboard" style={{ background: colors.green, color: '#000', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Get started</a>
          </>
        )}
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '80px 48px', minHeight: '80vh' }}>
      <div style={{ flex: 1, maxWidth: 500 }}>
        <div style={{ display: 'inline-block', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 20, padding: '8px 16px', fontSize: 13, color: colors.textDim, marginBottom: 24 }}>
          <span style={{ color: colors.green, marginRight: 8 }}>●</span>Minecraft profile intelligence
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1, margin: 0, color: colors.text }}>
          Look up any <span style={{ color: colors.green }}>Minecraft profile</span> in seconds.
        </h1>
        <p style={{ fontSize: 16, color: colors.textDim, marginTop: 20, lineHeight: 1.6, maxWidth: 440 }}>
          Search public usernames, UUIDs, skins and capes. Save the ones that matter as Hits and keep your full history with Pro.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 32 }}>
          <a href="#dashboard" style={{ background: colors.green, color: '#000', padding: '14px 24px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            Get started <span>→</span>
          </a>
        </div>
        <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 16 }}>Free to start · No card required</p>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 480, height: 380, background: colors.card, borderRadius: 16, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <svg viewBox="0 0 200 160" width="360" height="280" style={{ opacity: 0.9 }}>
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
    { icon: '🔍', title: 'Instant profile lookup', desc: 'Type any Minecraft username and pull public data in a second — no waiting, no scraping.' },
    { icon: '👤', title: 'Skins, capes & UUIDs', desc: 'See the full body render, avatar, dashed and trimmed UUIDs, ready to copy or export.' },
    { icon: '📌', title: 'Saved Hits & history', desc: 'Pin the profiles you care about as Hits and keep a searchable history of every lookup.' },
    { icon: '🛡️', title: 'Public data only', desc: 'Modrinth only reads public profile info. No passwords, no logging into anyone\'s account.' },
  ];
  return (
    <section id="features" style={{ padding: '80px 48px', borderTop: `1px solid ${colors.border}` }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p style={{ fontSize: 13, color: colors.green, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>What you get</p>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: colors.text, margin: 0 }}>Everything you need to inspect a player</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 1100, margin: '0 auto' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ width: 40, height: 40, background: '#1a3a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 16 }}>{item.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: '0 0 8px 0' }}>{item.title}</h3>
            <p style={{ fontSize: 14, color: colors.textDim, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" style={{ padding: '80px 48px', borderTop: `1px solid ${colors.border}` }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p style={{ fontSize: 13, color: colors.green, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Pricing</p>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: colors.text, margin: 0 }}>Start free. Go Pro when you need more.</h2>
        <p style={{ fontSize: 15, color: colors.textDim, marginTop: 8 }}>One simple plan. Cancel anytime.</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ flex: 1, background: colors.card, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 32, position: 'relative' }}>
          <p style={{ fontSize: 13, color: colors.green, letterSpacing: 1, margin: '0 0 8px 0' }}>PRO</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
            <span style={{ fontSize: 48, fontWeight: 700, color: colors.text }}>$5</span>
            <span style={{ fontSize: 15, color: colors.textDim }}>/ month</span>
          </div>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: colors.green, color: '#000', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 12 }}>Most popular</div>
          {[
            'Unlimited profile lookups',
            'Save unlimited profiles as Hits',
            'Full searchable lookup history',
            'Fast skin, cape & UUID exports',
            'Priority lookup queue',
          ].map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14, color: colors.text }}>
              <span style={{ color: colors.green }}>✓</span> {feat}
            </div>
          ))}
          <button disabled style={{ width: '100%', marginTop: 24, padding: '14px 0', background: colors.green, color: '#000', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, opacity: 0.5, cursor: 'not-allowed' }}>Upgrade for $5/mo</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: '32px 48px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 24, height: 24, background: colors.green, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 'bold', color: '#000' }}>M</div>
        <span style={{ fontSize: 14, color: colors.textDim }}>Modrinth</span>
      </div>
      <p style={{ fontSize: 13, color: colors.textMuted }}>Modrinth reads public Minecraft profile data only. Not affiliated with Mojang or Microsoft.</p>
    </footer>
  );
}

export default function HomePage() {
  const [signedIn, setSignedIn] = useState(false);
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar signedIn={signedIn} onSignIn={() => setSignedIn(true)} onSignOut={() => setSignedIn(false)} />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}
