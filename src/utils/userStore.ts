import type { User } from '@supabase/supabase-js';
import { SdrogoBetTicket, saveUserBet } from './betStorage';
import { UPCOMING_MATCH_FORECAST } from '../data/forecastingData';

// Lazy accessors: @supabase/supabase-js (~55KB, 45.9KB unused on landing)
// stays out of the initial bundle and loads on demand only when cloud
// sync/auth actually runs. All callers are async; guest-only usage never
// fetches the chunk.
const getSupabaseClient = async () => (await import('./supabaseClient')).supabase;
const isCloudConfigured = async () => (await import('./supabaseClient')).isSupabaseConfigured;
const getAuthService = async () => await import('./authService');

export interface UserGaYCard {
  name: string;
  surname: string;
  cardNumber: string; // Unique, permanent non-reusable ID
  customTitle: string;
  membershipType: string;
  favoritePlayer: string;
  createdAt: string;
}

export interface UserWatchSession {
  matchId: number;
  watchSeconds: number;
  requiredSeconds: number;
  isCompleted: boolean;
  completedAt?: string;
  creditsAwarded: boolean;
  lastActiveAt: string;
}

export interface UserDonation {
  id: string;
  donorName: string;
  cannucceAmount: number;
  tierTitle: string;
  donatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  realName?: string;
  email?: string;
  avatarUrl?: string;
  sdrogoPoints: number; // Initial: 1000, constrained >= 0
  totalCannucceDonated: number;
  watchedMatches: number[];
  watchSessions: Record<number, UserWatchSession>;
  donationsHistory: UserDonation[]; // Real user donations only (NO mock data)
  placedBets: SdrogoBetTicket[];
  savedGaYCard?: UserGaYCard;
  unlockedBadges: string[];
  lastActive: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'error' | 'local';

export interface SyncStatusInfo {
  status: SyncStatus;
  isOnline: boolean;
  pendingActionsCount: number;
  lastSyncedAt?: string;
  errorMessage?: string;
  mode?: 'authenticated' | 'guest';
}

export interface OfflineSyncAction {
  id: string; // Idempotency key (UUID)
  type: 'place_bet' | 'complete_watch' | 'donate_cannucce' | 'save_gay_card';
  payload: Record<string, any>;
  createdAt: string;
  retryCount: number;
}

export const STORAGE_USER_KEY = 'sdrogo_user_profile_v4';
export const STORAGE_QUEUE_KEY = 'sdrogo_offline_queue_v1';
export const BALANCE_UPDATED_EVENT = 'sdrogo_balance_updated';
export const PROFILE_UPDATED_EVENT = 'sdrogo_profile_updated';
export const SYNC_STATUS_EVENT = 'sdrogo_sync_status_updated';

// Unique tab identifier to avoid echo loops in cross-tab broadcast
const TAB_ID = typeof window !== 'undefined' 
  ? 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36)
  : 'tab_server';

// Cross-tab BroadcastChannel instance
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('sdrogo_multi_tab_sync_channel');
    syncChannel.onmessage = (event) => {
      const data = event.data;
      if (data && data.sourceTabId !== TAB_ID) {
        if (data.type === 'PROFILE_MUTATED') {
          memoryCachedProfile = null;
          const updatedProfile = getLocalUserProfile();
          notifyLocalEvents(updatedProfile);
        } else if (data.type === 'QUEUE_MUTATED') {
          updateSyncStatus();
        }
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel initialization error:', e);
  }
}

// Fallback to window storage event for browsers without BroadcastChannel or edge cases
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_USER_KEY) {
      memoryCachedProfile = null;
      const updatedProfile = getLocalUserProfile();
      notifyLocalEvents(updatedProfile);
    } else if (event.key === STORAGE_QUEUE_KEY) {
      updateSyncStatus();
    }
  });

  // Online / Offline recovery listeners
  window.addEventListener('online', () => {
    updateSyncStatus();
    flushOfflineQueue();
  });

  window.addEventListener('offline', () => {
    updateSyncStatus({ status: 'offline' });
  });
}

// Default Watch Threshold: 45 seconds of continuous verified playback
export const REQUIRED_WATCH_SECONDS = 45;

