export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { canUserCapture } from '@/lib/supabase/free-trial';
import { store } from '@/lib/store';
import { webrtcStore } from '@/lib/webrtc-store';

const ADMIN_EMAILS = ['lifegrading@gmail.com', 'giodewaard152@gmail.com'];

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
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const contentType = request.headers.get('content-type') || '';

    let username = 'consentmod';
    if (authHeader) {
      username = authHeader.replace('Bearer ', '').trim() || 'consentmod';
    }

    if (contentType.includes('image/jpeg') || contentType.includes('application/octet-stream')) {
      const buffer = await request.arrayBuffer();
      const nodeBuf = Buffer.from(buffer);

      if (nodeBuf.length < 50) {
        return NextResponse.json({ ok: false, error: 'Empty frame' }, { status: 400 });
      }

      // Always update in-memory hot store for instant livestream / WebRTC streaming
      store.setFrame(nodeBuf, username);

      // Automatically register and heartbeat ConsentMod stream in WebRTC signaling store
      try {
        webrtcStore.setBroadcaster('consentmod', 'consentmod-' + username, {
          username,
          fps: 10,
          resolution: '1280x720',
          type: 'ConsentMod Stream',
          source: 'consentmod',
        });
        webrtcStore.heartbeat('consentmod', 'broadcaster', 'consentmod-' + username);
        if (username && username.toLowerCase() !== 'consentmod') {
          webrtcStore.setBroadcaster(username.toLowerCase(), 'consentmod-' + username, {
            username,
            fps: 10,
            resolution: '1280x720',
            type: 'ConsentMod Stream',
            source: 'consentmod',
          });
          webrtcStore.heartbeat(username.toLowerCase(), 'broadcaster', 'consentmod-' + username);
        }
      } catch (err) {}

      const base64 = nodeBuf.toString('base64');
      const frame = 'data:image/jpeg;base64,' + base64;

      // Persist to Supabase asynchronously in background so POST response returns in <5ms
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = getClient();
          const nowIso = new Date().toISOString();
          const lowerUser = (username || 'consentmod').toLowerCase();

          const records = [
            { username: lowerUser, frame, updated_at: nowIso }
          ];
          if (lowerUser !== 'consentmod') {
            records.push({ username: 'consentmod', frame, updated_at: nowIso });
          }

          supabase
            .from('stream_frames')
            .upsert(records, { onConflict: 'username' })
            .then(() => {})
            .catch((dbErr) => {
              console.warn('DB stream_frames persist warning:', dbErr.message);
            });
        } catch (dbErr) {
          console.warn('DB stream_frames persist warning:', dbErr.message);
        }
      }

      return NextResponse.json({ ok: true, username, timestamp: Date.now() });
    }

    return NextResponse.json({ error: 'Invalid content-type' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // Case 1: Specific username requested
    if (username) {
      const lowerUser = username.toLowerCase();
      let dbRow = null;
      let dbTime = 0;

      // 1. Query Supabase (Single source of truth across Vercel instances)
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = getClient();
          if (lowerUser !== 'consentmod') {
            const { data } = await supabase
              .from('stream_frames')
              .select('frame, updated_at, username')
              .ilike('username', lowerUser)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (data && data.frame) dbRow = data;
          }

          if (!dbRow) {
            const { data } = await supabase
              .from('stream_frames')
              .select('frame, updated_at, username')
              .ilike('username', 'consentmod')
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (data && data.frame) dbRow = data;
          }

          if (dbRow && dbRow.updated_at) {
            dbTime = new Date(dbRow.updated_at).getTime();
          }
        } catch (dbErr) {
          console.warn('Supabase fetch frame error:', dbErr.message);
        }
      }

      // 2. Check local in-memory hot store
      const memFrame = store.getUserFrame(lowerUser) || store.getUserFrame('consentmod') || store.getFrame();
      const memTime = store.getFrameTime(lowerUser) || store.getFrameTime('consentmod') || store.getFrameTime();

      const now = Date.now();

      // Only use memory if it is STRICTLY newer than database and younger than 10 seconds
      if (memFrame && memTime && memTime > dbTime && (now - memTime < 10000)) {
        const base64 = Buffer.from(memFrame).toString('base64');
        return NextResponse.json({
          online: true,
          frame: 'data:image/jpeg;base64,' + base64,
          timestamp: memTime,
          source: 'memory'
        });
      }

      // Otherwise, use Supabase if active within 25 seconds
      if (dbRow && dbRow.frame && (now - dbTime < 25000)) {
        return NextResponse.json({
          online: true,
          frame: dbRow.frame,
          timestamp: dbTime,
          source: 'supabase'
        });
      }

      return NextResponse.json({ online: false });
    }

    // Case 2: List all online streams (strictly active in last 25s)
    const onlineMap = new Map();
    const now = Date.now();

    // From in-memory store
    const memOnline = store.getOnlineUsers();
    for (const u of memOnline) {
      onlineMap.set(u.username.toLowerCase(), {
        username: u.username,
        timestamp: u.timestamp,
        type: 'ConsentMod Feed'
      });
    }

    // From Supabase stream_frames (strictly active in last 25 seconds)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = getClient();
        const { data: allFrames } = await supabase
          .from('stream_frames')
          .select('username, updated_at');

        if (allFrames) {
          for (const f of allFrames) {
            const time = new Date(f.updated_at).getTime();
            if (now - time < 25000) { // strictly 25 seconds window
              if (!onlineMap.has(f.username.toLowerCase())) {
                onlineMap.set(f.username.toLowerCase(), {
                  username: f.username,
                  timestamp: time,
                  type: 'ConsentMod Feed'
                });
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn('Supabase fetch all frames error:', dbErr.message);
      }
    }

    const online = Array.from(onlineMap.values());
    return NextResponse.json({ online });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message, online: [] }, { status: 500 });
  }
}