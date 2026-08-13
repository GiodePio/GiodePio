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
  if (!user) return NextResponse.json({ is_pro: false, free_uses_remaining: 3, trial_exhausted: false });

  if (user.email === 'lifegrading@gmail.com') {
    return NextResponse.json({ is_pro: true, free_uses_remaining: null, trial_exhausted: false });
  }

  const supabase = getClient();
  let isPro = user.user_metadata?.is_pro || false;
  let freeUses = user.user_metadata?.free_uses_remaining ?? 3;

  try {
    const { data: authData } = await supabase.auth.admin.getUserById(user.id);
    if (authData?.user?.user_metadata) {
      const meta = authData.user.user_metadata;
      if (meta.is_pro !== undefined && meta.is_pro !== null) isPro = meta.is_pro;
      if (meta.free_uses_remaining !== undefined && meta.free_uses_remaining !== null) freeUses = meta.free_uses_remaining;
    }
  } catch (e) {}

  try {
    const { data } = await supabase
      .from('users')
      .select('is_pro, free_uses_remaining')
      .eq('email', user.email)
      .single();

    if (data) {
      if (data.is_pro !== undefined && data.is_pro !== null) isPro = data.is_pro;
      if (data.free_uses_remaining !== undefined && data.free_uses_remaining !== null) freeUses = data.free_uses_remaining;
    }
  } catch (e) {}

  return NextResponse.json({
    is_pro: isPro,
    free_uses_remaining: isPro ? null : freeUses,
    trial_exhausted: !isPro && freeUses <= 0,
  });
}
