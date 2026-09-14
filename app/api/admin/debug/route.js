import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: grabs, error: errGrabs } = await supabase.from('grabs').select('id, minecraft_username, owner_email, created_at, updated_at').or('minecraft_username.ilike.%gio%,minecraft_username.ilike.%pio%,minecraft_username.ilike.%consent%').limit(10);
  const { data: allUsers } = await supabase.from('users').select('email, is_pro').limit(10);
  const { data: frames, error: errFrames } = await supabase.from('stream_frames').select('username, updated_at');

  return NextResponse.json({
    now: new Date().toISOString(),
    grabs: grabs || [],
    allUsers: allUsers || [],
    frames: frames || [],
    errGrabs: errGrabs?.message || null,
    errFrames: errFrames?.message || null
  });
}
