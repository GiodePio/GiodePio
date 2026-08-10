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

export async function GET() {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('reps')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ reps: [], error: error.message });
  }
  return NextResponse.json({ reps: data || [] });
}

export async function POST(request) {
  const { user_email, username, tag, text } = await request.json();

  if (!user_email || !username || !text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getClient();

  const { data: existing } = await supabase
    .from('reps')
    .select('id')
    .eq('user_email', user_email)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'You already have a rep' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('reps')
    .insert([{ user_email, username, tag: tag || 'Good', text }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ rep: data });
}
