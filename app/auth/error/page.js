'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Unknown error';

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ background: '#15161c', border: '1px solid #2a2d38', borderRadius: 16, padding: 40, maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 16px 0' }}>Sign-in failed</h1>
        <p style={{ fontSize: 14, color: '#a0a4b0', margin: '0 0 24px 0', lineHeight: 1.6 }}>{message}</p>
        <a href="/" style={{ display: 'inline-block', padding: '12px 28px', background: '#22c55e', color: '#000', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Back to Home</a>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0f' }} />}>
      <ErrorContent />
    </Suspense>
  );
}
