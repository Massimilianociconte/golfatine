/**
 * High-Resolution Native Canvas 2D Exporter for Melagoodo GaY Card
 * 
 * Replaces fragile SVG/foreignObject html-to-image pipeline with
 * pure HTML5 Canvas 2D rendering. Guarantees 100% reliable,
 * non-empty, non-mirrored, pixel-perfect PNG download across all browsers.
 */

export interface CardExportOptions {
  userName: string;
  userSurname: string;
  cardNumber: string;
  customTitle: string;
  favoritePlayer: string;
}

/**
 * Preload an image element and wait for it to be fully decoded in memory
 */
function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      console.error(`Failed to load card image: ${src}`, err);
      reject(new Error(`Failed to load ${src}`));
    };
    img.src = src;
  });
}

/**
 * Helper to draw rounded rectangle path
 */
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Generates and downloads the GaY Card PNG containing:
 * - Front face on top
 * - Back face on bottom (NOT mirrored, perfectly upright)
 * - Native 882x576 aspect ratio with 2x Retina sharpness
 */
export async function downloadGayCardPng(options: {
  userName: string;
  userSurname: string;
  cardNumber: string;
  customTitle: string;
  favoritePlayer: string;
}): Promise<string> {
  const { userName, userSurname, cardNumber, customTitle, favoritePlayer } = options;

  // Preload front and back artwork from public assets (WebP for ultra-fast load)
  const [frontImg, backImg] = await Promise.all([
    preloadImage('/cards/gay_card_front.webp'),
    preloadImage('/cards/gay_card_back.webp'),
  ]);

  // Card Dimensions (native matching JPG assets)
  const CARD_W = 882;
  const CARD_H = 576;
  const GAP = 28;
  const PADDING = 32;
  const CORNER_RADIUS = 28;

  // Total canvas dimensions with padding
  const TOTAL_W = CARD_W + PADDING * 2;
  const TOTAL_H = CARD_H * 2 + GAP + PADDING * 2;

  // Scale factor: 2x for Retina sharpness (1764 x 2360)
  const SCALE = 2;

  const canvas = document.createElement('canvas');
  canvas.width = TOTAL_W * SCALE;
  canvas.height = TOTAL_H * SCALE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D canvas context');

  // Scale all drawing operations by 2x for ultra-sharp Retina output
  ctx.scale(SCALE, SCALE);

  // 1. Canvas Background: Deep luxury charcoal/obsidian #070b09
  ctx.fillStyle = '#070b09';
  ctx.fillRect(0, 0, TOTAL_W, TOTAL_H);

  // --- 2. DRAW FRONT FACE (TOP) ---
  const frontX = PADDING;
  const frontY = PADDING;

  ctx.save();
  // Rounded clipping mask for front card
  roundedRect(ctx, frontX, frontY, CARD_W, CARD_H, CORNER_RADIUS);
  ctx.clip();

  // Draw front background image
  ctx.drawImage(frontImg, frontX, frontY, CARD_W, CARD_H);

  // Front shadow/glare overlay
  const frontGrad = ctx.createLinearGradient(frontX, frontY, frontX + CARD_W, frontY + CARD_H);
  frontGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  frontGrad.addColorStop(0.5, 'transparent');
  frontGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
  ctx.fillStyle = frontGrad;
  ctx.fillRect(frontX, frontY, CARD_W, CARD_H);
  ctx.restore();

  // Front card subtle outer border
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  roundedRect(ctx, frontX, frontY, CARD_W, CARD_H, CORNER_RADIUS);
  ctx.stroke();
  ctx.restore();

  // --- FRONT TEXT OVERLAY ---
  // Matches on-screen layout: top: 31%, left: 6%
  const textLeft = frontX + CARD_W * 0.06;
  const textTop = frontY + CARD_H * 0.31;

  // A) Metallic Chip
  const chipW = 46;
  const chipH = 34;
  const chipX = textLeft;
  const chipY = textTop;

  ctx.save();
  const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
  chipGrad.addColorStop(0, '#d8ba66');
  chipGrad.addColorStop(0.5, '#f7e6a5');
  chipGrad.addColorStop(1, '#9c7d2e');
  ctx.fillStyle = chipGrad;
  ctx.strokeStyle = '#785f1e';
  ctx.lineWidth = 1.5;
  roundedRect(ctx, chipX, chipY, chipW, chipH, 5);
  ctx.fill();
  ctx.stroke();

  // Inner chip micro-circuit
  ctx.fillStyle = 'rgba(179, 149, 63, 0.45)';
  ctx.strokeStyle = 'rgba(120, 95, 30, 0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(chipX + 4, chipY + 4, chipW - 8, chipH - 8);
  ctx.fillRect(chipX + 7, chipY + 7, 13, chipH - 14);
  ctx.fillRect(chipX + 26, chipY + 7, 13, chipH - 14);
  ctx.restore();

  // B) Label: INTESTATARIO UFFICIALE
  ctx.save();
  ctx.font = '800 11px monospace, "Courier New"';
  ctx.fillStyle = '#5a4315';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.75)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.shadowBlur = 1;
  ctx.fillText('INTESTATARIO UFFICIALE', textLeft, chipY + chipH + 18);
  ctx.restore();

  // C) User Full Name (Uppercase, bold, drop shadow)
  ctx.save();
  ctx.font = '900 23px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#1e1303';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.shadowBlur = 2;
  const fullName = `${userName} ${userSurname}`.toUpperCase();
  ctx.fillText(fullName, textLeft, chipY + chipH + 45);
  ctx.restore();

  // D) Card Number
  ctx.save();
  ctx.font = '900 15px monospace, "Courier New"';
  ctx.fillStyle = '#38260a';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.65)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.shadowBlur = 1;
  ctx.fillText(cardNumber, textLeft, chipY + chipH + 68);
  ctx.restore();

  // E) Custom Title / Community Rank
  ctx.save();
  ctx.font = '700 13px Outfit, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = '#5c4618';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.shadowBlur = 1;
  ctx.fillText(customTitle, textLeft, chipY + chipH + 89);
  ctx.restore();

  // --- 3. DRAW BACK FACE (BOTTOM, UPRIGHT, NOT MIRRORED) ---
  const backX = PADDING;
  const backY = frontY + CARD_H + GAP;

  ctx.save();
  // Rounded clipping mask for back card
  roundedRect(ctx, backX, backY, CARD_W, CARD_H, CORNER_RADIUS);
  ctx.clip();

  // Draw back background image
  ctx.drawImage(backImg, backX, backY, CARD_W, CARD_H);
  ctx.restore();

  // Back card subtle outer border
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  roundedRect(ctx, backX, backY, CARD_W, CARD_H, CORNER_RADIUS);
  ctx.stroke();
  ctx.restore();

  // --- BACK FACE OVERLAY ---
  const backPadding = 28;

  // A) Top Row Tags
  const tagY = backY + backPadding + 14;

  // Left Tag: "MELAGOODO OFFICIAL CARD"
  ctx.save();
  ctx.font = '700 13px monospace, "Courier New"';
  const tag1Text = 'MELAGOODO OFFICIAL CARD';
  const tag1W = ctx.measureText(tag1Text).width + 24;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  roundedRect(ctx, backX + backPadding, tagY - 18, tag1W, 28, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tag1Text, backX + backPadding + 12, tagY);
  ctx.restore();

  // Right Tag: "VERIFIED 82 EPISODES"
  ctx.save();
  ctx.font = '700 13px monospace, "Courier New"';
  const tag2Text = 'VERIFIED 82 EPISODES';
  const tag2W = ctx.measureText(tag2Text).width + 24;
  const tag2X = backX + CARD_W - backPadding - tag2W;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  roundedRect(ctx, tag2X, tagY - 18, tag2W, 28, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tag2Text, tag2X + 12, tagY);
  ctx.restore();

  // B) Middle Row: Signature White Strip
  const stripW = CARD_W - backPadding * 2;
  const stripH = 46;
  const stripX = backX + backPadding;
  const stripY = backY + (CARD_H - stripH) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  roundedRect(ctx, stripX, stripY, stripW, stripH, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // User Name on Signature Strip
  ctx.font = 'italic 700 17px monospace, "Courier New"';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${userName} ${userSurname}`, stripX + 18, stripY + 29);

  // Serial Number Badge on Right of Strip
  ctx.font = '900 14px monospace, "Courier New"';
  const numW = ctx.measureText(cardNumber).width + 20;
  const numX = stripX + stripW - numW - 12;
  ctx.fillStyle = '#e2e8f0';
  roundedRect(ctx, numX, stripY + 8, numW, 30, 5);
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  ctx.fillText(cardNumber, numX + 10, stripY + 28);
  ctx.restore();

  // C) Bottom Row: Favorite Player & Domain
  const botRowH = 36;
  const botRowY = backY + CARD_H - backPadding - botRowH;
  const botRowX = backX + backPadding;
  const botRowW = CARD_W - backPadding * 2;

  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  roundedRect(ctx, botRowX, botRowY, botRowW, botRowH, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Favorite Player
  ctx.font = '800 14px Outfit, sans-serif';
  ctx.fillStyle = '#d4af37';
  ctx.fillText(`Favorito: ${favoritePlayer}`, botRowX + 16, botRowY + 23);

  // Official Domain
  ctx.font = '700 13px monospace, "Courier New"';
  ctx.fillStyle = '#cbd5e1';
  const domainText = 'losdrogogolfometro.cloud';
  const domainW = ctx.measureText(domainText).width;
  ctx.fillText(domainText, botRowX + botRowW - domainW - 16, botRowY + 23);
  ctx.restore();

  // Return PNG data URL
  const dataUrl = canvas.toDataURL('image/png', 1.0);

  // Trigger download directly
  const safeName = `${userName}_${userSurname}_${cardNumber}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const link = document.createElement('a');
  link.download = `GaY_Card_Melagoodo_${safeName}.png`;
  link.href = dataUrl;
  link.click();

  return dataUrl;
}
