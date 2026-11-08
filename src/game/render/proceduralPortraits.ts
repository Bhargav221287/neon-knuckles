import { FighterDefinition } from '../types';

/**
 * Procedurally draws a stylized neon cyber-head portrait of a fighter onto a canvas context.
 */
export function drawProceduralPortrait(
  ctx: CanvasRenderingContext2D,
  def: FighterDefinition,
  width: number,
  height: number,
  isLocked = false
): void {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Background dark gradient
  const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, 10, width * 0.5, height * 0.5, width * 0.7);
  bgGrad.addColorStop(0, isLocked ? '#080810' : '#140c28');
  bgGrad.addColorStop(1, '#030206');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const centerX = width * 0.5;
  const centerY = height * 0.45;
  const scale = width / 120;

  if (isLocked) {
    // Silhouette with question mark
    ctx.fillStyle = '#1e1e2f';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 6 * scale, 28 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#444466';
    ctx.font = `bold ${Math.round(36 * scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', centerX, centerY - 4 * scale);

    ctx.font = `bold ${Math.round(11 * scale)}px sans-serif`;
    ctx.fillText('LOCKED', centerX, height - 16);
    ctx.restore();
    return;
  }

  const sk = def.skeleton;

  // Outer glowing aura
  ctx.save();
  ctx.shadowColor = sk.glowColor;
  ctx.shadowBlur = 20 * scale;

  // Neck
  ctx.fillStyle = '#121224';
  ctx.strokeStyle = sk.secondaryColor;
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.roundRect(centerX - 10 * scale, centerY + 14 * scale, 20 * scale, 25 * scale, 4);
  ctx.fill();
  ctx.stroke();

  // Head contour
  ctx.fillStyle = '#0c0a1a';
  ctx.strokeStyle = sk.primaryColor;
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.arc(centerX, centerY - 8 * scale, 26 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chin / Jawline cyber plating
  ctx.beginPath();
  ctx.moveTo(centerX - 18 * scale, centerY - 2 * scale);
  ctx.lineTo(centerX, centerY + 22 * scale);
  ctx.lineTo(centerX + 18 * scale, centerY - 2 * scale);
  ctx.stroke();

  // Forehead cyber crest / headband
  ctx.strokeStyle = sk.secondaryColor;
  ctx.beginPath();
  ctx.moveTo(centerX - 24 * scale, centerY - 18 * scale);
  ctx.lineTo(centerX, centerY - 26 * scale);
  ctx.lineTo(centerX + 24 * scale, centerY - 18 * scale);
  ctx.stroke();

  // Neon Eyes / Visor
  ctx.shadowColor = sk.eyeColor;
  ctx.shadowBlur = 14 * scale;
  ctx.fillStyle = sk.eyeColor;
  ctx.beginPath();
  ctx.roundRect(centerX - 16 * scale, centerY - 10 * scale, 12 * scale, 4 * scale, 2);
  ctx.roundRect(centerX + 4 * scale, centerY - 10 * scale, 12 * scale, 4 * scale, 2);
  ctx.fill();

  ctx.restore();

  // Name badge at bottom
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(13 * scale)}px monospace`;
  ctx.textAlign = 'center';
  ctx.shadowColor = sk.glowColor;
  ctx.shadowBlur = 8;
  ctx.fillText(def.name.toUpperCase(), centerX, height - 12);

  ctx.restore();
}
