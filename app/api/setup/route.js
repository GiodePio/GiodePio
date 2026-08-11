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

export async function POST() {
  const supabase = getClient();

  const sql = `
    create table if not exists public.user_uuids (
      id uuid primary key default uuid_generate_v4(),
      mod_uuid text unique not null,
      email text not null,
      created_at timestamptz default now()
    );
    create index if not exists user_uuids_email_idx on public.user_uuids (email);
  `;

  const { error } = await supabase.rpc('exec_sql', { query: sql });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