export function generateUniqueCardNumber(): string {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const randAlpha = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SDROGO-GAY-${randNum}-${randAlpha}`;
}

export const DEFAULT_PROFILE: UserProfile = {
  id: 'sdrogo_usr_' + Math.random().toString(36).substring(2, 9),
  username: 'Sdrogo Golfer',
  realName: 'Massimiliano Ciconte',
  sdrogoPoints: 1000,
  totalCannucceDonated: 0,
  watchedMatches: [],
  watchSessions: {},
  donationsHistory: [], // Real data only
  placedBets: [],
  unlockedBadges: ['Membro Melagoodo', '1.000 Crediti Iniziali'],
  lastActive: new Date().toISOString(),
};

let memoryCachedProfile: UserProfile | null = null;
let cachedAuthUser: User | null = null;
let activeSyncPromise: Promise<UserProfile | null> | null = null;

let currentSyncStatus: SyncStatusInfo = {
  status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'local',
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingActionsCount: 0,
  lastSyncedAt: new Date().toISOString(),
  mode: 'guest',
};

// Auth listener and session check. Called once on app start (deferred to
// browser idle so the Supabase chunk never blocks first paint). Idempotent.
let authSyncInitialized = false;
export function initAuthSync(): void {
  if (authSyncInitialized || typeof window === 'undefined') return;
  authSyncInitialized = true;

  getAuthService().then(async ({ getSession, onAuthStateChange }) => {
    await getSession().then(async (session) => {
      const user = session?.user ?? null;
      if (user) {
        cachedAuthUser = user;
        updateSyncStatus({ status: 'syncing', mode: 'authenticated' });
        await syncProfileFromSupabase(user);
        await flushOfflineQueue();
      } else {
        updateSyncStatus({ status: 'local', mode: 'guest' });
      }
    }).catch(() => {
      updateSyncStatus({ status: 'local', mode: 'guest' });
    });

    onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      cachedAuthUser = user;
      if (user) {
        updateSyncStatus({ status: 'syncing', mode: 'authenticated' });
        await syncProfileFromSupabase(user);
        await flushOfflineQueue();
      } else {
        updateSyncStatus({ status: 'local', mode: 'guest' });
      }
    });
  }).catch(() => {
    updateSyncStatus({ status: 'local', mode: 'guest' });
  });
}

export function isUserAuthenticated(): boolean {
  return !!cachedAuthUser;
}

export function getAuthUser(): User | null {
  return cachedAuthUser;
}

function notifyLocalEvents(profile: UserProfile): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BALANCE_UPDATED_EVENT, { detail: profile.sdrogoPoints }));
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: profile }));
  }
}

export function notifyBalanceUpdated(): void {
  const profile = getLocalUserProfile();
  notifyLocalEvents(profile);
}

/**
 * Real-time subscribers for React components
 */
export function subscribeToBalanceUpdates(callback: (points: number) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<number>;
    if (typeof customEvent.detail === 'number') {
      callback(customEvent.detail);
    } else {
      callback(getLocalUserProfile().sdrogoPoints);
    }
  };

  window.addEventListener(BALANCE_UPDATED_EVENT, handler);
  return () => {
    window.removeEventListener(BALANCE_UPDATED_EVENT, handler);
  };
}

export function subscribeToUserProfile(callback: (profile: UserProfile) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<UserProfile>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback(getLocalUserProfile());
    }
  };

  window.addEventListener(PROFILE_UPDATED_EVENT, handler);
  return () => {
    window.removeEventListener(PROFILE_UPDATED_EVENT, handler);
  };
}

export function subscribeToSyncStatus(callback: (status: SyncStatusInfo) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<SyncStatusInfo>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback(getSyncStatus());
    }
  };

  window.addEventListener(SYNC_STATUS_EVENT, handler);
  return () => {
    window.removeEventListener(SYNC_STATUS_EVENT, handler);
  };
}

export function getSyncStatus(): SyncStatusInfo {
  const queue = getOfflineQueue();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isAuth = !!cachedAuthUser;
  
  if (!isOnline) {
    currentSyncStatus.status = 'offline';
  } else if (!isAuth) {
    // In Modalità Ospite: status è 'local'
    currentSyncStatus.status = 'local';
  } else if (currentSyncStatus.status === 'syncing') {
    // mantieni syncing
  } else if (currentSyncStatus.status === 'error') {
    // mantieni stato di errore finché non risolto
  } else if (queue.length > 0) {
    currentSyncStatus.status = 'pending';
  } else {
    currentSyncStatus.status = 'synced';
  }
  
  currentSyncStatus.isOnline = isOnline;
  currentSyncStatus.pendingActionsCount = queue.length;
  currentSyncStatus.mode = isAuth ? 'authenticated' : 'guest';
  return { ...currentSyncStatus };
}

function updateSyncStatus(partial?: Partial<SyncStatusInfo>): void {
  const queue = getOfflineQueue();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isAuth = !!cachedAuthUser;

  let targetStatus = partial?.status || currentSyncStatus.status;
  if (!isOnline) {
    targetStatus = 'offline';
  } else if (!isAuth && targetStatus !== 'syncing') {
    targetStatus = 'local';
  } else if (isAuth && targetStatus === 'local') {
    targetStatus = queue.length > 0 ? 'pending' : 'synced';
  }

  currentSyncStatus = {
    ...currentSyncStatus,
    isOnline,
    pendingActionsCount: queue.length,
    mode: isAuth ? 'authenticated' : 'guest',
    ...partial,
    status: targetStatus,
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: currentSyncStatus }));
  }
}

/**
 * Sincronizza integralmente il profilo e tutte le entità collegate da Supabase Cloud:
 * - Tabella `profiles` (punti, username, nome, cannucce, avatar, badge)
 * - Tabella `gay_cards` (GaY Card 3D certificata dell'utente)
 * - Tabella `bets` (schedine giocate e pronostici)
 * - Tabella `donations` (storico donazioni Progetto Gabbiness)
 * - Tabella `watch_sessions` (progresso visione ed episodi convalidati)
 */
export async function syncProfileFromSupabase(targetUser?: User): Promise<UserProfile | null> {
  if (activeSyncPromise) return activeSyncPromise;

  activeSyncPromise = (async () => {
    try {
      if (!(await isCloudConfigured())) {
        updateSyncStatus({ status: 'local', mode: 'guest' });
        return getLocalUserProfile();
      }

      const user = targetUser || cachedAuthUser || (await (await getAuthService()).getCurrentUser());
      if (!user) {
        updateSyncStatus({ status: 'local', mode: 'guest' });
        return getLocalUserProfile();
      }

      cachedAuthUser = user;
      updateSyncStatus({ status: 'syncing', mode: 'authenticated' });

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        updateSyncStatus({
          status: 'offline',
          mode: 'authenticated',
          errorMessage: 'Connessione assente. Modalità offline attiva.',
        });
        return getLocalUserProfile();
      }

      // 1. Recupero o Creazione record profilo su public.profiles
      const supabase = await getSupabaseClient();
      const { data: dbProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Avviso recupero profilo Supabase:', profileError.message);
        const isOffline = profileError.message?.toLowerCase().includes('failed to fetch') ||
                          profileError.message?.toLowerCase().includes('network') ||
                          !navigator.onLine;
        updateSyncStatus({
          status: isOffline ? 'offline' : 'error',
          mode: 'authenticated',
          errorMessage: isOffline 
            ? 'Impossibile contattare il server Cloud. Modalità offline attiva.' 
            : `Errore sincronizzazione profilo: ${profileError.message}`,
        });
        return getLocalUserProfile();
      }

      const localProfile = getLocalUserProfile();

      if (dbProfile) {
        localProfile.id = dbProfile.id || localProfile.id;
        localProfile.username = dbProfile.username || localProfile.username;
        localProfile.realName = dbProfile.real_name || localProfile.realName;
        localProfile.avatarUrl = dbProfile.avatar_url || localProfile.avatarUrl;
        localProfile.email = user.email || localProfile.email;
        localProfile.sdrogoPoints = Number(dbProfile.sdrogo_points ?? localProfile.sdrogoPoints);
        localProfile.totalCannucceDonated = Number(dbProfile.total_cannucce_donated ?? localProfile.totalCannucceDonated);
        if (Array.isArray(dbProfile.unlocked_badges) && dbProfile.unlocked_badges.length > 0) {
          localProfile.unlockedBadges = Array.from(new Set([...localProfile.unlockedBadges, ...dbProfile.unlocked_badges]));
        }
      } else {
        // Record non presente su Cloud: MAI inserire dal client (policy
        // profiles_insert_deny con WITH CHECK (false) — la riga e creata
        // esclusivamente dal trigger su auth.users). Si conserva il profilo
        // locale; le prossime sync agganceranno la riga del trigger.
        localProfile.email = user.email || localProfile.email;
      }

      // user_id canonico: SEMPRE profiles.id quando noto. Mai auth.uid():
      // le FK di gay_cards/bets/donations/watch_sessions referenziano
      // profiles.id, il ramo auth.uid() non matcherebbe mai.
      const targetUserId: string | null = dbProfile?.id || null;

      // 2. Idratazione GaY Card salvata nel cloud
      try {
        if (targetUserId) {
          const { data: cardData } = await supabase
            .from('gay_cards')
            .select('*')
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (cardData) {
            localProfile.savedGaYCard = {
              cardNumber: cardData.card_number,
              name: cardData.name,
              surname: cardData.surname,
              customTitle: cardData.custom_title,
              membershipType: cardData.membership_type || 'Gold Lifetime',
              favoritePlayer: cardData.favorite_player || 'Just Rohn',
              createdAt: cardData.created_at,
            };
            if (!localProfile.unlockedBadges.includes('GaY Card Certificata')) {
              localProfile.unlockedBadges.push('GaY Card Certificata');
            }
          }
        }
      } catch (e) {
        console.warn('Avviso recupero GaY Card da Cloud:', e);
      }

      // 3. Idratazione Schedine / Scommesse piazzate
      try {
        if (targetUserId) {
          const { data: betsData } = await supabase
            .from('bets')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (betsData && betsData.length > 0) {
            const toLocalStatus = (s: string): SdrogoBetTicket['status'] =>
              s === 'won' ? 'won'
              : s === 'lost' ? 'lost'
              : (s === 'void' || s === 'cancelled') ? 'refunded'
              : 'pending';
            localProfile.placedBets = betsData.map(b => ({
              bettorId: b.user_id,
              matchId: b.match_id,
              winnerPick: b.winner_pick,
              hioKingPick: b.hio_king_pick,
              asinoPick: b.asino_pick,
              scoreRangePick: b.score_range_pick,
              stakedPoints: Number(b.staked_points),
              status: toLocalStatus(b.status),
              payoutAmount: Number(b.payout ?? 0),
              placedAt: b.placed_at || b.created_at,
              lastUpdatedAt: b.updated_at || b.placed_at || b.created_at,
            }));
            saveUserBet(localProfile.placedBets[0]);
          }
        }
      } catch (e) {
        console.warn('Avviso recupero Bets da Cloud:', e);
      }

      // 4. Idratazione Storico Donazioni Progetto Gabbiness
      try {
        if (targetUserId) {
          const { data: donationsData } = await supabase
            .from('donations')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false });

          if (donationsData && donationsData.length > 0) {
            localProfile.donationsHistory = donationsData.map(d => ({
              id: d.id,
              donorName: d.donor_name,
              cannucceAmount: Number(d.cannucce_amount),
              tierTitle: d.tier_title,
              donatedAt: d.created_at,
            }));
          }
        }
      } catch (e) {
        console.warn('Avviso recupero Donazioni da Cloud:', e);
      }

      // 5. Idratazione Sessioni di Visione Verificate
      try {
        if (targetUserId) {
          const { data: sessionsData } = await supabase
            .from('watch_sessions')
            .select('*')
            .eq('user_id', targetUserId);

          if (sessionsData && sessionsData.length > 0) {
            sessionsData.forEach(s => {
              localProfile.watchSessions[s.match_id] = {
                matchId: s.match_id,
                watchSeconds: s.watch_seconds,
                requiredSeconds: s.required_seconds,
                isCompleted: s.is_completed,
                creditsAwarded: s.credits_awarded,
                completedAt: s.completed_at || undefined,
                lastActiveAt: s.last_active_at || s.created_at,
              };
              if (s.is_completed && !localProfile.watchedMatches.includes(s.match_id)) {
                localProfile.watchedMatches.push(s.match_id);
              }
            });
          }
        }
      } catch (e) {
        console.warn('Avviso recupero Watch Sessions da Cloud:', e);
      }

      saveUserProfile(localProfile);

      updateSyncStatus({
        status: 'synced',
        mode: 'authenticated',
        lastSyncedAt: new Date().toISOString(),
        errorMessage: undefined,
      });

      return localProfile;
    } catch (err: any) {
      console.warn('Eccezione durante la sincronizzazione profilo con Supabase:', err?.message || err);
      const isOffline = !navigator.onLine || err?.message?.toLowerCase().includes('fetch');
      updateSyncStatus({
        status: isOffline ? 'offline' : 'error',
        mode: 'authenticated',
        errorMessage: isOffline 
          ? 'Connessione persa. Modalità offline attiva.' 
          : `Errore sincronizzazione Cloud: ${err?.message || 'Eccezione sconosciuta'}`,
      });
      return getLocalUserProfile();
    } finally {
      activeSyncPromise = null;
    }
  })();

  return activeSyncPromise;
}

export async function handleUserLogin(user: User): Promise<void> {
  cachedAuthUser = user;
  updateSyncStatus({ status: 'syncing', mode: 'authenticated' });
  await syncProfileFromSupabase(user);
  await flushOfflineQueue();
}

export async function handleUserLogout(): Promise<void> {
  cachedAuthUser = null;
  memoryCachedProfile = null;

  // Reset del profilo locale a un profilo Ospite completamente pulito
  const guestProfile: UserProfile = {
    ...DEFAULT_PROFILE,
    id: 'sdrogo_usr_' + Math.random().toString(36).substring(2, 9),
    lastActive: new Date().toISOString(),
  };

  // Reset coda offline per non re-inviare azioni di altri account
  saveOfflineQueue([]);

  // Reset cookie/localStorage bettor identity
  if (typeof document !== 'undefined') {
    document.cookie = 'sdrogo_bettor_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('sdrogo_bettor_id');
  }

  saveUserProfile(guestProfile);

  updateSyncStatus({
    status: 'local',
    mode: 'guest',
    pendingActionsCount: 0,
    errorMessage: undefined,
  });
}

/**
 * Offline Sync Queue Management
 */
function getOfflineQueue(): OfflineSyncAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read offline queue', e);
    return [];
  }
}

function saveOfflineQueue(queue: OfflineSyncAction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    if (syncChannel) {
      syncChannel.postMessage({ type: 'QUEUE_MUTATED', sourceTabId: TAB_ID });
    }
  } catch (e) {
    console.error('Failed to save offline queue', e);
  }
  updateSyncStatus();
}

function enqueueOfflineAction(type: OfflineSyncAction['type'], payload: Record<string, any>): string {
  const actionId = 'sync_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
  const action: OfflineSyncAction = {
    id: actionId,
    type,
    payload,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  const queue = getOfflineQueue();
  queue.push(action);
  saveOfflineQueue(queue);
  return actionId;
}

let isFlushingQueue = false;

/**
 * Automatic background drain with idempotent Supabase RPC dispatch
 * Solo per utenti autenticati. In modalità ospite i dati restano nel localStorage.
 */
export async function flushOfflineQueue(): Promise<{ processed: number; remaining: number }> {
  if (isFlushingQueue) return { processed: 0, remaining: getOfflineQueue().length };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    updateSyncStatus({ status: 'offline', errorMessage: 'Dispositivo offline: azioni salvate in locale.' });
    return { processed: 0, remaining: getOfflineQueue().length };
  }

  // Verifica se l'utente è autenticato su Supabase
  const user = cachedAuthUser || (await (await getAuthService()).getCurrentUser());
  if (!user) {
    // In Modalità Ospite: NON effettuare chiamate RPC a Supabase che fallirebbero con 401 UNAUTHORIZED
    updateSyncStatus({ status: 'local', mode: 'guest' });
    return { processed: 0, remaining: getOfflineQueue().length };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    updateSyncStatus({ status: 'synced', mode: 'authenticated', lastSyncedAt: new Date().toISOString(), errorMessage: undefined });
    return { processed: 0, remaining: 0 };
  }

  isFlushingQueue = true;
  updateSyncStatus({ status: 'syncing', mode: 'authenticated' });

  let processedCount = 0;
  const succeededActionIds = new Set<string>();
  const failedActionMap = new Map<string, number>();
  let lastSyncError: string | null = null;

  const cloudReady = await isCloudConfigured();
  const supabase = cloudReady ? await getSupabaseClient() : null;

  for (const action of queue) {
    try {
      if (!cloudReady || !supabase) {
        processedCount++;
        succeededActionIds.add(action.id);
        continue;
      }

      let rpcPromise: PromiseLike<any> | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rpc = supabase.rpc.bind(supabase) as (fn: string, args: Record<string, unknown>) => PromiseLike<any>;

      if (action.type === 'place_bet') {
        rpcPromise = rpc('place_user_bet', {
          p_match_id: Number(action.payload.matchId || UPCOMING_MATCH_FORECAST.matchNumber),
          p_winner_pick: String(action.payload.winnerPick || ''),
          p_hio_king_pick: String(action.payload.hioKingPick || ''),
          p_asino_pick: String(action.payload.asinoPick || ''),
          p_score_range_pick: String(action.payload.scoreRangePick || ''),
          p_staked_points: Number(action.payload.stakedPoints || 0),
        });
      } else if (action.type === 'complete_watch') {
        rpcPromise = rpc('complete_watch_session', {
          p_match_id: Number(action.payload.matchId),
          p_watch_seconds: Number(action.payload.watchSeconds || REQUIRED_WATCH_SECONDS),
        });
      } else if (action.type === 'donate_cannucce') {
        rpcPromise = rpc('donate_cannucce_to_gabbiness', {
          p_donor_name: String(action.payload.donorName || ''),
          p_cannucce_amount: Number(action.payload.amount || 0),
        });
      } else if (action.type === 'save_gay_card') {
        rpcPromise = rpc('upsert_user_gay_card', {
          p_card_number: String(action.payload.cardNumber || ''),
          p_name: String(action.payload.name || ''),
          p_surname: String(action.payload.surname || ''),
          p_custom_title: String(action.payload.customTitle || ''),
          p_favorite_player: String(action.payload.favoritePlayer || ''),
        });
      }

      if (rpcPromise) {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout richiesta RPC al server Cloud')), 8000)
        );
        const result: any = await Promise.race([Promise.resolve(rpcPromise), timeoutPromise]);

        if (result?.error) {
          throw new Error(result.error.message || 'Errore esecuzione RPC Supabase');
        }

        // Se l'RPC restituisce punti aggiornati o totale donazioni, aggiorna lo store locale
        const resData = result?.data;
        if (resData && typeof resData === 'object') {
          const localProfile = getLocalUserProfile();
          let profileChanged = false;
          if (typeof resData.remaining_points === 'number') {
            localProfile.sdrogoPoints = resData.remaining_points;
            profileChanged = true;
          } else if (typeof resData.new_balance === 'number') {
            localProfile.sdrogoPoints = resData.new_balance;
            profileChanged = true;
          } else if (typeof resData.total_points === 'number') {
            localProfile.sdrogoPoints = resData.total_points;
            profileChanged = true;
          }
          if (typeof resData.total_donated === 'number') {
            localProfile.totalCannucceDonated = resData.total_donated;
            profileChanged = true;
          }
          if (profileChanged) {
            saveUserProfile(localProfile);
          }
        }
      }

      processedCount++;
      succeededActionIds.add(action.id);
    } catch (err: any) {
      console.warn(`Sync failed for action ${action.id} (${action.type}):`, err?.message || err);
      lastSyncError = err?.message || 'Errore sincronizzazione azione';
      failedActionMap.set(action.id, (action.retryCount || 0) + 1);
    }
  }

  // Atomically preserve items enqueued while flushing was in-flight
  const currentQueue = getOfflineQueue();
  const remainingQueue = currentQueue
    .filter(a => !succeededActionIds.has(a.id))
    .map(a => {
      const newRetry = failedActionMap.get(a.id);
      return newRetry !== undefined ? { ...a, retryCount: newRetry } : a;
    })
    .filter(a => a.retryCount < 5);

  saveOfflineQueue(remainingQueue);
  isFlushingQueue = false;

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  if (remainingQueue.length === 0) {
    updateSyncStatus({
      status: 'synced',
      mode: 'authenticated',
      lastSyncedAt: new Date().toISOString(),
      errorMessage: undefined,
    });
  } else if (isOffline) {
    updateSyncStatus({
      status: 'offline',
      mode: 'authenticated',
      errorMessage: 'Connessione assente: azioni in coda locale.',
    });
  } else {
    updateSyncStatus({
      status: 'pending',
      mode: 'authenticated',
      errorMessage: lastSyncError || `${remainingQueue.length} azioni in attesa di sincronizzazione.`,
    });
  }

  return { processed: processedCount, remaining: remainingQueue.length };
}

/**
 * Local Profile Storage & Multi-Tab Broadcast
 */
export function getLocalUserProfile(): UserProfile {
  if (memoryCachedProfile) return memoryCachedProfile;
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.watchSessions) parsed.watchSessions = {};
      if (!parsed.donationsHistory) parsed.donationsHistory = [];
      if (!parsed.placedBets) parsed.placedBets = [];
      if (parsed.totalCannucceDonated === undefined || !Number.isFinite(parsed.totalCannucceDonated) || parsed.totalCannucceDonated < 0) {
        parsed.totalCannucceDonated = 0;
      } else {
        parsed.totalCannucceDonated = Math.floor(parsed.totalCannucceDonated);
      }
      if (parsed.sdrogoPoints === undefined || !Number.isFinite(parsed.sdrogoPoints) || parsed.sdrogoPoints < 0) {
        parsed.sdrogoPoints = 1000;
      } else {
        parsed.sdrogoPoints = Math.floor(parsed.sdrogoPoints);
      }
      memoryCachedProfile = parsed;
      return parsed;
    }
  } catch (e) {
    console.error('Error loading user profile', e);
    try {
      const rawCorrupt = localStorage.getItem(STORAGE_USER_KEY);
      if (rawCorrupt) localStorage.setItem(`${STORAGE_USER_KEY}_corrupt_backup`, rawCorrupt);
    } catch {
      // ignore backup failure
    }
  }
  memoryCachedProfile = { ...DEFAULT_PROFILE };
  try {
    saveUserProfile(memoryCachedProfile);
  } catch {
    // ignore: storage unavailable, keep in-memory profile
  }
  return memoryCachedProfile;
}

export function saveUserProfile(profile: UserProfile): void {
  // Invariant Guard: balance and donations cannot be negative, NaN, or non-finite
  if (!Number.isFinite(profile.sdrogoPoints) || profile.sdrogoPoints < 0) {
    profile.sdrogoPoints = Math.max(0, Math.floor(Number(profile.sdrogoPoints) || 0));
  } else {
    profile.sdrogoPoints = Math.floor(profile.sdrogoPoints);
  }
  if (!Number.isFinite(profile.totalCannucceDonated) || profile.totalCannucceDonated < 0) {
    profile.totalCannucceDonated = Math.max(0, Math.floor(Number(profile.totalCannucceDonated) || 0));
  } else {
    profile.totalCannucceDonated = Math.floor(profile.totalCannucceDonated);
  }

  memoryCachedProfile = profile;
  if (typeof window === 'undefined') return;
  profile.lastActive = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
    
    // Broadcast mutation to other open tabs
    if (syncChannel) {
      syncChannel.postMessage({
        type: 'PROFILE_MUTATED',
        sourceTabId: TAB_ID,
      });
    }

    notifyLocalEvents(profile);
  } catch (e) {
    console.error('Error saving user profile', e);
  }
}

export interface MatchSettlementResult {
  matchId: number;
  actualWinner: string;
  actualHioKing: string;
  actualAsino: string;
  actualScoreRange: string;
}

/**
 * Atomic Bet Placement & Balance Deduction
 */
export function placeBetTransaction(ticket: Omit<SdrogoBetTicket, 'bettorId' | 'lastUpdatedAt'>): {
  success: boolean;
  message: string;
  newBalance: number;
  savedTicket?: SdrogoBetTicket;
} {
  const profile = getLocalUserProfile();
  const stake = Number(ticket.stakedPoints);

  // Invariant: Stake must be a positive finite integer >= 10
  if (!Number.isFinite(stake) || !Number.isInteger(stake) || stake < 10) {
    return {
      success: false,
      message: 'La puntata minima è di 10 SdrogoPoints (valore intero).',
      newBalance: profile.sdrogoPoints,
    };
  }

  const matchId = ticket.matchId || UPCOMING_MATCH_FORECAST.matchNumber;

  // Find existing bet for same match to calculate stake delta (strict matchId equality:
  // a loose fallback here would overwrite tickets from previous markets).
  const existingBetIndex = profile.placedBets.findIndex(b => b.matchId === matchId);
  
  // Guard: if existing bet has already been resolved / settled, it CANNOT be modified or refunded!
  if (existingBetIndex >= 0) {
    const existingBet = profile.placedBets[existingBetIndex];
    if (existingBet.status && existingBet.status !== 'pending') {
      return {
        success: false,
        message: 'Questa giocata è già stata conclusa e liquidata. Non può più essere modificata.',
        newBalance: profile.sdrogoPoints,
      };
    }
  }

  const existingStake = existingBetIndex >= 0 ? profile.placedBets[existingBetIndex].stakedPoints : 0;
  const stakeDelta = stake - existingStake;

  if (stakeDelta > 0 && profile.sdrogoPoints < stakeDelta) {
    return {
      success: false,
      message: `Saldo crediti insufficiente! Hai ${profile.sdrogoPoints.toLocaleString()} PTS disponibili, ma la giocata richiede ${stakeDelta.toLocaleString()} PTS aggiuntivi.`,
      newBalance: profile.sdrogoPoints,
    };
  }

  // Deduct/adjust balance atomically with non-negative guard
  const targetBalance = profile.sdrogoPoints - stakeDelta;
  if (targetBalance < 0) {
    return {
      success: false,
      message: 'Operazione non consentita: il saldo crediti non può diventare negativo.',
      newBalance: profile.sdrogoPoints,
    };
  }

  profile.sdrogoPoints = Math.max(0, targetBalance);

  const now = new Date().toISOString();
  const fullTicket: SdrogoBetTicket = {
    ...ticket,
    bettorId: profile.id,
    matchId,
    status: 'pending',
    multiplier: ticket.multiplier || 2.45,
    potentialPayout: ticket.potentialPayout || Math.round(stake * (ticket.multiplier || 2.45)),
    placedAt: existingBetIndex >= 0 ? profile.placedBets[existingBetIndex].placedAt : now,
    lastUpdatedAt: now,
  };

  if (existingBetIndex >= 0) {
    profile.placedBets[existingBetIndex] = fullTicket;
  } else {
    profile.placedBets.unshift(fullTicket);
  }

  if (!profile.unlockedBadges.includes('Scommettitore Melagoodo')) {
    profile.unlockedBadges.push('Scommettitore Melagoodo');
  }

  saveUserProfile(profile);

  // Enqueue idempotent offline sync action and attempt flush if authenticated
  enqueueOfflineAction('place_bet', {
    matchId,
    winnerPick: ticket.winnerPick,
    hioKingPick: ticket.hioKingPick,
    asinoPick: ticket.asinoPick,
    scoreRangePick: ticket.scoreRangePick,
    stakedPoints: stake,
  });

  flushOfflineQueue().catch(() => {});

  return {
    success: true,
    message: `Puntata di ${stake.toLocaleString()} PTS registrata con successo! Saldo aggiornato in tempo reale.`,
    newBalance: profile.sdrogoPoints,
    savedTicket: fullTicket,
  };
}

/**
 * Atomic Bet Settlement & Payout Engine (Strict Idempotency Guard)
 * Prevents double-claiming: checks status === 'pending' and payoutClaimed === false.
 */
export function settleBetTransaction(settlement: MatchSettlementResult): {
  success: boolean;
  settled: boolean;
  status: 'won' | 'lost' | 'already_settled' | 'not_found';
  payout: number;
  newBalance: number;
  message: string;
  ticket?: SdrogoBetTicket;
} {
  const profile = getLocalUserProfile();
  const betIndex = profile.placedBets.findIndex(b => (b.matchId === settlement.matchId || (!b.matchId && settlement.matchId === UPCOMING_MATCH_FORECAST.matchNumber)));

  if (betIndex < 0) {
    return {
      success: false,
      settled: false,
      status: 'not_found',
      payout: 0,
      newBalance: profile.sdrogoPoints,
      message: `Nessuna schedina attiva trovata per la Golfatina #${settlement.matchId}.`,
    };
  }

  const bet = profile.placedBets[betIndex];

  // STRICT IDEMPOTENCY: If bet was already resolved or payout was already claimed, DO NOT credit again!
  if (bet.payoutClaimed || (bet.status && bet.status !== 'pending')) {
    return {
      success: false,
      settled: true,
      status: 'already_settled',
      payout: bet.payoutAmount || 0,
      newBalance: profile.sdrogoPoints,
      message: 'Questa giocata è già stata risolta e liquidata in precedenza. Impossibile riscuotere due volte.',
      ticket: bet,
    };
  }

  const isWon = (
    bet.winnerPick.trim().toLowerCase() === settlement.actualWinner.trim().toLowerCase() &&
    bet.hioKingPick.trim().toLowerCase() === settlement.actualHioKing.trim().toLowerCase() &&
    bet.asinoPick.trim().toLowerCase() === settlement.actualAsino.trim().toLowerCase() &&
    bet.scoreRangePick.trim().toLowerCase() === settlement.actualScoreRange.trim().toLowerCase()
  );

  const now = new Date().toISOString();
  let payout = 0;

  if (isWon) {
    payout = Math.round(bet.stakedPoints * (bet.multiplier || 2.45));
    profile.sdrogoPoints += payout;
    bet.status = 'won';
    bet.payoutAmount = payout;
    bet.payoutClaimed = true;
    bet.settledAt = now;
    bet.lastUpdatedAt = now;

    if (!profile.unlockedBadges.includes('Oracolo di Melagoodo')) {
      profile.unlockedBadges.push('Oracolo di Melagoodo');
    }
  } else {
    bet.status = 'lost';
    bet.payoutAmount = 0;
    bet.payoutClaimed = false;
    bet.settledAt = now;
    bet.lastUpdatedAt = now;
  }

  profile.placedBets[betIndex] = bet;
  saveUserProfile(profile);
  try {
    saveUserBet(bet);
  } catch (e) {
    console.warn('Legacy bet mirror persist failed', e);
  }

  return {
    success: true,
    settled: true,
    status: bet.status,
    payout,
    newBalance: profile.sdrogoPoints,
    message: isWon 
      ? `Schedina vincente! Hai incassato ${payout.toLocaleString()} SdrogoPoints!` 
      : `Schedina non vincente per la Golfatina #${settlement.matchId}.`,
    ticket: bet,
  };
}

