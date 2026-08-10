export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.modrinth.nl';

export async function GET(request) {
  const redirectTo = new URL(request.url).searchParams.get('redirect') ?? '/dashboard';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${SITE_URL}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    return NextResponse.redirect(new URL('/auth/error', SITE_URL));
  }

  return NextResponse.redirect(data.url);
}
