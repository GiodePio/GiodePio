import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { requirePermission, logAuditEvent } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request) {
  const auth = await requirePermission(request, 'endpoints.view');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let query = supabase.from('endpoints').select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,path.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch endpoints' }, { status: 500 });
  }

  return NextResponse.json({
    endpoints: data,
    total: count,
    page,
    limit,
    pages: Math.ceil(count / limit),
  });
}

export async function POST(request) {
  const auth = await requirePermission(request, 'endpoints.create');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { name, description, path, authMethod, allowedMethods, maxPayloadSize, rateLimitPerMinute, requiredFields, optionalFields, tags } = body;

  if (!name || !path) {
    return NextResponse.json({ error: 'Name and path are required' }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if path already exists
  const { data: existing } = await supabase
    .from('endpoints')
    .select('id')
    .eq('path', path)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Path already exists' }, { status: 400 });
  }

  // Create endpoint
  const { data: endpoint, error } = await supabase
    .from('endpoints')
    .insert({
      name,
      description,
      path,
      auth_method: authMethod || 'bearer',
      allowed_methods: allowedMethods || ['POST'],
      max_payload_size: maxPayloadSize || 1048576,
      rate_limit_per_minute: rateLimitPerMinute || 60,
      required_fields: requiredFields || [],
      optional_fields: optionalFields || [],
      tags: tags || [],
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create endpoint' }, { status: 500 });
  }

  // Generate initial secret
  const secret = crypto.randomBytes(32).toString('hex');
  const secretPrefix = secret.substring(0, 8);

  await supabase.from('endpoint_credentials').insert({
    endpoint_id: endpoint.id,
    secret_hash: crypto.createHash('sha256').update(secret).digest('hex'),
    secret_prefix: secretPrefix,
  });

  await logAuditEvent(supabase, {
    actorId: auth.user.id,
    actorEmail: auth.user.email,
    action: 'ENDPOINT_CREATED',
    targetType: 'endpoint',
    targetId: endpoint.id,
    targetName: name,
    metadata: { path },
  });

  return NextResponse.json({ endpoint, secret });
}

export async function PATCH(request) {
  const auth = await requirePermission(request, 'endpoints.edit');
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const { endpointId, action, data } = body;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: endpoint } = await supabase
    .from('endpoints')
    .select('name')
    .eq('id', endpointId)
    .single();

  let result;

  switch (action) {
    case 'update':
      result = await supabase
        .from('endpoints')
        .update(data)
        .eq('id', endpointId)
        .select()
        .single();

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'ENDPOINT_UPDATED',
        targetType: 'endpoint',
        targetId: endpointId,
        targetName: endpoint?.name,
      });
      break;

    case 'enable':
      result = await supabase
        .from('endpoints')
        .update({ status: 'active' })
        .eq('id', endpointId)
        .select()
        .single();

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'ENDPOINT_ENABLED',
        targetType: 'endpoint',
        targetId: endpointId,
        targetName: endpoint?.name,
      });
      break;

    case 'disable':
      result = await supabase
        .from('endpoints')
        .update({ status: 'disabled' })
        .eq('id', endpointId)
        .select()
        .single();

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'ENDPOINT_DISABLED',
        targetType: 'endpoint',
        targetId: endpointId,
        targetName: endpoint?.name,
      });
      break;

    case 'rotate_credentials':
      const oldCreds = await supabase
        .from('endpoint_credentials')
        .update({ is_active: false, rotated_at: new Date().toISOString() })
        .eq('endpoint_id', endpointId)
        .eq('is_active', true);

      const newSecret = crypto.randomBytes(32).toString('hex');
      const newSecretPrefix = newSecret.substring(0, 8);

      await supabase.from('endpoint_credentials').insert({
        endpoint_id: endpointId,
        secret_hash: crypto.createHash('sha256').update(newSecret).digest('hex'),
        secret_prefix: newSecretPrefix,
      });

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'ENDPOINT_CREDENTIAL_ROTATED',
        targetType: 'endpoint',
        targetId: endpointId,
        targetName: endpoint?.name,
      });

      return NextResponse.json({ secret: newSecret });

    case 'delete':
      await supabase.from('endpoints').delete().eq('id', endpointId);

      await logAuditEvent(supabase, {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        action: 'ENDPOINT_DELETED',
        targetType: 'endpoint',
        targetId: endpointId,
        targetName: endpoint?.name,
      });
      break;

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  return NextResponse.json({ success: true, endpoint: result?.data });
}
