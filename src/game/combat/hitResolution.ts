import { FighterRuntime, GameState, Particle, FlyText } from '../types';
import { aabbIntersect, getActiveHitbox, getHurtboxes } from '../physics/collision';
import { DIFFICULTY_CONFIGS } from '../difficulty';

/**
 * Calculates juggle damage scaling based on number of consecutive air hits.
 * Hit 1: 100%, Hit 2: 80%, Hit 3: 60%, Hit 4: 40%, Hit 5+: 20% floor.
 */
export function getJuggleDamageScale(juggleHits: number): number {
  if (juggleHits <= 1) return 1.0;
  if (juggleHits === 2) return 0.8;
  if (juggleHits === 3) return 0.6;
  if (juggleHits === 4) return 0.4;
  return 0.2; // 20% floor
}

/**
 * Checks whether an incoming attack can be blocked given the defender's blocking stance and hit level.
 * High: standing block succeeds, ducking ducks/whiffs.
 * Mid: standing or crouching block succeeds.
 * Low: crouching block succeeds, standing block FAILS.
 */
export function canBlockAttack(defender: FighterRuntime, hitLevel: 'high' | 'mid' | 'low'): boolean {
  if (!defender.isBlocking) return false;

  if (hitLevel === 'low') {
    // Low attacks MUST be crouch-blocked!
    return defender.isCrouching;
  }

  if (hitLevel === 'high') {
    // High attacks blocked standing; if crouching, it might miss hurtbox entirely or crouch block
    return !defender.isCrouching || defender.isBlocking;
  }

  // Mid attacks can be blocked standing or crouching
  return true;
}

/**
 * Resolves hit and block interactions between an attacker and defender.
 */
