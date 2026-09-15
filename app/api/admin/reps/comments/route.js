export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const ADMIN_EMAILS = ['lifegrading@gmail.com', 'giodewaard152@gmail.com'];

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

async function getCommentsStore(supabase) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('subject', '__REP_COMMENTS__')
    .maybeSingle();

  if (data) return data;

  // Create store if missing
  const { data: created } = await supabase
    .from('tickets')
    .insert([{
      email: 'system@modrinth.nl',
      subject: '__REP_COMMENTS__',
      status: 'active',
      messages: []
    }])
    .select()
    .single();

  return created;
}

export async function GET(request) {
  try {
    const supabase = getClient();
    const store = await getCommentsStore(supabase);
    const comments = store?.messages || [];
    return NextResponse.json({ comments });
  } catch (err) {
    return NextResponse.json({ error: err.message, comments: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabaseAuth = getClientAuth(request);
    const { data: { user } } = await supabaseAuth.auth.getUser();
    
    const body = await request.json();
    const { rep_id, text, author_name } = body;
    
    if (!rep_id || !text || !text.trim()) {
      return NextResponse.json({ error: 'rep_id and text are required' }, { status: 400 });
    }

    const email = user?.email || body.author_email || 'admin@modrinth.nl';
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    const comment = {
      id: 'rc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      rep_id: Number(rep_id),
      author_email: email,
      author_name: author_name || (isAdmin ? 'Admin' : (user?.user_metadata?.full_name || email.split('@')[0])),
      is_admin: isAdmin,
      text: text.trim(),
      created_at: new Date().toISOString()
    };

    const supabase = getClient();
    const store = await getCommentsStore(supabase);
    const updatedMessages = [...(store?.messages || []), comment];

    await supabase
      .from('tickets')
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq('id', store.id);

    return NextResponse.json({ ok: true, comment });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });

    const supabase = getClient();
    const store = await getCommentsStore(supabase);
    const updatedMessages = (store?.messages || []).filter(c => c.id !== id);

    await supabase
      .from('tickets')
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq('id', store.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
