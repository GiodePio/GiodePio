export const dynamic = 'force-dynamic';

import { store } from '@/lib/store';
import { createClient } from '@supabase/supabase-js';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// 1x1 transparent GIF buffer fallback to prevent 404 console errors
const TRANSPARENT_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // 1. Check in-memory store
    let frame = username ? store.getUserFrame(username) : store.getFrame();

    // 2. If not found in memory, try Supabase database (stream_frames)
    if (!frame && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = getClient();
        let query = supabase.from('stream_frames').select('frame, updated_at');
        if (username && username !== 'latest' && username !== 'consentmod') {
          query = query.ilike('username', username);
        }
        const { data: row } = await query
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (row && row.frame) {
          const match = row.frame.match(/^data:image\/\w+;base64,(.+)$/);
          if (match) {
            frame = Buffer.from(match[1], 'base64');
          }
        }
      } catch (e) {
        // Silently ignore DB errors on frame lookup
      }
    }

    if (!frame) {
      // Return 200 with 1x1 transparent pixel so browser never throws 404 error
      return new Response(TRANSPARENT_PIXEL, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    return new Response(frame, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    return new Response(TRANSPARENT_PIXEL, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
