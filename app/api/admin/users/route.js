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

const ADMIN_EMAIL = 'lifegrading@gmail.com';

function isOwnerEmail(email) {
  return email && email.toLowerCase() === ADMIN_EMAIL;
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
    if (authData?.users) {
      authUsersList = authData.users;
    }
  } catch (e) {}

  let dbUsers = [];
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) dbUsers = data;
  } catch (e) {}

  const userMap = new Map();

  for (const au of authUsersList) {
    if (!au.email) continue;
    const normEmail = au.email.toLowerCase();
    const meta = au.user_metadata || {};
    const isOwner = isOwnerEmail(normEmail);
    const isPro = isOwner || meta.is_pro === true;
    const freeUses = isPro ? null : (typeof meta.free_uses_remaining === 'number' ? meta.free_uses_remaining : 3);

    userMap.set(normEmail, {
      id: au.id,
      email: au.email,
      display_name: meta.full_name || au.email,
      is_pro: isPro,
      free_uses_remaining: freeUses,
      created_at: au.created_at,
      last_login_at: au.last_sign_in_at || null,
    });
  }

  for (const dbu of dbUsers) {
    if (!dbu.email) continue;
    const normEmail = dbu.email.toLowerCase();
    const existing = userMap.get(normEmail);

    const isOwner = isOwnerEmail(normEmail);
    let isPro = isOwner;
    if (isOwner) {
      isPro = true;
    } else if (existing && typeof existing.is_pro === 'boolean') {
      isPro = existing.is_pro || dbu.is_pro === true;
    } else if (typeof dbu.is_pro === 'boolean') {
      isPro = dbu.is_pro;
    }

    let freeUses = null;
    if (!isPro) {
      if (existing && typeof existing.free_uses_remaining === 'number') {
        freeUses = existing.free_uses_remaining;
      } else if (typeof dbu.free_uses_remaining === 'number') {
        freeUses = dbu.free_uses_remaining;
      } else {
        freeUses = 3;
      }
    }

    userMap.set(normEmail, {
      id: dbu.id || existing?.id,
      email: dbu.email,
      display_name: dbu.display_name || existing?.display_name || dbu.email,
      is_pro: isPro,
      free_uses_remaining: freeUses,
      created_at: dbu.created_at || existing?.created_at,
      last_login_at: dbu.last_login_at || existing?.last_login_at,
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
  const { email, is_pro } = body;

  if (!email || typeof is_pro !== 'boolean') {
    return NextResponse.json({ error: 'email and is_pro required' }, { status: 400 });
  }

  const normEmail = email.toLowerCase();
  const supabase = getClient();

  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase() === normEmail);
    if (targetAuth) {
      const existingMeta = targetAuth.user_metadata || {};
      await supabase.auth.admin.updateUserById(targetAuth.id, {
        user_metadata: {
          ...existingMeta,
          is_pro,
          free_uses_remaining: is_pro ? null : (existingMeta.free_uses_remaining ?? 3),
        },
      });
    }
  } catch (e) {
    console.error('Failed to update auth metadata:', e);
  }

  try {
    await supabase
      .from('users')
      .update({
        is_pro,
        free_uses_remaining: is_pro ? null : 3,
        updated_at: new Date().toISOString(),
      })
      .ilike('email', normEmail);
  } catch (e) {}

  return NextResponse.json({ ok: true, is_pro, free_uses_remaining: is_pro ? null : 3 });
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

  const normEmail = email.toLowerCase();
  const supabase = getClient();

  if (action === 'add_use' || action === 'remove_use') {
    let currentUses = 3;
    let targetAuth = null;

    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase() === normEmail);
      const meta = targetAuth?.user_metadata || {};
      if (typeof meta.free_uses_remaining === 'number') {
        currentUses = meta.free_uses_remaining;
      }
    } catch (e) {}

    const delta = action === 'add_use' ? 1 : -1;
    const newValue = Math.max(0, currentUses + delta);

    if (targetAuth) {
      try {
        await supabase.auth.admin.updateUserById(targetAuth.id, {
          user_metadata: {
            ...targetAuth.user_metadata,
            is_pro: false,
            free_uses_remaining: newValue,
          },
        });
      } catch (e) {}
    }

    try {
      await supabase
        .from('users')
        .update({ is_pro: false, free_uses_remaining: newValue, updated_at: new Date().toISOString() })
        .ilike('email', normEmail);
    } catch (e) {}

    return NextResponse.json({ ok: true, free_uses_remaining: newValue });
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 });
}
