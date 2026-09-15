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

async function getDeletedPurchasesStore(supabase) {
  const { data } = await supabase
    .from('tickets')
    .select('*')
    .eq('subject', '__DELETED_PURCHASES__')
    .maybeSingle();

  if (data) return data;

  const { data: created } = await supabase
    .from('tickets')
    .insert([{
      email: 'system@modrinth.nl',
      subject: '__DELETED_PURCHASES__',
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
    const [store, delStore] = await Promise.all([
      getPurchasesStore(supabase),
      getDeletedPurchasesStore(supabase)
    ]);

    const deletedItems = new Set((delStore?.messages || []).map(x => String(x).toLowerCase().trim()));
    const rawRecorded = store?.messages || [];
    const recordedPurchases = rawRecorded.filter(p => {
      if (!p) return false;
      if (deletedItems.has(String(p.id).toLowerCase())) return false;
      if (p.user_email && deletedItems.has(p.user_email.toLowerCase().trim())) return false;
      return true;
    });

    // Also fetch pro_users to ensure any user with active pro status is included
    const { data: proUsers } = await supabase
      .from('pro_users')
      .select('email, is_pro, pro_expires_at, updated_at');

    const recordedEmails = new Set(recordedPurchases.map(p => p.user_email?.toLowerCase().trim()));

    const synthesizedFromPro = [];
    if (proUsers) {
      for (const p of proUsers) {
        if (!p.email) continue;
        const emailLower = p.email.toLowerCase().trim();

        // If explicitly deleted or already recorded or is admin, skip!
        if (deletedItems.has(emailLower) || deletedItems.has('pro_' + emailLower)) continue;
        if (recordedEmails.has(emailLower)) continue;
        if (ADMIN_EMAILS.includes(emailLower)) continue;

        if (p.is_pro || (p.pro_expires_at && new Date(p.pro_expires_at) > new Date())) {
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
            description: '',
            created_at: p.updated_at || new Date().toISOString(),
            expires_at: p.pro_expires_at || null
          });
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
    const { user_email, subscription_id, amount, plan_name, status, payer_name, payer_email, description } = body;

    if (!user_email) {
      return NextResponse.json({ error: 'user_email is required' }, { status: 400 });
    }

    const emailLower = user_email.toLowerCase().trim();
    const supabase = getClient();
    const [store, delStore] = await Promise.all([
      getPurchasesStore(supabase),
      getDeletedPurchasesStore(supabase)
    ]);

    // Unmark from deleted store if it was previously deleted
    if (delStore) {
      const remainingDeleted = (delStore.messages || []).filter(x => {
        const xl = String(x).toLowerCase().trim();
        return xl !== emailLower && xl !== ('pro_' + emailLower);
      });
      await supabase
        .from('tickets')
        .update({ messages: remainingDeleted, updated_at: new Date().toISOString() })
        .eq('id', delStore.id);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 31);

    const newPurchase = {
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      subscription_id: subscription_id || 'SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      user_email: emailLower,
      payer_name: payer_name || emailLower.split('@')[0],
      payer_email: payer_email || emailLower,
      plan_id: body.plan_id || 'ULTIMATE_GRABS_PRO',
      plan_name: plan_name || (amount === '4.99' ? 'Ultimate Grabs Pro (50% Promo)' : 'Ultimate Grabs Pro (Monthly)'),
      amount: amount || '9.99',
      currency: body.currency || 'USD',
      status: status || 'ACTIVE',
      payment_source: 'PayPal',
      description: (description || '').trim(),
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    const updated = [newPurchase, ...(store?.messages || []).filter(p => p.user_email?.toLowerCase().trim() !== emailLower)];

    await supabase
      .from('tickets')
      .update({ messages: updated, updated_at: new Date().toISOString() })
      .eq('id', store.id);

    // Also ensure pro_users table has them as pro
    await supabase
      .from('pro_users')
      .upsert({
        email: emailLower,
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
    const emailParam = searchParams.get('email');
    if (!id && !emailParam) return NextResponse.json({ error: 'Purchase ID or email required' }, { status: 400 });

    const supabase = getClient();
    const [store, delStore] = await Promise.all([
      getPurchasesStore(supabase),
      getDeletedPurchasesStore(supabase)
    ]);

    // Find the purchase to identify user_email
    const existingList = store?.messages || [];
    const target = existingList.find(p => p.id === id);
    const targetEmail = (emailParam || target?.user_email || (id && id.startsWith('pro_') ? id.replace('pro_', '') : '')).toLowerCase().trim();

    // 1. Remove from recorded purchases
    const updatedMessages = existingList.filter(p => p.id !== id && (!targetEmail || p.user_email?.toLowerCase().trim() !== targetEmail));
    await supabase
      .from('tickets')
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq('id', store.id);

    // 2. Add to deleted tracking so it is NEVER resurrected
    const toDelete = [id, targetEmail, 'pro_' + targetEmail].filter(Boolean).map(x => x.toLowerCase().trim());
    const existingDeleted = (delStore?.messages || []).map(x => String(x).toLowerCase().trim());
    const combinedDeleted = Array.from(new Set([...existingDeleted, ...toDelete]));

    await supabase
      .from('tickets')
      .update({ messages: combinedDeleted, updated_at: new Date().toISOString() })
      .eq('id', delStore.id);

    // 3. If targetEmail exists, revoke pro in pro_users so it cannot recreate
    if (targetEmail) {
      await supabase
        .from('pro_users')
        .update({
          is_pro: false,
          pro_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('email', targetEmail);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, user_email, description } = body;

    if (!id && !user_email) {
      return NextResponse.json({ error: 'Purchase ID or user_email is required' }, { status: 400 });
    }

    const supabase = getClient();
    const store = await getPurchasesStore(supabase);
    const existingList = store?.messages || [];

    const emailLower = (user_email || '').toLowerCase().trim();
    let found = false;
    let updatedPurchase = null;

    const descValue = description !== undefined ? String(description).trim() : '';

    const updatedMessages = existingList.map(p => {
      if ((id && p.id === id) || (emailLower && p.user_email?.toLowerCase().trim() === emailLower)) {
        found = true;
        updatedPurchase = {
          ...p,
          description: descValue,
          updated_at: new Date().toISOString()
        };
        return updatedPurchase;
      }
      return p;
    });

    if (!found) {
      // If the purchase was synthesized from pro_users, promote it into recorded purchases with description
      const userEmail = emailLower || (id && id.startsWith('pro_') ? id.replace('pro_', '') : '');
      const { data: proUser } = await supabase
        .from('pro_users')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      const createdItem = {
        id: id || ('pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
        subscription_id: 'SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        user_email: userEmail,
        payer_name: userEmail.split('@')[0],
        payer_email: userEmail,
        plan_id: 'ULTIMATE_GRABS_PRO',
        plan_name: 'Ultimate Grabs Pro (Monthly)',
        amount: '9.99',
        currency: 'USD',
        status: proUser?.is_pro ? 'ACTIVE' : 'EXPIRED',
        payment_source: 'PayPal',
        description: descValue,
        created_at: proUser?.updated_at || new Date().toISOString(),
        expires_at: proUser?.pro_expires_at || null,
        updated_at: new Date().toISOString()
      };

      updatedMessages.unshift(createdItem);
      updatedPurchase = createdItem;
    }

    await supabase
      .from('tickets')
      .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
      .eq('id', store.id);

    return NextResponse.json({ ok: true, purchase: updatedPurchase });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

