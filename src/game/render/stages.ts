import { STAGE_WIDTH, STAGE_HEIGHT, GROUND_Y } from '../physics/collision';

export interface StageDefinition {
  id: string;
  name: string;
  location: string;
  musicBpm: number;
}

export const STAGES: StageDefinition[] = [
  { id: 'stage_tokyo', name: 'Neo Tokyo Rooftop', location: 'District 09 Skyline', musicBpm: 128 },
  { id: 'stage_alley', name: 'Cyber Alley', location: 'Sector 4 Underground', musicBpm: 120 },
  { id: 'stage_harbor', name: 'Synthwave Harbor', location: 'Neo Bay Container Port', musicBpm: 124 },
];

/**
 * Draws the selected parallax background stage.
 */
export function drawStage(
  ctx: CanvasRenderingContext2D,
  stageId: string,
  cameraX: number
): void {
  ctx.save();

  if (stageId === 'stage_alley') {
    drawCyberAlley(ctx, cameraX);
  } else if (stageId === 'stage_harbor') {
    drawSynthwaveHarbor(ctx, cameraX);
  } else {
    drawNeoTokyoRooftop(ctx, cameraX);
  }

  ctx.restore();
}

/**
 * Stage 1: Neo Tokyo Rooftop
 */
function drawNeoTokyoRooftop(
  ctx: CanvasRenderingContext2D,
  cameraX: number
): void {
  // 1. Dark Cyber Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, STAGE_HEIGHT);
  skyGrad.addColorStop(0, '#050212');
  skyGrad.addColorStop(0.5, '#0b0424');
  skyGrad.addColorStop(0.85, '#190a3a');
  skyGrad.addColorStop(1, '#080318');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

  // 2. Far Skyline (Parallax factor 0.15)
  const farOffset = cameraX * 0.15;
  ctx.fillStyle = '#08051a';
  for (let i = -1; i < 18; i++) {
    const x = i * 85 - (farOffset % 85);
    const height = 180 + Math.sin(i * 1.7) * 90;
    ctx.fillRect(x, 260 - height * 0.5, 75, height + 200);

    // Glowing window dots
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 0, 128, 0.25)';
    for (let w = 0; w < 4; w++) {
      ctx.fillRect(x + 12 + w * 14, 280, 4, 6);
      ctx.fillRect(x + 12 + w * 14, 310, 4, 6);
    }
    ctx.fillStyle = '#08051a';
  }

  // 3. Mid Skyline & Holographic Signs (Parallax factor 0.35)
  const midOffset = cameraX * 0.35;
  for (let i = -1; i < 12; i++) {
    const x = i * 140 - (midOffset % 140);
    const h = 260 + (i % 3) * 60;
    ctx.fillStyle = '#0f082e';
    ctx.fillRect(x, GROUND_Y - h, 110, h);

    // Neon billboards
    if (i % 3 === 0) {
      ctx.save();
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 15, GROUND_Y - h + 30, 80, 40);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.fillRect(x + 15, GROUND_Y - h + 30, 80, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('NEO-TOKYO', x + 20, GROUND_Y - h + 55);
      ctx.restore();
    } else if (i % 3 === 1) {
      ctx.save();
      ctx.shadowColor = '#ff0077';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = '#ff0077';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 20, GROUND_Y - h + 40, 70, 30);
      ctx.fillStyle = '#ff0077';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('KNUCKLES', x + 24, GROUND_Y - h + 60);
      ctx.restore();
    }
  }

  // 4. Rooftop Floor & Neon Reflection Grid
  drawFloor(ctx, '#00f0ff', '#ff0077');
}

/**
 * Stage 2: Cyber Alley
 */
function drawCyberAlley(
  ctx: CanvasRenderingContext2D,
  cameraX: number
): void {
  // Brick gradient
  const alleyGrad = ctx.createLinearGradient(0, 0, 0, STAGE_HEIGHT);
  alleyGrad.addColorStop(0, '#020208');
  alleyGrad.addColorStop(0.7, '#080816');
  alleyGrad.addColorStop(1, '#050510');
  ctx.fillStyle = alleyGrad;
  ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

  const offset = cameraX * 0.3;

  // Overhead industrial pipes & wires
  ctx.strokeStyle = '#181828';
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 80 + i * 35);
    ctx.bezierCurveTo(400, 130 + i * 30, 800, 110 + i * 35, STAGE_WIDTH, 70 + i * 35);
    ctx.stroke();
  }

  // Neon Japanese / Cyber signs on alley walls
  const signs = [
    { text: '電撃 RAMEN', color: '#ffaa00', x: 180, y: 160 },
    { text: 'CYBER BAR', color: '#ff0055', x: 420, y: 130 },
    { text: 'ARCADE 2099', color: '#00f0ff', x: 720, y: 150 },
    { text: '格闘 KLUB', color: '#aa00ff', x: 960, y: 140 },
  ];

  signs.forEach((s) => {
    const sx = s.x - offset;
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(sx, s.y, 110, 48);
    ctx.fillStyle = s.color;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(s.text, sx + 10, s.y + 30);
    ctx.restore();
  });

  // Wet reflective floor with puddle glows
  drawFloor(ctx, '#aa00ff', '#ffaa00');
}

