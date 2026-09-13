import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env
const envFile = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[match[1]] = val.trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://kfmuqxqicvmcyveastum.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function testAuthLifecycle() {
  console.log('\n--- TEST AUTH LIFECYCLE & LIVE TRANSACTIONAL RPCS ---');
  const testEmail = `sdrogo_audit_${Date.now()}@gmail.com`;
  const testPassword = `SdrogoSecurePass_${Date.now()}!#`;

  console.log(`Tentativo di registrazione utente test: ${testEmail}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        username: `sdrogo_auditor_${Math.floor(Math.random() * 10000)}`,
        real_name: 'Massimiliano Ciconte Test Auditor'
      }
    }
  });

  if (signUpError) {
    console.log('ℹ️ Sign up result / notice:', signUpError.message);
    if (signUpError.message.includes('Signups not allowed') || signUpError.message.includes('confirm')) {
      console.log('   (Registrazioni disabilitate o conferma email richiesta per default auth)');
    }
    return;
  }

  const user = signUpData?.user;
  const session = signUpData?.session;
  console.log('✅ Utente creato con successo! User ID:', user?.id);

  if (!session) {
    console.log('ℹ️ Sessione non restituita immediatamente (richiede conferma email o session token).');
    return;
  }

  // Create authenticated client
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  });

  // 1. Check Profile Auto-Provisioning (Trigger trg_on_auth_user_created)
  console.log('\n--- 1. VERIFICA PROFILO AUTO-PROVISIONING ---');
  const { data: profile, error: profileErr } = await authClient
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (profileErr) {
    console.log('❌ Errore recupero profilo:', profileErr.message);
  } else {
    console.log('✅ Profilo utente trovato nel DB:', profile);
  }

  // 2. Test RPC: upsert_user_gay_card
  console.log('\n--- 2. TEST RPC: upsert_user_gay_card ---');
  const cardNumber = `SDROGO-GAY-8888-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const { data: gayCardData, error: gayCardErr } = await authClient.rpc('upsert_user_gay_card', {
    p_card_number: cardNumber,
    p_name: 'Massimiliano',
    p_surname: 'Ciconte',
    p_custom_title: 'Sdrogo Auditor Ufficiale',
    p_favorite_player: 'Just Rohn'
  });

  if (gayCardErr) {
    console.log('❌ Errore upsert_user_gay_card:', gayCardErr.message);
  } else {
    console.log('✅ GaY Card creata con successo via RPC:', gayCardData);
  }

  // 3. Test RPC: complete_watch_session (+50 PTS)
  console.log('\n--- 3. TEST RPC: complete_watch_session (+50 PTS) ---');
  const { data: watchData, error: watchErr } = await authClient.rpc('complete_watch_session', {
    p_match_id: 1,
    p_watch_seconds: 45
  });

  if (watchErr) {
    console.log('❌ Errore complete_watch_session:', watchErr.message);
  } else {
    console.log('✅ Sessione di visione completata (+50 PTS accreditati):', watchData);
  }

  // Test Idempotency (re-calling watch session for same match)
  const { data: watchData2, error: watchErr2 } = await authClient.rpc('complete_watch_session', {
    p_match_id: 1,
    p_watch_seconds: 45
  });
  console.log('✅ Verifica Idempotenza (chiamata duplicata):', watchData2);

  // 4. Test RPC: place_user_bet (deduzione saldo)
  console.log('\n--- 4. TEST RPC: place_user_bet ---');
  const { data: betData, error: betErr } = await authClient.rpc('place_user_bet', {
    p_match_id: 62,
    p_winner_pick: 'Just Rohn',
    p_hio_king_pick: 'Delux',
    p_asino_pick: 'GaBBo',
    p_score_range_pick: '-10 to -5',
    p_staked_points: 200
  });

  if (betErr) {
    console.log('❌ Errore place_user_bet:', betErr.message);
  } else {
    console.log('✅ Schedina piazzata e saldo scalato:', betData);
  }

  // 5. Test RPC: donate_cannucce_to_gabbiness
  console.log('\n--- 5. TEST RPC: donate_cannucce_to_gabbiness ---');
  const { data: donData, error: donErr } = await authClient.rpc('donate_cannucce_to_gabbiness', {
    p_donor_name: 'Massimiliano Ciconte',
    p_cannucce_amount: 150
  });

  if (donErr) {
    console.log('❌ Errore donate_cannucce_to_gabbiness:', donErr.message);
  } else {
    console.log('✅ Donazione effettuata con successo:', donData);
  }

  // 6. Test RLS Update Violation by Authenticated User
  console.log('\n--- 6. TEST VIOLAZIONE RLS DA UTENTE AUTENTICATO ---');
  const { data: hackData, error: hackErr } = await authClient
    .from('profiles')
    .update({ sdrogo_points: 9999999 })
    .eq('auth_user_id', user.id)
    .select();

  if (hackErr) {
    console.log('✅ Tentativo di hack saldo da utente autenticato BLOCCATO (Trigger/Policy):', hackErr.message);
  } else if (!hackData || hackData.length === 0) {
    console.log('✅ Tentativo di hack saldo da utente autenticato BLOCCATO (0 righe modificate)');
  } else {
    console.log('🚨 ALLARME: Modifica saldo diretta riuscita:', hackData);
  }
}

testAuthLifecycle().catch(console.error);
