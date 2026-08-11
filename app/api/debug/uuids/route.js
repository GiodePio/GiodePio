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

  const { data: tableCheck, error: tableError } = await supabase
    .from('user_uuids')
    .select('*')
    .limit(10);

  if (tableError) {
    return NextResponse.json({
      tableExists: false,
      error: tableError.message,
      hint: 'Run this in Supabase SQL Editor: create table if not exists public.user_uuids (id uuid primary key default uuid_generate_v4(), mod_uuid text unique not null, email text not null, created_at timestamptz default now());'
    });
  }

  return NextResponse.json({
    tableExists: true,
    entries: tableCheck?.length || 0,
    data: tableCheck
  });
}
