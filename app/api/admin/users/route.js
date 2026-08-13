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
    if (authData?.users) authUsersList = authData.users;
  } catch (e) {}

  let proUsersMap = new Map();
  try {
    const { data: proData } = await supabase
      .from('pro_users')
      .select('email, is_pro, free_uses_remaining');
    if (proData) {
      for (const p of proData) {
        if (p.email) proUsersMap.set(p.email.toLowerCase(), p);
      }
    }
  } catch (e) {}

  const userMap = new Map();

  for (const au of authUsersList) {
    if (!au.email) continue;
    const normEmail = au.email.toLowerCase();
    const meta = au.user_metadata || {};
    const proRecord = proUsersMap.get(normEmail);

    const isOwner = isOwnerEmail(normEmail);
    let isPro = isOwner;
    let freeUses = null;

    if (isOwner) {
      isPro = true;
      freeUses = null;
    } else if (proRecord && typeof proRecord.is_pro === 'boolean') {
      isPro = proRecord.is_pro;
      freeUses = isPro ? null : (proRecord.free_uses_remaining ?? 3);
    } else if (meta && typeof meta.is_pro === 'boolean') {
      isPro = meta.is_pro;
      freeUses = isPro ? null : (meta.free_uses_remaining ?? 3);
    } else {
      isPro = false;
      freeUses = 3;
    }

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
  const freeUses = is_pro ? null : 3;

  // 1. Upsert into pro_users table
  try {
    await supabase
      .from('pro_users')
      .upsert({
        email: normEmail,
        is_pro,
        free_uses_remaining: freeUses,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
  } catch (e) {
    console.error('Failed to upsert pro_users:', e);
  }

  // 2. Also update Auth user_metadata
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase() === normEmail);
    if (targetAuth) {
      const existingMeta = targetAuth.user_metadata || {};
      await supabase.auth.admin.updateUserById(targetAuth.id, {
        user_metadata: {
          ...existingMeta,
          is_pro,
          free_uses_remaining: freeUses,
        },
      });
    }
  } catch (e) {}

  // 3. Best-effort update users table
  try {
    await supabase
      .from('users')
      .update({ is_pro, free_uses_remaining: freeUses, updated_at: new Date().toISOString() })
      .ilike('email', normEmail);
  } catch (e) {}

  return NextResponse.json({ ok: true, is_pro, free_uses_remaining: freeUses });
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

    try {
      const { data: proRecord } = await supabase
        .from('pro_users')
        .select('free_uses_remaining')
        .eq('email', normEmail)
        .single();
      if (proRecord && typeof proRecord.free_uses_remaining === 'number') {
        currentUses = proRecord.free_uses_remaining;
      } else {
        const { data: authData } = await supabase.auth.admin.listUsers();
        const targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase() === normEmail);
        const meta = targetAuth?.user_metadata || {};
        if (typeof meta.free_uses_remaining === 'number') {
          currentUses = meta.free_uses_remaining;
        }
      }
    } catch (e) {}

    const delta = action === 'add_use' ? 1 : -1;
    const newValue = Math.max(0, currentUses + delta);

    // 1. Upsert into pro_users table
    try {
      await supabase
        .from('pro_users')
        .upsert({
          email: normEmail,
          is_pro: false,
          free_uses_remaining: newValue,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
    } catch (e) {}

    // 2. Update Auth metadata
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase() === normEmail);
      if (targetAuth) {
        await supabase.auth.admin.updateUserById(targetAuth.id, {
          user_metadata: {
            ...targetAuth.user_metadata,
            is_pro: false,
            free_uses_remaining: newValue,
          },
        });
      }
    } catch (e) {}

    // 3. Update DB users table
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
