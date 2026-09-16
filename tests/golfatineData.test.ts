import { describe, expect, it } from 'vitest';
import { GLOBAL_SUMMARY, MATCHES_DATA } from '../src/data/golfatineData';
import { UPCOMING_MATCH_FORECAST } from '../src/data/forecastingData';

import { ALL_CHANNELS, CHANNEL_OWNERS, PLAYER_CHANNELS } from '../src/data/channels';

// Nomi publisher ESATTI di YouTube (verificati via oEmbed su tutti i video).
const KNOWN_CHANNELS = new Set([
  'GaBBoDSQ',
  'Delux',
  'Just Rohn JR',
  'Around Dread',
  'oessaM',
  'Mollu',
  'JTaz Extra',
]);

describe('golfatine 62-89 integration', () => {
  it('has 84 scorecards with official numbering (79 merged into 30)', () => {
    const ids = MATCHES_DATA.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(GLOBAL_SUMMARY.totalMatches).toBe(84);
    expect(GLOBAL_SUMMARY.totalVideos).toBe(89);
    expect(GLOBAL_SUMMARY.totalScorecards).toBe(391);
    for (const expected of [62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89]) {
      expect(ids).toContain(expected);
    }
    expect(ids).not.toContain(79);
  });

  it('has no duplicate videos (youtubeId unique)', () => {
    const ytIds = MATCHES_DATA.map((m) => m.youtubeId);
    expect(new Set(ytIds).size).toBe(ytIds.length);
  });

  it('attributes every video to its publisher channel (never title-derived)', () => {
    for (const m of MATCHES_DATA) {
      expect(m.channel).toBeTruthy();
      expect(KNOWN_CHANNELS.has(m.channel)).toBe(true);
    }
    // Spot checks: publisher differs from names mentioned in the title.
    const byId = new Map(MATCHES_DATA.map((m) => [m.id, m]));
    expect(byId.get(62)?.channel).toBe('JTaz Extra');
    expect(byId.get(66)?.channel).toBe('Just Rohn JR');
    expect(byId.get(70)?.channel).toBe('GaBBoDSQ');
    expect(byId.get(71)?.channel).toBe('Around Dread');
    expect(byId.get(72)?.channel).toBe('Delux');
    expect(byId.get(80)?.channel).toBe('oessaM');
    expect(byId.get(30)?.channel).toBe('Delux');
    expect(byId.get(83)?.channel).toBe('Just Rohn JR');
    expect(byId.get(84)?.channel).toBe('Delux');
    expect(byId.get(85)?.channel).toBe('Around Dread');
    expect(byId.get(86)?.channel).toBe('GaBBoDSQ');
  });

  it('has full scorecards for 83-84-87-88-89 (no video-only left)', () => {
    const byId = new Map(MATCHES_DATA.map((m) => [m.id, m]));
    for (const vid of [83, 84, 87, 88, 89]) {
      const m = byId.get(vid)!;
      expect(m.hasScorecard).not.toBe(false);
      expect(m.players.length).toBeGreaterThan(0);
      expect(m.totalPar).toBeGreaterThan(0);
    }
    expect(byId.get(87)?.channel).toBe('Just Rohn JR');
    expect(byId.get(88)?.channel).toBe('Mollu');
    expect(byId.get(89)?.channel).toBe('JTaz Extra');
  });

  it('maps every player to exactly one publisher channel and vice versa', () => {
    // Ogni canale nei dati esiste nella mappa e ogni canale mappa a un giocatore.
    const dataChannels = new Set(MATCHES_DATA.map((m) => m.channel));
    expect(dataChannels).toEqual(new Set(ALL_CHANNELS));
    for (const channel of ALL_CHANNELS) {
      expect(CHANNEL_OWNERS[channel]).toBeTruthy();
    }
    // La mappa e' biunivoca: nessun canale condiviso tra due giocatori.
    expect(Object.keys(CHANNEL_OWNERS)).toHaveLength(Object.keys(PLAYER_CHANNELS).length);
    // Filtro per canale: ogni video del canale ha SOLO quel publisher.
    for (const channel of ALL_CHANNELS) {
      const vids = MATCHES_DATA.filter((m) => m.channel === channel);
      expect(vids.length).toBeGreaterThan(0);
      expect(vids.every((m) => m.channel === channel)).toBe(true);
    }
  });

  it('keeps new scorecards internally consistent', () => {
    for (const m of MATCHES_DATA.filter((x) => x.id >= 62 && x.hasScorecard !== false && x.players.length > 0)) {
      for (const p of m.players) {
        const played = p.holes.filter((h): h is number => h !== null);
        expect(played.length).toBeGreaterThan(0);
        expect(played.every((h) => h >= 1)).toBe(true);
        expect(played.reduce((a, b) => a + b, 0)).toBe(p.totalScore);
        expect(p.totalScore - m.totalPar).toBe(p.diffPar);
      }
      expect(m.players.some((p) => p.position === 1)).toBe(true);
    }
  });
});

describe('timesfm forecast on full dataset', () => {
  it('forecasts match #90 for the 7 main players with coherent probabilities', () => {
    expect(UPCOMING_MATCH_FORECAST.matchNumber).toBe(90);
    expect(UPCOMING_MATCH_FORECAST.modelEngine).toContain('TimesFM');
    expect(UPCOMING_MATCH_FORECAST.playersForecast).toHaveLength(7);
    const probSum = UPCOMING_MATCH_FORECAST.playersForecast.reduce(
      (a, p) => a + p.winProbabilityPercent,
      0,
    );
    expect(probSum).toBeGreaterThan(99);
    expect(probSum).toBeLessThan(101);
    for (const p of UPCOMING_MATCH_FORECAST.playersForecast) {
      expect(p.q10DiffPar).toBeLessThanOrEqual(p.predictedDiffPar);
      expect(p.q90DiffPar).toBeGreaterThanOrEqual(p.predictedDiffPar);
      expect(p.predictedHoles).toHaveLength(18);
    }
  });
});
