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
  if (!user || user.email !== 'lifegrading@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getClient();

  let authUsersMap = {};
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    if (authData?.users) {
      for (const u of authData.users) {
        if (u.email) authUsersMap[u.email] = u;
      }
    }
  } catch (e) {}

  let users = null;
  try {
    const { data } = await supabase
      .from('users')
      .select('id, email, display_name, is_pro, free_uses_remaining, created_at, last_login_at')
      .order('created_at', { ascending: false });
    users = data;
  } catch (e) {}

  if (!users || users.length === 0) {
    const emailList = Object.keys(authUsersMap);
    const mapped = emailList.map(email => {
      const u = authUsersMap[email];
      const meta = u.user_metadata || {};
      const isOwner = email === 'lifegrading@gmail.com';
      const isPro = isOwner || meta.is_pro === true;
      const freeUses = isPro ? null : (meta.free_uses_remaining ?? 3);
      return {
        id: u.id,
        email: u.email,
        display_name: meta.full_name || u.email,
        is_pro: isPro,
        free_uses_remaining: freeUses,
        created_at: u.created_at,
        last_login_at: u.last_sign_in_at || null,
      };
    });
    return NextResponse.json({ users: mapped });
  }

  const mapped = users.map(u => {
    const authUser = authUsersMap[u.email];
    const meta = authUser?.user_metadata || {};
    const isOwner = u.email === 'lifegrading@gmail.com';
    const isPro = isOwner || u.is_pro === true || meta.is_pro === true;
    const freeUses = isPro ? null : (u.free_uses_remaining ?? meta.free_uses_remaining ?? 3);

    return {
      ...u,
      display_name: u.display_name || meta.full_name || u.email,
      is_pro: isPro,
      free_uses_remaining: freeUses,
    };
  });

  return NextResponse.json({ users: mapped });
}

export async function POST(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || user.email !== 'lifegrading@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email, is_pro } = body;

  if (!email || typeof is_pro !== 'boolean') {
    return NextResponse.json({ error: 'email and is_pro required' }, { status: 400 });
  }

  const supabase = getClient();

  // 1. Always update Auth user_metadata
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const targetAuth = authData?.users?.find(u => u.email === email);
    if (targetAuth) {
      await supabase.auth.admin.updateUserById(targetAuth.id, {
        user_metadata: {
          ...targetAuth.user_metadata,
          is_pro,
          free_uses_remaining: is_pro ? null : 3,
        },
      });
    }
  } catch (e) {
    console.error('Failed to update auth metadata:', e);
  }

  // 2. Best-effort update DB users table
  try {
    await supabase
      .from('users')
      .update({
        is_pro,
        free_uses_remaining: is_pro ? null : 3,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);
  } catch (e) {}

  return NextResponse.json({ ok: true, is_pro, free_uses_remaining: is_pro ? null : 3 });
}

export async function PATCH(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || user.email !== 'lifegrading@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { email, action } = body;

  if (!email || !action) {
    return NextResponse.json({ error: 'email and action required' }, { status: 400 });
  }

  const supabase = getClient();

  if (action === 'add_use' || action === 'remove_use') {
    let currentUses = 3;
    let authUser = null;

    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      authUser = authData?.users?.find(u => u.email === email);
      if (authUser?.user_metadata?.free_uses_remaining !== undefined && authUser?.user_metadata?.free_uses_remaining !== null) {
        currentUses = authUser.user_metadata.free_uses_remaining;
      }
    } catch (e) {}

    try {
      const { data: current } = await supabase
        .from('users')
        .select('free_uses_remaining')
        .eq('email', email)
        .single();
      if (current?.free_uses_remaining !== undefined && current?.free_uses_remaining !== null) {
        currentUses = current.free_uses_remaining;
      }
    } catch (e) {}

    const delta = action === 'add_use' ? 1 : -1;
    const newValue = Math.max(0, currentUses + delta);

    if (authUser) {
      try {
        await supabase.auth.admin.updateUserById(authUser.id, {
          user_metadata: {
            ...authUser.user_metadata,
            free_uses_remaining: newValue,
          },
        });
      } catch (e) {}
    }

    try {
      await supabase
        .from('users')
        .update({ free_uses_remaining: newValue, updated_at: new Date().toISOString() })
        .eq('email', email);
    } catch (e) {}

    return NextResponse.json({ ok: true, free_uses_remaining: newValue });
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 });
}
