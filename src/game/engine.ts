import {
  GameState,
  RawInputs,
  FighterRuntime,
  FighterDefinition,
} from './types';
import { DifficultyLevel, DIFFICULTY_CONFIGS } from './difficulty';
import { updateMovement } from './physics/movement';
import { resolvePushboxes, GROUND_Y } from './physics/collision';
import { resolveHits } from './combat/hitResolution';
import { updateFighterState } from './combat/stateMachine';
import { tryActivateUltimate, updateUltimateCinematic } from './combat/ultimate';
import { tryInitiateThrow } from './combat/throws';
import { InputBuffer } from './input/InputBuffer';

export const ROUND_TIME_SECONDS = 60;
export const WINNING_ROUNDS = 2; // Best-of-3

export function createFighterRuntime(
  id: 'p1' | 'p2',
  def: FighterDefinition,
  startX: number
): FighterRuntime {
  return {
    id,
    fighterId: def.id,
    def,
    x: startX,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    facing: id === 'p1' ? 1 : -1,
    z: 0,
    health: def.stats.health,
    maxHealth: def.stats.health,
    ghostHealth: def.stats.health,
    meter: 0, // Resets to 0 every round
    meterGlow: false,
    state: 'idle',
    currentMove: null,
    frameInMove: 0,
    stateTime: 0,
    isGrounded: true,
    isCrouching: false,
    isBlocking: false,
    isSidestepping: false,
    sidestepDirection: 1,
    sidestepFrames: 0,
    hitstunFrames: 0,
    blockstunFrames: 0,
    knockdownFrames: 0,
    comboCount: 0,
    comboDamage: 0,
    juggleHits: 0,
    isRage: false,
    hasHitOpponent: false,
    throwBreakWindow: 0,
    invulnerableFrames: 0,
    roundsWon: 0,
    recentInputs: [],
    bufferedCommand: null,
    bufferTimer: 0,
    lastAttackLandedName: null,
  };
}

export function createInitialGameState(
  p1Def: FighterDefinition,
  p2Def: FighterDefinition,
  difficulty: DifficultyLevel = 'normal',
  mode: 'arcade' | 'versus' | 'training' = 'arcade',
  stageId = 'stage_tokyo'
): GameState {
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const roundSeconds = diffConfig.roundTimerSeconds;

  return {
    frame: 0,
    round: 1,
    maxRounds: WINNING_ROUNDS,
    timerFrames: roundSeconds * 60,
    roundTimerTotalSeconds: roundSeconds,
    stageId,
    p1: createFighterRuntime('p1', p1Def, 460),
    p2: createFighterRuntime('p2', p2Def, 740),
    roundOver: false,
    matchOver: false,
    winner: null,
    hitstop: 0,
    screenShake: 0,
    screenFlash: null,
    flashOpacity: 0,
    cinematic: null,
    camera: {
      x: 0,
      y: 0,
      zoom: 1.0,
      targetZoom: 1.0,
    },
    particles: [],
    flyTexts: [],
    debugHitboxes: false,
    difficulty,
    mode,
  };
}

export class FightingEngine {
  private p1Buffer: InputBuffer;
  private p2Buffer: InputBuffer;

  constructor(bufferSize = 6) {
    this.p1Buffer = new InputBuffer(bufferSize);
    this.p2Buffer = new InputBuffer(bufferSize);
  }

  public resetBuffers(): void {
    this.p1Buffer.clear();
    this.p2Buffer.clear();
  }

  public setBufferSize(size: number): void {
    this.p1Buffer.setBufferSize(size);
    this.p2Buffer.setBufferSize(size);
  }

  public update(
    state: GameState,
    p1Raw: RawInputs,
    p2Raw: RawInputs,
    reducedMotion = false
  ): void {
    state.frame++;

    // 1. Decay visual screen shake & screen flash
    if (state.screenShake > 0) state.screenShake--;
    if (state.flashOpacity > 0) {
      state.flashOpacity = Math.max(0, state.flashOpacity - 0.08);
      if (state.flashOpacity <= 0) state.screenFlash = null;
    }

    // 2. Camera zoom smooth interpolation
    state.camera.zoom += (state.camera.targetZoom - state.camera.zoom) * 0.15;

    // 3. Update particle lifecycles
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      if (p.life >= p.maxLife) {
        state.particles.splice(i, 1);
      }
    }

