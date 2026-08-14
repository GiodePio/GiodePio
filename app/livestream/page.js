'use client';

import { useState, useEffect, useRef } from 'react';

export default function LivestreamPage() {
  const [status, setStatus] = useState('Connecting...');
  const [statusColor, setStatusColor] = useState('#fa0');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatIndex, setChatIndex] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('');
  const imgRef = useRef(null);
  const chatLogRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (imgRef.current) {
        imgRef.current.src = '/api/latest?t=' + Date.now();
      }
    }, 33);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/chat/poll?index=' + chatIndex)
        .then(r => r.json())
        .then(data => {
          if (data.msg) {
            setChatMessages(prev => [...prev, { from: 'Player', text: data.msg }]);
            setChatIndex(data.next);
          }
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [chatIndex]);

  const handleImageLoad = () => {
    setStatus('Connected');
    setStatusColor('#0f0');
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const handleImageError = () => {
    setStatus('Waiting for stream...');
    setStatusColor('#fa0');
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg) return;
    
    await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ msg }),
    });
    
    setChatMessages(prev => [...prev, { from: 'You', text: msg }]);
    setChatInput('');
  };

  return (
    <div style={{ margin: 0, padding: 20, background: '#1a1a1a', color: 'white', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 10 }}>Live Stream</h1>
      <div style={{ color: statusColor, marginBottom: 10 }}>{status}</div>
      <img
        ref={imgRef}
        src="/api/latest"
        alt="Loading..."
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ maxWidth: '90vw', maxHeight: '70vh', border: '2px solid #333' }}
      />
      <div style={{ color: '#888', marginTop: 10 }}>Last update: {lastUpdate}</div>
      <div style={{ marginTop: 20, width: '90vw', maxWidth: 600 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendChat()}
            placeholder="Type a message..."
            maxLength={100}
            style={{ flex: 1, padding: 10, border: '1px solid #333', background: '#222', color: 'white', borderRadius: '5px 0 0 5px', fontSize: 16 }}
          />
          <button
            onClick={sendChat}
            style={{ padding: '10px 20px', background: '#5865F2', color: 'white', border: 'none', borderRadius: '0 5px 5px 0', fontSize: 16, cursor: 'pointer' }}
          >
            Send
          </button>
        </div>
        <div ref={chatLogRef} style={{ marginTop: 10, textAlign: 'left', maxHeight: 200, overflowY: 'auto' }}>
          {chatMessages.map((m, i) => (
            <div key={i} style={{ padding: '5px 10px', margin: '2px 0', background: '#222', borderRadius: 3, fontSize: 14 }}>
              <span style={{ color: '#5865F2', fontWeight: 'bold' }}>{m.from}:</span> {m.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
