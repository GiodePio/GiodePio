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
    .from('user_minecraft')
    .select('minecraft_username')
    .eq('email', email)
    .single();

  return NextResponse.json({ username: data?.minecraft_username || null });
}

export async function POST(request) {
  const body = await request.json();
  if (!body.email || !body.minecraft_username) {
    return NextResponse.json({ error: 'email and minecraft_username required' }, { status: 400 });
  }

  const supabase = getClient();

  const { error } = await supabase
    .from('user_minecraft')
    .upsert(
      { email: body.email, minecraft_username: body.minecraft_username },
      { onConflict: 'minecraft_username' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