/**
 * Stage 3: Synthwave Harbor
 */
function drawSynthwaveHarbor(
  ctx: CanvasRenderingContext2D,
  cameraX: number
): void {
  // Synthwave twilight gradient
  const harborGrad = ctx.createLinearGradient(0, 0, 0, STAGE_HEIGHT);
  harborGrad.addColorStop(0, '#0d001a');
  harborGrad.addColorStop(0.4, '#260033');
  harborGrad.addColorStop(0.7, '#59004d');
  harborGrad.addColorStop(1, '#110022');
  ctx.fillStyle = harborGrad;
  ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

  const offset = cameraX * 0.2;

  // Giant Synthwave Wireframe Sun on horizon
  const sunX = STAGE_WIDTH * 0.5 - offset * 0.5;
  const sunY = 240;
  const sunRadius = 110;

  ctx.save();
  ctx.shadowColor = '#ff3366';
  ctx.shadowBlur = 30;
  const sunGrad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
  sunGrad.addColorStop(0, '#ffff00');
  sunGrad.addColorStop(0.7, '#ff0066');
  sunGrad.addColorStop(1, '#330033');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI, true);
  ctx.fill();

  // Sun horizontal blind lines
  ctx.fillStyle = '#0d001a';
  for (let s = 0; s < 7; s++) {
    const lineY = sunY - 10 - s * 14;
    ctx.fillRect(sunX - sunRadius - 10, lineY, (sunRadius + 10) * 2, 2.5 + s * 0.6);
  }
  ctx.restore();

  // Distant glowing suspension bridge & cargo cranes
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y - 140);
  ctx.lineTo(STAGE_WIDTH, GROUND_Y - 140);
  ctx.stroke();

  // Bridge suspension cables
  for (let c = 0; c < 10; c++) {
    const cx = c * 130 - offset;
    ctx.beginPath();
    ctx.moveTo(cx, GROUND_Y - 140);
    ctx.lineTo(cx + 65, GROUND_Y - 260);
    ctx.lineTo(cx + 130, GROUND_Y - 140);
    ctx.stroke();
  }
  ctx.restore();

  // Pier deck floor
  drawFloor(ctx, '#ff0077', '#00f0ff');
}

/**
 * Common glowing floor with grid perspective and neon boundary lines.
 */
function drawFloor(
  ctx: CanvasRenderingContext2D,
  primaryColor: string,
  secondaryColor: string
): void {
  // Dark metallic floor base
  const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, STAGE_HEIGHT);
  floorGrad.addColorStop(0, '#0a0a18');
  floorGrad.addColorStop(0.4, '#04040c');
  floorGrad.addColorStop(1, '#010106');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, GROUND_Y, STAGE_WIDTH, STAGE_HEIGHT - GROUND_Y);

  // Ground boundary neon laser line
  ctx.save();
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(STAGE_WIDTH, GROUND_Y);
  ctx.stroke();

  // Perspective floor grid lines
  ctx.shadowBlur = 8;
  ctx.strokeStyle = secondaryColor;
  ctx.lineWidth = 1;
  const gridCount = 20;
  for (let i = 0; i <= gridCount; i++) {
    const xTop = (i / gridCount) * STAGE_WIDTH;
    const xBottom = STAGE_WIDTH * 0.5 + (xTop - STAGE_WIDTH * 0.5) * 1.6;
    ctx.beginPath();
    ctx.moveTo(xTop, GROUND_Y);
    ctx.lineTo(xBottom, STAGE_HEIGHT);
    ctx.stroke();
  }

  // Horizontal scanline bands
  for (let y = GROUND_Y + 15; y < STAGE_HEIGHT; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(STAGE_WIDTH, y);
    ctx.stroke();
  }

  ctx.restore();
}
