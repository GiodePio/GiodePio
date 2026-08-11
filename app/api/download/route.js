export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request) {
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jarPath = join(process.cwd(), 'public', 'mods', 'consentmod-1.0.0.jar');
    const jarData = await readFile(jarPath);
    const zip = await JSZip.loadAsync(jarData);

    const configContent = user.email;
    zip.file('config.txt', configContent);

    const modifiedJar = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    return new NextResponse(modifiedJar, {
      headers: {
        'Content-Type': 'application/java-archive',
        'Content-Disposition': 'attachment; filename="consentmod-1.0.0.jar"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate mod' }, { status: 500 });
  }
}
