export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
      }
    }
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

  const { data: usersBasic, error: errorBasic } = await supabase
    .from('users')
    .select('id, email, display_name, created_at')
    .order('created_at', { ascending: false });

  if (errorBasic) {
    return NextResponse.json({ error: errorBasic.message }, { status: 500 });
  }

  // Fetch pro_users to determine is_pro correctly
  const { data: proUsersData } = await supabase
    .from('pro_users')
    .select('email, is_pro, pro_expires_at');
    
  const proMap = {};
  if (proUsersData) {
    proUsersData.forEach(p => {
      if (p.email) proMap[p.email.toLowerCase()] = p;
    });
  }

  const mapped = (usersBasic || []).map(u => {
    const emailLower = u.email ? u.email.toLowerCase() : '';
    const proInfo = proMap[emailLower];
    const isOwner = emailLower === 'lifegrading@gmail.com';
    let is_pro = isOwner;
    let remaining_pro_seconds = null;

    if (proInfo && proInfo.is_pro) {
      is_pro = true;
      if (proInfo.pro_expires_at) {
        const exp = new Date(proInfo.pro_expires_at);
        const now = new Date();
        if (now < exp) {
          remaining_pro_seconds = Math.max(0, Math.floor((exp - now) / 1000));
        } else {
          is_pro = false; // Expired
        }
      }
    }

    return {
      id: u.id,
      email: u.email,
      display_name: u.display_name || null,
      is_pro: is_pro,
      free_uses_remaining: is_pro ? null : 3, // Fallback since we don't store it in users anymore
      remaining_pro_seconds: remaining_pro_seconds,
      created_at: u.created_at,
      last_login_at: null,
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
  let { email, is_pro, duration_seconds } = body;
  
  if (email) {
    email = email.toLowerCase().trim();
  }

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const supabase = getClient();
  const now = new Date();

  if (typeof duration_seconds === 'number') {
    const expiresAt = new Date(now.getTime() + duration_seconds * 1000);

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

    if (proUpError) return NextResponse.json({ error: proUpError.message }, { status: 500 });
    
    return NextResponse.json({ 
      ok: true, 
      is_pro: true, 
      pro_expires_at: expiresAt.toISOString(),
      remaining_pro_seconds: duration_seconds 
    });
  }

  if (typeof is_pro === 'boolean') {
    // Also update pro_users table
    if (is_pro) {
      console.log(`[DEBUG] Attempting to upsert permanent pro for ${email}`);
      const { error: proUpError } = await supabase
        .from('pro_users')
        .upsert(
          { email: email.toLowerCase().trim(), is_pro: true, pro_expires_at: null },
          { onConflict: 'email' }
        );
      if (proUpError) {
        console.error(`[DEBUG] Upsert failed for ${email}:`, proUpError);
        return NextResponse.json({ error: proUpError.message, details: proUpError }, { status: 500 });
      }
      console.log(`[DEBUG] Successfully upserted permanent pro for ${email}`);
    } else {
      console.log(`[DEBUG] Attempting to revoke pro for ${email}`);
      const { error: proDelError } = await supabase
        .from('pro_users')
        .delete()
        .ilike('email', email.toLowerCase().trim());
      if (proDelError) {
        console.error(`[DEBUG] Delete failed for ${email}:`, proDelError);
        return NextResponse.json({ error: proDelError.message, details: proDelError }, { status: 500 });
      }
      console.log(`[DEBUG] Successfully revoked pro for ${email}`);
    }
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