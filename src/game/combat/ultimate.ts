import { FighterRuntime, GameState } from '../types';
import { spawnSparks, addFlyText } from './hitResolution';

/**
 * Calculates the exact 30% fixed damage for an Ultimate strike based on the target's MAX health.
 * Must ignore combo scaling, rage bonuses, difficulty multipliers, and character damage stats.
 */
export function calculateUltimateDamage(targetMaxHealth: number): number {
  return Math.round(targetMaxHealth * 0.30);
}

/**
 * Attempts to activate the ultimate for a fighter.
 * Requirements:
 * - Meter must be 100.
 * - Fighter must be in a neutral or blockstring recovery state (not hitstun, knockdown, or already in ultimate).
 * - Single button press with no chord. Consumes the full meter.
 * - If meter is not 100: does nothing, returns { activated: false, denied: true }.
 */
export function tryActivateUltimate(
  f: FighterRuntime,
  state: GameState
): { activated: boolean; denied: boolean } {
  // If meter is not full, deny
  if (f.meter < 100) {
    return { activated: false, denied: true };
  }

  // Cannot activate during hitstun, knockdown, KO, victory, thrown, or while already in ultimate
  const disallowedStates = [
    'hitstun',
    'knockdown',
    'getting_up',
    'thrown',
    'ko',
    'victory',
    'ultimate_startup',
    'ultimate_active',
    'ultimate_recovery',
    'ultimate_cinematic',
  ];
  if (disallowedStates.includes(f.state)) {
    return { activated: false, denied: false };
  }

  // Activate!
  f.meter = 0;
  f.meterGlow = false;
  f.state = 'ultimate_startup';
  f.currentMove = f.def.ultimateMove;
  f.frameInMove = 0;
  f.stateTime = 0;
  f.hasHitOpponent = false;

  // Startup visual cues: screen flash, camera push-in, freeze frames
  state.hitstop = 12;
  state.screenShake = 6;
  state.screenFlash = f.def.skeleton.glowColor;
  state.flashOpacity = 0.5;
  state.camera.targetZoom = 1.25;

  addFlyText(state, 'OVERDRIVE STRIKE!', f.x, f.y - 150, f.def.skeleton.glowColor, 32);

  return { activated: true, denied: false };
}

/**
 * Advances the Ultimate cinematic sequence frame-by-frame and applies the exact 30% damage.
 */
export function updateUltimateCinematic(
  state: GameState,
  reducedMotion = false
): void {
  if (!state.cinematic || state.cinematic.type !== 'ultimate') return;

  const cinematic = state.cinematic;
  const attacker = cinematic.attacker === 'p1' ? state.p1 : state.p2;
  const target = cinematic.target === 'p1' ? state.p1 : state.p2;

  cinematic.frame++;

  const totalDuration = reducedMotion ? 40 : cinematic.maxFrames; // Shortened for reduced motion

  // Phase 1: Camera push-in and barrage sparks
  if (cinematic.frame < totalDuration * 0.4) {
    cinematic.phase = 'push_in';
    state.camera.targetZoom = reducedMotion ? 1.1 : 1.35;
    if (!reducedMotion && cinematic.frame % 6 === 0) {
      spawnSparks(state, target.x, target.y - 60, attacker.def.skeleton.glowColor, 8);
    }
  }
  // Phase 2: Final blow build-up
  else if (cinematic.frame < totalDuration * 0.75) {
    cinematic.phase = 'strike_barrage';
    if (!reducedMotion && cinematic.frame % 4 === 0) {
      state.screenShake = 5;
    }
  }
  // Phase 3: Impact and exact 30% damage application
  else {
    cinematic.phase = 'impact';
    if (!cinematic.damageApplied) {
      cinematic.damageApplied = true;

      // Apply EXACTLY 30% of target max health fixed damage!
      const exactDamage = calculateUltimateDamage(target.maxHealth);
      target.health = Math.max(0, target.health - exactDamage);

      // Huge impact sparks and screen shake
      state.screenShake = reducedMotion ? 0 : 20;
      if (!reducedMotion) {
        state.screenFlash = attacker.def.skeleton.glowColor;
        state.flashOpacity = 0.8;
      }
      spawnSparks(state, target.x, target.y - 60, attacker.def.skeleton.glowColor, 35);
      addFlyText(state, `-${exactDamage} (30%)`, target.x, target.y - 120, '#ff0055', 38);

      // Launch target backwards into knockdown or KO
      if (target.health <= 0) {
        target.state = 'ko';
        target.vy = -10;
        target.vx = -target.facing * 7;
        target.isGrounded = false;
        state.hitstop = 35;
        addFlyText(state, 'K.O. !', 600, 250, '#ff0033', 56);
      } else {
        target.state = 'knockdown';
        target.knockdownFrames = 50;
        target.vy = -8;
        target.vx = -target.facing * 6;
        target.isGrounded = false;
      }
    }
  }

  // End cinematic
  if (cinematic.frame >= totalDuration) {
    state.cinematic = null;
    state.camera.targetZoom = 1.0;
    state.camera.x = 0;
    state.camera.y = 0;
    state.screenFlash = null;
    state.flashOpacity = 0;

    // Return attacker to neutral recovery
    attacker.state = 'idle';
    attacker.currentMove = null;
    attacker.frameInMove = 0;
    attacker.stateTime = 0;
  }
}
