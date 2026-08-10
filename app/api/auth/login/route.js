export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.modrinth.nl';

export async function GET(request) {
  const redirectTo = new URL(request.url).searchParams.get('redirect') ?? '/dashboard';

  let cookiesToSet = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookies) {
          cookiesToSet = cookies;
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${SITE_URL}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, SITE_URL));
  }

  const res = NextResponse.redirect(data.url);
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options);
  });
  return res;
}
