import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requirePermission } from '@/lib/auth';

export async function GET(request) {
  const auth = await requirePermission(request, 'users.view');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const [usersCount, bannedCount, suspendedCount, adminsCount, endpointsCount, activeEndpointsCount] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'banned'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
    supabase.from('users').select('*', { count: 'exact', head: true }).in('role', ['owner', 'administrator', 'moderator', 'endpoint_manager']),
    supabase.from('endpoints').select('*', { count: 'exact', head: true }),
    supabase.from('endpoints').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [requestsToday, requestsWeek, requestsMonth, failedRequests] = await Promise.all([
    supabase.from('endpoint_requests').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
    supabase.from('endpoint_requests').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
    supabase.from('endpoint_requests').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('endpoint_requests').select('*', { count: 'exact', head: true }).gte('status_code', 400),
  ]);

  const { data: recentActivity } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: recentSecurity } = await supabase
    .from('security_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    stats: {
      totalUsers: usersCount.count || 0,
      bannedUsers: bannedCount.count || 0,
      suspendedUsers: suspendedCount.count || 0,
      admins: adminsCount.count || 0,
      totalEndpoints: endpointsCount.count || 0,
      activeEndpoints: activeEndpointsCount.count || 0,
      requestsToday: requestsToday.count || 0,
      requestsWeek: requestsWeek.count || 0,
      requestsMonth: requestsMonth.count || 0,
      failedRequests: failedRequests.count || 0,
    },
    recentActivity: recentActivity || [],
    recentSecurity: recentSecurity || [],
  });
}
