import { Box, HitboxDefinition, HurtboxDefinition, FighterRuntime } from '../types';

export const STAGE_WIDTH = 1200;
export const STAGE_HEIGHT = 700;
export const GROUND_Y = 560;
export const LEFT_WALL = 120;
export const RIGHT_WALL = 1080;

/**
 * Checks if two axis-aligned bounding boxes intersect.
 */
export function aabbIntersect(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Generates the pushbox for a fighter based on position, posture, and stats.
 */
export function getPushbox(f: FighterRuntime): Box {
  const width = 50;
  const height = f.isCrouching ? 75 : 125;
  return {
    x: f.x - width / 2,
    y: f.y - height,
    width,
    height,
  };
}

/**
 * Resolves pushbox collisions so fighters do not walk through each other.
 */
export function resolvePushboxes(p1: FighterRuntime, p2: FighterRuntime): void {
  const b1 = getPushbox(p1);
  const b2 = getPushbox(p2);

  if (aabbIntersect(b1, b2)) {
    const overlapX = (b1.width / 2 + b2.width / 2) - Math.abs(p1.x - p2.x);
    if (overlapX > 0) {
      const pushDirection = p1.x < p2.x ? -1 : 1;
      const pushDist = overlapX / 2;

      p1.x += pushDirection * pushDist;
      p2.x -= pushDirection * pushDist;

      // Clamp both to stage boundaries
      p1.x = Math.max(LEFT_WALL + 30, Math.min(RIGHT_WALL - 30, p1.x));
      p2.x = Math.max(LEFT_WALL + 30, Math.min(RIGHT_WALL - 30, p2.x));
    }
  }
}

/**
 * Returns dynamic hurtboxes for a fighter based on their state, crouch, jump, and facing.
 */
export function getHurtboxes(f: FighterRuntime): HurtboxDefinition[] {
  // During knockdown or full invulnerability, return empty (cannot be hit)
  if (f.state === 'knockdown' || f.invulnerableFrames > 0) {
    return [];
  }

  const boxes: HurtboxDefinition[] = [];

  if (f.isCrouching) {
    // Crouching hurtbox is shorter, ducking high attacks
    boxes.push({
      type: 'head',
      x: f.x - 22,
      y: f.y - 65,
      width: 44,
      height: 25,
    });
    boxes.push({
      type: 'body',
      x: f.x - 26,
      y: f.y - 40,
      width: 52,
      height: 40,
    });
  } else {
    // Standing or jumping
    const totalHeight = 135;
    // Head (top 30px) - vulnerable to High attacks
    boxes.push({
      type: 'head',
      x: f.x - 20,
      y: f.y - totalHeight,
      width: 40,
      height: 32,
    });
    // Body (torso 55px)
    boxes.push({
      type: 'body',
      x: f.x - 25,
      y: f.y - (totalHeight - 32),
      width: 50,
      height: 55,
    });
    // Legs (bottom 48px)
    boxes.push({
      type: 'legs',
      x: f.x - 24,
      y: f.y - 48,
      width: 48,
      height: 48,
    });
  }

  return boxes;
}

/**
 * Calculates the active hitbox for a fighter during their current move.
 */
export function getActiveHitbox(f: FighterRuntime): HitboxDefinition | null {
  if (!f.currentMove) return null;
  const move = f.currentMove;
  const frame = f.frameInMove;

  // Active during [startup, startup + active)
  if (frame < move.startup || frame >= move.startup + move.active) {
    return null;
  }

  // Hitbox offset: [dx, dy, width, height] relative to center/feet
  const offset = move.hitboxOffset || [30, -80, 55, 45];
  const [dx, dy, width, height] = offset;

  // Adjust for facing
  const x = f.facing === 1 ? f.x + dx : f.x - dx - width;
  const y = f.y + dy;

  return {
    id: `${f.id}_${move.id}_${frame}`,
    x,
    y,
    width,
    height,
    damage: move.damage,
    hitLevel: move.hitLevel,
    hitstun: move.hitstun,
    blockstun: move.blockstun,
    launchX: move.launchX,
    launchY: move.launchY,
    isLauncher: move.isLauncher,
    isKnockdown: move.isKnockdown,
  };
}
