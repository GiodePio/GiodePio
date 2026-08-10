import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requirePermission, logAuditEvent } from '@/lib/auth';

export async function GET(request) {
  const auth = await requirePermission(request, 'users.view');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const role = searchParams.get('role') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let query = supabase.from('users').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (role) {
    query = query.eq('role', role);
  }

  const { data, count, error } = await query
    .order(sort, { ascending: order === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  return NextResponse.json({
    users: data,
    total: count,
    page,
    limit,
    pages: Math.ceil(count / limit),
  });
}

export async function PATCH(request) {
  const auth = await requirePermission(request, 'users.edit');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { userId, action, data } = body;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if target is owner
  const { data: targetUser } = await supabase
    .from('users')
    .select('email, is_owner')
    .eq('id', userId)
    .single();

  if (targetUser?.is_owner || targetUser?.email === 'lifegrading@gmail.com') {
    return NextResponse.json({ error: 'Cannot modify owner account' }, { status: 403 });
  }

  let result;

  switch (action) {
    case 'ban':
      const { data: existingBan } = await supabase
        .from('bans')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (existingBan) {
        return NextResponse.json({ error: 'User already banned' }, { status: 400 });
      }

      await supabase.from('bans').insert({
        user_id: userId,
        reason: data.reason,
        banned_by: auth.user.id,
        expires_at: data.expiresAt,
      });

      result = await supabase
        .from('users')
        .update({ status: 'banned' })
        .eq('id', userId)
        .select()
        .single();

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'USER_BANNED',
        targetType: 'user',
        targetId: userId,
        targetName: targetUser?.email,
        metadata: { reason: data.reason },
      });
      break;

    case 'unban':
      await supabase
        .from('bans')
        .update({ status: 'revoked' })
        .eq('user_id', userId)
        .eq('status', 'active');

      result = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId)
        .select()
        .single();

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'USER_UNBANNED',
        targetType: 'user',
        targetId: userId,
        targetName: targetUser?.email,
      });
      break;

    case 'suspend':
      await supabase.from('suspensions').insert({
        user_id: userId,
        reason: data.reason,
        suspended_by: auth.user.id,
        expires_at: data.expiresAt,
      });

      result = await supabase
        .from('users')
        .update({ status: 'suspended' })
        .eq('id', userId)
        .select()
        .single();

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'USER_SUSPENDED',
        targetType: 'user',
        targetId: userId,
        targetName: targetUser?.email,
        metadata: { reason: data.reason },
      });
      break;

    case 'unsuspend':
      await supabase
        .from('suspensions')
        .update({ status: 'revoked' })
        .eq('user_id', userId)
        .eq('status', 'active');

      result = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId)
        .select()
        .single();

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'USER_UNSUSPENDED',
        targetType: 'user',
        targetId: userId,
        targetName: targetUser?.email,
      });
      break;

    case 'delete':
      await supabase.from('users').delete().eq('id', userId);

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'USER_DELETED',
        targetType: 'user',
        targetId: userId,
        targetName: targetUser?.email,
      });
      break;

    case 'update_role':
      result = await supabase
        .from('users')
        .update({ role: data.role })
        .eq('id', userId)
        .select()
        .single();

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'USER_ROLE_CHANGED',
        targetType: 'user',
        targetId: userId,
        targetName: targetUser?.email,
        metadata: { newRole: data.role },
      });
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ success: true, user: result?.data });
}
