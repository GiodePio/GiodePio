import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: testUpsert, error: errUpsert } = await supabase
    .from('stream_frames')
    .upsert([{ username: 'gio_de_pio', frame: 'data:image/jpeg;base64,debug123', updated_at: new Date().toISOString() }], { onConflict: 'username' })
    .select();

  const { data: allRows, error: errAll } = await supabase
    .from('stream_frames')
    .select('*');

  const { count, error: errCount } = await supabase
    .from('stream_frames')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    now: new Date().toISOString(),
    testUpsert,
    errUpsert: errUpsert ? { message: errUpsert.message, details: errUpsert.details, hint: errUpsert.hint, code: errUpsert.code } : null,
    count,
    allRows: (allRows || []).map(r => ({ username: r.username, updated_at: r.updated_at, frameLen: r.frame?.length })),
    errAll: errAll?.message || null,
  });
}
