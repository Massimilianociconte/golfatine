// Player Cutout Avatars Registry for Melagoodo
// 64px WebP variants (max display size is 64px): ~90% lighter than 256px originals.

export const PLAYER_AVATARS: Record<string, string> = {
  'Just Rohn': '/avatars/rohn-64.webp',
  'Delux': '/avatars/delux-64.webp',
  'nonsonodread': '/avatars/dread-64.webp',
  'Dread': '/avatars/dread-64.webp',
  'ilMasseo': '/avatars/masseo-64.webp',
  'Masseo': '/avatars/masseo-64.webp',
  'GaBBo': '/avatars/gabbo-64.webp',
  'Mollu': '/avatars/mollu-64.webp',
  'JTaz': '/avatars/jtaz-64.webp',
  'Just Marzaa': '/avatars/marzaa-64.webp',
  'Marzaa': '/avatars/marzaa-64.webp',
  'Yung Chape': '/avatars/chape-64.webp',
  'Chape': '/avatars/chape-64.webp',
  'Fava': '/avatars/fava-64.webp',
};

export function getPlayerAvatar(name: string): string {
  return PLAYER_AVATARS[name] || '/avatars/rohn-64.webp';
}
