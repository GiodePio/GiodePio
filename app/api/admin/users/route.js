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

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, display_name, is_pro, free_uses_remaining, created_at, last_login_at')
    .order('created_at', { ascending: false });

  if (error) {
    const { data: usersBasic, error: errorBasic } = await supabase
      .from('users')
      .select('id, email, display_name, created_at')
      .order('created_at', { ascending: false });
    if (errorBasic) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const mapped = (usersBasic || []).map(u => ({
      id: u.id,
      email: u.email,
      display_name: u.display_name || null,
      is_pro: u.email === 'lifegrading@gmail.com',
      free_uses_remaining: u.email === 'lifegrading@gmail.com' ? null : 3,
      created_at: u.created_at,
      last_login_at: null,
    }));
    return NextResponse.json({ users: mapped, columns_missing: true });
  }

  if (!users || users.length === 0) {
    const { data: authUsers, error: authError } = await supabase
      .from('users')
      .select('id, email, created_at');
    if (authError) return NextResponse.json({ users: [] });
    const mapped = (authUsers || []).map(u => ({
      id: u.id,
      email: u.email,
      display_name: null,
      is_pro: u.email === 'lifegrading@gmail.com',
      free_uses_remaining: u.email === 'lifegrading@gmail.com' ? null : 3,
      created_at: u.created_at,
      last_login_at: null,
    }));
    return NextResponse.json({ users: mapped, fallback: true });
  }

  return NextResponse.json({ users: users || [] });
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

  const updates = { is_pro, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('email', email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
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

  if (action === 'add_use') {
    const { data: current, error: fetchError } = await supabase
      .from('users')
      .select('free_uses_remaining')
      .eq('email', email)
      .single();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    const newValue = (current?.free_uses_remaining ?? 0) + 1;
    const { error } = await supabase
      .from('users')
      .update({ free_uses_remaining: newValue, updated_at: new Date().toISOString() })
      .eq('email', email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, free_uses_remaining: newValue });
  }

  if (action === 'remove_use') {
    const { data: current, error: fetchError } = await supabase
      .from('users')
      .select('free_uses_remaining')
      .eq('email', email)
      .single();
    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

    const newValue = Math.max(0, (current?.free_uses_remaining ?? 0) - 1);
    const { error } = await supabase
      .from('users')
      .update({ free_uses_remaining: newValue, updated_at: new Date().toISOString() })
      .eq('email', email);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, free_uses_remaining: newValue });
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 });
}
