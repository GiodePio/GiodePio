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

  const normEmail = email.toLowerCase();
  if (normEmail === 'lifegrading@gmail.com') {
    return { allowed: true, remaining: null, is_pro: true };
  }

  // 1. Check pro_users table
  try {
    const { data: proRecord } = await supabase
      .from('pro_users')
      .select('is_pro, free_uses_remaining')
      .eq('email', normEmail)
      .single();

    if (proRecord && typeof proRecord.is_pro === 'boolean') {
      const isPro = proRecord.is_pro;
      const remaining = isPro ? null : (proRecord.free_uses_remaining ?? 3);
      if (isPro) return { allowed: true, remaining: null, is_pro: true };
      if (remaining <= 0) return { allowed: false, remaining: 0, is_pro: false, reason: 'trial_exhausted' };
      return { allowed: true, remaining, is_pro: false };
    }
  } catch (e) {}

  // 2. Check auth metadata
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const u = authData?.users?.find(x => x.email && x.email.toLowerCase() === normEmail);
    if (u?.user_metadata && typeof u.user_metadata.is_pro === 'boolean') {
      const isPro = u.user_metadata.is_pro;
      const remaining = isPro ? null : (u.user_metadata.free_uses_remaining ?? 3);
      if (isPro) return { allowed: true, remaining: null, is_pro: true };
      if (remaining <= 0) return { allowed: false, remaining: 0, is_pro: false, reason: 'trial_exhausted' };
      return { allowed: true, remaining, is_pro: false };
    }
  } catch (e) {}

  // 3. Check users table
  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_pro, free_uses_remaining')
      .ilike('email', normEmail)
      .single();

    if (user && typeof user.is_pro === 'boolean') {
      const isPro = user.is_pro;
      const remaining = isPro ? null : (user.free_uses_remaining ?? 3);
      if (isPro) return { allowed: true, remaining: null, is_pro: true };
      if (remaining <= 0) return { allowed: false, remaining: 0, is_pro: false, reason: 'trial_exhausted' };
      return { allowed: true, remaining, is_pro: false };
    }
  } catch (e) {}

  return { allowed: true, remaining: 3, is_pro: false };
}

export async function consumeFreeUse(supabase, email) {
  if (!email) {
    return { success: true };
  }

  const normEmail = email.toLowerCase();
  const check = await canUserCapture(supabase, normEmail);
  if (!check.allowed || check.is_pro) {
    return { success: check.allowed, is_pro: check.is_pro, reason: check.reason, remaining: check.remaining };
  }

  const current = check.remaining ?? 3;
  if (current <= 0) {
    return { success: false, reason: 'trial_exhausted', remaining: 0 };
  }

  const newValue = Math.max(0, current - 1);

  // Update pro_users
  try {
    await supabase
      .from('pro_users')
      .upsert({
        email: normEmail,
        is_pro: false,
        free_uses_remaining: newValue,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
  } catch (e) {}

  // Update Auth user_metadata
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const u = authData?.users?.find(x => x.email && x.email.toLowerCase() === normEmail);
    if (u) {
      await supabase.auth.admin.updateUserById(u.id, {
        user_metadata: {
          ...u.user_metadata,
          is_pro: false,
          free_uses_remaining: newValue,
        },
      });
    }
  } catch (e) {}

  // Update users table
  try {
    await supabase
      .from('users')
      .update({ is_pro: false, free_uses_remaining: newValue })
      .ilike('email', normEmail);
  } catch (e) {}

  return { success: true, remaining: newValue };
}

export async function getExhaustedEmails(supabase) {
  const exhausted = new Set();

  try {
    const { data: proData } = await supabase
      .from('pro_users')
      .select('email, is_pro, free_uses_remaining')
      .eq('is_pro', false)
      .eq('free_uses_remaining', 0);
    if (proData) {
      for (const p of proData) if (p.email) exhausted.add(p.email.toLowerCase());
    }
  } catch (e) {}

  return Array.from(exhausted);
}
