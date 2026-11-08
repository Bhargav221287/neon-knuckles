import { FighterRuntime, GameState } from '../types';
import { breakThrow } from './throws';
import { spawnSparks, addFlyText } from './hitResolution';

/**
 * Updates a fighter's internal state machine per frame.
 */
export function updateFighterState(f: FighterRuntime, opponent: FighterRuntime, state: GameState): void {
  f.stateTime++;

  // Update rage flag (< 20% health)
  f.isRage = f.health > 0 && f.health <= f.maxHealth * 0.2;

  // Update meter glow
  f.meterGlow = f.meter >= 100;

  // Decrease invulnerability frames
  if (f.invulnerableFrames > 0) {
    f.invulnerableFrames--;
  }

  // Smooth ghost health trail
  if (f.ghostHealth > f.health) {
    f.ghostHealth = Math.max(f.health, f.ghostHealth - 1.2);
  } else if (f.ghostHealth < f.health) {
    f.ghostHealth = f.health;
  }

  // Handle throw break window if defender is in 'thrown' state
  if (f.state === 'thrown') {
    if (f.throwBreakWindow > 0) {
      f.throwBreakWindow--;
      // Check if defender just input throw break
      const latest = f.recentInputs[f.recentInputs.length - 1];
      if (latest && ((latest.input.lp && latest.input.lk) || f.bufferedCommand === 'LP+LK')) {
        breakThrow(opponent, f, state);
        f.bufferedCommand = null;
        return;
      }
    } else {
      // Throw completes! Damage defender and knockdown
      f.health = Math.max(0, f.health - 130);
      f.state = f.health <= 0 ? 'ko' : 'knockdown';
      f.knockdownFrames = 45;
      f.vy = -6;
      f.vx = -f.facing * 5;
      f.isGrounded = false;

      // Meter gain for throw
      const pct = (130 / f.maxHealth) * 100;
      opponent.meter = Math.min(100, opponent.meter + pct * 1.0);
      f.meter = Math.min(100, f.meter + pct * 1.5);

      state.screenShake = 10;
      spawnSparks(state, f.x, f.y - 40, opponent.def.skeleton.glowColor, 18);
      addFlyText(state, 'SLAM!', f.x, f.y - 90, '#ff3300', 28);
    }
    return;
  }

  // Handle attack state
  if (f.state === 'attack') {
    if (!f.currentMove) {
      f.state = 'idle';
      f.stateTime = 0;
      return;
    }

    f.frameInMove++;
    const totalFrames = f.currentMove.startup + f.currentMove.active + f.currentMove.recovery;

    // String combo cancel window handling
    if (f.hasHitOpponent && f.currentMove.combosInto && f.bufferedCommand) {
      const nextMoveId = f.currentMove.combosInto[f.bufferedCommand];
      if (nextMoveId) {
        const nextMove = f.def.moves.find((m) => m.id === nextMoveId);
        if (nextMove) {
          f.currentMove = nextMove;
          f.frameInMove = 0;
          f.hasHitOpponent = false;
          f.bufferedCommand = null;
          return;
        }
      }
    }

    // Move complete
    if (f.frameInMove >= totalFrames) {
      f.state = 'idle';
      f.currentMove = null;
      f.frameInMove = 0;
      f.stateTime = 0;
      f.hasHitOpponent = false;
      // Reset combo if attacker finishes recovery without hitting again
      if (f.comboCount > 0 && opponent.state !== 'hitstun') {
        f.comboCount = 0;
        f.comboDamage = 0;
      }
    }
    return;
  }

  // Handle hitstun
  if (f.state === 'hitstun') {
    if (f.hitstunFrames > 0) {
      f.hitstunFrames--;
    } else if (f.isGrounded) {
      f.state = 'idle';
      f.stateTime = 0;
      f.comboCount = 0;
      f.comboDamage = 0;
    }
    return;
  }

  // Handle blockstun
  if (f.state === 'blockstun') {
    if (f.blockstunFrames > 0) {
      f.blockstunFrames--;
    } else {
      f.state = 'idle';
      f.stateTime = 0;
    }
    return;
  }

  // Handle knockdown
  if (f.state === 'knockdown') {
    f.knockdownFrames--;
    if (f.knockdownFrames <= 0) {
      f.state = 'getting_up';
      f.stateTime = 0;
      f.invulnerableFrames = 18; // Wakeup invulnerability
    }
    return;
  }

  // Handle getting up
  if (f.state === 'getting_up') {
    if (f.stateTime >= 18) {
      f.state = 'idle';
      f.stateTime = 0;
    }
    return;
  }

  // Handle Ultimate Startup
  if (f.state === 'ultimate_startup') {
    f.frameInMove++;
    // 25 frames visible startup with aura and camera zoom
    if (f.frameInMove % 5 === 0) {
      spawnSparks(state, f.x, f.y - 70, f.def.skeleton.glowColor, 6);
    }

    if (f.frameInMove >= 25) {
      f.state = 'ultimate_active';
      f.frameInMove = 0;
      // Trigger hitbox check immediately
    }
    return;
  }

  // Handle Ultimate Active
  if (f.state === 'ultimate_active') {
    f.frameInMove++;
    // Active for 6 frames
    if (f.frameInMove >= 6) {
      if (!state.cinematic?.active) {
        // Whiffed! Enter 50 frames recovery (punishable counterplay)
        f.state = 'ultimate_recovery';
        f.frameInMove = 0;
        addFlyText(state, 'WHIFF!', f.x, f.y - 120, '#888888', 26);
      }
    }
    return;
  }

  // Handle Ultimate Recovery (punish window)
  if (f.state === 'ultimate_recovery') {
    f.frameInMove++;
    if (f.frameInMove >= 50) {
      f.state = 'idle';
      f.currentMove = null;
      f.frameInMove = 0;
      f.stateTime = 0;
    }
    return;
  }
}
