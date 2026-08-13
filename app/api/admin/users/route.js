export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { getUserProState } from '@/lib/supabase/free-trial';

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

const ADMIN_EMAIL = 'lifegrading@gmail.com';

function isOwnerEmail(email) {
  return email && email.toLowerCase().trim() === ADMIN_EMAIL;
}

export async function GET(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || !isOwnerEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getClient();

  let authUsersList = [];
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    if (authData?.users) authUsersList = authData.users;
  } catch (e) {}

  const userMap = new Map();

  for (const au of authUsersList) {
    if (!au.email) continue;
    const normEmail = au.email.toLowerCase().trim();
    const meta = au.user_metadata || {};
    const state = await getUserProState(supabase, normEmail);

    userMap.set(normEmail, {
      id: au.id,
      email: au.email,
      display_name: meta.full_name || au.email,
      is_pro: state.is_pro,
      pro_expires_at: state.pro_expires_at || null,
      remaining_pro_seconds: state.remaining_seconds,
      free_uses_remaining: state.free_uses_remaining,
      created_at: au.created_at,
      last_login_at: au.last_sign_in_at || null,
    });
  }

  const result = Array.from(userMap.values());
  return NextResponse.json({ users: result });
}

export async function POST(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || !isOwnerEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email, is_pro, duration_seconds } = body;

  if (!email || typeof is_pro !== 'boolean') {
    return NextResponse.json({ error: 'email and is_pro required' }, { status: 400 });
  }

  const normEmail = email.toLowerCase().trim();
  const supabase = getClient();
  const freeUses = is_pro ? null : 3;

  let proExpiresAt = null;
  if (is_pro && typeof duration_seconds === 'number' && duration_seconds > 0) {
    proExpiresAt = new Date(Date.now() + duration_seconds * 1000).toISOString();
  }

  // ONLY Write to public.pro_users table (as requested by user)
  let proErr = null;
  try {
    const { error } = await supabase
      .from('pro_users')
      .upsert({
        email: normEmail,
        is_pro,
        pro_expires_at: proExpiresAt,
        free_uses_remaining: freeUses,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
    if (error) proErr = error.message;
  } catch (e) {
    proErr = e.message;
  }

  if (proErr) {
    return NextResponse.json({ error: `Supabase error (pro_users table missing?): ${proErr}` }, { status: 500 });
  }

  const remainingProSeconds = proExpiresAt ? Math.max(0, Math.floor((new Date(proExpiresAt) - new Date()) / 1000)) : null;

  return NextResponse.json({
    ok: true,
    email: normEmail,
    is_pro,
    pro_expires_at: proExpiresAt,
    remaining_pro_seconds: remainingProSeconds,
    free_uses_remaining: freeUses,
  });
}

export async function PATCH(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || !isOwnerEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email, action } = body;

  if (!email || !action) {
    return NextResponse.json({ error: 'email and action required' }, { status: 400 });
  }

  const normEmail = email.toLowerCase().trim();
  const supabase = getClient();

  if (action === 'add_use' || action === 'remove_use') {
    const state = await getUserProState(supabase, normEmail);
    const currentUses = state.free_uses_remaining ?? 3;
    const delta = action === 'add_use' ? 1 : -1;
    const newValue = Math.max(0, currentUses + delta);

    // ONLY Write to public.pro_users table
    let proErr = null;
    try {
      const { error } = await supabase
        .from('pro_users')
        .upsert({
          email: normEmail,
          is_pro: false,
          pro_expires_at: null,
          free_uses_remaining: newValue,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
      if (error) proErr = error.message;
    } catch (e) {
      proErr = e.message;
    }

    if (proErr) {
      return NextResponse.json({ error: `Supabase error: ${proErr}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, email: normEmail, free_uses_remaining: newValue });
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 });
}
