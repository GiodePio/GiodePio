export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import crypto from 'crypto';

export async function POST(request, { params }) {
  const { id } = params;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get endpoint
  const { data: endpoint } = await supabase
    .from('endpoints')
    .select('*')
    .eq('id', id)
    .single();

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  }

  if (endpoint.status !== 'active') {
    return NextResponse.json({ error: 'Endpoint is disabled' }, { status: 403 });
  }

  // Check method
  if (!endpoint.allowed_methods.includes(request.method)) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Authenticate
  if (endpoint.auth_method !== 'none') {
    const authHeader = request.headers.get('authorization');
    const apiKeyHeader = request.headers.get('x-api-key');

    if (!authHeader && !apiKeyHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let providedSecret;
    if (endpoint.auth_method === 'bearer' && authHeader?.startsWith('Bearer ')) {
      providedSecret = authHeader.substring(7);
    } else if (endpoint.auth_method === 'api_key') {
      providedSecret = apiKeyHeader;
    }

    if (!providedSecret) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { data: credentials } = await supabase
      .from('endpoint_credentials')
      .select('secret_hash')
      .eq('endpoint_id', id)
      .eq('is_active', true);

    const providedHash = crypto.createHash('sha256').update(providedSecret).digest('hex');
    const isValid = credentials?.some(c => c.secret_hash === providedHash);

    if (!isValid) {
      await supabase.from('security_events').insert({
        event_type: 'ENDPOINT_AUTH_FAILURE',
        severity: 'warning',
        description: `Failed authentication for endpoint ${endpoint.name}`,
        metadata: { endpoint_id: id },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  }

  // Check rate limit
  const now = new Date();
  const minuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();

  const { count: recentRequests } = await supabase
    .from('endpoint_requests')
    .select('*', { count: 'exact', head: true })
    .eq('endpoint_id', id)
    .gte('created_at', minuteAgo);

  if (recentRequests >= endpoint.rate_limit_per_minute) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Read payload
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > endpoint.max_payload_size) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate required fields
  if (endpoint.required_fields?.length > 0) {
    const missingFields = endpoint.required_fields.filter(f => !(f in body));
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        fields: missingFields,
      }, { status: 400 });
    }
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  // Process the webhook data
  // For now, just log it. In production, you'd forward to your application logic.
  const processingTime = Date.now() - startTime;

  // Log request
  await supabase.from('endpoint_requests').insert({
    endpoint_id: id,
    request_id: requestId,
    method: request.method,
    status_code: 200,
    payload_size: contentLength,
    processing_time_ms: processingTime,
    validation_passed: true,
    ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    user_agent: request.headers.get('user-agent'),
  });

  return NextResponse.json({
    success: true,
    request_id: requestId,
  });
}

export async function GET(request, { params }) {
  const { id } = params;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: endpoint } = await supabase
    .from('endpoints')
    .select('name, description, path, status, auth_method, allowed_methods, required_fields, optional_fields')
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  }

  return NextResponse.json(endpoint);
}
