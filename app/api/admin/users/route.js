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

  let targetAuthId = null;
  let targetAuth = null;
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase().trim() === normEmail);
    if (targetAuth) targetAuthId = targetAuth.id;
  } catch (e) {}

  // 1. Primary Write: public.users table in Supabase
  // We DELIBERATELY omit pro_expires_at here because it does not exist in schema.sql for public.users
  // This guarantees the update succeeds in Supabase so the user can visually see it.
  try {
    const updatePayload = {
      is_pro,
      free_uses_remaining: freeUses,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedRows, error: updateErr } = await supabase
      .from('users')
      .update(updatePayload)
      .ilike('email', normEmail)
      .select();

    if (updateErr || !updatedRows || updatedRows.length === 0) {
      await supabase.from('users').upsert({
        id: targetAuthId,
        email: normEmail,
        is_pro,
        free_uses_remaining: freeUses,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
    }
  } catch (e) {
    console.error('Best-effort users table write:', e);
  }

  // 2. Secondary Write: public.pro_users table (this table HAS pro_expires_at)
  try {
    await supabase
      .from('pro_users')
      .upsert({
        email: normEmail,
        is_pro,
        pro_expires_at: proExpiresAt,
        free_uses_remaining: freeUses,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
  } catch (e) {}

  // 3. Fallback Write: Auth user_metadata
  if (targetAuthId) {
    try {
      await supabase.auth.admin.updateUserById(targetAuthId, {
        user_metadata: {
          ...(targetAuth?.user_metadata || {}),
          is_pro,
          pro_expires_at: proExpiresAt,
          free_uses_remaining: freeUses,
        },
      });
    } catch (e) {}
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

    let targetAuthId = null;
    let targetAuth = null;
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase().trim() === normEmail);
      if (targetAuth) targetAuthId = targetAuth.id;
    } catch (e) {}

    // 1. Primary Write: public.users
    try {
      const { data: updatedRows, error: updateErr } = await supabase
        .from('users')
        .update({
          is_pro: false,
          free_uses_remaining: newValue,
          updated_at: new Date().toISOString(),
        })
        .ilike('email', normEmail)
        .select();

      if (updateErr || !updatedRows || updatedRows.length === 0) {
        await supabase.from('users').upsert({
          id: targetAuthId,
          email: normEmail,
          is_pro: false,
          free_uses_remaining: newValue,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
      }
    } catch (e) {}

    // 2. Secondary Write: public.pro_users
    try {
      await supabase
        .from('pro_users')
        .upsert({
          email: normEmail,
          is_pro: false,
          pro_expires_at: null,
          free_uses_remaining: newValue,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
    } catch (e) {}

    // 3. Fallback Write: Auth user_metadata
    if (targetAuthId) {
      try {
        await supabase.auth.admin.updateUserById(targetAuthId, {
          user_metadata: {
            ...(targetAuth?.user_metadata || {}),
            is_pro: false,
            pro_expires_at: null,
            free_uses_remaining: newValue,
          },
        });
      } catch (e) {}
    }

    return NextResponse.json({ ok: true, email: normEmail, free_uses_remaining: newValue });
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 });
}
