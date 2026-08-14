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
      return NextResponse.json({ error: error.message, details: errorBasic.message }, { status: 500 });
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
    return NextResponse.json({ users: mapped, columns_missing: true, error: 'Database columns missing' });
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
  const { email, is_pro, duration_seconds } = body;

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const supabase = getClient();
  const now = new Date();

  if (typeof duration_seconds === 'number') {
    const expiresAt = new Date(now.getTime() + duration_seconds * 1000);
    const updates = { 
      is_pro: true 
    };
    const { error: usersError } = await supabase
      .from('users')
      .update(updates)
      .eq('email', email);

    // Also update pro_users table
    const { error: proUpError } = await supabase
      .from('pro_users')
      .upsert(
        { 
          email, 
          is_pro: true, 
          pro_expires_at: expiresAt.toISOString() 
        },
        { onConflict: 'email' }
      );

    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
    if (proUpError) return NextResponse.json({ error: proUpError.message }, { status: 500 });
    
    return NextResponse.json({ 
      ok: true, 
      is_pro: true, 
      pro_expires_at: expiresAt.toISOString(),
      remaining_pro_seconds: duration_seconds 
    });
  }

  if (typeof is_pro === 'boolean') {
    const updates = { is_pro };
    const { error: usersError } = await supabase
      .from('users')
      .update(updates)
      .eq('email', email);

    // Also update pro_users table
    if (is_pro) {
      const { error: proUpError } = await supabase
        .from('pro_users')
        .upsert(
          { email, is_pro: true, pro_expires_at: null },
          { onConflict: 'email' }
        );
      if (proUpError) return NextResponse.json({ error: proUpError.message }, { status: 500 });
    } else {
      const { error: proDelError } = await supabase
        .from('pro_users')
        .delete()
        .eq('email', email);
      if (proDelError) return NextResponse.json({ error: proDelError.message }, { status: 500 });
    }

    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });
    return NextResponse.json({ ok: true, is_pro, pro_expires_at: null, remaining_pro_seconds: null });

  }

  return NextResponse.json({ error: 'Invalid request - provide is_pro (boolean) or duration_seconds (number)' }, { status: 400 });
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

export async function DELETE(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || user.email !== 'lifegrading@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const supabase = getClient();

  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, display_name, free_uses_remaining, is_pro')
    .eq('email', email)
    .single();

  if (fetchError) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (existingUser.email === 'lifegrading@gmail.com') {
    return NextResponse.json({ error: 'Cannot delete owner account' }, { status: 403 });
  }

  // Delete from pro_users first if exists
  await supabase.from('pro_users').delete().eq('email', email);

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('email', email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ 
    ok: true, 
    deleted_user: {
      email: existingUser.email,
      display_name: existingUser.display_name,
      was_pro: existingUser.is_pro,
      uses_not_refunded: true
    }
  });
}