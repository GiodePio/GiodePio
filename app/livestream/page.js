'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const colors = {
  bg: '#07070b',
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
};

export default function LivestreamPage() {
  // Stream states
  const [streamId] = useState('consentmod');
  const [streamMode, setStreamMode] = useState('auto'); // 'webrtc' | 'bridge' | 'auto'
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
  const [activePlayer, setActivePlayer] = useState('ConsentMod Player');
  const [lastUpdate, setLastUpdate] = useState('');

  // Chat states
  const [chatMessages, setChatMessages] = useState([
    { from: 'System', text: 'Connected to ConsentMod WebRTC live stream room.', time: 'Live' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatIndex, setChatIndex] = useState(0);

  // References
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const broadcastStreamRef = useRef(null);
  const chatLogRef = useRef(null);
  const candidateIndexRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(Date.now());
  const bridgeIntervalRef = useRef(null);
  const signalingIntervalRef = useRef(null);
  const peerIdRef = useRef('peer-' + Math.random().toString(36).substring(2, 9));

  // Auto-scroll chat
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // FPS Counter
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
      // Gracefully ignore frame decode hiccups without console error
    };

    let lastTimestamp = 0;

    bridgeIntervalRef.current = setInterval(async () => {
      // Fetch latest frame from ConsentMod
      try {
        const res = await fetch('/api/stream?username=consentmod&t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) return;

        const data = await res.json();
        if (data.online && data.frame) {
          if (data.timestamp && data.timestamp <= lastTimestamp) return;
          lastTimestamp = data.timestamp || Date.now();
          tempImg.src = data.frame;
          if (data.username) setActivePlayer(data.username);
        }
      } catch (e) {}
    }, 120);

    tempImg.onload = () => {
      if (ctx && tempImg.width > 0 && tempImg.height > 0) {
        if (canvas.width !== tempImg.width || canvas.height !== tempImg.height) {
          canvas.width = tempImg.width;
          canvas.height = tempImg.height;
        }
        ctx.drawImage(tempImg, 0, 0, canvas.width, canvas.height);
        updateFrameStats(canvas.width, canvas.height);

        // Bind WebRTC MediaStream from canvas if video element is not already playing P2P stream
        if (videoRef.current && (!videoRef.current.srcObject || videoRef.current.dataset.source !== 'p2p')) {
          if (!videoRef.current.srcObject) {
            try {
              const stream = canvas.captureStream ? canvas.captureStream(30) : null;
              if (stream) {
                videoRef.current.srcObject = stream;
                videoRef.current.dataset.source = 'bridge';
                videoRef.current.play().catch(() => {});
              }
            } catch (err) {
              console.warn('Canvas captureStream error:', err);
            }
          }
          setStatus('ConsentMod WebRTC Live');
          setStatusColor(colors.green);
          setProtocol('WebRTC MediaStream (ConsentMod Bridge)');
        }
      }
    };

    tempImg.onerror = () => {
      if (videoRef.current && videoRef.current.dataset.source !== 'p2p') {
        setStatus('Waiting for ConsentMod Stream...');
        setStatusColor('#eab308');
      }
    };
  }, [updateFrameStats]);

  // -------------------------------------------------------------
  // WebRTC P2P Signaling & Viewer Connection
  // -------------------------------------------------------------
  const initWebRTCViewer = useCallback(async () => {
    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Handle ICE candidates to send to signaling server
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/livestream/webrtc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'candidate',
              streamId,
              role: 'viewer',
              peerId: peerIdRef.current,
              candidate: event.candidate,
            }),
          }).catch(() => {});
        }
      };

      // Handle incoming remote WebRTC track
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

      // Data channel for P2P chat
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

      // ICE connection status monitoring
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

      // Poll signaling server for broadcaster offer
      if (signalingIntervalRef.current) clearInterval(signalingIntervalRef.current);

      signalingIntervalRef.current = setInterval(async () => {
        if (isBroadcasting) return;

        try {
          const res = await fetch(
            `/api/livestream/webrtc?streamId=${streamId}&role=viewer&peerId=${peerIdRef.current}&candidateIndex=${candidateIndexRef.current}`
          );
          if (!res.ok) return;
          const data = await res.json();

          if (data.hasBroadcaster && data.offer && pc.signalingState === 'stable') {
            // Set remote offer & send answer
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await fetch('/api/livestream/webrtc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'answer',
                streamId,
                role: 'viewer',
                peerId: peerIdRef.current,
                sdp: answer,
              }),
            });
          }

          // Apply new ICE candidates from broadcaster
          if (data.candidates && data.candidates.length > 0) {
            candidateIndexRef.current = data.nextCandidateIndex || candidateIndexRef.current + data.candidates.length;
            for (const cand of data.candidates) {
              try {
                const c = cand && cand.candidate ? cand.candidate : cand;
                await pc.addIceCandidate(new RTCIceCandidate(c));
              } catch (e) {}
            }
          }

          if (data.metadata?.username) {
            setActivePlayer(data.metadata.username);
          }
        } catch (err) {
          console.warn('Signaling poll warning:', err.message);
        }
      }, 1500);
    } catch (err) {
      console.error('WebRTC viewer init error:', err);
    }
  }, [streamId, isBroadcasting]);

  // -------------------------------------------------------------
  // WebRTC Broadcaster Mode (Screen / Game Share directly)
  // -------------------------------------------------------------
  const startBroadcasting = async () => {
    try {
      setStatus('Requesting Screen / Game Share...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 60, max: 60 },
          cursor: 'always',
        },
        audio: true,
      });

      broadcastStreamRef.current = stream;
      setIsBroadcasting(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.dataset.source = 'p2p';
        videoRef.current.play().catch(() => {});
      }

      // Initialize broadcaster WebRTC peer connection
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add media tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Create WebRTC DataChannel
      const dc = pc.createDataChannel('consentmod-chat');
      dataChannelRef.current = dc;

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/livestream/webrtc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'candidate',
              streamId,
              role: 'broadcaster',
              peerId: peerIdRef.current,
              candidate: event.candidate,
            }),
          }).catch(() => {});
        }
      };

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Publish offer to signaling server
      await fetch('/api/livestream/webrtc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'offer',
          streamId,
          role: 'broadcaster',
          peerId: peerIdRef.current,
          sdp: offer,
          metadata: {
            username: activePlayer || 'WebRTC Broadcaster',
            fps: 60,
          },
        }),
      });

      setStatus('Broadcasting Live via WebRTC (60 FPS)');
      setStatusColor(colors.green);
      setProtocol('WebRTC P2P Broadcaster');

      // Broadcaster ICE connection monitoring
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setStatus('WebRTC P2P Broadcaster (Client Connected)');
          setStatusColor(colors.green);
        }
      };

      // Poll for viewer answers
      if (signalingIntervalRef.current) clearInterval(signalingIntervalRef.current);
      signalingIntervalRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/livestream/webrtc?streamId=${streamId}&role=broadcaster&peerId=${peerIdRef.current}`
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

      // Handle user stopping screen share from browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopBroadcasting();
      };
    } catch (err) {
      console.error('Screen share error:', err);
      setStatus('Broadcast canceled or failed');
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
      body: JSON.stringify({ action: 'close', streamId }),
    }).catch(() => {});

    // Resume viewer mode
    initWebRTCViewer();
    startCanvasBridge();
  };

  // -------------------------------------------------------------
  // Chat & Minecraft ConsentMod Remote Command Sync
  // -------------------------------------------------------------
  useEffect(() => {
    const chatInterval = setInterval(() => {
      fetch('/api/chat/poll?index=' + chatIndex)
        .then((r) => r.json())
        .then((data) => {
          if (data.msg) {
            setChatMessages((prev) => [...prev, { from: 'ConsentMod Player', text: data.msg, time: new Date().toLocaleTimeString() }]);
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

    // 1. Send via WebRTC DataChannel if open
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(JSON.stringify({ from: 'You', msg: textToSend }));
      } catch (e) {}
    }

    // 2. Post to /api/chat/send so ConsentMod in Minecraft executes it
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg: textToSend }),
      });
    } catch (e) {}

    setChatMessages((prev) => [...prev, { from: 'You', text: textToSend, time: new Date().toLocaleTimeString() }]);
    if (!presetMsg) setChatInput('');
  };

  // -------------------------------------------------------------
  // Lifecycle Initialization
  // -------------------------------------------------------------
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
    <div
      style={{
        margin: 0,
        padding: '24px 32px',
        background: colors.bg,
        color: colors.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          width: '100%',
          maxWidth: 1380,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          padding: '16px 24px',
          background: colors.surface,
          borderRadius: 14,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: statusColor,
              boxShadow: `0 0 14px ${statusColor}`,
              animation: 'pulse 2s infinite',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
                ConsentMod Live Stream
              </h1>
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
                WebRTC Enabled
              </span>
            </div>
            <div style={{ fontSize: 13, color: colors.textDim, marginTop: 3 }}>
              Target: <strong style={{ color: colors.text }}>{activePlayer}</strong> • Status: {status}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isBroadcasting ? (
            <button
              onClick={startBroadcasting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#000',
                fontWeight: 700,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
                transition: 'transform 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <span>📡</span> Broadcast WebRTC Screen
            </button>
          ) : (
            <button
              onClick={stopBroadcasting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                background: colors.redBg,
                color: colors.red,
                fontWeight: 700,
                fontSize: 13,
                border: `1px solid rgba(239,68,68,0.4)`,
                cursor: 'pointer',
              }}
            >
              <span>⏹</span> Stop Broadcast
            </button>
          )}

          <a
            href="/dashboard/remote-control"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${colors.border}`,
              color: colors.text,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <span>🖥</span> Remote Control
          </a>
        </div>
      </header>

      {/* Main Grid: Stream & Chat */}
      <main
        style={{
          width: '100%',
          maxWidth: 1380,
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 20,
          flex: 1,
        }}
      >
        {/* Stream Player Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              minHeight: 520,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {/* Real-time HTML5 WebRTC Video Player */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />

            {/* Top Overlay: Stream Badges */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
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
                bottom: 14,
                right: 14,
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
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text,
                  cursor: 'pointer',
                  fontSize: 15,
                  padding: 4,
                }}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button
                onClick={toggleFullscreen}
                title="Fullscreen"
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text,
                  cursor: 'pointer',
                  fontSize: 15,
                  padding: 4,
                }}
              >
                ⛶
              </button>
            </div>
          </div>

          {/* Diagnostics Telemetry Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              padding: '14px 18px',
              background: colors.surface,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              fontSize: 12,
            }}
          >
            <div>
              <div style={{ color: colors.textDim, marginBottom: 2 }}>STREAM PROTOCOL</div>
              <div style={{ fontWeight: 600, color: colors.green }}>{protocol}</div>
            </div>
            <div>
              <div style={{ color: colors.textDim, marginBottom: 2 }}>ESTIMATED LATENCY</div>
              <div style={{ fontWeight: 600 }}>{latency}</div>
            </div>
            <div>
              <div style={{ color: colors.textDim, marginBottom: 2 }}>RESOLUTION & REFRESH</div>
              <div style={{ fontWeight: 600 }}>{resolution} @ {fps} fps</div>
            </div>
            <div>
              <div style={{ color: colors.textDim, marginBottom: 2 }}>LAST FRAME RECEIVED</div>
              <div style={{ fontWeight: 600 }}>{lastUpdate || 'Connecting...'}</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Chat & Remote Minecraft Commands */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: colors.surface,
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
            overflow: 'hidden',
            height: '100%',
            minHeight: 580,
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}>
              <span>💬</span> ConsentMod Stream Chat
            </div>
            <span
              style={{
                fontSize: 11,
                color: colors.green,
                background: colors.greenBg,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              Live Sync
            </span>
          </div>

          {/* Quick Minecraft Command Shortcuts */}
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 11, color: colors.textDim, width: '100%', marginBottom: 2 }}>
              SEND MINECRAFT COMMAND:
            </span>
            <button
              onClick={() => sendChat('/say Hello from WebRTC livestream!')}
              style={{
                fontSize: 11,
                padding: '4px 8px',
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
                padding: '4px 8px',
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
                padding: '4px 8px',
                borderRadius: 5,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${colors.border}`,
                color: colors.text,
                cursor: 'pointer',
              }}
            >
              /weather clear 🌤
            </button>
          </div>

          {/* Chat Messages Log */}
          <div
            ref={chatLogRef}
            style={{
              flex: 1,
              padding: 14,
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

          {/* Chat Input Field */}
          <div
            style={{
              padding: 14,
              borderTop: `1px solid ${colors.border}`,
              background: 'rgba(0,0,0,0.2)',
            }}
          >
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
                  padding: '10px 14px',
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
                  padding: '10px 18px',
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
        </div>
      </main>
    </div>
  );
}
