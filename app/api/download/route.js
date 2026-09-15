export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

function getClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll() { return []; }, setAll() {} } }
  );
}

function generateRandom() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function patchClassWithUUID(classBuffer, uuid) {
  const buf = Buffer.from(classBuffer);
  const searchStr = 'PLACEHOLDER_UUID';
  const searchBytes = Buffer.from(searchStr, 'ascii');
  const positions = [];
  let i = 0;
  while (i < buf.length - searchBytes.length - 3) {
    if (buf[i] === 0x01) {
      const len = buf.readUInt16BE(i + 1);
      if (len === searchBytes.length && buf.slice(i + 3, i + 3 + len).equals(searchBytes)) {
        positions.push({ offset: i, oldLen: len });
      }
    }
    i++;
  }
  if (positions.length === 0) return buf;

  let result = Buffer.alloc(0);
  let lastEnd = 0;
  for (const pos of positions) {
    result = Buffer.concat([result, buf.slice(lastEnd, pos.offset)]);
    const tagBuf = Buffer.from([0x01]);
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16BE(uuid.length);
    const strBuf = Buffer.from(uuid, 'ascii');
    result = Buffer.concat([result, tagBuf, lenBuf, strBuf]);
    lastEnd = pos.offset + 1 + 2 + pos.oldLen;
  }
  result = Buffer.concat([result, buf.slice(lastEnd)]);
  return result;
}

async function processDownload(request, { type = 'consentmod', title = '', description = '', logo = null } = {}) {
  const isAuthMe = type === 'authme';

  const supabaseAuth = createServerClient(
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

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const email = user.email;
  const supabase = getClient();

  const { data: existing } = await supabase
    .from('mod_versions')
    .select('version_number')
    .eq('email', email)
    .single();

  let newVersion = 1;
  if (existing) {
    newVersion = existing.version_number + 1;
    await supabase.from('mod_versions').update({ version_number: newVersion, created_at: new Date().toISOString() }).eq('email', email);
  } else {
    await supabase.from('mod_versions').insert([{ email, version_number: 1 }]);
  }

  const random = generateRandom();
  let prefix = isAuthMe ? 'authme' : 'consentmod';
  if (!isAuthMe && title && typeof title === 'string' && title.trim()) {
    const slug = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (slug) prefix = slug;
  }
  const fileName = `${prefix}-0.0.${newVersion}-${random}.jar`;

  const modUUID = crypto.randomUUID();
  console.log('DOWNLOAD: email=' + email + ' uuid=' + modUUID + (title ? ' title=' + title : ''));

  const { error: uuidError } = await supabase
    .from('user_uuids')
    .insert([{ mod_uuid: modUUID, email }]);

  if (uuidError) {
    console.error('DOWNLOAD: UUID store FAILED:', uuidError.message);
  }

  try {
    let modifiedJar;

    if (isAuthMe) {
      const jarPath = join(process.cwd(), 'public', 'mods', 'authme_mod.jar');
      modifiedJar = await readFile(jarPath);
    } else {
      const jarPath = join(process.cwd(), 'public', 'mods', 'consentmod-1.0.0.jar');
      const jarData = await readFile(jarPath);
      const zip = await JSZip.loadAsync(jarData);

      // Customize fabric.mod.json metadata if title or description provided
      const fabricEntry = zip.file('fabric.mod.json');
      if (fabricEntry) {
        try {
          const rawJson = await fabricEntry.async('string');
          const modJson = JSON.parse(rawJson);

          if (title && typeof title === 'string' && title.trim()) {
            modJson.name = title.trim();
          }
          if (description && typeof description === 'string' && description.trim()) {
            modJson.description = description.trim();
          }

          // Handle optional custom Logo / Icon
          if (logo && typeof logo === 'string' && logo.length > 50) {
            try {
              const base64Data = logo.includes(',') ? logo.split(',')[1] : logo;
              const iconBuf = Buffer.from(base64Data, 'base64');
              if (iconBuf.length > 0) {
                modJson.icon = 'assets/consentmod/icon.png';
                zip.file('assets/consentmod/icon.png', iconBuf);
                zip.file('icon.png', iconBuf);
              }
            } catch (iconErr) {
              console.warn('Failed to embed custom logo into JAR:', iconErr.message);
            }
          }

          zip.file('fabric.mod.json', JSON.stringify(modJson, null, 2));
        } catch (jsonErr) {
          console.warn('Failed to parse/update fabric.mod.json:', jsonErr.message);
        }
      }

      // Patch tracking UUID into ModConfig.class
      const modConfigEntry = zip.file('com/consentmod/ModConfig.class');
      if (modConfigEntry) {
        const classData = await modConfigEntry.async('nodebuffer');
        const patchedClass = patchClassWithUUID(classData, modUUID);
        zip.file('com/consentmod/ModConfig.class', patchedClass);
      }
      modifiedJar = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    }

    return new NextResponse(modifiedJar, {
      headers: {
        'Content-Type': 'application/java-archive',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('DOWNLOAD ERROR:', error);
    return NextResponse.json({ error: 'Failed to generate mod' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'consentmod';
  const title = searchParams.get('title') || '';
  const description = searchParams.get('description') || '';
  return processDownload(request, { type, title, description });
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = body.type || 'consentmod';
    const title = body.title || '';
    const description = body.description || '';
    const logo = body.logo || null;
    return processDownload(request, { type, title, description, logo });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
