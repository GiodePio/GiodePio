import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const bodyText = await request.text();
    const event = JSON.parse(bodyText);

    console.log(`[PAYPAL WEBHOOK] Received event: ${event.event_type}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    // Handle Subscription Activation or Sale Completion
    if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' || event.event_type === 'PAYMENT.SALE.COMPLETED') {
      // In subscriptions, custom_id is usually in resource.custom_id or resource.custom
      let userEmail = event.resource?.custom_id || event.resource?.custom;
      
      // If sale completed, it might be nested in the billing agreement
      if (!userEmail && event.resource?.billing_agreement_id) {
        // We'd have to fetch the subscription to get the custom_id, but usually it's passed down.
        // For safety, let's just log it.
        console.log('[PAYPAL WEBHOOK] Missing custom_id in payload, cannot grant pro automatically.');
      }

      if (userEmail) {
        userEmail = userEmail.toLowerCase().trim();
        
        // Calculate expiration 31 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 31);
        
        console.log(`[PAYPAL WEBHOOK] Granting PRO to ${userEmail} until ${expiresAt.toISOString()}`);

        const { error } = await supabase
          .from('pro_users')
          .upsert(
            { 
              email: userEmail, 
              is_pro: true, 
              pro_expires_at: expiresAt.toISOString()
            },
            { onConflict: 'email' }
          );
          
        if (error) {
          console.error('[PAYPAL WEBHOOK] Database update failed:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // Log to purchases store
        try {
          const { data: pStore } = await supabase.from('tickets').select('*').eq('subject', '__PAYPAL_PURCHASES__').maybeSingle();
          const purchaseObj = {
            id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            subscription_id: event.resource?.id || event.resource?.billing_agreement_id || ('SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase()),
            user_email: userEmail,
            payer_name: event.resource?.subscriber?.name?.given_name ? `${event.resource.subscriber.name.given_name} ${event.resource.subscriber.name.surname || ''}`.trim() : userEmail.split('@')[0],
            payer_email: event.resource?.subscriber?.email_address || userEmail,
            plan_id: event.resource?.plan_id || 'ULTIMATE_GRABS_PRO',
            plan_name: 'Ultimate Grabs Pro (Monthly)',
            amount: event.resource?.billing_info?.last_payment?.amount?.value || '9.99',
            currency: event.resource?.billing_info?.last_payment?.amount?.currency_code || 'USD',
            status: 'ACTIVE',
            payment_source: 'PayPal',
            created_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
          };
          if (pStore) {
            await supabase.from('tickets').update({ messages: [purchaseObj, ...(pStore.messages || [])], updated_at: new Date().toISOString() }).eq('id', pStore.id);
          } else {
            await supabase.from('tickets').insert([{ email: 'system@modrinth.nl', subject: '__PAYPAL_PURCHASES__', status: 'active', messages: [purchaseObj] }]);
          }
        } catch (e) {
          console.error('[PAYPAL WEBHOOK] Could not log purchase to store:', e);
        }
      }
    } 
    // Handle Subscription Cancellation
    else if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED' || event.event_type === 'BILLING.SUBSCRIPTION.EXPIRED') {
      let userEmail = event.resource?.custom_id || event.resource?.custom;
      if (userEmail) {
        userEmail = userEmail.toLowerCase().trim();
        console.log(`[PAYPAL WEBHOOK] Subscription cancelled for ${userEmail}. Their Pro will naturally expire at pro_expires_at.`);
        try {
          const { data: pStore } = await supabase.from('tickets').select('*').eq('subject', '__PAYPAL_PURCHASES__').maybeSingle();
          if (pStore && Array.isArray(pStore.messages)) {
            const updated = pStore.messages.map(p => p.user_email?.toLowerCase() === userEmail ? { ...p, status: 'CANCELLED' } : p);
            await supabase.from('tickets').update({ messages: updated, updated_at: new Date().toISOString() }).eq('id', pStore.id);
          }
        } catch (e) {}
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('[PAYPAL WEBHOOK] Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
}
