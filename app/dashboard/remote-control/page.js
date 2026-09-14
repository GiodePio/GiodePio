'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import RemoteControlStream from '@/components/RemoteControlStream';

const ADMIN_EMAILS = ['lifegrading@gmail.com', 'giodewaard152@gmail.com'];

const colors = {
  bg: '#050508',
  panel: 'rgba(13, 13, 18, 0.7)',
  surface: 'rgba(10, 10, 16, 0.8)',
  border: 'rgba(255,255,255,0.06)',
  text: '#f0f0f0',
  textDim: '#6b6e7b',
  green: '#22c55e',
  blue: '#3b82f6',
  red: '#ef4444',
};

export default function RemoteControlPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [proChecked, setProChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/user')
      .then((r) => r.json())
      .then((d) => {
        const email = d.user?.email || '';
        setUserEmail(email);

        if (ADMIN_EMAILS.includes(email.toLowerCase())) {
          setIsPro(true);
          setProChecked(true);
          return;
        }

        fetch('/api/user/pro?t=' + Date.now(), { cache: 'no-store' })
          .then((r) => r.json())
          .then((p) => {
            setIsPro(!!p.is_pro);
            setProChecked(true);
          })
          .catch(() => {
            setIsPro(false);
            setProChecked(true);
          });
      })
      .catch(() => {
        setProChecked(true);
      });
  }, []);

  if (!proChecked) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim }}>Loading Remote Control...</div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <Sidebar userEmail={userEmail} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Pro Required</div>
          <div style={{ fontSize: 14, color: colors.textDim, textAlign: 'center', maxWidth: 400 }}>
            Remote Control live streaming is only available for Pro users. Free trials cannot access this feature.
          </div>
          <button onClick={() => router.push('/dashboard?tab=plans')} style={{ cursor: 'pointer', background: colors.green, color: '#000', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>Upgrade to Pro</button>
          <div onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer', color: colors.textDim, fontSize: 14, marginTop: 8 }}>← Back to Dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <Sidebar userEmail={userEmail} />

      <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        <RemoteControlStream initialTarget="consentmod" />
      </main>
    </div>
  );
}