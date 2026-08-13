export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function getClientAuth(request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );
}

export async function GET(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ is_pro: false, free_uses_remaining: null });

  const supabase = getClient();

  const { data } = await supabase
    .from('users')
    .select('is_pro, free_uses_remaining')
    .eq('email', user.email)
    .single();

  return NextResponse.json({
    is_pro: data?.is_pro || false,
    free_uses_remaining: data?.is_pro ? null : (data?.free_uses_remaining ?? 3),
    trial_exhausted: !data?.is_pro && (data?.free_uses_remaining ?? 3) <= 0,
  });
}
