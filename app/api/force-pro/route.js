import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

function getClientAuth(req) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          const cookie = req.cookies.get(name);
          return cookie?.value;
        },
      },
    }
  );
}

export async function GET(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || user.email !== 'lifegrading@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'pipivoorjason@gmail.com';
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // 1. Check existing
  const { data: before } = await supabase.from('pro_users').select('*').ilike('email', email);
  
  // 2. Force delete
  await supabase.from('pro_users').delete().ilike('email', email);
  
  // 3. Force insert
  const { data: inserted, error: insertErr } = await supabase.from('pro_users').insert([{ email: email.toLowerCase().trim(), is_pro: true, pro_expires_at: null }]).select('*');
  
  // 4. Check after
  const { data: after } = await supabase.from('pro_users').select('*').ilike('email', email);
  
  return NextResponse.json({
    email_tested: email,
    before: before,
    insert_result: inserted,
    insert_error: insertErr,
    after: after
  });
}
