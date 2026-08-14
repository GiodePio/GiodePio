export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { getUserProState } from '@/lib/supabase/free-trial';

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

import { getProBenefits } from '@/lib/pro-benefits';

export async function GET(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ is_pro: false, free_uses_remaining: 3, trial_exhausted: false, benefits: getProBenefits(false) });

  const supabase = getClient();
  const state = await getUserProState(supabase, user.email);
  return NextResponse.json({ ...state, benefits: getProBenefits(state.is_pro) });
}
