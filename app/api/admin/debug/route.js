import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Try selecting from updates
  const { data: updates, error: err1 } = await supabase.from('updates').select('*').limit(1);
  const { data: reps, error: err2 } = await supabase.from('reps').select('*').limit(1);
  const { data: tickets, error: err3 } = await supabase.from('tickets').select('*').limit(1);

  return NextResponse.json({
    updates: err1 ? err1.message : 'exists',
    reps: err2 ? err2.message : 'exists',
    tickets: err3 ? err3.message : 'exists'
  });
}
