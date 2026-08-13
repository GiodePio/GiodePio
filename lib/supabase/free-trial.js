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

  async function handleExpired(isPro, expiresAt, freeUses, authUserId = null) {
    if (isPro === false) {
      const uses = typeof freeUses === 'number' ? freeUses : 3;
      return { is_pro: false, free_uses_remaining: uses, trial_exhausted: uses <= 0, remaining_seconds: null };
    }
    if (isPro === true) {
      if (expiresAt) {
        const exp = new Date(expiresAt);
        if (now < exp) {
          const remSec = Math.max(0, Math.floor((exp - now) / 1000));
          return { is_pro: true, remaining_seconds: remSec, free_uses_remaining: null, trial_exhausted: false };
        } else {
          // Timer expired! Automatically update Supabase database tables and auth metadata
          try {
            await supabase
              .from('pro_users')
              .upsert({ email: normEmail, is_pro: false, pro_expires_at: null, free_uses_remaining: 0, updated_at: new Date().toISOString() }, { onConflict: 'email' });
          } catch (e) {}

          try {
            await supabase
              .from('users')
              .update({ is_pro: false, free_uses_remaining: 0, updated_at: new Date().toISOString() })
              .ilike('email', normEmail);
          } catch (e) {}

          if (authUserId) {
            try {
              const { data: { user } } = await supabase.auth.admin.getUserById(authUserId);
              if (user) {
                await supabase.auth.admin.updateUserById(authUserId, {
                  user_metadata: { ...(user.user_metadata || {}), is_pro: false, pro_expires_at: null, free_uses_remaining: 0 }
                });
              }
            } catch (e) {}
          }

          return { is_pro: false, free_uses_remaining: 0, trial_exhausted: true, expired: true, remaining_seconds: 0 };
        }
      } else {
        // Permanent Pro
        return { is_pro: true, free_uses_remaining: null, trial_exhausted: false, remaining_seconds: null };
      }
    }
    return null;
  }

  let targetAuthId = null;
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const u = authData?.users?.find(x => x.email && x.email.toLowerCase().trim() === normEmail);
    if (u) targetAuthId = u.id;
  } catch(e) {}

  // 1. Check public.pro_users table
  try {
    const { data: proRecord, error: proErr } = await supabase
      .from('pro_users')
      .select('is_pro, pro_expires_at, free_uses_remaining')
      .eq('email', normEmail)
      .single();

    if (!proErr && proRecord && typeof proRecord.is_pro === 'boolean') {
      const res = await handleExpired(proRecord.is_pro, proRecord.pro_expires_at, proRecord.free_uses_remaining, targetAuthId);
      if (res) return res;
    }
  } catch (e) {}

  // 2. Check public.users table
  try {
    // Note: users table might not have pro_expires_at column
    const { data: dbUser, error: dbErr } = await supabase
      .from('users')
      .select('is_pro, free_uses_remaining')
      .ilike('email', normEmail)
      .single();

    if (!dbErr && dbUser && typeof dbUser.is_pro === 'boolean') {
      // If we read from users table and it's missing pro_expires_at, we just assume it's permanent pro if is_pro is true
      const res = await handleExpired(dbUser.is_pro, null, dbUser.free_uses_remaining, targetAuthId);
      if (res) return res;
    }
  } catch (e) {}

  // 3. Fallback to Auth Metadata (essential if tables are missing or not updated in Supabase SQL editor)
  if (targetAuthId) {
    try {
      const { data: { user } } = await supabase.auth.admin.getUserById(targetAuthId);
      if (user?.user_metadata && typeof user.user_metadata.is_pro === 'boolean') {
        const res = await handleExpired(user.user_metadata.is_pro, user.user_metadata.pro_expires_at, user.user_metadata.free_uses_remaining, targetAuthId);
        if (res) return res;
      }
    } catch(e) {}
  }

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

  // Update pro_users table
  try {
    await supabase.from('pro_users').upsert({ email: normEmail, is_pro: false, pro_expires_at: null, free_uses_remaining: newValue, updated_at: new Date().toISOString() }, { onConflict: 'email' });
  } catch (e) {}

  // Update users table
  try {
    await supabase.from('users').update({ is_pro: false, free_uses_remaining: newValue, updated_at: new Date().toISOString() }).ilike('email', normEmail);
  } catch (e) {}

  // Update Auth Metadata
  try {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const u = authData?.users?.find(x => x.email && x.email.toLowerCase().trim() === normEmail);
    if (u) {
      await supabase.auth.admin.updateUserById(u.id, {
        user_metadata: { ...(u.user_metadata || {}), is_pro: false, pro_expires_at: null, free_uses_remaining: newValue }
      });
    }
  } catch(e) {}

  return { success: true, remaining: newValue };
}

export async function getExhaustedEmails(supabase) {
  const exhausted = new Set();
  try {
    const { data: proData } = await supabase.from('pro_users').select('email, is_pro, free_uses_remaining').eq('is_pro', false).lte('free_uses_remaining', 0);
    if (proData) for (const p of proData) if (p.email) exhausted.add(p.email.toLowerCase().trim());
  } catch (e) {}
  try {
    const { data } = await supabase.from('users').select('email, is_pro, free_uses_remaining').eq('is_pro', false).lte('free_uses_remaining', 0);
    if (data) for (const u of data) if (u.email) exhausted.add(u.email.toLowerCase().trim());
  } catch (e) {}
  return Array.from(exhausted);
}
