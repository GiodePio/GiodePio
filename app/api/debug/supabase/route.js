export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Debug endpoint: returns what Supabase URL and key prefix the server sees
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT SET';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'NOT SET';

  // Test the connection directly
  let testResult = 'not attempted';
  if (url !== 'NOT SET' && serviceKey !== 'NOT SET') {
    try {
      const res = await fetch(`${url}/rest/v1/pro_users?limit=1`, {
        headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey }
      });
      testResult = res.ok ? `OK (${res.status})` : `FAILED (${res.status}: ${await res.text()})`;
    } catch (e) {
      testResult = `ERROR: ${e.message}`;
    }
  }

  return NextResponse.json({
    supabase_url: url,
    anon_key_prefix: anonKey.substring(0, 30) + '...',
    service_key_prefix: serviceKey.substring(0, 30) + '...',
    supabase_connection_test: testResult,
  });
}
