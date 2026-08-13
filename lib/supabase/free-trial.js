import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function canUserCapture(supabase, email) {
  if (!email) {
    return { allowed: true, remaining: null, is_pro: false };
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('is_pro, free_uses_remaining')
    .eq('email', email)
    .single();

  if (error || !user) {
    return { allowed: true, remaining: null, is_pro: false };
  }

  if (user.is_pro) {
    return { allowed: true, remaining: null, is_pro: true };
  }

  const remaining = user.free_uses_remaining ?? 0;
  if (remaining <= 0) {
    return { allowed: false, remaining: 0, is_pro: false, reason: 'trial_exhausted' };
  }

  return { allowed: true, remaining, is_pro: false };
}

export async function consumeFreeUse(supabase, email) {
  if (!email) {
    return { success: true };
  }

  const { data, error } = await supabase
    .from('users')
    .select('is_pro, free_uses_remaining')
    .eq('email', email)
    .single();

  if (error || !data || data.is_pro) {
    return { success: true, is_pro: data?.is_pro || false };
  }

  const current = data.free_uses_remaining ?? 0;
  if (current <= 0) {
    return { success: false, reason: 'trial_exhausted', remaining: 0 };
  }

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ free_uses_remaining: current - 1 })
    .eq('email', email)
    .eq('free_uses_remaining', current)
    .select('free_uses_remaining');

  if (updateError || !updated || updated.length === 0) {
    return { success: false, reason: 'race_condition', remaining: 0 };
  }

  return { success: true, remaining: updated[0].free_uses_remaining };
}

export async function getExhaustedEmails(supabase) {
  const { data, error } = await supabase
    .from('users')
    .select('email')
    .eq('is_pro', false)
    .eq('free_uses_remaining', 0);

  return (data || []).map(u => u.email);
}
