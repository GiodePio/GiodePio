'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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

const BUILD_STEPS = [
  { label: 'Queuing runner...', duration: 600 },
  { label: 'Setting environment...', duration: 800 },
  { label: 'Compiling jar...', duration: 0 },
  { label: 'Compiled complete', duration: 400 },
  { label: 'Uploading to storage...', duration: 600 },
  { label: 'Finalizing...', duration: 500 },
  { label: 'Build complete', duration: 0 },
];

export default function BuildPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (p) => pathname === p || pathname.startsWith(p + '/');
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [buildStep, setBuildStep] = useState(-1);
  const [buildDone, setBuildDone] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [freeUses, setFreeUses] = useState(null);
  const [trialExhausted, setTrialExhausted] = useState(false);
  const [proChecked, setProChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email) {
          setUserEmail(d.user.email);
          setEmail(d.user.email);
          setEmailConfirmed(true);
          if (d.user.email.toLowerCase() === 'lifegrading@gmail.com') {
            setIsPro(true);
            setProChecked(true);
          } else {
            fetch('/api/user/pro?t=' + Date.now(), { cache: 'no-store' })
              .then(r => r.json())
              .then(p => {
                setIsPro(p.is_pro);
                setFreeUses(p.free_uses_remaining);
                setTrialExhausted(p.trial_exhausted || false);
                setProChecked(true);
              })
              .catch(() => { setIsPro(false); setProChecked(true); });
          }
        } else {
          setProChecked(true);
        }
      })
      .catch(() => setProChecked(true));
  }, []);

  const handleConfirmEmail = () => {
    if (email && email.includes('@')) setEmailConfirmed(true);
  };

  const handleDownload = async () => {
    if (!emailConfirmed || !email) return;
    setDownloading(true);
    setBuildStep(0);
    setBuildDone(false);

    let stepIndex = 0;
    const apiPromise = fetch(`/api/download?email=${encodeURIComponent(email)}`);

    const runSteps = async () => {
      for (let i = 0; i < BUILD_STEPS.length; i++) {
        stepIndex = i;
        setBuildStep(i);
        if (i === 2) {
          await apiPromise;
        }
        if (BUILD_STEPS[i].duration > 0) {
          await new Promise(r => setTimeout(r, BUILD_STEPS[i].duration));
        }
      }
    };

    await runSteps();

    try {
      const res = await apiPromise;
      if (res.ok) {
        const disposition = res.headers.get('content-disposition');
        const fileName = disposition ? disposition.split('filename=')[1]?.replace(/"/g, '') : 'consentmod.jar';
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {}

    setBuildDone(true);
    setTimeout(() => { setDownloading(false); setBuildDone(false); setBuildStep(-1); }, 2000);
  };

  if (!proChecked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
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
          <NavItem icon="📊" label="Dashboard" active={isActive('/dashboard') && !isActive('/dashboard/grabs') && !isActive('/dashboard/build') && !isActive('/dashboard/remote-control') && !isActive('/dashboard/rep') && !isActive('/dashboard/updates') && !isActive('/dashboard/leaderboard') && !isActive('/dashboard/tickets') && !isActive('/dashboard/settings')} onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" active={isActive('/dashboard/grabs')} onClick={() => router.push('/dashboard/grabs')} />
          <NavItem icon="🔨" label="Build" active={isActive('/dashboard/build')} onClick={() => router.push('/dashboard/build')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
          <NavItem icon="🖥" label="Remote Control" active={isActive('/dashboard/remote-control')} onClick={() => router.push('/dashboard/remote-control')} />
          <NavItem icon="⭐" label="+Rep" active={isActive('/dashboard/rep')} onClick={() => router.push('/dashboard/rep')} />
          <NavItem icon="📢" label="Updates" active={isActive('/dashboard/updates')} onClick={() => router.push('/dashboard/updates')} />
          <NavItem icon="🏆" label="Leaderboard" active={isActive('/dashboard/leaderboard')} onClick={() => router.push('/dashboard/leaderboard')} />
          <NavItem icon="💬" label="Join Discord" onClick={() => window.open('https://discord.gg/FV2668v4Zp','_blank')} />
          <NavItem icon="🎫" label="Tickets" active={isActive('/dashboard/tickets')} onClick={() => router.push('/dashboard/tickets')} />
          {userEmail === 'lifegrading@gmail.com' && <NavItem icon="👥" label="Admin" active={isActive('/admin')} onClick={() => router.push('/admin')} />}
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" active={isActive('/dashboard/settings')} onClick={() => router.push('/dashboard/settings')} />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>
      <div style={{ flex: 1, padding: '28px 36px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Build Center</h1>
        <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Build, download, and install your mods.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="glass-card" style={{ borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 600, color: colors.text }}>
              <span>📧</span> Account Configuration
            </div>
            <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>YOUR EMAIL</div>
            <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 12 }}>
              This email is baked into your mod. Each download creates a personalized build.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailConfirmed(false); }}
                placeholder="your@email.com"
                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none', transition: 'all 0.2s ease' }}
              />
              <button
                onClick={handleConfirmEmail}
                disabled={!email || !email.includes('@')}
                className="btn-smooth"
                style={{ background: emailConfirmed ? colors.green : 'transparent', color: emailConfirmed ? '#000' : colors.textDim, border: `1px solid ${emailConfirmed ? colors.green : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: email && email.includes('@') ? 'pointer' : 'not-allowed' }}
              >
                {emailConfirmed ? '✓ Confirmed' : 'Confirm'}
              </button>
            </div>
            {emailConfirmed && email && (
              <div style={{ marginTop: 10, fontSize: 12, color: colors.green }}>
                ✓ Configured — grabs will be tagged to <strong>{email}</strong>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 600, color: colors.text }}>
              <span>🔨</span> Build Mod
            </div>
            <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>VERSION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 16px', fontSize: 14, color: colors.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                Fabric 1.21.11
                <span style={{ background: colors.green, color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>LATEST</span>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={!emailConfirmed || downloading}
              className="btn-smooth"
              style={{ background: 'transparent', border: `1px solid ${emailConfirmed && !downloading ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`, color: emailConfirmed && !downloading ? colors.text : '#555', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: emailConfirmed && !downloading ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span>↓</span> {downloading ? 'Building...' : 'Download JAR'}
            </button>
            {!emailConfirmed && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>Confirm your email first to enable download</div>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📦</span> How It Works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ fontSize: 13, color: colors.textDim }}>
              <div style={{ color: colors.green, fontWeight: 600, marginBottom: 4 }}>1. Link Minecraft Username</div>
              Go to Dashboard and enter your Minecraft username. This links your account to your mod grabs automatically.
            </div>
            <div style={{ fontSize: 13, color: colors.textDim }}>
              <div style={{ color: colors.green, fontWeight: 600, marginBottom: 4 }}>2. Download &amp; Install</div>
              Download the JAR, place it in your Minecraft mods folder. Your grabs will auto-appear on your dashboard.
            </div>
          </div>
        </div>
      </div>

      {downloading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: colors.panel, border: `1px solid ${colors.border}`, borderRadius: 16, padding: '40px 48px', textAlign: 'center', minWidth: 420 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 6 }}>Building your mod</div>
            <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 28 }}>Personalizing for <strong style={{ color: colors.green }}>{email}</strong></div>

            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              {BUILD_STEPS.map((step, i) => {
                const isCurrent = i === buildStep && !buildDone;
                const isDone = i < buildStep || buildDone;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', opacity: isDone || isCurrent ? 1 : 0.3 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: isDone ? colors.green : isCurrent ? '#1a1b24' : 'transparent', color: isDone ? '#000' : isCurrent ? colors.green : '#444', border: isCurrent ? `1px solid ${colors.green}` : isDone ? 'none' : '1px solid #333' }}>
                      {isDone ? '✓' : isCurrent ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> : i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: isDone ? colors.green : isCurrent ? colors.text : '#555', fontWeight: isCurrent ? 600 : 400 }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {buildDone && (
              <div style={{ fontSize: 14, color: colors.green, fontWeight: 600, marginTop: 8 }}>Download starting...</div>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
