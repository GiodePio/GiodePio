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
  if (!user || !user.email) return NextResponse.json({ is_pro: false, free_uses_remaining: 3, trial_exhausted: false });

  const normEmail = user.email.toLowerCase();
  if (normEmail === 'lifegrading@gmail.com') {
    return NextResponse.json({ is_pro: true, free_uses_remaining: null, trial_exhausted: false });
  }

  const supabase = getClient();
  let isPro = false;
  let freeUses = 3;

  // 1. Check pro_users table
  try {
    const { data: proRecord } = await supabase
      .from('pro_users')
      .select('is_pro, free_uses_remaining')
      .eq('email', normEmail)
      .single();

    if (proRecord) {
      if (typeof proRecord.is_pro === 'boolean') isPro = proRecord.is_pro;
      if (!isPro && typeof proRecord.free_uses_remaining === 'number') {
        freeUses = proRecord.free_uses_remaining;
      }
    }
  } catch (e) {}

  // 2. Fallback check Auth user_metadata
  if (!isPro) {
    try {
      const { data: authData } = await supabase.auth.admin.getUserById(user.id);
      const meta = authData?.user?.user_metadata;
      if (meta) {
        if (meta.is_pro === true) isPro = true;
        if (!isPro && typeof meta.free_uses_remaining === 'number') {
          freeUses = meta.free_uses_remaining;
        }
      }
    } catch (e) {}
  }

  // 3. Fallback check users table
  if (!isPro) {
    try {
      const { data } = await supabase
        .from('users')
        .select('is_pro, free_uses_remaining')
        .ilike('email', normEmail)
        .single();

      if (data) {
        if (data.is_pro === true) isPro = true;
        if (!isPro && typeof data.free_uses_remaining === 'number') {
          freeUses = data.free_uses_remaining;
        }
      }
    } catch (e) {}
  }

  return NextResponse.json({
    is_pro: isPro,
    free_uses_remaining: isPro ? null : freeUses,
    trial_exhausted: !isPro && freeUses <= 0,
  });
}
