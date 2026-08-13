'use client';
// Redirect live captures to dashboard with live tab
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function LiveRedirect() {
  const router = useRouter();
  useEffect(() => router.replace('/dashboard'), []);
  return null;
}
