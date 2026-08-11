export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

function getClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll() { return []; }, setAll() {} } }
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getClient();
  const { data } = await supabase
    .from('user_settings')
    .select('webhook_url')
    .eq('email', email)
    .single();

  return NextResponse.json({ webhook_url: data?.webhook_url || null });
}

export async function POST(request) {
  const body = await request.json();
  if (!body.email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const supabase = getClient();

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { email: body.email, webhook_url: body.webhook_url || '' },
      { onConflict: 'email' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
