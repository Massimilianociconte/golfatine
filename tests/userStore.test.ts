import { beforeEach, describe, expect, it, vi } from 'vitest';

const PROFILE_KEY = 'sdrogo_user_profile_v4';

async function freshStore() {
  vi.resetModules();
  return await import('../src/utils/userStore');
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

beforeEach(() => {
  rawStore().clear();
  vi.resetModules();
});

describe('userStore profile round-trip e guards', () => {
  it('persists and reloads a profile across module reloads', async () => {
    const m1 = await freshStore();
    const p = m1.getLocalUserProfile();
    p.username = 'Test Golfer';
    p.sdrogoPoints = 1234;
    m1.saveUserProfile(p);
    const m2 = await freshStore();
    const reloaded = m2.getLocalUserProfile();
    expect(reloaded.username).toBe('Test Golfer');
    expect(reloaded.sdrogoPoints).toBe(1234);
  });

  it('clamps negative / non-finite balances to safe values', async () => {
    const m = await freshStore();
    const p = m.getLocalUserProfile();
    p.sdrogoPoints = -50;
    p.totalCannucceDonated = NaN;
    m.saveUserProfile(p);
    const m2 = await freshStore();
    const reloaded = m2.getLocalUserProfile();
    expect(Number.isFinite(reloaded.sdrogoPoints)).toBe(true);
    expect(reloaded.sdrogoPoints).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(reloaded.totalCannucceDonated)).toBe(true);
    expect(reloaded.totalCannucceDonated).toBeGreaterThanOrEqual(0);
  });

  it('falls back to the default profile on corrupted storage (with backup)', async () => {
    rawStore().setItem(PROFILE_KEY, '{corrupted-json');
    const m = await freshStore();
    const p = m.getLocalUserProfile();
    expect(p.sdrogoPoints).toBe(1000);
    expect(rawStore().getItem(`${PROFILE_KEY}_corrupt_backup`)).toBe('{corrupted-json');
  });

  it('exposes sane defaults and the watch threshold guard', async () => {
    const m = await freshStore();
    expect(m.DEFAULT_PROFILE.sdrogoPoints).toBe(1000);
    expect(m.REQUIRED_WATCH_SECONDS).toBe(45);
  });
});

describe('placeBetTransaction per-market isolation', () => {
  const ticketFor = (matchId: number, over: Record<string, unknown> = {}) => ({
    matchId,
    winnerPick: 'Just Rohn',
    hioKingPick: 'Delux',
    asinoPick: 'GaBBo',
    scoreRangePick: '50-59 colpi',
    stakedPoints: 100,
    placedAt: new Date().toISOString(),
    ...over,
  });

  it('keeps tickets from different markets separate (no cross-match overwrite)', async () => {
    const m = await freshStore();
    const r1 = m.placeBetTransaction(ticketFor(83));
    expect(r1.success).toBe(true);
    const r2 = m.placeBetTransaction(ticketFor(85));
    expect(r2.success).toBe(true);
    const profile = m.getLocalUserProfile();
    expect(profile.placedBets).toHaveLength(2);
    const ids = profile.placedBets.map((b: { matchId?: number }) => b.matchId).sort();
    expect(ids).toEqual([83, 85]);
  });

  it('updates the same-market ticket in place and preserves its placedAt', async () => {
    const m = await freshStore();
    const first = m.placeBetTransaction(ticketFor(85, { stakedPoints: 100 }));
    expect(first.success).toBe(true);
    const second = m.placeBetTransaction(
      ticketFor(85, { stakedPoints: 150, winnerPick: 'Delux' }),
    );
    expect(second.success).toBe(true);
    const profile = m.getLocalUserProfile();
    expect(profile.placedBets).toHaveLength(1);
    expect(profile.placedBets[0].stakedPoints).toBe(150);
    expect(profile.placedBets[0].placedAt).toBe(first.savedTicket?.placedAt);
  });
});
