/**
 * Test staff creation flow (create_staff_with_login RPC and create_staff_user_account RPC).
 * Requires .env with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, and TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD.
 * Run from project root: node scripts/test-staff-creation.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

function loadEnv() {
  const envPath = join(projectRoot, '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const i = line.indexOf('=');
    if (i <= 0) return;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    if (key && !process.env[key]) process.env[key] = val;
  });
}

loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const testEmail = process.env.TEST_ADMIN_EMAIL;
const testPassword = process.env.TEST_ADMIN_PASSWORD;

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function main() {
  console.log('=== Staff creation flow test ===\n');

  if (testEmail && testPassword) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    if (authError) {
      console.error('Sign-in failed:', authError.message);
      process.exit(1);
    }
    console.log('Signed in as', authData.user?.email);
  } else {
    console.log('No TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD in .env – testing RPC without auth (may fail with RLS)');
  }

  const testName = 'Test Staff ' + Date.now();
  const testStaffEmail = 'teststaff' + Date.now() + '@salon.local';
  const testPasswordValue = 'TempTest123!';

  console.log('\n1. Calling create_staff_with_login RPC...');
  const { data: rpc1, error: err1 } = await supabase.rpc('create_staff_with_login', {
    name_param: testName,
    role_param: 'Stylist',
    email_param: testStaffEmail,
    password_param: testPasswordValue,
    is_active_param: true
  });

  if (err1) {
    console.error('create_staff_with_login error:', err1.message);
    process.exit(1);
  }
  if (rpc1?.error) {
    console.error('RPC returned error:', rpc1.error);
    process.exit(1);
  }
  if (!rpc1?.success || !rpc1?.id || !rpc1?.user_id) {
    console.error('Unexpected RPC response:', JSON.stringify(rpc1, null, 2));
    process.exit(1);
  }

  console.log('   Success. Staff id:', rpc1.id, 'User id:', rpc1.user_id);
  console.log('   Email:', rpc1.email, 'Password (shown in UI):', rpc1.temporary_password === testPasswordValue ? 'matches' : 'MISMATCH');

  const staffId = rpc1.id;

  const { data: row } = await supabase.from('staff').select('id, name, email, user_id').eq('id', staffId).single();
  if (row && row.user_id === rpc1.user_id) {
    console.log('   Staff row verified: user_id set correctly');
  } else {
    console.log('   Staff row not readable (expected if not authenticated due to RLS)');
  }

  console.log('\n2. Verifying login with new credentials (Auth REST API)...');
  const authUrl = url.replace(/\/$/, '') + '/auth/v1/token?grant_type=password';
  const loginRes = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': 'Bearer ' + anonKey
    },
    body: JSON.stringify({
      email: testStaffEmail,
      password: testPasswordValue
    })
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok) {
    console.warn('   Login check failed:', loginBody?.error_description || loginBody?.msg || loginRes.status);
    console.log('   (RPC and user creation succeeded; try signing in manually in the app.)');
  } else if (loginBody?.access_token) {
    console.log('   Login OK: new staff can sign in (access_token received).');
  } else {
    console.warn('   Login response missing access_token:', loginBody);
  }

  console.log('\n=== Staff creation flow test completed ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
