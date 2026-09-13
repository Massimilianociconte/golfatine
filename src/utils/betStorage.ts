// Cookie and LocalStorage Persistent Betting Engine for Lo Sdrogo Golfometro
// Synchronized with UserProfile for unified state management

export interface SdrogoBetTicket {
  bettorId: string;
  matchId?: number;
  winnerPick: string;
  hioKingPick: string;
  asinoPick: string;
  scoreRangePick: string;
  stakedPoints: number;
  multiplier?: number;
  potentialPayout?: number;
  status?: 'pending' | 'won' | 'lost' | 'refunded';
  payoutClaimed?: boolean;
  payoutAmount?: number;
  settledAt?: string;
  placedAt: string;
  lastUpdatedAt: string;
}

const STORAGE_KEY = 'sdrogo_golfometro_bet_v1';
const COOKIE_NAME = 'sdrogo_bettor_id';

// Helper to get a cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to set a cookie value for 365 days
function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Generate or retrieve persistent Bettor ID
export function getOrCreateBettorId(): string {
  let bettorId = getCookie(COOKIE_NAME);
  if (!bettorId && typeof window !== 'undefined') {
    try {
      bettorId = localStorage.getItem(COOKIE_NAME);
    } catch {
      bettorId = null;
    }
  }
  if (!bettorId) {
    bettorId = 'bettor_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    setCookie(COOKIE_NAME, bettorId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(COOKIE_NAME, bettorId);
      } catch (e) {
        console.warn('Bettor ID persist failed (storage unavailable)', e);
      }
    }
  } else {
    // Ensure both cookie and localStorage are synchronized
    setCookie(COOKIE_NAME, bettorId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(COOKIE_NAME, bettorId);
      } catch {
        // Non-blocking: cookie remains source of truth
      }
    }
  }
  return bettorId;
}

// Retrieve user's active bet (Checking unified user profile first, fallback to bettorId)
export function getUserBet(): SdrogoBetTicket | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const rawUser = localStorage.getItem('sdrogo_user_profile_v4');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed.placedBets && parsed.placedBets.length > 0) {
        return parsed.placedBets[0];
      }
    }
  } catch (e) {
    // Non-blocking fallback
  }

  const bettorId = getOrCreateBettorId();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${bettorId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read user bet', e);
  }
  return null;
}

// Save or update user's bet in storage
export function saveUserBet(ticket: Omit<SdrogoBetTicket, 'bettorId' | 'lastUpdatedAt'>): SdrogoBetTicket {
  const bettorId = getOrCreateBettorId();
  const existing = getUserBet();
  const now = new Date().toISOString();

  const fullTicket: SdrogoBetTicket = {
    ...ticket,
    bettorId,
    // Preserve the original placedAt only when updating the SAME market;
    // a ticket for a different matchId is a new bet with a fresh timestamp.
    placedAt: existing && existing.matchId === ticket.matchId ? existing.placedAt : now,
    lastUpdatedAt: now,
  };

  try {
    localStorage.setItem(`${STORAGE_KEY}_${bettorId}`, JSON.stringify(fullTicket));
  } catch (e) {
    console.error('Failed to save user bet (storage unavailable or quota exceeded)', e);
    throw new Error('Salvataggio schedina non riuscito: spazio locale esaurito o non disponibile.');
  }

  return fullTicket;
}
