import { createServerClient } from '@supabase/ssr';

const OWNER_EMAIL = 'lifegrading@gmail.com';

export async function getUser(request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return userData;
}

export async function isOwner(request) {
  const user = await getUser(request);
  return user?.email === OWNER_EMAIL || user?.is_owner === true;
}

export async function hasPermission(request, permission) {
  const user = await getUser(request);
  if (!user) return false;

  if (user.is_owner || user.role === 'owner') return true;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );

  const { data } = await supabase
    .from('user_roles')
    .select('role_permissions!inner(permission_id, permissions!inner(name))')
    .eq('user_id', user.id);

  if (!data) return false;

  return data.some(ur =>
    ur.role_permissions?.permissions?.name === permission
  );
}

export async function requireAuth(request) {
  const user = await getUser(request);
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (user.status === 'banned') {
    return { error: 'Account banned', status: 403 };
  }
  if (user.status === 'suspended') {
    return { error: 'Account suspended', status: 403 };
  }
  return { user };
}

export async function requirePermission(request, permission) {
  const auth = await requireAuth(request);
  if (auth.error) return auth;

  const allowed = await hasPermission(request, permission);
  if (!allowed) {
    return { error: 'Forbidden', status: 403 };
  }
  return auth;
}

export async function logAuditEvent(supabase, { actorId, actorEmail, action, targetType, targetId, targetName, result, metadata, ipAddress }) {
  await supabase.from('audit_logs').insert({
    actor_id: actorId,
    actor_email: actorEmail,
    action,
    target_type: targetType,
    target_id: targetId,
    target_name: targetName,
    result: result || 'success',
    metadata,
    ip_address: ipAddress,
  });
}

export async function logSecurityEvent(supabase, { eventType, severity, description, metadata, ipAddress }) {
  await supabase.from('security_events').insert({
    event_type: eventType,
    severity: severity || 'info',
    description,
    metadata,
    ip_address: ipAddress,
  });
}
