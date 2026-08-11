export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const streamFrames = {};

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
      streamFrames[username] = { frame: `data:image/jpeg;base64,${base64}`, timestamp: Date.now() };
      return NextResponse.json({ ok: true });
    }

    const body = await request.json();
    if (body.username && body.frame) {
      streamFrames[body.username] = { frame: body.frame, timestamp: Date.now() };
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
    const stream = streamFrames[username];
    if (!stream || Date.now() - stream.timestamp > 10000) {
      return NextResponse.json({ online: false });
    }
    return NextResponse.json({ online: true, frame: stream.frame, timestamp: stream.timestamp });
  }

  const online = [];
  for (const [name, data] of Object.entries(streamFrames)) {
    if (Date.now() - data.timestamp < 10000) {
      online.push({ username: name, timestamp: data.timestamp });
    }
  }
  return NextResponse.json({ online });
}
