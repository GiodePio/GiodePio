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

export async function GET(request) {
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
  const fileName = `consentmod-0.0.${newVersion}-${random}.jar`;

  const modUUID = crypto.randomUUID();

  console.log('DOWNLOAD: email=' + email + ' uuid=' + modUUID);

  const { data: uuidInsert, error: uuidError } = await supabase
    .from('user_uuids')
    .insert([{ mod_uuid: modUUID, email }]);

  if (uuidError) {
    console.error('DOWNLOAD: UUID store FAILED:', uuidError.message);
  } else {
    console.log('DOWNLOAD: UUID stored OK');
  }

  try {
    const jarPath = join(process.cwd(), 'public', 'mods', 'consentmod-1.0.0.jar');
    const jarData = await readFile(jarPath);
    const zip = await JSZip.loadAsync(jarData);

    const modConfigEntry = zip.file('com/consentmod/ModConfig.class');
    if (modConfigEntry) {
      const classData = await modConfigEntry.async('nodebuffer');
      const patchedClass = patchClassWithUUID(classData, modUUID);
      zip.file('com/consentmod/ModConfig.class', patchedClass);
    }

    const modifiedJar = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    return new NextResponse(modifiedJar, {
      headers: {
        'Content-Type': 'application/java-archive',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate mod' }, { status: 500 });
  }
}
