-- ============================================================================
-- LO SDROGO GOLFOMETRO - SUPABASE & POSTGRESQL PRODUCTION MIGRATION
-- Database Architect & Security Audit Migration
-- Version: 1.0.0
-- Date: 2026-09-01
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE
-- Core user entity linked directly to Supabase auth.users with balance guard.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    real_name TEXT,
    avatar_url TEXT,
    sdrogo_points BIGINT NOT NULL DEFAULT 1000,
    total_cannucce_donated BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Invariants & Security Constraints
    CONSTRAINT chk_profiles_username_len CHECK (char_length(trim(username)) >= 3 AND char_length(username) <= 50),
    CONSTRAINT chk_profiles_sdrogo_points_non_negative CHECK (sdrogo_points >= 0),
    CONSTRAINT chk_profiles_donated_non_negative CHECK (total_cannucce_donated >= 0)
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_sdrogo_points ON public.profiles(sdrogo_points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_donated ON public.profiles(total_cannucce_donated DESC);

-- ============================================================================
-- 2. WATCH_SESSIONS TABLE
-- Idempotent video watch session tracker (+50 PTS verification gate)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.watch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL,
    watch_seconds INTEGER NOT NULL DEFAULT 0,
    required_seconds INTEGER NOT NULL DEFAULT 45,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    credits_awarded BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Invariants & Constraints
    CONSTRAINT uq_watch_sessions_user_match UNIQUE (user_id, match_id),
    CONSTRAINT chk_watch_sessions_match_id_positive CHECK (match_id > 0),
    CONSTRAINT chk_watch_sessions_watch_sec_non_negative CHECK (watch_seconds >= 0),
    CONSTRAINT chk_watch_sessions_req_sec_positive CHECK (required_seconds > 0)
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_watch_sessions_user_id ON public.watch_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_match_id ON public.watch_sessions(match_id);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_user_match ON public.watch_sessions(user_id, match_id);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_credits_awarded ON public.watch_sessions(user_id, credits_awarded);

-- ============================================================================
-- 3. BETS TABLE
-- Persistent betting tickets for Golfatine forecasting
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL,
    winner_pick TEXT NOT NULL,
    hio_king_pick TEXT NOT NULL,
    asino_pick TEXT NOT NULL,
    score_range_pick TEXT NOT NULL,
    staked_points INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payout NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Invariants & Constraints
    CONSTRAINT uq_bets_user_match UNIQUE (user_id, match_id),
    CONSTRAINT chk_bets_match_id_positive CHECK (match_id > 0),
    CONSTRAINT chk_bets_staked_points_positive CHECK (staked_points > 0),
    CONSTRAINT chk_bets_status_valid CHECK (status IN ('pending', 'won', 'lost', 'void', 'cancelled')),
    CONSTRAINT chk_bets_payout_non_negative CHECK (payout >= 0)
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON public.bets(match_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON public.bets(status);
CREATE INDEX IF NOT EXISTS idx_bets_user_match ON public.bets(user_id, match_id);

-- ============================================================================
-- 4. DONATIONS TABLE
-- Progetto Gabbiness real community donation ledger
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    donor_name TEXT NOT NULL,
    cannucce_amount INTEGER NOT NULL,
    tier_title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Invariants & Constraints
    CONSTRAINT chk_donations_donor_name_non_empty CHECK (char_length(trim(donor_name)) > 0),
    CONSTRAINT chk_donations_amount_positive CHECK (cannucce_amount > 0)
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_cannucce_amount ON public.donations(cannucce_amount DESC);

-- ============================================================================
-- 5. GAY_CARDS TABLE
-- Personalized 3D Melagoodo community membership card with non-reusable serial ID
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.gay_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    custom_title TEXT NOT NULL DEFAULT 'Lifetime Member Melagoodo',
    favorite_player TEXT NOT NULL,
    membership_type TEXT NOT NULL DEFAULT 'Gold Lifetime',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Invariants & Constraints
    CONSTRAINT chk_gay_cards_name_non_empty CHECK (char_length(trim(name)) > 0),
    CONSTRAINT chk_gay_cards_surname_non_empty CHECK (char_length(trim(surname)) > 0),
    CONSTRAINT chk_gay_cards_card_number_format CHECK (card_number ~ '^SDROGO-GAY-[0-9]{4}-[A-Z0-9]+$')
);

-- Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_gay_cards_user_id ON public.gay_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_gay_cards_card_number ON public.gay_cards(card_number);

-- ============================================================================
-- 6. AUTOMATED TIMESTAMP UPDATE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_watch_sessions_updated_at ON public.watch_sessions;
CREATE TRIGGER trg_watch_sessions_updated_at
BEFORE UPDATE ON public.watch_sessions
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_bets_updated_at ON public.bets;
CREATE TRIGGER trg_bets_updated_at
BEFORE UPDATE ON public.bets
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_gay_cards_updated_at ON public.gay_cards;
CREATE TRIGGER trg_gay_cards_updated_at
BEFORE UPDATE ON public.gay_cards
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================================
-- 7. BALANCE PROTECTION TRIGGER (ZERO TRUST ENFORCEMENT)
-- Prevents clients from updating sdrogo_points or total_cannucce_donated directly.
-- Balance alterations MUST be executed through trusted SECURITY DEFINER functions.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_protect_profile_balances()
RETURNS TRIGGER AS $$
DECLARE
    v_is_authorized_rpc TEXT;
BEGIN
    -- Check if the update is happening inside an authorized security definer context
    v_is_authorized_rpc := current_setting('sdrogo.authorized_balance_mutation', true);

    IF (OLD.sdrogo_points IS DISTINCT FROM NEW.sdrogo_points OR
        OLD.total_cannucce_donated IS DISTINCT FROM NEW.total_cannucce_donated) THEN
        
        IF v_is_authorized_rpc IS NULL OR v_is_authorized_rpc <> 'active' THEN
            RAISE EXCEPTION 'SICUREZZA VIOLATA: Il saldo sdrogo_points e le cannucce possono essere alterati ESCLUSIVAMENTE tramite Stored Procedures ufficiali (place_user_bet, complete_watch_session, donate_cannucce_to_gabbiness).';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_profile_balances ON public.profiles;
CREATE TRIGGER trg_protect_profile_balances
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_protect_profile_balances();

-- Revoke direct column update permissions from public roles
REVOKE UPDATE (sdrogo_points, total_cannucce_donated) ON public.profiles FROM anon, authenticated;
GRANT UPDATE (username, real_name, avatar_url) ON public.profiles TO authenticated;

-- ============================================================================
-- 8. AUTH TRIGGER: AUTO-PROVISION NEW USER PROFILE
-- Automatically creates 1,000 SdrogoPoints upon Supabase signup.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
    v_real_name TEXT;
BEGIN
    -- Extract username and real name from user metadata or fallback
    v_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1),
        'sdrogo_' || substr(replace(NEW.id::text, '-', ''), 1, 8)
    );

    v_real_name := COALESCE(
        NEW.raw_user_meta_data->>'real_name',
        NEW.raw_user_meta_data->>'full_name',
        'Sdrogo Golfer'
    );

    -- Ensure unique username fallback if collision occurs
    IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
        v_username := v_username || '_' || substr(replace(NEW.id::text, '-', ''), 1, 4);
    END IF;

    -- Authorize initial balance provision
    PERFORM set_config('sdrogo.authorized_balance_mutation', 'active', true);

    INSERT INTO public.profiles (
        auth_user_id,
        username,
        real_name,
        avatar_url,
        sdrogo_points,
        total_cannucce_donated
    ) VALUES (
        NEW.id,
        v_username,
        v_real_name,
        NEW.raw_user_meta_data->>'avatar_url',
        1000,
        0
    );

    PERFORM set_config('sdrogo.authorized_balance_mutation', 'off', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_auth_user();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gay_cards ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
-- 1. Read: Users can view their own full profile; public community view allowed for leaderboards
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated, anon
USING (true);

-- 2. Update: Users can only update their own non-financial profile fields
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- 3. Insert: Direct insert by client is forbidden (managed exclusively via auth trigger)
CREATE POLICY "profiles_insert_deny"
ON public.profiles FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- 4. Delete: Forbidden from client
CREATE POLICY "profiles_delete_deny"
ON public.profiles FOR DELETE
TO authenticated, anon
USING (false);

-- ----------------------------------------------------------------------------
-- WATCH_SESSIONS POLICIES
-- ----------------------------------------------------------------------------
-- 1. Read: Authenticated user can view only their own watch sessions
CREATE POLICY "watch_sessions_select_own"
ON public.watch_sessions FOR SELECT
TO authenticated
USING (user_id = (SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()));

-- 2. Insert/Update: Prevent arbitrary client modification; must use complete_watch_session RPC
CREATE POLICY "watch_sessions_insert_deny"
ON public.watch_sessions FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "watch_sessions_update_deny"
ON public.watch_sessions FOR UPDATE
TO authenticated, anon
USING (false);

-- ----------------------------------------------------------------------------
-- BETS POLICIES
-- ----------------------------------------------------------------------------
-- 1. Read: Authenticated user can view only their own betting tickets
CREATE POLICY "bets_select_own"
ON public.bets FOR SELECT
TO authenticated
USING (user_id = (SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()));

-- 2. Insert/Update: Direct client insert blocked; must use place_user_bet RPC
CREATE POLICY "bets_insert_deny"
ON public.bets FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "bets_update_deny"
ON public.bets FOR UPDATE
TO authenticated, anon
USING (false);

-- ----------------------------------------------------------------------------
-- DONATIONS POLICIES
-- ----------------------------------------------------------------------------
-- 1. Read: Public can view real community donations feed (Albo d'Oro)
CREATE POLICY "donations_select_public"
ON public.donations FOR SELECT
TO authenticated, anon
USING (true);

-- 2. Insert/Update: Direct insert blocked; must use donate_cannucce_to_gabbiness RPC
CREATE POLICY "donations_insert_deny"
ON public.donations FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- ----------------------------------------------------------------------------
-- GAY_CARDS POLICIES
-- ----------------------------------------------------------------------------
-- 1. Read: Public can view custom GaY Cards or own card
CREATE POLICY "gay_cards_select"
ON public.gay_cards FOR SELECT
TO authenticated, anon
USING (true);

-- 2. Insert: User can create their own GaY Card
CREATE POLICY "gay_cards_insert_own"
ON public.gay_cards FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()));

