export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function getClientAuth(request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        },
      },
    }
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const includeDisplayName = searchParams.get('include_display_name') === 'true';
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getClient();
  const response = { webhook_url: null, display_name: null };

  const { data: settings } = await supabase
    .from('user_settings')
    .select('webhook_url')
    .eq('email', email)
    .single();

  response.webhook_url = settings?.webhook_url || null;

  if (includeDisplayName) {
    const { data: user } = await supabase
      .from('users')
      .select('display_name')
      .eq('email', email)
      .single();
    response.display_name = user?.display_name || null;
  }

  return NextResponse.json(response);
}

export async function POST(request) {
  const body = await request.json();
  if (!body.email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getClient();

  if (body.display_name !== undefined) {
    const { error } = await supabase
      .from('users')
      .update({ display_name: body.display_name, updated_at: new Date().toISOString() })
      .eq('email', body.email);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.webhook_url !== undefined) {
    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { email: body.email, webhook_url: body.webhook_url || '' },
        { onConflict: 'email' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