    // 4. Update fly texts
    for (let i = state.flyTexts.length - 1; i >= 0; i--) {
      const t = state.flyTexts[i];
      t.y -= 0.8;
      t.life++;
      if (t.life >= t.maxLife) {
        state.flyTexts.splice(i, 1);
      }
    }

    // 5. Handle active cinematics (e.g. Ultimate Strike)
    if (state.cinematic && state.cinematic.active) {
      updateUltimateCinematic(state, reducedMotion);
      return;
    }

    // 6. Hitstop freeze frames (freeze physical updates on heavy impacts)
    if (state.hitstop > 0) {
      state.hitstop--;
      return;
    }

    // 7. Check round over or match over
    if (state.roundOver || state.matchOver) {
      return;
    }

    // 8. Round timer countdown
    if (state.mode !== 'training') {
      state.timerFrames--;
      if (state.timerFrames <= 0) {
        state.timerFrames = 0;
        this.handleTimeout(state);
        return;
      }
    }

    // 9. Push inputs into buffers
    this.p1Buffer.push(p1Raw, state.frame);
    this.p2Buffer.push(p2Raw, state.frame);

    // Record recent inputs in runtime
    state.p1.recentInputs.push({ input: { ...p1Raw }, frame: state.frame });
    if (state.p1.recentInputs.length > 20) state.p1.recentInputs.shift();

    state.p2.recentInputs.push({ input: { ...p2Raw }, frame: state.frame });
    if (state.p2.recentInputs.length > 20) state.p2.recentInputs.shift();

    // 10. Process fighter inputs and attacks
    this.processFighterInput(state.p1, state.p2, this.p1Buffer, p1Raw, state);
    this.processFighterInput(state.p2, state.p1, this.p2Buffer, p2Raw, state);

    // 11. Physics and movement
    updateMovement(state.p1, p1Raw, state.p2.x);
    updateMovement(state.p2, p2Raw, state.p1.x);

    // 12. Resolve pushbox collisions
    resolvePushboxes(state.p1, state.p2);

    // 13. State machine updates
    updateFighterState(state.p1, state.p2, state);
    updateFighterState(state.p2, state.p1, state);

    // 14. Combat & Hit resolution
    const isP2AI = state.mode === 'arcade';
    resolveHits(state, state.p1, state.p2, false);
    resolveHits(state, state.p2, state.p1, isP2AI);

