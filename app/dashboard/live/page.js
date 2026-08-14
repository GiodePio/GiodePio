'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const colors = {
  bg: '#050508',
  panel: 'rgba(13, 13, 18, 0.7)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
  purple: '#a855f7',
};

export default function LivePage() {
  const router = useRouter();
  const [captures, setCaptures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  const fetchCaptures = () => {
    fetch('/api/live')
      .then(r => r.json())
      .then(d => {
        if (d.captures) {
          setCaptures(d.captures);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email) {
          setUserEmail(d.user.email);
        }
      });

    fetchCaptures();
    const interval = setInterval(fetchCaptures, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTime = (t) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="page-enter" style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Sidebar userEmail={userEmail} router={router} />
      
      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors.red, boxShadow: `0 0 10px ${colors.red}`, animation: 'pulse 2s infinite' }} />
            Live Feed
          </span>
        </div>
        <p style={{ color: colors.textDim, fontSize: 14, marginBottom: 28 }}>
          Global real-time capture feed across the network. Details are hidden for privacy.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {captures.map((c, i) => (
            <div
              key={c.id + '_' + i}
              className="glass-card"
              style={{
                borderRadius: 12,
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: i === 0 ? 'rgba(34,197,94,0.05)' : colors.panel,
                border: i === 0 ? `1px solid rgba(34,197,94,0.2)` : `1px solid ${colors.border}`,
                animation: 'fade-in 0.5s ease-out'
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <span style={{ fontSize: 20 }}>👤</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: colors.text, fontFamily: 'monospace' }}>
                    {c.minecraft_username}
                  </span>
                  <span style={{ background: 'rgba(94, 234, 212, 0.1)', color: '#5eead4', fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {c.os?.includes('Windows') ? 'Windows' : c.os?.includes('Mac') ? 'macOS' : c.os?.includes('Linux') ? 'Linux' : c.os || 'Unknown OS'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: colors.textDim, marginTop: 4 }}>
                  Anonymous Capture
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: i === 0 ? colors.green : colors.textDim, fontWeight: i === 0 ? 600 : 400 }}>
                  {formatTime(c.created_at)}
                </span>
              </div>
            </div>
          ))}

          {captures.length === 0 && !loading && (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: colors.textDim, borderRadius: 12, fontSize: 14 }}>
              No recent captures on the network.
            </div>
          )}
          {loading && captures.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: colors.textDim, fontSize: 14 }}>
              Connecting to live stream...
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