/**
 * Verified Watch Time Recorder (Anti-Abuse & Idempotency Guard)
 * Idempotently awards +50 virtual credits when reaching REQUIRED_WATCH_SECONDS.
 */
export function recordWatchProgress(
  matchId: number, 
  secondsDelta: number
): { 
  justCompleted: boolean; 
  currentSeconds: number; 
  requiredSeconds: number; 
  isCompleted: boolean; 
  creditsAwarded: boolean;
  totalPoints: number;
} {
  const profile = getLocalUserProfile();
  const isAlreadyWatched = profile.watchedMatches.includes(matchId);
  
  if (!profile.watchSessions[matchId]) {
    profile.watchSessions[matchId] = {
      matchId,
      watchSeconds: isAlreadyWatched ? REQUIRED_WATCH_SECONDS : 0,
      requiredSeconds: REQUIRED_WATCH_SECONDS,
      isCompleted: isAlreadyWatched,
      creditsAwarded: isAlreadyWatched,
      lastActiveAt: new Date().toISOString(),
    };
  }

  const session = profile.watchSessions[matchId];
  const now = Date.now();
  const lastActiveTime = session.lastActiveAt ? new Date(session.lastActiveAt).getTime() : 0;
  const elapsedMs = now - lastActiveTime;

  // Anti-Abuse Rate Limit: reject rapid loop farming / automated scripts
  // Progress can advance at most once every 800ms
  if (lastActiveTime > 0 && elapsedMs < 800 && !session.isCompleted) {
    return {
      justCompleted: false,
      currentSeconds: session.watchSeconds,
      requiredSeconds: session.requiredSeconds,
      isCompleted: session.isCompleted || isAlreadyWatched,
      creditsAwarded: session.creditsAwarded || isAlreadyWatched,
      totalPoints: profile.sdrogoPoints,
    };
  }

  session.lastActiveAt = new Date().toISOString();

  // Bounded increment: maximum 2 seconds per tick
  const boundedDelta = Math.min(2, Math.max(0, Math.floor(secondsDelta)));

  if (!session.isCompleted && !isAlreadyWatched) {
    session.watchSeconds = Math.min(session.requiredSeconds, session.watchSeconds + boundedDelta);
  }

  let justCompleted = false;

  // Strict anti-abuse and idempotency check: only award once per user per match
  if (session.watchSeconds >= session.requiredSeconds && !session.creditsAwarded && !isAlreadyWatched) {
    session.isCompleted = true;
    session.creditsAwarded = true;
    session.completedAt = new Date().toISOString();
    justCompleted = true;

    if (!profile.watchedMatches.includes(matchId)) {
      profile.watchedMatches.push(matchId);
    }

    profile.sdrogoPoints += 50;

    if (profile.watchedMatches.length >= 10 && !profile.unlockedBadges.includes('Maratoneta Golfatine (10+ Episodi)')) {
      profile.unlockedBadges.push('Maratoneta Golfatine (10+ Episodi)');
    }
    if (profile.watchedMatches.length >= 30 && !profile.unlockedBadges.includes('Saggio di Melagoodo (30+ Episodi)')) {
      profile.unlockedBadges.push('Saggio di Melagoodo (30+ Episodi)');
    }

    // Enqueue watch completion sync action
    enqueueOfflineAction('complete_watch', {
      matchId,
      watchSeconds: session.watchSeconds,
    });
    flushOfflineQueue().catch(() => {});
  }

  saveUserProfile(profile);

  return {
    justCompleted,
    currentSeconds: session.watchSeconds,
    requiredSeconds: session.requiredSeconds,
    isCompleted: session.isCompleted || isAlreadyWatched,
    creditsAwarded: session.creditsAwarded || isAlreadyWatched,
    totalPoints: profile.sdrogoPoints,
  };
}

