'use client';

import { useState, useEffect } from 'react';

export default function Particles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 25 + 15,
      delay: Math.random() * 25,
    }));
    setParticles(p);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
    }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.left + '%',
          width: p.size + 'px',
          height: p.size + 'px',
          background: 'rgba(255,255,255,0.12)',
          borderRadius: '50%',
          animation: `float ${p.duration}s linear ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}
