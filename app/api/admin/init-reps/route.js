export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll() { return []; }, setAll() {} } }
  );

  const sql = `
    CREATE TABLE IF NOT EXISTS reps (
      id BIGSERIAL PRIMARY KEY,
      user_email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT 'Good',
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  const { error } = await supabase.rpc('exec_sql', { query: sql });

  if (error) {
    return NextResponse.json({ error: error.message, note: 'Create tables manually in Supabase SQL Editor' });
  }
  return NextResponse.json({ ok: true });
}
