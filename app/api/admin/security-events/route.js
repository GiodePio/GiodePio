import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requirePermission } from '@/lib/auth';

export async function GET(request) {
  const auth = await requirePermission(request, 'security_events.view');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const eventType = searchParams.get('eventType') || '';
  const severity = searchParams.get('severity') || '';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let query = supabase.from('security_events').select('*', { count: 'exact' });

  if (eventType) {
    query = query.eq('event_type', eventType);
  }
  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch security events' }, { status: 500 });
  }

  return NextResponse.json({
    events: data,
    total: count,
    page,
    limit,
    pages: Math.ceil(count / limit),
  });
}
