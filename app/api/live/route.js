export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

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

export async function GET(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('grabs')
    .select('id, minecraft_username, os, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mask some of the username for privacy on the public live feed
  const maskedCaptures = data.map(c => {
    let name = c.minecraft_username || 'Unknown';
    if (name.length > 3) {
      name = name.substring(0, 3) + '*'.repeat(Math.max(2, name.length - 5)) + name.substring(name.length - 2);
    }
    return {
      id: c.id,
      minecraft_username: name,
      os: c.os,
      created_at: c.created_at
    };
  });

  return NextResponse.json({ captures: maskedCaptures });
}
