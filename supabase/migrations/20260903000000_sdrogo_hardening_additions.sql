-- ============================================================================
-- HARDENING REPO-SIDE (solo repo, MAI cloud diretto, MAI secret nei file)
-- Colonne lette dal client ma assenti nello schema base 20260901:
--  - userStore.ts legge profiles.unlocked_badges (merge badge da cloud)
--  - userStore.ts legge watch_sessions.last_active_at (idrat sync sessioni)
-- Idempotente e additiva: nessun DROP/ALTER di policy o RPC esistenti.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unlocked_badges TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.watch_sessions
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
