export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getExhaustedEmails } from '@/lib/supabase/free-trial';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const supabase = getClient();

  const { data: grabs, error } = await supabase
    .from('grabs')
    .select('minecraft_username, discord_username, created_at, updated_at, os, country, owner_email')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ grabs: [], error: error.message });

  const exhaustedEmails = await getExhaustedEmails(supabase);

  const newGrabs = (grabs || []).filter(g => {
    if (g.updated_at && g.updated_at !== g.created_at) return true;
    return !g.owner_email || !exhaustedEmails.includes(g.owner_email);
  });

  const counts = {};
  for (const g of newGrabs) {
    const name = g.minecraft_username;
    if (!counts[name]) {
      counts[name] = { minecraft_username: name, discord_username: g.discord_username, os: g.os, country: g.country, count: 0, last_grab: g.created_at };
    }
    counts[name].count++;
  }

  return NextResponse.json({ grabs: Object.values(counts).sort((a, b) => new Date(b.last_grab) - new Date(a.last_grab)) });
}
