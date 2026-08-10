import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requirePermission } from '@/lib/auth';

export async function GET(request) {
  const auth = await requirePermission(request, 'audit_logs.view');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const action = searchParams.get('action') || '';
  const actorId = searchParams.get('actorId') || '';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let query = supabase.from('audit_logs').select('*', { count: 'exact' });

  if (action) {
    query = query.eq('action', action);
  }
  if (actorId) {
    query = query.eq('actor_id', actorId);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }

  return NextResponse.json({
    logs: data,
    total: count,
    page,
    limit,
    pages: Math.ceil(count / limit),
  });
}
