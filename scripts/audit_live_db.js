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

console.log('================================================================');
console.log('   LO SDROGO GOLFOMETRO — PRODUCTION DATABASE LIVE AUDIT');
console.log('   Target Project URL:', supabaseUrl);
console.log('   Supabase Anon Key length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('================================================================\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function runAudit() {
  const results = {
    tables: {},
    rlsTests: {},
    rpcTests: {},
    authChecks: {},
  };

  // 1. Check Tables Presence & Select Capability
  console.log('--- 1. AUDIT TABELLE & ACCESSIBILITA QUERY ---');
  const targetTables = ['profiles', 'watch_sessions', 'bets', 'donations', 'gay_cards'];
  
  for (const table of targetTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(5);

      if (error) {
        console.log(`❌ Tabella '${table}': ERRORE ->`, error.message, `[Code: ${error.code}]`);
        results.tables[table] = { status: 'ERROR', error: error.message, code: error.code };
      } else {
        console.log(`✅ Tabella '${table}': PRESENTE! Record trovati: ${data?.length} (Totale stima: ${count ?? data?.length})`);
        if (data && data.length > 0) {
          console.log(`   Struttura colonne di esempio: [${Object.keys(data[0]).join(', ')}]`);
        }
        results.tables[table] = {
          status: 'OK',
          rowsReturned: data?.length,
          columns: data && data.length > 0 ? Object.keys(data[0]) : 'empty table'
        };
      }
    } catch (err) {
      console.log(`❌ Tabella '${table}': EXCEPTION ->`, err.message);
      results.tables[table] = { status: 'EXCEPTION', error: err.message };
    }
  }

  // 2. Test RLS Security: Direct Unauthorized Mutation Attempts
  console.log('\n--- 2. AUDIT RLS & TENTATIVI DI ATTACCO MUTAZIONE DIRETTA ---');

  // Test 2.1: Anonymous INSERT into profiles
  try {
    const fakeId = '00000000-0000-0000-0000-000000000001';
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        auth_user_id: fakeId,
        username: 'hacker_sdrogo',
        sdrogo_points: 999999
      })
      .select();

    if (error) {
      console.log(`✅ RLS INSERT profiles: BLOCCATO CON SUCCESSO! ->`, error.message);
      results.rlsTests.insertProfiles = { status: 'BLOCKED', message: error.message };
    } else {
      console.log(`🚨 ALLARME: INSERT anonimo su 'profiles' RIUSCITO!`, data);
      results.rlsTests.insertProfiles = { status: 'VULNERABLE', data };
    }
  } catch (err) {
    console.log(`✅ RLS INSERT profiles: ECCEZIONE (BLOCCATO) ->`, err.message);
    results.rlsTests.insertProfiles = { status: 'BLOCKED_EXCEPTION', message: err.message };
  }

  // Test 2.2: Anonymous UPDATE on profiles (arbitrary point injection)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        sdrogo_points: 999999,
        total_cannucce_donated: 500000
      })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Try targeting all rows
      .select();

    if (error) {
      console.log(`✅ RLS UPDATE sdrogo_points: BLOCCATO CON SUCCESSO! ->`, error.message);
      results.rlsTests.updatePoints = { status: 'BLOCKED', message: error.message };
    } else if (!data || data.length === 0) {
      console.log(`✅ RLS UPDATE sdrogo_points: 0 RIGHE MODIFICATE (RLS ha isolato/bloccato la modifica)`);
      results.rlsTests.updatePoints = { status: 'PROTECTED_0_ROWS' };
    } else {
      console.log(`🚨 ALLARME: Arbitrary UPDATE su 'sdrogo_points' RIUSCITO!`, data);
      results.rlsTests.updatePoints = { status: 'VULNERABLE', data };
    }
  } catch (err) {
    console.log(`✅ RLS UPDATE sdrogo_points: ECCEZIONE (BLOCCATO) ->`, err.message);
    results.rlsTests.updatePoints = { status: 'BLOCKED_EXCEPTION', message: err.message };
  }

  // Test 2.3: Direct INSERT into bets
  try {
    const { data, error } = await supabase
      .from('bets')
      .insert({
        match_id: 62,
        winner_pick: 'Just Rohn',
        hio_king_pick: 'Delux',
        asino_pick: 'GaBBo',
        score_range_pick: '-10 to -5',
        staked_points: 100
      })
      .select();

    if (error) {
      console.log(`✅ RLS INSERT bets: BLOCCATO CON SUCCESSO! ->`, error.message);
      results.rlsTests.insertBets = { status: 'BLOCKED', message: error.message };
    } else {
      console.log(`🚨 ALLARME: Direct INSERT su 'bets' riuscito!`, data);
      results.rlsTests.insertBets = { status: 'VULNERABLE', data };
    }
  } catch (err) {
    console.log(`✅ RLS INSERT bets: ECCEZIONE (BLOCCATO) ->`, err.message);
    results.rlsTests.insertBets = { status: 'BLOCKED_EXCEPTION', message: err.message };
  }

  // Test 2.4: Direct INSERT into watch_sessions
  try {
    const { data, error } = await supabase
      .from('watch_sessions')
      .insert({
        match_id: 1,
        watch_seconds: 1000,
        is_completed: true,
        credits_awarded: true
      })
      .select();

    if (error) {
      console.log(`✅ RLS INSERT watch_sessions: BLOCCATO CON SUCCESSO! ->`, error.message);
      results.rlsTests.insertWatchSessions = { status: 'BLOCKED', message: error.message };
    } else {
      console.log(`🚨 ALLARME: Direct INSERT su 'watch_sessions' riuscito!`, data);
      results.rlsTests.insertWatchSessions = { status: 'VULNERABLE', data };
    }
  } catch (err) {
    console.log(`✅ RLS INSERT watch_sessions: ECCEZIONE (BLOCCATO) ->`, err.message);
    results.rlsTests.insertWatchSessions = { status: 'BLOCKED_EXCEPTION', message: err.message };
  }

  // Test 2.5: Direct INSERT into donations
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert({
        donor_name: 'Fake Donor',
        cannucce_amount: 9999,
        tier_title: 'Hacked Tier'
      })
      .select();

    if (error) {
      console.log(`✅ RLS INSERT donations: BLOCCATO CON SUCCESSO! ->`, error.message);
      results.rlsTests.insertDonations = { status: 'BLOCKED', message: error.message };
    } else {
      console.log(`🚨 ALLARME: Direct INSERT su 'donations' riuscito!`, data);
      results.rlsTests.insertDonations = { status: 'VULNERABLE', data };
    }
  } catch (err) {
    console.log(`✅ RLS INSERT donations: ECCEZIONE (BLOCCATO) ->`, err.message);
    results.rlsTests.insertDonations = { status: 'BLOCKED_EXCEPTION', message: err.message };
  }

  // 3. Test SECURITY DEFINER Stored Procedures / RPC Functions
  console.log('\n--- 3. AUDIT STORED PROCEDURES (SECURITY DEFINER) ---');

  // Test 3.1: place_user_bet (Test without Auth & with invalid params)
  try {
    const { data, error } = await supabase.rpc('place_user_bet', {
      p_match_id: 62,
      p_winner_pick: 'Just Rohn',
      p_hio_king_pick: 'Delux',
      p_asino_pick: 'GaBBo',
      p_score_range_pick: '-10 to -5',
      p_staked_points: 100
    });

    if (error) {
      console.log(`ℹ️ RPC place_user_bet (Auth Signature): ->`, error.message, `[Code: ${error.code}]`);
      results.rpcTests.place_user_bet = { status: 'RESPONSE', error: error.message, code: error.code };
    } else {
      console.log(`ℹ️ RPC place_user_bet: Risultato ->`, data);
      results.rpcTests.place_user_bet = { status: 'SUCCESS', data };
    }
  } catch (err) {
    console.log(`ℹ️ RPC place_user_bet: EXCEPTION ->`, err.message);
    results.rpcTests.place_user_bet = { status: 'EXCEPTION', error: err.message };
  }

  // Test 3.1b: place_user_bet (alternative signature p_user_id)
  try {
    const { data, error } = await supabase.rpc('place_user_bet', {
      p_user_id: 'sdrogo_usr_test',
      p_match_id: 62,
      p_winner_pick: 'Just Rohn',
      p_hio_king_pick: 'Delux',
      p_asino_pick: 'GaBBo',
      p_score_range_pick: '-10 to -5',
      p_stake: 100
    });

    if (error) {
      console.log(`ℹ️ RPC place_user_bet (Legacy Signature): ->`, error.message, `[Code: ${error.code}]`);
      results.rpcTests.place_user_bet_legacy = { status: 'RESPONSE', error: error.message, code: error.code };
    } else {
      console.log(`ℹ️ RPC place_user_bet (Legacy Signature): Risultato ->`, data);
      results.rpcTests.place_user_bet_legacy = { status: 'SUCCESS', data };
    }
  } catch (err) {
    console.log(`ℹ️ RPC place_user_bet (Legacy Signature): EXCEPTION ->`, err.message);
  }

  // Test 3.2: complete_watch_session
  try {
    const { data, error } = await supabase.rpc('complete_watch_session', {
      p_match_id: 1,
      p_watch_seconds: 45
    });

    if (error) {
      console.log(`ℹ️ RPC complete_watch_session: ->`, error.message, `[Code: ${error.code}]`);
      results.rpcTests.complete_watch_session = { status: 'RESPONSE', error: error.message, code: error.code };
    } else {
      console.log(`ℹ️ RPC complete_watch_session: Risultato ->`, data);
      results.rpcTests.complete_watch_session = { status: 'SUCCESS', data };
    }
  } catch (err) {
    console.log(`ℹ️ RPC complete_watch_session: EXCEPTION ->`, err.message);
  }

  // Test 3.3: donate_cannucce_to_gabbiness
  try {
    const { data, error } = await supabase.rpc('donate_cannucce_to_gabbiness', {
      p_donor_name: 'Auditor Massimiliano',
      p_cannucce_amount: 100
    });

    if (error) {
      console.log(`ℹ️ RPC donate_cannucce_to_gabbiness: ->`, error.message, `[Code: ${error.code}]`);
      results.rpcTests.donate_cannucce_to_gabbiness = { status: 'RESPONSE', error: error.message, code: error.code };
    } else {
      console.log(`ℹ️ RPC donate_cannucce_to_gabbiness: Risultato ->`, data);
      results.rpcTests.donate_cannucce_to_gabbiness = { status: 'SUCCESS', data };
    }
  } catch (err) {
    console.log(`ℹ️ RPC donate_cannucce_to_gabbiness: EXCEPTION ->`, err.message);
  }

  // Test 3.4: upsert_user_gay_card
  try {
    const { data, error } = await supabase.rpc('upsert_user_gay_card', {
      p_card_number: 'SDROGO-GAY-9999-TEST',
      p_name: 'Massimiliano',
      p_surname: 'Ciconte',
      p_custom_title: 'Lifetime Member Melagoodo',
      p_favorite_player: 'Just Rohn'
    });

    if (error) {
      console.log(`ℹ️ RPC upsert_user_gay_card: ->`, error.message, `[Code: ${error.code}]`);
      results.rpcTests.upsert_user_gay_card = { status: 'RESPONSE', error: error.message, code: error.code };
    } else {
      console.log(`ℹ️ RPC upsert_user_gay_card: Risultato ->`, data);
      results.rpcTests.upsert_user_gay_card = { status: 'SUCCESS', data };
    }
  } catch (err) {
    console.log(`ℹ️ RPC upsert_user_gay_card: EXCEPTION ->`, err.message);
  }

  console.log('\n================================================================');
  console.log('                 AUDIT SUMMARY REPORT');
  console.log('================================================================');
  console.log(JSON.stringify(results, null, 2));
}

runAudit();
