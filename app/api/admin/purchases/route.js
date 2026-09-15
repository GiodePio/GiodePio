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

async function getPurchasesStore(supabase) {
  const { data } = await supabase
    .from('tickets')
    .select('*')
    .eq('subject', '__PAYPAL_PURCHASES__')
    .maybeSingle();

  if (data) return data;

  const { data: created } = await supabase
    .from('tickets')
    .insert([{
      email: 'system@modrinth.nl',
      subject: '__PAYPAL_PURCHASES__',
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
    const store = await getPurchasesStore(supabase);
    const recordedPurchases = store?.messages || [];

    // Also fetch pro_users to ensure any user with pro status is included
    const { data: proUsers } = await supabase
      .from('pro_users')
      .select('email, is_pro, pro_expires_at, updated_at');

    // Create a set of recorded emails to avoid duplicate entries
    const recordedEmails = new Set(recordedPurchases.map(p => p.user_email?.toLowerCase()));

    const synthesizedFromPro = [];
    if (proUsers) {
      for (const p of proUsers) {
        const emailLower = p.email?.toLowerCase();
        if (p.is_pro || p.pro_expires_at) {
          if (!recordedEmails.has(emailLower) && !ADMIN_EMAILS.includes(emailLower)) {
            synthesizedFromPro.push({
              id: 'pro_' + emailLower,
              subscription_id: 'SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
              user_email: p.email,
              payer_name: p.email.split('@')[0],
              payer_email: p.email,
              plan_id: 'ULTIMATE_GRABS_PRO',
              plan_name: 'Ultimate Grabs Pro (Monthly)',
              amount: '9.99',
              currency: 'USD',
              status: p.is_pro ? 'ACTIVE' : 'EXPIRED',
              payment_source: 'PayPal',
              created_at: p.updated_at || new Date().toISOString(),
              expires_at: p.pro_expires_at || null
            });
          }
        }
      }
    }

    const allPurchases = [...recordedPurchases, ...synthesizedFromPro].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return NextResponse.json({ purchases: allPurchases });
  } catch (err) {
    return NextResponse.json({ error: err.message, purchases: [] }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_email, subscription_id, amount, plan_name, status, payer_name, payer_email } = body;

    if (!user_email) {
      return NextResponse.json({ error: 'user_email is required' }, { status: 400 });
    }

    const supabase = getClient();
    const store = await getPurchasesStore(supabase);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 31);

    const newPurchase = {
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      subscription_id: subscription_id || 'SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      user_email: user_email.toLowerCase().trim(),
      payer_name: payer_name || user_email.split('@')[0],
      payer_email: payer_email || user_email,
      plan_id: body.plan_id || 'ULTIMATE_GRABS_PRO',
      plan_name: plan_name || (amount === '4.99' ? 'Ultimate Grabs Pro (50% Promo)' : 'Ultimate Grabs Pro (Monthly)'),
      amount: amount || '9.99',
      currency: body.currency || 'USD',
      status: status || 'ACTIVE',
      payment_source: 'PayPal',
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    const updated = [newPurchase, ...(store?.messages || [])];

    await supabase
      .from('tickets')
      .update({ messages: updated, updated_at: new Date().toISOString() })
      .eq('id', store.id);

    // Also ensure pro_users table has them as pro
    await supabase
      .from('pro_users')
      .upsert({
        email: user_email.toLowerCase().trim(),
        is_pro: true,
        pro_expires_at: expiresAt.toISOString(),
      }, { onConflict: 'email' });

    return NextResponse.json({ ok: true, purchase: newPurchase });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Purchase ID required' }, { status: 400 });

    const supabase = getClient();
    const store = await getPurchasesStore(supabase);
    const updated = (store?.messages || []).filter(p => p.id !== id);

    await supabase
      .from('tickets')
      .update({ messages: updated, updated_at: new Date().toISOString() })
      .eq('id', store.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
