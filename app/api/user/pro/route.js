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

  // 1. Check pro_users table as primary authority
  try {
    const { data: proRecord } = await supabase
      .from('pro_users')
      .select('is_pro, free_uses_remaining')
      .eq('email', normEmail)
      .single();

    if (proRecord && typeof proRecord.is_pro === 'boolean') {
      const isPro = proRecord.is_pro;
      const freeUses = isPro ? null : (proRecord.free_uses_remaining ?? 3);
      return NextResponse.json({
        is_pro: isPro,
        free_uses_remaining: freeUses,
        trial_exhausted: !isPro && freeUses <= 0,
      });
    }
  } catch (e) {}

  // 2. Check Auth user_metadata if no pro_users record
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(user.id);
    const meta = authData?.user?.user_metadata;
    if (meta && typeof meta.is_pro === 'boolean') {
      const isPro = meta.is_pro;
      const freeUses = isPro ? null : (meta.free_uses_remaining ?? 3);
      return NextResponse.json({
        is_pro: isPro,
        free_uses_remaining: freeUses,
        trial_exhausted: !isPro && freeUses <= 0,
      });
    }
  } catch (e) {}

  // 3. Check users table
  try {
    const { data } = await supabase
      .from('users')
      .select('is_pro, free_uses_remaining')
      .ilike('email', normEmail)
      .single();

    if (data && typeof data.is_pro === 'boolean') {
      const isPro = data.is_pro;
      const freeUses = isPro ? null : (data.free_uses_remaining ?? 3);
      return NextResponse.json({
        is_pro: isPro,
        free_uses_remaining: freeUses,
        trial_exhausted: !isPro && freeUses <= 0,
      });
    }
  } catch (e) {}

  return NextResponse.json({
    is_pro: false,
    free_uses_remaining: 3,
    trial_exhausted: false,
  });
}