    // 15. Check KO
    if (state.p1.health <= 0 || state.p2.health <= 0) {
      this.handleKO(state);
    }
  }

  private processFighterInput(
    f: FighterRuntime,
    opponent: FighterRuntime,
    buffer: InputBuffer,
    raw: RawInputs,
    state: GameState
  ): void {
    // Cannot initiate actions during hitstun, knockdown, or throw states
    if (f.state === 'hitstun' || f.state === 'blockstun' || f.state === 'knockdown' || f.state === 'thrown') {
      return;
    }

    // Check sidestep command (double tap up or down)
    if (f.isGrounded && (f.state === 'idle' || f.state === 'walk_forward' || f.state === 'walk_back')) {
      const sidestep = buffer.querySidestep();
      if (sidestep) {
        f.state = 'sidestep';
        f.sidestepDirection = sidestep === 'up' ? 1 : -1;
        f.sidestepFrames = 18;
        f.stateTime = 0;
        return;
      }
    }

    // Check Ultimate button press (single key Q)
    const availableCommandNames = f.def.moves.map((m) => m.command);
    availableCommandNames.push('Q', 'LP+LK');

    const queriedCommand = buffer.queryCommand(f.facing, availableCommandNames);
    if (!queriedCommand) return;

    // 1. Ultimate Strike
    if (queriedCommand === 'Q') {
      const res = tryActivateUltimate(f, state);
      if (res.activated) {
        return;
      }
    }

    // 2. Throw (LP+LK)
    if (queriedCommand === 'LP+LK') {
      const initiated = tryInitiateThrow(f, opponent, state);
      if (initiated) return;
    }

    // 3. Attacks & Combos
    // If currently attacking, store in buffer for string combo canceling
    if (f.state === 'attack') {
      f.bufferedCommand = queriedCommand;
      f.bufferTimer = 8;
      return;
    }

    // If neutral, initiate attack
    const move = f.def.moves.find((m) => m.command === queriedCommand);
    if (move && f.isGrounded) {
      f.state = 'attack';
      f.currentMove = move;
      f.frameInMove = 0;
      f.stateTime = 0;
      f.hasHitOpponent = false;
      f.bufferedCommand = null;
    }
  }

  private handleKO(state: GameState): void {
    state.roundOver = true;

    let roundWinner: 'p1' | 'p2' | 'draw' = 'draw';
    if (state.p1.health > 0 && state.p2.health <= 0) {
      roundWinner = 'p1';
      state.p1.roundsWon++;
    } else if (state.p2.health > 0 && state.p1.health <= 0) {
      roundWinner = 'p2';
      state.p2.roundsWon++;
    }

    state.winner = roundWinner;

    if (state.p1.roundsWon >= WINNING_ROUNDS || state.p2.roundsWon >= WINNING_ROUNDS) {
      state.matchOver = true;
      state.winner = state.p1.roundsWon >= WINNING_ROUNDS ? 'p1' : 'p2';
    }
  }

  private handleTimeout(state: GameState): void {
    state.roundOver = true;
    let roundWinner: 'p1' | 'p2' | 'draw' = 'draw';
    if (state.p1.health > state.p2.health) {
      roundWinner = 'p1';
      state.p1.roundsWon++;
    } else if (state.p2.health > state.p1.health) {
      roundWinner = 'p2';
      state.p2.roundsWon++;
    } else {
      // Draw: both gain a round point in standard competitive rules
      roundWinner = 'draw';
      state.p1.roundsWon++;
      state.p2.roundsWon++;
    }
    state.winner = roundWinner;

    if (state.p1.roundsWon >= WINNING_ROUNDS || state.p2.roundsWon >= WINNING_ROUNDS) {
      state.matchOver = true;
      if (state.p1.roundsWon > state.p2.roundsWon) {
        state.winner = 'p1';
      } else if (state.p2.roundsWon > state.p1.roundsWon) {
        state.winner = 'p2';
      } else {
        state.winner = 'draw';
      }
    }
  }

  /**
   * Starts the next round of a match.
   * Meter is reset to 0 at the start of every round.
   */
  public startNextRound(state: GameState): void {
    state.round++;
    state.roundOver = false;
    state.winner = null;

    const diffConfig = DIFFICULTY_CONFIGS[state.difficulty];
    const roundSeconds = diffConfig.roundTimerSeconds;
    state.timerFrames = roundSeconds * 60;

    // Reset fighter round states & meter to 0!
    state.p1.x = 460;
    state.p1.y = GROUND_Y;
    state.p1.vx = 0;
    state.p1.vy = 0;
    state.p1.facing = 1;
    state.p1.z = 0;
    state.p1.state = 'idle';
    state.p1.currentMove = null;
    state.p1.frameInMove = 0;
    state.p1.stateTime = 0;
    state.p1.meter = 0; // resets to 0 every round!
    state.p1.meterGlow = false;
    state.p1.comboCount = 0;
    state.p1.comboDamage = 0;
    state.p1.juggleHits = 0;
    state.p1.hasHitOpponent = false;
    state.p1.bufferedCommand = null;

    // Health reset between rounds unless Nightmare mode
    if (diffConfig.regenHealthBetweenRounds || state.mode !== 'arcade') {
      state.p1.health = state.p1.maxHealth;
      state.p1.ghostHealth = state.p1.maxHealth;
    }

    state.p2.x = 740;
    state.p2.y = GROUND_Y;
    state.p2.vx = 0;
    state.p2.vy = 0;
    state.p2.facing = -1;
    state.p2.z = 0;
    state.p2.state = 'idle';
    state.p2.currentMove = null;
    state.p2.frameInMove = 0;
    state.p2.stateTime = 0;
    state.p2.meter = 0; // resets to 0 every round!
    state.p2.meterGlow = false;
    state.p2.comboCount = 0;
    state.p2.comboDamage = 0;
    state.p2.juggleHits = 0;
    state.p2.hasHitOpponent = false;
    state.p2.bufferedCommand = null;

    if (diffConfig.regenHealthBetweenRounds || state.mode !== 'arcade') {
      state.p2.health = state.p2.maxHealth;
      state.p2.ghostHealth = state.p2.maxHealth;
    }

    this.resetBuffers();
  }
}
