'use client';

import { useState, useEffect, useRef } from 'react';

export default function LivestreamPage() {
  const [status, setStatus] = useState('Connecting...');
  const [statusColor, setStatusColor] = useState('#fa0');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const chatLogRef = useRef(null);

  // Automatisch naar beneden scrollen bij nieuwe chatberichten
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Realtime Chat via Server-Sent Events (SSE)
  useEffect(() => {
    const eventSource = new EventSource('/api/chat/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.msg) {
          setChatMessages((prev) => [...prev, { from: data.from || 'Player', text: data.msg }]);
          setLastUpdate(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error('Fout bij verwerken chat event:', err);
      }
    };

    eventSource.onerror = () => {
      setStatus('Chat connection lost. Reconnecting...');
      setStatusColor('#f00');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleStreamLoad = () => {
    setStatus('Connected');
    setStatusColor('#0f0');
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const handleStreamError = () => {
    setStatus('Waiting for stream...');
    setStatusColor('#fa0');
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg) return;

    setChatMessages((prev) => [...prev, { from: 'You', text: msg }]);
    setChatInput('');

    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg }),
      });
    } catch (err) {
      console.error('Fout bij verzenden bericht:', err);
    }
  };

  return (
    <div style={{ margin: 0, padding: 20, background: '#1a1a1a', color: 'white', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 10 }}>Live Stream</h1>
      <div style={{ color: statusColor, marginBottom: 10, fontWeight: 'bold' }}>{status}</div>
      
      <img
        src="/api/stream"
        alt="Livestream feed"
        onLoad={handleStreamLoad}
        onError={handleStreamError}
        style={{ maxWidth: '90vw', maxHeight: '70vh', border: '2px solid #333', borderRadius: '4px', backgroundColor: '#000' }}
      />
      
      <div style={{ color: '#888', marginTop: 10, fontSize: 12 }}>Last update: {lastUpdate}</div>
      
      <div style={{ marginTop: 20, width: '90vw', maxWidth: 600 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            placeholder="Type a message..."
            maxLength={100}
            style={{ flex: 1, padding: 10, border: '1px solid #333', background: '#222', color: 'white', borderRadius: '5px 0 0 5px', fontSize: 16 }}
          />
          <button
            onClick={sendChat}
            style={{ padding: '10px 20px', background: '#5865F2', color: 'white', border: 'none', borderRadius: '0 5px 5px 0', fontSize: 16, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Send
          </button>
        </div>
        
        <div ref={chatLogRef} style={{ marginTop: 10, textAlign: 'left', maxHeight: 200, overflowY: 'auto', border: '1px solid #2a2a2a', padding: '5px', borderRadius: '4px' }}>
          {chatMessages.map((m, i) => (
            <div key={i} style={{ padding: '5px 10px', margin: '4px 0', background: '#222', borderRadius: 3, fontSize: 14 }}>
              <span style={{ color: m.from === 'You' ? '#43b581' : '#5865F2', fontWeight: 'bold' }}>{m.from}:</span> {m.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
