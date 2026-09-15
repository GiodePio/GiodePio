import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: grabs, error: errGrabs } = await supabase
    .from('grabs')
    .select('id, minecraft_username, windows_username, pc_name, owner_email, created_at, updated_at')
    .order('created_at', { ascending: false });

  const { data: allRows, error: errAll } = await supabase
    .from('stream_frames')
    .select('*');

  // Check tables
  const { data: testPurchases, error: errPurchases } = await supabase.from('purchases').select('*').limit(1);
  const { data: testPaypal, error: errPaypal } = await supabase.from('paypal_purchases').select('*').limit(1);
  const { data: testRepComments, error: errRepComments } = await supabase.from('rep_comments').select('*').limit(1);
  const { data: testAudit, error: errAudit } = await supabase.from('audit_logs').select('*').limit(1);
  const { data: testProUsers, error: errProUsers } = await supabase.from('pro_users').select('*').limit(5);

  return NextResponse.json({
    now: new Date().toISOString(),
    grabsCount: grabs?.length || 0,
    errGrabs: errGrabs?.message || null,
    streamFramesCount: allRows?.length || 0,
    errAll: errAll?.message || null,
    tables: {
      purchases: { exists: !errPurchases, error: errPurchases?.message, sample: testPurchases },
      paypal_purchases: { exists: !errPaypal, error: errPaypal?.message, sample: testPaypal },
      rep_comments: { exists: !errRepComments, error: errRepComments?.message, sample: testRepComments },
      audit_logs: { exists: !errAudit, error: errAudit?.message, sample: testAudit },
      pro_users: { exists: !errProUsers, error: errProUsers?.message, sample: testProUsers },
    }
  });
}
