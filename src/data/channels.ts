// Mappa verificata Giocatore <-> Canale YouTube di pubblicazione.
//
// I nomi dei canali sono quelli ESATTI di YouTube (verificati via oEmbed su
// tutti gli 89 video al 2026-09-14): il canale di Rohn si chiama "Just Rohn JR"
// e quello di Masseo "oessaM", anche se la lista-golfatine li riporta come
// "Just Rohn" / "ilMasseo".
// Cliccare un giocatore filtra i video PUBBLICATI sul suo canale (match
// esatto sul publisher), mai il testo del titolo.

export const PLAYER_CHANNELS: Record<string, string> = {
  'Just Rohn': 'Just Rohn JR',
  'Delux': 'Delux',
  'nonsonodread': 'Around Dread',
  'ilMasseo': 'oessaM',
  'GaBBo': 'GaBBoDSQ',
  'Mollu': 'Mollu',
  'JTaz': 'JTaz Extra',
};

// Canale -> giocatore proprietario (per avatar e label).
export const CHANNEL_OWNERS: Record<string, string> = Object.fromEntries(
  Object.entries(PLAYER_CHANNELS).map(([player, channel]) => [channel, player]),
);

export const ALL_CHANNELS: string[] = Object.values(PLAYER_CHANNELS);
