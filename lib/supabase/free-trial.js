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

  if (email === 'lifegrading@gmail.com') {
    return { allowed: true, remaining: null, is_pro: true };
  }

  let isPro = false;
  let remaining = 3;

  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const u = authData?.users?.find(x => x.email === email);
    if (u?.user_metadata?.is_pro) isPro = true;
    if (u?.user_metadata?.free_uses_remaining !== undefined && u?.user_metadata?.free_uses_remaining !== null) {
      remaining = u.user_metadata.free_uses_remaining;
    }
  } catch (e) {}

  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_pro, free_uses_remaining')
      .eq('email', email)
      .single();

    if (user) {
      if (user.is_pro) isPro = true;
      if (user.free_uses_remaining !== undefined && user.free_uses_remaining !== null) {
        remaining = user.free_uses_remaining;
      }
    }
  } catch (e) {}

  if (isPro) {
    return { allowed: true, remaining: null, is_pro: true };
  }

  if (remaining <= 0) {
    return { allowed: false, remaining: 0, is_pro: false, reason: 'trial_exhausted' };
  }

  return { allowed: true, remaining, is_pro: false };
}

export async function consumeFreeUse(supabase, email) {
  if (!email) {
    return { success: true };
  }

  const check = await canUserCapture(supabase, email);
  if (!check.allowed || check.is_pro) {
    return { success: check.allowed, is_pro: check.is_pro, reason: check.reason, remaining: check.remaining };
  }

  const current = check.remaining ?? 3;
  if (current <= 0) {
    return { success: false, reason: 'trial_exhausted', remaining: 0 };
  }

  const newValue = Math.max(0, current - 1);

  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const u = authData?.users?.find(x => x.email === email);
    if (u) {
      await supabase.auth.admin.updateUserById(u.id, {
        user_metadata: {
          ...u.user_metadata,
          free_uses_remaining: newValue,
        },
      });
    }
  } catch (e) {}

  try {
    await supabase
      .from('users')
      .update({ free_uses_remaining: newValue })
      .eq('email', email);
  } catch (e) {}

  return { success: true, remaining: newValue };
}

export async function getExhaustedEmails(supabase) {
  const exhausted = new Set();

  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    if (authData?.users) {
      for (const u of authData.users) {
        if (!u.user_metadata?.is_pro && u.user_metadata?.free_uses_remaining === 0) {
          exhausted.add(u.email);
        }
      }
    }
  } catch (e) {}

  try {
    const { data } = await supabase
      .from('users')
      .select('email')
      .eq('is_pro', false)
      .eq('free_uses_remaining', 0);

    if (data) {
      for (const u of data) exhausted.add(u.email);
    }
  } catch (e) {}

  return Array.from(exhausted);
}
