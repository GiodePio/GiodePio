import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: grabs, error: errGrabs } = await supabase.from('grabs').select('id, minecraft_username, owner_email, created_at, updated_at').or('minecraft_username.ilike.%gio%,minecraft_username.ilike.%pio%,minecraft_username.ilike.%consent%').limit(10);
  const { data: testUpsert, error: errUpsert } = await supabase
    .from('stream_frames')
    .upsert([{ username: 'test_upsert', frame: 'data:image/jpeg;base64,123', updated_at: new Date().toISOString() }], { onConflict: 'username' })
    .select();

  const { data: frames, error: errFrames } = await supabase.from('stream_frames').select('username, updated_at');

  return NextResponse.json({
    now: new Date().toISOString(),
    testUpsert,
    errUpsert: errUpsert ? { message: errUpsert.message, details: errUpsert.details, hint: errUpsert.hint, code: errUpsert.code } : null,
    frames: frames || [],
    errFrames: errFrames?.message || null
  });
}
