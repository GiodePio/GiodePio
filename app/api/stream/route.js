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

      // Persist to Supabase stream_frames table immediately for live multi-instance viewing
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

          await supabase
            .from('stream_frames')
            .upsert(records, { onConflict: 'username' });
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
      // First check in-memory store
      const memFrame = store.getUserFrame(username);
      const memTime = store.getFrameTime(username);
      if (memFrame && memTime && Date.now() - memTime < 60000) {
        const base64 = Buffer.from(memFrame).toString('base64');
        return NextResponse.json({
          online: true,
          frame: 'data:image/jpeg;base64,' + base64,
          timestamp: memTime,
          source: 'memory'
        });
      }

      // Check database
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = getClient();
          const lowerUser = username.toLowerCase();
          const { data: row } = await supabase
            .from('stream_frames')
            .select('frame, updated_at')
            .or(`username.ilike.${lowerUser},username.ilike.consentmod`)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (row && row.frame && Date.now() - new Date(row.updated_at).getTime() < 300000) {
            return NextResponse.json({
              online: true,
              frame: row.frame,
              timestamp: new Date(row.updated_at).getTime(),
              source: 'supabase'
            });
          }
        } catch (dbErr) {
          console.warn('Supabase fetch frame error:', dbErr.message);
        }
      }

      return NextResponse.json({ online: false });
    }

    // Case 2: List all online streams
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

    // From Supabase stream_frames (5 minutes window)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = getClient();
        const { data: allFrames } = await supabase
          .from('stream_frames')
          .select('username, updated_at');

        if (allFrames) {
          for (const f of allFrames) {
            const time = new Date(f.updated_at).getTime();
            if (now - time < 300000) { // 5 minutes window
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

        // Also check recent captures in grabs table (15 minutes window)
        const { data: recentGrabs } = await supabase
          .from('grabs')
          .select('minecraft_username, country, created_at')
          .order('created_at', { ascending: false })
          .limit(20);

        if (recentGrabs) {
          for (const g of recentGrabs) {
            if (g.minecraft_username && !onlineMap.has(g.minecraft_username.toLowerCase())) {
              const grabTime = new Date(g.created_at).getTime();
              if (now - grabTime < 900000) {
                onlineMap.set(g.minecraft_username.toLowerCase(), {
                  username: g.minecraft_username,
                  country: g.country,
                  timestamp: grabTime,
                  type: 'Active Session'
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