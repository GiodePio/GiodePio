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
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getClient();
  let query = supabase.from('tickets').select('*').order('updated_at', { ascending: false });
  
  if (user.email !== 'lifegrading@gmail.com') {
    query = query.eq('email', user.email);
  }

  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ tickets: [] });
  }
  return NextResponse.json({ tickets: data || [] });
}

export async function POST(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const supabase = getClient();
  const { data, error } = await supabase.from('tickets').insert([{
    email: user.email,
    subject: body.subject,
    messages: body.messages,
    status: 'open'
  }]).select();
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ticket: data[0] });
}

export async function PATCH(request) {
  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, message, status } = body;
  if (!id) return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 });

  const supabase = getClient();
  
  // Get current ticket
  const { data: ticket, error: fetchErr } = await supabase.from('tickets').select('*').eq('id', id).single();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  
  // Verify ownership if not admin
  if (user.email !== 'lifegrading@gmail.com' && ticket.email !== user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updates = { updated_at: new Date().toISOString() };
  if (message) {
    updates.messages = [...(ticket.messages || []), message];
  }
  if (status) {
    updates.status = status;
  }

  const { data, error } = await supabase.from('tickets').update(updates).eq('id', id).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ticket: data[0] });
}
