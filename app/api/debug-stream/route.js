export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';

function getClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll() { return []; }, setAll() {} } }
  );
}

export async function GET() {
  try {
    const supabase = getClient();
    const { data, error } = await supabase.from('stream_frames').select('*');
    return Response.json({ data, error: error?.message || null, count: data?.length || 0 });
  } catch (e) {
    return Response.json({ error: e.message });
  }
}