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

export async function PUT(request, { params }) {
  const { id } = await params;
  const { text, tag, user_email } = await request.json();

  if (!text || !user_email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getClient();

  const { data: existing } = await supabase
    .from('reps')
    .select('user_email')
    .eq('id', id)
    .single();

  if (!existing || existing.user_email !== user_email) {
    return NextResponse.json({ error: 'Not your rep' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('reps')
    .update({ text, tag, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ rep: data });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const user_email = searchParams.get('user_email');

  if (!user_email) {
    return NextResponse.json({ error: 'Missing user_email' }, { status: 400 });
  }

  const supabase = getClient();

  const { data: existing } = await supabase
    .from('reps')
    .select('user_email')
    .eq('id', id)
    .single();

  if (!existing || existing.user_email !== user_email) {
    return NextResponse.json({ error: 'Not your rep' }, { status: 403 });
  }

  const { error } = await supabase
    .from('reps')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
