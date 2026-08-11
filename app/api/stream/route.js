export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const streamFrames = {};

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
      streamFrames[username] = { frame: 'data:image/jpeg;base64,' + base64, timestamp: Date.now() };
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

  if (username) {
    const supabaseAuth = getClientAuth(request);
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) return NextResponse.json({ online: false });

    const supabase = getClient();
    const { data: grab } = await supabase
      .from('grabs')
      .select('id')
      .eq('minecraft_username', username)
      .eq('owner_email', user.email)
      .limit(1)
      .single();

    const isAdmin = user.email === 'lifegrading@gmail.com';
    if (!grab && !isAdmin) return NextResponse.json({ online: false });

    const stream = streamFrames[username];
    if (!stream || Date.now() - stream.timestamp > 10000) {
      return NextResponse.json({ online: false });
    }
    return NextResponse.json({ online: true, frame: stream.frame, timestamp: stream.timestamp });
  }

  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  const isAdmin = user?.email === 'lifegrading@gmail.com';

  const supabase = getClient();

  const online = [];
  for (const [name, data] of Object.entries(streamFrames)) {
    if (Date.now() - data.timestamp < 10000) {
      let ownerEmail = null;
      if (!isAdmin) {
        const { data: grab } = await supabase
          .from('grabs')
          .select('owner_email')
          .eq('minecraft_username', name)
          .limit(1)
          .single();
        ownerEmail = grab?.owner_email || null;
      }
      online.push({ username: name, timestamp: data.timestamp, owner_email: ownerEmail });
    }
  }

  const filtered = isAdmin ? online : online.filter(u => u.owner_email === user?.email);
  return NextResponse.json({ online: filtered });
}
