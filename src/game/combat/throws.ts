import { FighterRuntime, GameState } from '../types';
import { addFlyText, spawnSparks } from './hitResolution';

export const THROW_RANGE = 75;
export const THROW_BREAK_WINDOW = 14;

/**
 * Initiates a throw attempt for the attacker.
 */
export function tryInitiateThrow(attacker: FighterRuntime, defender: FighterRuntime, state: GameState): boolean {
  if (attacker.state !== 'idle' && attacker.state !== 'walk_forward' && attacker.state !== 'walk_back') {
    return false;
  }

  // Check distance and grounded status
  const dist = Math.abs(attacker.x - defender.x);
  if (dist > THROW_RANGE || !defender.isGrounded) {
    // Whiff throw
    attacker.state = 'attack';
    attacker.currentMove = attacker.def.throwMove;
    attacker.frameInMove = 0;
    attacker.stateTime = 0;
    attacker.hasHitOpponent = true; // prevent re-triggering
    return false;
  }

  // Cannot throw invincible or knocked down opponents
  if (defender.state === 'knockdown' || defender.invulnerableFrames > 0 || defender.state === 'thrown') {
    return false;
  }

  // Connect throw: enter throw startup with defender break window
  attacker.state = 'attack';
  attacker.currentMove = attacker.def.throwMove;
  attacker.frameInMove = 0;
  attacker.stateTime = 0;

  defender.state = 'thrown';
  defender.throwBreakWindow = THROW_BREAK_WINDOW;
  defender.vx = 0;
  defender.vy = 0;

  state.hitstop = 8;
  addFlyText(state, 'GRAB!', attacker.x, attacker.y - 120, '#ffaa00', 26);
  return true;
}

/**
 * Checks if the defender successfully teched (broke) the throw.
 */
export function breakThrow(attacker: FighterRuntime, defender: FighterRuntime, state: GameState): void {
  defender.state = 'idle';
  defender.throwBreakWindow = 0;
  defender.vx = -defender.facing * 8;

  attacker.state = 'idle';
  attacker.currentMove = null;
  attacker.frameInMove = 0;
  attacker.vx = -attacker.facing * 8;

  state.hitstop = 12;
  state.screenShake = 6;
  spawnSparks(state, (attacker.x + defender.x) / 2, defender.y - 60, '#00ffff', 14);
  addFlyText(state, 'THROW BREAK!', (attacker.x + defender.x) / 2, defender.y - 130, '#00ffff', 30);
}
