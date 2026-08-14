import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getUserProState(supabase, email) {
  if (!email) {
    return { is_pro: false, free_uses_remaining: 3, trial_exhausted: false, remaining_seconds: null };
  }

  const normEmail = email.toLowerCase().trim();
  const now = new Date();

  // ONLY check public.pro_users table (as requested by user)
  try {
    const { data: proRecords, error: proErr } = await supabase
      .from('pro_users')
      .select('*')
      .ilike('email', normEmail)
      .limit(1);

    const proRecord = proRecords && proRecords.length > 0 ? proRecords[0] : null;

    if (!proErr && proRecord && proRecord.is_pro !== undefined) {
      const isProBool = proRecord.is_pro === true || proRecord.is_pro === 'true' || proRecord.is_pro === 1;
      
      if (!isProBool) {
        const uses = typeof proRecord.free_uses_remaining === 'number' ? proRecord.free_uses_remaining : 3;
        return { is_pro: false, free_uses_remaining: uses, trial_exhausted: uses <= 0, remaining_seconds: null };
      }
      
      if (isProBool) {
        if (proRecord.pro_expires_at) {
          const exp = new Date(proRecord.pro_expires_at);
          if (now < exp) {
            const remSec = Math.max(0, Math.floor((exp - now) / 1000));
            return { is_pro: true, remaining_seconds: remSec, free_uses_remaining: null, trial_exhausted: false };
          } else {
            // Timer expired! Automatically update pro_users table
            try {
              await supabase
                .from('pro_users')
                .update({ is_pro: false, pro_expires_at: null })
                .ilike('email', normEmail);
            } catch (e) {}
            return { is_pro: false, free_uses_remaining: 0, trial_exhausted: true, expired: true, remaining_seconds: 0 };
          }
        } else {
          // Permanent Pro
          return { is_pro: true, free_uses_remaining: null, trial_exhausted: false, remaining_seconds: null };
        }
      }
    }
  } catch (e) {}

  // If nothing shows up abt an email, DONT give pro rank!
  return { is_pro: false, free_uses_remaining: 3, trial_exhausted: false, remaining_seconds: null };
}

export async function canUserCapture(supabase, email) {
  const state = await getUserProState(supabase, email);
  if (state.is_pro) {
    return { allowed: true, remaining: null, is_pro: true };
  }
  if (state.free_uses_remaining <= 0) {
    return { allowed: false, remaining: 0, is_pro: false, reason: 'trial_exhausted' };
  }
  return { allowed: true, remaining: state.free_uses_remaining, is_pro: false };
}

export async function consumeFreeUse(supabase, email) {
  if (!email) return { success: true };

  const normEmail = email.toLowerCase().trim();
  const state = await getUserProState(supabase, normEmail);

  if (state.is_pro) {
    return { success: true, is_pro: true, remaining: null };
  }

  const current = state.free_uses_remaining ?? 3;
  if (current <= 0) {
    return { success: false, reason: 'trial_exhausted', remaining: 0 };
  }

  const newValue = Math.max(0, current - 1);

  // ONLY update pro_users table
  try {
    await supabase.from('pro_users').upsert({ email: normEmail, is_pro: false, pro_expires_at: null }, { onConflict: 'email' });
  } catch (e) {}

  return { success: true, remaining: newValue };
}

export async function getExhaustedEmails(supabase) {
  const exhausted = new Set();
  try {
    const { data: proData } = await supabase.from('pro_users').select('email, is_pro, free_uses_remaining').eq('is_pro', false).lte('free_uses_remaining', 0);
    if (proData) for (const p of proData) if (p.email) exhausted.add(p.email.toLowerCase().trim());
  } catch (e) {}
  return Array.from(exhausted);
}