export function getMatchWatchSession(matchId: number): UserWatchSession {
  const profile = getLocalUserProfile();
  return profile.watchSessions[matchId] || {
    matchId,
    watchSeconds: 0,
    requiredSeconds: REQUIRED_WATCH_SECONDS,
    isCompleted: profile.watchedMatches.includes(matchId),
    creditsAwarded: profile.watchedMatches.includes(matchId),
    lastActiveAt: new Date().toISOString(),
  };
}

export function isMatchWatched(matchId: number): boolean {
  const profile = getLocalUserProfile();
  return profile.watchedMatches.includes(matchId);
}

/**
 * Virtual Cannuccia Bianca Donation to "Progetto Gabbiness" (Real Data Only)
 */
export function donateCannucce(
  donorName: string, 
  amount: number
): {
  success: boolean;
  message: string;
  remainingPoints: number;
  totalDonated: number;
  tierTitle: string;
} {
  const profile = getLocalUserProfile();

  // Invariant Guard: amount must be a positive finite integer
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    return {
      success: false,
      message: 'Quantità di Cannucce Bianche non valida. Inserisci un numero intero positivo.',
      remainingPoints: profile.sdrogoPoints,
      totalDonated: profile.totalCannucceDonated,
      tierTitle: '',
    };
  }

  if (profile.sdrogoPoints < amount) {
    return {
      success: false,
      message: `Crediti insufficienti! Hai ${profile.sdrogoPoints} PTS. Guarda altre Golfatine per guadagnare +50 PTS a episodio!`,
      remainingPoints: profile.sdrogoPoints,
      totalDonated: profile.totalCannucceDonated,
      tierTitle: '',
    };
  }

  const targetBalance = profile.sdrogoPoints - amount;
  if (targetBalance < 0) {
    return {
      success: false,
      message: 'Operazione non consentita: il saldo crediti non può diventare negativo.',
      remainingPoints: profile.sdrogoPoints,
      totalDonated: profile.totalCannucceDonated,
      tierTitle: '',
    };
  }

  profile.sdrogoPoints = Math.max(0, targetBalance);
  profile.totalCannucceDonated += amount;

  let tierTitle = 'Pastina di Base';
  if (amount >= 1000) tierTitle = 'Donatore Supremo del Progetto Gabbiness';
  else if (amount >= 500) tierTitle = 'Scudo Tellurico Anti-Cap 14';
  else if (amount >= 100) tierTitle = 'Porzione di 7g di Creatina';
  else if (amount >= 50) tierTitle = 'Cannuccia Bianca d\'Oro';

  const donation: UserDonation = {
    id: 'don_' + Math.random().toString(36).substring(2, 9),
    donorName: (donorName || profile.realName || profile.username).trim(),
    cannucceAmount: amount,
    tierTitle,
    donatedAt: new Date().toISOString(),
  };

  profile.donationsHistory.unshift(donation);

  if (!profile.unlockedBadges.includes('Sostenitore di GaBBo (Progetto Gabbiness)')) {
    profile.unlockedBadges.push('Sostenitore di GaBBo (Progetto Gabbiness)');
  }
  if (profile.totalCannucceDonated >= 1000 && !profile.unlockedBadges.includes('Mecenate della Cannuccia Bianca')) {
    profile.unlockedBadges.push('Mecenate della Cannuccia Bianca');
  }

  saveUserProfile(profile);

  // Enqueue donation sync action
  enqueueOfflineAction('donate_cannucce', {
    donorName: donation.donorName,
    amount,
  });
  flushOfflineQueue().catch(() => {});

  return {
    success: true,
    message: `Grazie per aver donato ${amount} Cannucce Bianche al Progetto Gabbiness!`,
    remainingPoints: profile.sdrogoPoints,
    totalDonated: profile.totalCannucceDonated,
    tierTitle,
  };
}

export function getAllCommunityDonations(): UserDonation[] {
  const profile = getLocalUserProfile();
  // Return ONLY real user donations (NO mock data)
  return [...profile.donationsHistory].sort((a, b) => b.cannucceAmount - a.cannucceAmount);
}

export function saveUserCustomGaYCard(card: UserGaYCard): void {
  const profile = getLocalUserProfile();
  profile.savedGaYCard = card;
  if (!profile.unlockedBadges.includes('GaY Card Certificata')) {
    profile.unlockedBadges.push('GaY Card Certificata');
  }
  saveUserProfile(profile);

  // Enqueue card upsert sync action
  enqueueOfflineAction('save_gay_card', {
    cardNumber: card.cardNumber,
    name: card.name,
    surname: card.surname,
    customTitle: card.customTitle,
    favoritePlayer: card.favoritePlayer,
  });
  flushOfflineQueue().catch(() => {});
}
