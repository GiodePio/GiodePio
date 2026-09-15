export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_email, subscription_id, amount, plan_id, plan_name, status, payer_name, payer_email } = body;

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
      plan_id: plan_id || 'ULTIMATE_GRABS_PRO',
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

    // Update pro_users
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
