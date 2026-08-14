const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('--- Checking pro_users schema (a single row) ---');
  const { data: proUsers } = await supabase.from('pro_users').select('*').limit(1);
  if (proUsers && proUsers.length > 0) {
    const row = proUsers[0];
    for (const key in row) {
      console.log(`${key}: ${typeof row[key]} (${row[key]})`);
    }
  } else {
    console.log('pro_users table is empty or does not exist');
  }
}

run();
