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
  return email && email.toLowerCase().trim() === ADMIN_EMAIL;
}

export async function GET(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || !isOwnerEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getClient();
  const now = new Date();

  // 1. Fetch auth users
  let authUsersList = [];
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    if (authData?.users) authUsersList = authData.users;
  } catch (e) {}

  // 2. Fetch pro_users table
  let proUsersMap = new Map();
  try {
    const { data: proData } = await supabase
      .from('pro_users')
      .select('email, is_pro, pro_expires_at, free_uses_remaining');
    if (proData) {
      for (const p of proData) {
        if (p.email) proUsersMap.set(p.email.toLowerCase().trim(), p);
      }
    }
  } catch (e) {}

  // 3. Fetch public.users table
  let dbUsersMap = new Map();
  try {
    const { data: dbData } = await supabase
      .from('users')
      .select('email, is_pro, free_uses_remaining');
    if (dbData) {
      for (const d of dbData) {
        if (d.email) dbUsersMap.set(d.email.toLowerCase().trim(), d);
      }
    }
  } catch (e) {}

  const userMap = new Map();

  for (const au of authUsersList) {
    if (!au.email) continue;
    const normEmail = au.email.toLowerCase().trim();
    const meta = au.user_metadata || {};
    const proRecord = proUsersMap.get(normEmail);
    const dbRecord = dbUsersMap.get(normEmail);
    const isOwner = isOwnerEmail(normEmail);

    let isPro = false;
    let proExpiresAt = null;
    let remainingProSeconds = null;
    let freeUses = 3;

    if (isOwner) {
      isPro = true;
      freeUses = null;
    } else {
      let recordIsPro = undefined;
      let recordExpiresAt = undefined;
      let recordFreeUses = undefined;

      if (proRecord && typeof proRecord.is_pro === 'boolean') {
        recordIsPro = proRecord.is_pro;
        recordExpiresAt = proRecord.pro_expires_at;
        recordFreeUses = proRecord.free_uses_remaining;
      } else if (meta && typeof meta.is_pro === 'boolean') {
        recordIsPro = meta.is_pro;
        recordExpiresAt = meta.pro_expires_at;
        recordFreeUses = meta.free_uses_remaining;
      } else if (dbRecord && typeof dbRecord.is_pro === 'boolean') {
        recordIsPro = dbRecord.is_pro;
        recordFreeUses = dbRecord.free_uses_remaining;
      }

      if (recordIsPro === false) {
        isPro = false;
        freeUses = typeof recordFreeUses === 'number' ? recordFreeUses : 3;
      } else if (recordIsPro === true) {
        if (recordExpiresAt) {
          const exp = new Date(recordExpiresAt);
          if (now < exp) {
            isPro = true;
            proExpiresAt = recordExpiresAt;
            remainingProSeconds = Math.max(0, Math.floor((exp - now) / 1000));
            freeUses = null;
          } else {
            isPro = false;
            freeUses = typeof recordFreeUses === 'number' ? recordFreeUses : 3;
          }
        } else {
          isPro = true;
          freeUses = null;
        }
      } else {
        isPro = false;
        freeUses = 3;
      }
    }

    userMap.set(normEmail, {
      id: au.id,
      email: au.email,
      display_name: meta.full_name || au.email,
      is_pro: isPro,
      pro_expires_at: proExpiresAt,
      remaining_pro_seconds: remainingProSeconds,
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

  // 1. Update Auth user_metadata
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase().trim() === normEmail);
    if (targetAuth) {
      await supabase.auth.admin.updateUserById(targetAuth.id, {
        user_metadata: {
          ...(targetAuth.user_metadata || {}),
          is_pro,
          pro_expires_at: proExpiresAt,
          free_uses_remaining: freeUses,
        },
      });
    }
  } catch (e) {
    console.error('Failed auth metadata update:', e);
  }

  // 2. Upsert into pro_users table
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
  } catch (e) {
    console.error('Failed pro_users upsert:', e);
  }

  // 3. Best-effort update users table
  try {
    await supabase
      .from('users')
      .update({ is_pro, free_uses_remaining: freeUses, updated_at: new Date().toISOString() })
      .ilike('email', normEmail);
  } catch (e) {}

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
        const targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase().trim() === normEmail);
        const meta = targetAuth?.user_metadata || {};
        if (typeof meta.free_uses_remaining === 'number') {
          currentUses = meta.free_uses_remaining;
        }
      }
    } catch (e) {}

    const delta = action === 'add_use' ? 1 : -1;
    const newValue = Math.max(0, currentUses + delta);

    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      const targetAuth = authData?.users?.find(u => u.email && u.email.toLowerCase().trim() === normEmail);
      if (targetAuth) {
        await supabase.auth.admin.updateUserById(targetAuth.id, {
          user_metadata: {
            ...(targetAuth.user_metadata || {}),
            is_pro: false,
            pro_expires_at: null,
            free_uses_remaining: newValue,
          },
        });
      }
    } catch (e) {}

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

    try {
      await supabase
        .from('users')
        .update({ is_pro: false, free_uses_remaining: newValue })
        .ilike('email', normEmail);
    } catch (e) {}

    return NextResponse.json({ ok: true, email: normEmail, free_uses_remaining: newValue });
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 });
}