export function resolveHits(
  state: GameState,
  attacker: FighterRuntime,
  defender: FighterRuntime,
  isAttackerAI: boolean
): void {
  // If attacker has no active hitbox or already connected on this move, skip
  if (attacker.hasHitOpponent) return;

  const hitbox = getActiveHitbox(attacker);
  if (!hitbox) return;

  // Defender cannot be hit if invincible or knocked down
  if (defender.state === 'knockdown' || defender.invulnerableFrames > 0) return;

  // Sidestep evasion: if defender is actively sidestepping (z != 0), linear strikes whiff
  if (defender.isSidestepping && !attacker.currentMove?.isUltimate) {
    return;
  }

  const hurtboxes = getHurtboxes(defender);
  let hasIntersected = false;
  let impactX = defender.x;
  let impactY = defender.y - 60;

  for (const hurtbox of hurtboxes) {
    // If High attack and defender is crouching, hurtbox won't intersect because crouch hurtbox is low
    if (aabbIntersect(hitbox, hurtbox)) {
      hasIntersected = true;
      impactX = (hitbox.x + hurtbox.x + Math.min(hitbox.width, hurtbox.width)) / 2;
      impactY = (hitbox.y + hurtbox.y + Math.min(hitbox.height, hurtbox.height)) / 2;
      break;
    }
  }

  if (!hasIntersected) return;

  // Mark attacker as having connected so it doesn't multi-hit on adjacent frames
  attacker.hasHitOpponent = true;

  // 1. Ultimate Hit Resolution
  if (attacker.currentMove?.isUltimate) {
    // Ultimates CANNOT be blocked! Counterplay: whiffs if airborne, jumping, or sidestepping
    if (!defender.isGrounded || defender.isSidestepping) {
      // Whiff!
      return;
    }

    // Trigger Ultimate cinematic
    state.cinematic = {
      active: true,
      type: 'ultimate',
      attacker: attacker.id,
      target: defender.id,
      frame: 0,
      maxFrames: 90, // ~1.5s cinematic
      phase: 'push_in',
      damageApplied: false,
    };
    state.hitstop = 20;
    state.screenShake = 15;
    return;
  }

  // 2. Check if blocked
  const isBlocked = canBlockAttack(defender, hitbox.hitLevel);

  if (isBlocked) {
    // Blocked!
    defender.state = 'blockstun';
    defender.blockstunFrames = hitbox.blockstun;
    defender.vx = -defender.facing * (attacker.currentMove?.pushbackOnBlock ?? 7);
    defender.stateTime = 0;

    state.hitstop = 6;
    state.screenShake = 3;

    // Block sparks (cyan/white)
    spawnSparks(state, impactX, impactY, '#00ffff', 8);

    // Fly text
    addFlyText(state, 'BLOCKED', defender.x, defender.y - 120, '#00f0ff', 24);
    return;
  }

  // 3. Clean Hit!
  let damage = hitbox.damage;

  // Apply juggle scaling if defender is airborne
  if (!defender.isGrounded) {
    defender.juggleHits++;
    const scale = getJuggleDamageScale(defender.juggleHits);
    damage = Math.round(damage * scale);
  } else {
    // Ground hit resets juggle count
    defender.juggleHits = 0;
  }

  // Rage bonus: +25% damage when attacker health is below 20%
  if (attacker.isRage) {
    damage = Math.round(damage * 1.25);
  }

  // AI difficulty multiplier (does NOT apply to ultimates)
  if (isAttackerAI) {
    const diffConfig = DIFFICULTY_CONFIGS[state.difficulty];
    damage = Math.round(damage * diffConfig.aiDamageMultiplier);
  }

  // Apply damage
  defender.health = Math.max(0, defender.health - damage);

  // Meter Gain Formula:
  // "Gains +1 per 1% of max health damage dealt and +1.5 per 1% of max health damage taken."
  const damagePercentTarget = (damage / defender.maxHealth) * 100;
  attacker.meter = Math.min(100, attacker.meter + damagePercentTarget * 1.0);
  defender.meter = Math.min(100, defender.meter + damagePercentTarget * 1.5);
  attacker.meterGlow = attacker.meter >= 100;
  defender.meterGlow = defender.meter >= 100;

  // Update combo counter
  attacker.comboCount++;
  attacker.comboDamage += damage;
  attacker.lastAttackLandedName = attacker.currentMove?.name || 'Strike';

  // Apply Defender Stun & Launches
  if (hitbox.isLauncher) {
    defender.state = 'hitstun';
    defender.isGrounded = false;
    defender.vy = hitbox.launchY ?? -13.5;
    defender.vx = -defender.facing * (hitbox.launchX ?? 3.8);
    state.hitstop = 12;
    state.screenShake = 8;
    addFlyText(state, 'LAUNCH!', defender.x, defender.y - 130, '#ff0055', 28);
  } else if (hitbox.isKnockdown || !defender.isGrounded) {
    // Knockdown or air juggle hit
    defender.state = 'hitstun';
    defender.vy = !defender.isGrounded ? -7 : -3;
    defender.vx = -defender.facing * 4.5;
    state.hitstop = 10;
    state.screenShake = 7;
  } else {
    // Standard grounded hitstun
    defender.state = 'hitstun';
    defender.hitstunFrames = hitbox.hitstun;
    defender.vx = -defender.facing * (attacker.currentMove?.pushbackOnHit ?? 9);
    state.hitstop = 8;
    state.screenShake = 5;
  }

  // Hit sparks (neon color of attacker)
  spawnSparks(state, impactX, impactY, attacker.def.skeleton.glowColor, 16);

  // Fly text for damage and combo
  if (attacker.comboCount > 1) {
    addFlyText(state, `${attacker.comboCount} COMBO!`, attacker.x, attacker.y - 140, '#ffff00', 30);
  } else {
    addFlyText(state, `${damage}`, defender.x, defender.y - 100, '#ff3366', 22);
  }

  // Check for KO
  if (defender.health <= 0) {
    defender.state = 'ko';
    defender.vy = -8;
    defender.vx = -defender.facing * 5;
    defender.isGrounded = false;
    state.hitstop = 30; // Dramatic slow-mo KO freeze
    state.screenShake = 16;
    state.camera.targetZoom = 1.35;
    addFlyText(state, 'K.O. !', 600, 250, '#ff0033', 54);
  }
}

/**
 * Spawns neon spark particles at an impact coordinate.
 */
export function spawnSparks(
  state: GameState,
  x: number,
  y: number,
  color: string,
  count = 12
): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 8;
    state.particles.push({
      id: Math.random(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      color,
      life: 0,
      maxLife: 15 + Math.floor(Math.random() * 15),
      size: 2 + Math.random() * 3,
      type: 'spark',
    });
  }
}

/**
 * Adds floating combat text.
 */
export function addFlyText(
  state: GameState,
  text: string,
  x: number,
  y: number,
  color: string,
  size = 24
): void {
  state.flyTexts.push({
    id: Math.random(),
    text,
    x,
    y,
    color,
    life: 0,
    maxLife: 45,
    size,
  });
}
