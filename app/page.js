'use client';

import { useState } from 'react';

const colors = {
  green: '#22c55e',
  text: '#ffffff',
  textDim: '#a0a4b0',
};

function SignInModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div style={{ background: '#15161c', border: '1px solid #2a2d38', borderRadius: 16, padding: 40, width: 380, position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#6b6e7b', fontSize: 20, cursor: 'pointer' }}>✕</button>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, margin: '0 0 24px 0', textAlign: 'center' }}>Sign in to Modrinth</h2>
        <button style={{ width: '100%', padding: '13px 0', background: '#fff', color: '#333', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <button style={{ width: '100%', padding: '13px 0', background: '#24292e', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          Continue with GitHub
        </button>
        <p style={{ fontSize: 11, color: '#5c6068', textAlign: 'center', marginTop: 18, lineHeight: 1.5 }}>By continuing, you agree to Modrinth's Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
}

function Navbar({ signedIn, onSignIn }) {
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', zIndex: 100, background: 'rgba(10,10,15,0.6)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: colors.text, textTransform: 'uppercase' }}>MODRINTH</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <a href="#features" style={{ color: colors.textDim, textDecoration: 'none', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Features</a>
        <a href="#pricing" style={{ color: colors.textDim, textDecoration: 'none', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Pricing</a>
        <a href="#about" style={{ color: colors.textDim, textDecoration: 'none', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>About</a>
        <a href="#contact" style={{ color: colors.textDim, textDecoration: 'none', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Contact</a>
        {signedIn ? (
          <a href="#dashboard" style={{ border: '1px solid rgba(255,255,255,0.2)', color: colors.text, padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', letterSpacing: 0.5 }}>OPEN APP</a>
        ) : (
          <span onClick={onSignIn} style={{ border: '1px solid rgba(255,255,255,0.2)', color: colors.text, padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5 }}>SIGN IN</span>
        )}
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{
      position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 80%, #0c1a3a 0%, #0a0a12 50%, #050508 100%)' }} />
      <div style={{ position: 'absolute', top: '10%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(60,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', top: '30%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      {[...Array(60)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%', background: 'white',
          width: Math.random() * 2 + 1, height: Math.random() * 2 + 1,
          top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
          opacity: Math.random() * 0.6 + 0.1,
        }} />
      ))}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'radial-gradient(ellipse at 50% 100%, rgba(20,40,80,0.4) 0%, transparent 70%)' }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, padding: '0 20px' }}>
        <p style={{ fontSize: 13, color: colors.textDim, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>The ultimate session grabber</p>
        <h1 style={{ fontSize: 64, fontWeight: 800, color: colors.text, margin: 0, letterSpacing: 4, lineHeight: 1.1, textTransform: 'uppercase' }}>Modrinth</h1>
        <p style={{ fontSize: 14, color: colors.textDim, marginTop: 20, lineHeight: 1.7, maxWidth: 520, margin: '20px auto 0', letterSpacing: 1 }}>
          Secure, reliable, and invisible. Take control with an advanced dashboard, real-time analytics, and unparalleled features.
        </p>
        <a href="#features" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 36, padding: '12px 28px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: colors.text, textDecoration: 'none', fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.04)' }}>
          <span style={{ fontSize: 16 }}>◎</span> Discover Features
        </a>
      </div>

      <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.3))' }} />
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
    <section id="features" style={{ padding: '80px 40px', background: '#0a0a0f', position: 'relative' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p style={{ fontSize: 12, color: colors.green, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>What you get</p>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: colors.text, margin: 0 }}>Everything you need to inspect a player</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 1000, margin: '0 auto' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: '#111218', border: '1px solid #1e1f28', borderRadius: 12, padding: 24, transition: 'transform 0.2s' }}>
            <div style={{ width: 40, height: 40, background: '#1a2a1a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 16 }}>{item.icon}</div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.text, margin: '0 0 8px 0' }}>{item.title}</h3>
            <p style={{ fontSize: 13, color: colors.textDim, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" style={{ padding: '80px 40px', background: '#08080c', borderTop: '1px solid #1a1b22' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <p style={{ fontSize: 12, color: colors.green, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10, fontWeight: 600 }}>Pricing</p>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: colors.text, margin: 0 }}>Start free. Go Pro when you need more.</h2>
        <p style={{ fontSize: 14, color: colors.textDim, marginTop: 8 }}>One simple plan. Cancel anytime.</p>
      </div>
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        <div style={{ background: '#111218', border: '1px solid #22c55e', borderRadius: 14, padding: 32, position: 'relative' }}>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: colors.green, color: '#000', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 12, letterSpacing: 0.5 }}>Most popular</div>
          <p style={{ fontSize: 12, color: colors.green, letterSpacing: 2, margin: '0 0 6px 0', fontWeight: 600 }}>PRO</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: colors.text }}>$5</span>
            <span style={{ fontSize: 14, color: colors.textDim }}>/ month</span>
          </div>
          {[
            'Unlimited profile lookups',
            'Save unlimited profiles as Hits',
            'Full searchable lookup history',
            'Fast skin, cape & UUID exports',
            'Priority lookup queue',
          ].map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, fontSize: 14, color: colors.text }}>
              <span style={{ color: colors.green, fontWeight: 'bold' }}>✓</span> {feat}
            </div>
          ))}
          <button disabled style={{ width: '100%', marginTop: 24, padding: '14px 0', background: colors.green, color: '#000', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, opacity: 0.5, cursor: 'not-allowed', letterSpacing: 0.5 }}>Upgrade for $5/mo</button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: '28px 40px', borderTop: '1px solid #1a1b22', background: '#08080c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: colors.text, textTransform: 'uppercase' }}>MODRINTH</span>
      <p style={{ fontSize: 12, color: '#5c6068' }}>Reads public Minecraft profile data only. Not affiliated with Mojang or Microsoft.</p>
    </footer>
  );
}

export default function HomePage() {
  const [signedIn, setSignedIn] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Navbar signedIn={signedIn} onSignIn={() => setShowSignIn(true)} />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
      {showSignIn && <SignInModal onClose={() => { setShowSignIn(false); setSignedIn(true); }} />}
    </div>
  );
}
