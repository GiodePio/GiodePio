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

  const normEmail = user.email.toLowerCase().trim();
  if (normEmail === 'lifegrading@gmail.com') {
    return NextResponse.json({ is_pro: true, free_uses_remaining: null, trial_exhausted: false });
  }

  const supabase = getClient();
  const now = new Date();

  function evaluate(isPro, expiresAt, freeUses) {
    if (isPro === false) {
      const uses = typeof freeUses === 'number' ? freeUses : 3;
      return { is_pro: false, free_uses_remaining: uses, trial_exhausted: uses <= 0 };
    }
    if (isPro === true) {
      if (expiresAt) {
        const exp = new Date(expiresAt);
        if (now < exp) {
          const remSec = Math.max(0, Math.floor((exp - now) / 1000));
          return { is_pro: true, remaining_seconds: remSec, free_uses_remaining: null, trial_exhausted: false };
        } else {
          const uses = typeof freeUses === 'number' ? freeUses : 3;
          return { is_pro: false, free_uses_remaining: uses, trial_exhausted: uses <= 0, expired: true };
        }
      } else {
        return { is_pro: true, free_uses_remaining: null, trial_exhausted: false };
      }
    }
    return null;
  }

  // 1. Check pro_users table
  try {
    const { data: proRecord } = await supabase
      .from('pro_users')
      .select('is_pro, pro_expires_at, free_uses_remaining')
      .eq('email', normEmail)
      .single();

    if (proRecord && typeof proRecord.is_pro === 'boolean') {
      const res = evaluate(proRecord.is_pro, proRecord.pro_expires_at, proRecord.free_uses_remaining);
      if (res) return NextResponse.json(res);
    }
  } catch (e) {}

  // 2. Check Auth metadata
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(user.id);
    const meta = authData?.user?.user_metadata;
    if (meta && typeof meta.is_pro === 'boolean') {
      const res = evaluate(meta.is_pro, meta.pro_expires_at, meta.free_uses_remaining);
      if (res) return NextResponse.json(res);
    }
  } catch (e) {}

  // 3. Check public.users table
  try {
    const { data: dbUser } = await supabase
      .from('users')
      .select('is_pro, free_uses_remaining')
      .ilike('email', normEmail)
      .single();

    if (dbUser && typeof dbUser.is_pro === 'boolean') {
      const res = evaluate(dbUser.is_pro, null, dbUser.free_uses_remaining);
      if (res) return NextResponse.json(res);
    }
  } catch (e) {}

  return NextResponse.json({ is_pro: false, free_uses_remaining: 3, trial_exhausted: false });
}
