import { beforeEach, describe, expect, it, vi } from 'vitest';

async function freshBet() {
  vi.resetModules();
  return await import('../src/utils/betStorage');
}

function rawStore(): {
  clear: () => void;
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
} {
  return (globalThis as unknown as { localStorage: never }).localStorage as never as {
    clear: () => void;
    getItem: (k: string) => string | null;
    setItem: (k: string, v: string) => void;
  };
}

const ticket = () => ({
  matchId: 62,
  winnerPick: 'Just Rohn',
  hioKingPick: 'Delux',
  asinoPick: 'GaBBo',
  scoreRangePick: 'X2',
  stakedPoints: 100,
  placedAt: new Date().toISOString(),
});

beforeEach(() => {
  rawStore().clear();
  (globalThis as unknown as { document: { cookie: string } }).document.cookie = '';
  vi.resetModules();
});

describe('betStorage', () => {
  it('generates a stable bettor id (cookie + localStorage)', async () => {
    const m = await freshBet();
    const a = m.getOrCreateBettorId();
    const b = m.getOrCreateBettorId();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });

  it('save/get round-trip preserves ticket fields', async () => {
    const m = await freshBet();
    const saved = m.saveUserBet(ticket());
    expect(saved.bettorId).toBe(m.getOrCreateBettorId());
    const loaded = m.getUserBet();
    expect(loaded?.winnerPick).toBe('Just Rohn');
    expect(loaded?.stakedPoints).toBe(100);
    expect(loaded?.matchId).toBe(62);
  });

  it('keeps the original placedAt on updates', async () => {
    const m = await freshBet();
    const first = m.saveUserBet({ ...ticket(), matchId: 1 });
    const second = m.saveUserBet({ ...ticket(), matchId: 1, winnerPick: 'Z', stakedPoints: 20 });
    expect(second.placedAt).toBe(first.placedAt);
    expect(second.winnerPick).toBe('Z');
  });

  it('uses a fresh placedAt when the ticket is for a different match', async () => {
    const m = await freshBet();
    const bettorId = m.getOrCreateBettorId();
    m.saveUserBet({ ...ticket(), matchId: 1 });
    // Backdate the stored ticket so the "fresh timestamp" assertion is deterministic.
    const store = rawStore();
    const key = `sdrogo_golfometro_bet_v1_${bettorId}`;
    const stored = JSON.parse(store.getItem(key) as string);
    stored.placedAt = '2000-01-01T00:00:00.000Z';
    store.setItem(key, JSON.stringify(stored));
    const second = m.saveUserBet({ ...ticket(), matchId: 85 });
    expect(second.matchId).toBe(85);
    expect(second.placedAt).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('returns null when no bet is stored', async () => {
    const m = await freshBet();
    expect(m.getUserBet()).toBeNull();
  });

  it('throws a quota error when storage is unavailable', async () => {
    const m = await freshBet();
    const store = rawStore();
    const orig = store.setItem;
    store.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    try {
      expect(() => m.saveUserBet(ticket())).toThrow(/spazio locale|non riuscito/);
    } finally {
      store.setItem = orig;
    }
  });
});