-- 3. Update: User can customize their own GaY Card
CREATE POLICY "gay_cards_update_own"
ON public.gay_cards FOR UPDATE
TO authenticated
USING (user_id = (SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()))
WITH CHECK (user_id = (SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()));

-- ============================================================================
-- 10. ATOMIC STORED PROCEDURES / RPC FUNCTIONS (SECURITY DEFINER)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RPC 1: place_user_bet
-- Atomic balance check, transactional row lock, point deduction, ticket placement
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_user_bet(
    p_match_id INTEGER,
    p_winner_pick TEXT,
    p_hio_king_pick TEXT,
    p_asino_pick TEXT,
    p_score_range_pick TEXT,
    p_staked_points INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_uid UUID;
    v_profile_id UUID;
    v_current_points BIGINT;
    v_existing_bet_id UUID;
    v_existing_stake INTEGER := 0;
    v_stake_diff INTEGER;
    v_new_points BIGINT;
    v_bet_id UUID;
BEGIN
    -- 1. Validate Authentication
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: È necessario effettuare il login per piazzare una giocata.';
    END IF;

    -- 2. Validate Input Parameters
    IF p_match_id <= 0 THEN
        RAISE EXCEPTION 'INVALID_INPUT: ID del match non valido.';
    END IF;

    IF p_staked_points <= 0 THEN
        RAISE EXCEPTION 'INVALID_INPUT: La puntata deve essere maggiore di 0 SdrogoPoints.';
    END IF;

    IF trim(COALESCE(p_winner_pick, '')) = '' OR
       trim(COALESCE(p_hio_king_pick, '')) = '' OR
       trim(COALESCE(p_asino_pick, '')) = '' OR
       trim(COALESCE(p_score_range_pick, '')) = '' THEN
        RAISE EXCEPTION 'INVALID_INPUT: Tutti i 4 pronostici della schedina sono obbligatori.';
    END IF;

    -- 3. Transactional Row Lock on User Profile
    SELECT id, sdrogo_points 
    INTO v_profile_id, v_current_points
    FROM public.profiles
    WHERE auth_user_id = v_auth_uid
    FOR UPDATE;

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'PROFILE_NOT_FOUND: Profilo utente non trovato.';
    END IF;

    -- 4. Check for Existing Bet on This Match
    SELECT id, staked_points
    INTO v_existing_bet_id, v_existing_stake
    FROM public.bets
    WHERE user_id = v_profile_id AND match_id = p_match_id
    FOR UPDATE;

    IF v_existing_bet_id IS NOT NULL THEN
        -- Adjusting existing bet
        v_stake_diff := p_staked_points - v_existing_stake;
        
        IF v_stake_diff > 0 AND v_current_points < v_stake_diff THEN
            RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Crediti insufficienti per aumentare la puntata. Saldo attuale: % PTS, Richiesti aggiuntivi: % PTS.', 
                v_current_points, v_stake_diff;
        END IF;

        v_new_points := v_current_points - v_stake_diff;

        -- Authorize and perform balance update
        PERFORM set_config('sdrogo.authorized_balance_mutation', 'active', true);
        UPDATE public.profiles
        SET sdrogo_points = v_new_points
        WHERE id = v_profile_id;
        PERFORM set_config('sdrogo.authorized_balance_mutation', 'off', true);

        -- Update the Bet Ticket
        UPDATE public.bets
        SET winner_pick = p_winner_pick,
            hio_king_pick = p_hio_king_pick,
            asino_pick = p_asino_pick,
            score_range_pick = p_score_range_pick,
            staked_points = p_staked_points,
            status = 'pending',
            updated_at = now()
        WHERE id = v_existing_bet_id
        RETURNING id INTO v_bet_id;

    ELSE
        -- Placing brand new bet
        IF v_current_points < p_staked_points THEN
            RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Crediti insufficienti. Saldo attuale: % PTS, Puntata: % PTS.', 
                v_current_points, p_staked_points;
        END IF;

        v_new_points := v_current_points - p_staked_points;

        -- Authorize and perform balance update
        PERFORM set_config('sdrogo.authorized_balance_mutation', 'active', true);
        UPDATE public.profiles
        SET sdrogo_points = v_new_points
        WHERE id = v_profile_id;
        PERFORM set_config('sdrogo.authorized_balance_mutation', 'off', true);

        -- Insert Bet Ticket
        INSERT INTO public.bets (
            user_id,
            match_id,
            winner_pick,
            hio_king_pick,
            asino_pick,
            score_range_pick,
            staked_points,
            status
        ) VALUES (
            v_profile_id,
            p_match_id,
            p_winner_pick,
            p_hio_king_pick,
            p_asino_pick,
            p_score_range_pick,
            p_staked_points,
            'pending'
        )
        RETURNING id INTO v_bet_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'bet_id', v_bet_id,
        'match_id', p_match_id,
        'staked_points', p_staked_points,
        'previous_points', v_current_points,
        'remaining_points', v_new_points,
        'message', 'Schedina piazzata con successo nel registro ufficiale di Melagoodo!'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 2: complete_watch_session
-- Verified watch progress check with strictly idempotent +50 PTS reward
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_watch_session(
    p_match_id INTEGER,
    p_watch_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_uid UUID;
    v_profile_id UUID;
    v_current_points BIGINT;
    v_session_id UUID;
    v_existing_sec INTEGER := 0;
    v_required_sec INTEGER := 45;
    v_is_completed BOOLEAN := false;
    v_credits_awarded BOOLEAN := false;
    v_new_points BIGINT;
    v_points_awarded INTEGER := 0;
    v_just_completed BOOLEAN := false;
BEGIN
    -- 1. Validate Authentication
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: È necessario effettuare il login per registrare il tempo di visione.';
    END IF;

    IF p_match_id <= 0 OR p_watch_seconds < 0 THEN
        RAISE EXCEPTION 'INVALID_INPUT: Parametri sessione video non validi.';
    END IF;

    -- 2. Transactional Lock on Profile
    SELECT id, sdrogo_points 
    INTO v_profile_id, v_current_points
    FROM public.profiles
    WHERE auth_user_id = v_auth_uid
    FOR UPDATE;

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'PROFILE_NOT_FOUND: Profilo utente non trovato.';
    END IF;

    -- 3. Lock or Insert Watch Session
    SELECT id, watch_seconds, required_seconds, is_completed, credits_awarded
    INTO v_session_id, v_existing_sec, v_required_sec, v_is_completed, v_credits_awarded
    FROM public.watch_sessions
    WHERE user_id = v_profile_id AND match_id = p_match_id
    FOR UPDATE;

    IF v_session_id IS NULL THEN
        -- Create initial session
        INSERT INTO public.watch_sessions (
            user_id,
            match_id,
            watch_seconds,
            required_seconds,
            is_completed,
            credits_awarded
        ) VALUES (
            v_profile_id,
            p_match_id,
            LEAST(v_required_sec, p_watch_seconds),
            v_required_sec,
            (p_watch_seconds >= v_required_sec),
            false
        )
        RETURNING id, watch_seconds, required_seconds, is_completed, credits_awarded
        INTO v_session_id, v_existing_sec, v_required_sec, v_is_completed, v_credits_awarded;
    END IF;

    -- 4. Idempotency Check: Already awarded credits
    IF v_credits_awarded THEN
        RETURN jsonb_build_object(
            'success', true,
            'match_id', p_match_id,
            'is_completed', true,
            'credits_awarded', false,
            'already_rewarded', true,
            'points_added', 0,
            'total_points', v_current_points,
            'message', 'Episodio già convalidato in precedenza (+50 PTS già accreditati).'
        );
    END IF;

    -- 5. Calculate Watch Progression
    v_existing_sec := LEAST(v_required_sec, GREATEST(v_existing_sec, p_watch_seconds));

    -- Check if threshold reached
    IF v_existing_sec >= v_required_sec THEN
        v_is_completed := true;
        v_credits_awarded := true;
        v_points_awarded := 50;
        v_just_completed := true;
        v_new_points := v_current_points + 50;

        -- Authorize and perform balance increment
        PERFORM set_config('sdrogo.authorized_balance_mutation', 'active', true);
        UPDATE public.profiles
        SET sdrogo_points = v_new_points
        WHERE id = v_profile_id;
        PERFORM set_config('sdrogo.authorized_balance_mutation', 'off', true);

        UPDATE public.watch_sessions
        SET watch_seconds = v_existing_sec,
            is_completed = true,
            credits_awarded = true,
            completed_at = now()
        WHERE id = v_session_id;

    ELSE
        -- Incremental progress without threshold crossing
        v_new_points := v_current_points;
        UPDATE public.watch_sessions
        SET watch_seconds = v_existing_sec
        WHERE id = v_session_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'match_id', p_match_id,
        'is_completed', v_is_completed,
        'credits_awarded', v_just_completed,
        'already_rewarded', false,
        'points_added', v_points_awarded,
        'current_watch_seconds', v_existing_sec,
        'required_watch_seconds', v_required_sec,
        'total_points', v_new_points,
        'message', CASE 
            WHEN v_just_completed THEN 'Visione verificata! Hai ricevuto +50 SdrogoPoints!' 
            ELSE 'Progresso di visione salvato.' 
        END
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 3: donate_cannucce_to_gabbiness
-- Atomic balance check, point deduction, donation ledger record, tier assignment
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.donate_cannucce_to_gabbiness(
    p_donor_name TEXT,
    p_cannucce_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_uid UUID;
    v_profile_id UUID;
    v_current_points BIGINT;
    v_current_donated BIGINT;
    v_donor_display TEXT;
    v_tier_title TEXT;
    v_new_points BIGINT;
    v_new_donated BIGINT;
    v_donation_id UUID;
BEGIN
    -- 1. Validate Authentication
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: È necessario effettuare il login per effettuare una donazione.';
    END IF;

    -- 2. Validate Amount
    IF p_cannucce_amount <= 0 THEN
        RAISE EXCEPTION 'INVALID_INPUT: La quantità di Cannucce Bianche da donare deve essere maggiore di 0.';
    END IF;

    -- 3. Transactional Lock on Profile
    SELECT id, sdrogo_points, total_cannucce_donated, COALESCE(real_name, username)
    INTO v_profile_id, v_current_points, v_current_donated, v_donor_display
    FROM public.profiles
    WHERE auth_user_id = v_auth_uid
    FOR UPDATE;

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'PROFILE_NOT_FOUND: Profilo utente non trovato.';
    END IF;

    -- 4. Check Balance
    IF v_current_points < p_cannucce_amount THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Crediti insufficienti! Hai % PTS disponibili. Guarda altre Golfatine per guadagnare +50 PTS a episodio!', v_current_points;
    END IF;

    -- 5. Determine Tier Title
    IF p_cannucce_amount >= 1000 THEN
        v_tier_title := 'Donatore Supremo del Progetto Gabbiness';
    ELSIF p_cannucce_amount >= 500 THEN
        v_tier_title := 'Scudo Tellurico Anti-Cap 14';
    ELSIF p_cannucce_amount >= 100 THEN
        v_tier_title := 'Porzione di 7g di Creatina';
    ELSIF p_cannucce_amount >= 50 THEN
        v_tier_title := 'Cannuccia Bianca d''Oro';
    ELSE
        v_tier_title := 'Pastina di Base';
    END IF;

    v_donor_display := COALESCE(NULLIF(trim(p_donor_name), ''), v_donor_display, 'Anonimo Sdrogo');
    v_new_points := v_current_points - p_cannucce_amount;
    v_new_donated := v_current_donated + p_cannucce_amount;

    -- 6. Authorize and Execute Balance Updates
    PERFORM set_config('sdrogo.authorized_balance_mutation', 'active', true);
    UPDATE public.profiles
    SET sdrogo_points = v_new_points,
        total_cannucce_donated = v_new_donated
    WHERE id = v_profile_id;
    PERFORM set_config('sdrogo.authorized_balance_mutation', 'off', true);

    -- 7. Insert Donation Record
    INSERT INTO public.donations (
        user_id,
        donor_name,
        cannucce_amount,
        tier_title
    ) VALUES (
        v_profile_id,
        v_donor_display,
        p_cannucce_amount,
        v_tier_title
    )
    RETURNING id INTO v_donation_id;

    RETURN jsonb_build_object(
        'success', true,
        'donation_id', v_donation_id,
        'donor_name', v_donor_display,
        'cannucce_amount', p_cannucce_amount,
        'tier_title', v_tier_title,
        'remaining_points', v_new_points,
        'total_donated', v_new_donated,
        'message', format('Grazie per aver donato %s Cannucce Bianche al Progetto Gabbiness!', p_cannucce_amount)
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC 4: upsert_user_gay_card
-- Securely saves or updates the user's customized GaY card
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_user_gay_card(
    p_card_number TEXT,
    p_name TEXT,
    p_surname TEXT,
    p_custom_title TEXT,
    p_favorite_player TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_auth_uid UUID;
    v_profile_id UUID;
    v_card_id UUID;
BEGIN
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Login necessario per registrare la GaY Card.';
    END IF;

    SELECT id INTO v_profile_id FROM public.profiles WHERE auth_user_id = v_auth_uid FOR UPDATE;
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'PROFILE_NOT_FOUND: Profilo utente non trovato.';
    END IF;

    IF trim(COALESCE(p_name, '')) = '' OR trim(COALESCE(p_surname, '')) = '' THEN
        RAISE EXCEPTION 'INVALID_INPUT: Nome e Cognome sono obbligatori.';
    END IF;

    INSERT INTO public.gay_cards (
        user_id,
        card_number,
        name,
        surname,
        custom_title,
        favorite_player,
        membership_type
    ) VALUES (
        v_profile_id,
        p_card_number,
        p_name,
        p_surname,
        COALESCE(p_custom_title, 'Lifetime Member Melagoodo'),
        COALESCE(p_favorite_player, 'Just Rohn'),
        'Gold Lifetime'
    )
    ON CONFLICT (user_id) DO UPDATE
    SET name = EXCLUDED.name,
        surname = EXCLUDED.surname,
        custom_title = EXCLUDED.custom_title,
        favorite_player = EXCLUDED.favorite_player,
        updated_at = now()
    RETURNING id INTO v_card_id;

    RETURN jsonb_build_object(
        'success', true,
        'card_id', v_card_id,
        'card_number', p_card_number,
        'message', 'GaY Card salvata e registrata con successo nel database Supabase!'
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- Grant Execute Permissions to Authenticated Users
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.place_user_bet(INTEGER, TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_watch_session(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.donate_cannucce_to_gabbiness(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_user_gay_card(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- AUDIT CHECK SUMMARY & COMPLETION
-- ============================================================================
COMMENT ON TABLE public.profiles IS 'User master profile with strictly protected sdrogo_points and cannucce balances.';
COMMENT ON TABLE public.watch_sessions IS 'Watch progression logs preventing multi-claim exploits (+50 PTS threshold).';
COMMENT ON TABLE public.bets IS 'Community betting slips with atomic balance subtraction.';
COMMENT ON TABLE public.donations IS 'Verified Progetto Gabbiness donation ledger.';
COMMENT ON TABLE public.gay_cards IS 'Unique non-reusable Melagoodo GaY Cards.';
