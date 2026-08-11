export const dynamic = 'force-dynamic';

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { readFile } from 'fs/promises';
import { join } from 'path';

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

function createBatchInstaller(email, version) {
  return `@echo off
title ConsentMod Installer v0.0.${version}
color 0A
echo ============================================
echo   ConsentMod Auto-Installer v0.0.${version}
echo   Email: ${email}
echo ============================================
echo.
echo Finding Minecraft directory...
set "MC_DIR=%APPDATA%\\.minecraft\\consentmod"
if not exist "%MC_DIR%" (
    echo Creating consentmod folder...
    mkdir "%MC_DIR%"
)
echo Writing config.txt with your email...
echo ${email}> "%MC_DIR%\\config.txt"
echo.
echo ============================================
echo   DONE! config.txt placed at:
echo   %MC_DIR%\\config.txt
echo.
echo   Your email: ${email}
echo   You can now close this window.
echo ============================================
timeout /t 5 >nul
`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

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

  const supabase = getClient();

  const { data: existing } = await supabase
    .from('mod_versions')
    .select('version_number')
    .eq('email', email)
    .single();

  let newVersion = 1;
  if (existing) {
    newVersion = existing.version_number + 1;
    await supabase
      .from('mod_versions')
      .update({ version_number: newVersion, created_at: new Date().toISOString() })
      .eq('email', email);
  } else {
    await supabase
      .from('mod_versions')
      .insert([{ email, version_number: 1 }]);
  }

  const random = generateRandom();
  const fileName = `consentmod-0.0.${newVersion}-${random}.jar`;

  try {
    const jarPath = join(process.cwd(), 'public', 'mods', 'consentmod-1.0.0.jar');
    const jarData = await readFile(jarPath);
    const zip = await JSZip.loadAsync(jarData);

    zip.file('config.txt', email);
    zip.file('INSTALL.bat', createBatchInstaller(email, newVersion));

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
