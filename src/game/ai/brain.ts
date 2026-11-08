import { FighterRuntime, GameState, RawInputs, MoveData } from '../types';
import { DIFFICULTY_CONFIGS, DifficultyLevel } from '../difficulty';
import { HabitTracker } from './habitTracker';

interface PerceivedPlayerState {
  frame: number;
  x: number;
  y: number;
  state: string;
  isGrounded: boolean;
  isCrouching: boolean;
  isAttacking: boolean;
  currentMoveStartup: number;
  currentMoveRecovery: number;
  frameInMove: number;
  currentMoveHitLevel?: 'high' | 'mid' | 'low';
}

export class AIBrain {
  private habitTracker = new HabitTracker();
  private perceivedStateQueue: PerceivedPlayerState[] = [];
  private lastActionDecision = 0;
  private currentPlannedInputs: RawInputs = {
    up: false,
    down: false,
    left: false,
    right: false,
    lp: false,
    rp: false,
    lk: false,
    rk: false,
    ultimate: false,
  };
  private inputHoldFrames = 0;

  public reset(): void {
    this.habitTracker.clear();
    this.perceivedStateQueue = [];
    this.lastActionDecision = 0;
    this.inputHoldFrames = 0;
  }

  public update(
    ai: FighterRuntime,
    player: FighterRuntime,
    state: GameState,
    difficulty: DifficultyLevel
  ): RawInputs {
    const config = DIFFICULTY_CONFIGS[difficulty];

    // 1. Record actual player behavior into habit tracker (for Hard & Nightmare)
    this.habitTracker.recordPlayerAction(player);

    // 2. Queue player state to enforce reaction delay
    this.perceivedStateQueue.push({
      frame: state.frame,
      x: player.x,
      y: player.y,
      state: player.state,
      isGrounded: player.isGrounded,
      isCrouching: player.isCrouching,
      isAttacking: player.state === 'attack',
      currentMoveStartup: player.currentMove?.startup ?? 0,
      currentMoveRecovery: player.currentMove?.recovery ?? 0,
      frameInMove: player.frameInMove,
      currentMoveHitLevel: player.currentMove?.hitLevel,
    });

    // Determine delayed perceived player state
    const targetFrame = state.frame - config.reactionDelayFrames;
    while (this.perceivedStateQueue.length > 0 && this.perceivedStateQueue[0].frame < targetFrame) {
      this.perceivedStateQueue.shift();
    }
    const perceived = this.perceivedStateQueue[0] || {
      frame: state.frame,
      x: player.x,
      y: player.y,
      state: player.state,
      isGrounded: player.isGrounded,
      isCrouching: player.isCrouching,
      isAttacking: player.state === 'attack',
      currentMoveStartup: 0,
      currentMoveRecovery: 0,
      frameInMove: 0,
    };

    // If still executing held input, decay timer and return
    if (this.inputHoldFrames > 0) {
      this.inputHoldFrames--;
      // Attack buttons should only pulse for 1 frame
      return {
        ...this.currentPlannedInputs,
        lp: this.inputHoldFrames > 2 ? false : this.currentPlannedInputs.lp,
        rp: this.inputHoldFrames > 2 ? false : this.currentPlannedInputs.rp,
        lk: this.inputHoldFrames > 2 ? false : this.currentPlannedInputs.lk,
        rk: this.inputHoldFrames > 2 ? false : this.currentPlannedInputs.rk,
        ultimate: false,
      };
    }

    // Default neutral inputs
    const inputs: RawInputs = {
      up: false,
      down: false,
      left: false,
      right: false,
      lp: false,
      rp: false,
      lk: false,
      rk: false,
      ultimate: false,
    };

    const dist = Math.abs(ai.x - perceived.x);
    const forwardKey = ai.facing === 1 ? 'right' : 'left';
    const backKey = ai.facing === 1 ? 'left' : 'right';

    // 3. Ultimate Decision
    if (ai.meter >= 100) {
      const shouldUseUltimate = this.evaluateUltimateUsage(ai, perceived, config, dist);
      if (shouldUseUltimate) {
        inputs.ultimate = true;
        this.inputHoldFrames = 3;
        this.currentPlannedInputs = inputs;
        return inputs;
      }
    }

    // 4. Defensive Reaction (Blocking & Ducking)
    if (perceived.isAttacking && dist < 160) {
      const willBlock = Math.random() < config.blockProbability;
      if (willBlock) {
        const habits = this.habitTracker.getHabits();
        const shouldCrouchBlock =
          perceived.currentMoveHitLevel === 'low' ||
          (difficulty === 'nightmare' && habits.lowAttackFrequency > 0.4);

        if (shouldCrouchBlock) {
          inputs.down = true;
          inputs[backKey] = true;
        } else {
          inputs[backKey] = true; // Standing block
        }

        this.inputHoldFrames = 6 + Math.floor(Math.random() * 8);
        this.currentPlannedInputs = inputs;
        return inputs;
      }
    }

    // 5. Juggle Follow-up (Opponent is airborne in hitstun)
    if (!perceived.isGrounded && perceived.state === 'hitstun' && dist < 130) {
      const willCombo = Math.random() < config.comboProbability;
      if (willCombo) {
        // Find fast poke or launcher to juggle
        const juggleMove = this.selectJuggleMove(ai.def.moves);
        if (juggleMove) {
          this.applyMoveInput(juggleMove, inputs, forwardKey, backKey);
          this.inputHoldFrames = 5;
          this.currentPlannedInputs = inputs;
          return inputs;
        }
      }
    }

    // 6. Whiff Punish or Block Punish
    const isPlayerVulnerable =
      perceived.state === 'attack' &&
      perceived.frameInMove > perceived.currentMoveStartup &&
      dist < 140;

    if (isPlayerVulnerable && Math.random() < config.punishProbability) {
      // Choose optimal punish move
      const launcher = ai.def.moves.find((m) => m.isLauncher);
      const punishMove = launcher && Math.random() < 0.65 ? launcher : this.selectFastestMove(ai.def.moves);
      if (punishMove) {
        this.applyMoveInput(punishMove, inputs, forwardKey, backKey);
        this.inputHoldFrames = 5;
        this.currentPlannedInputs = inputs;
        return inputs;
      }
    }

    // 7. Neutral Spacing & Offense
    if (dist > 95) {
      // Approach to strike range
      inputs[forwardKey] = true;
      if (Math.random() < 0.08 && config.aggression > 0.5) {
        inputs.up = true; // occasional jumping approach
      }
      this.inputHoldFrames = 5;
    } else if (dist < 60) {
      // Close range: throw, mixup, or fast poke
      const roll = Math.random();
      if (roll < 0.28 * config.aggression) {
        // Throw attempt (LP+LK)
        inputs.lp = true;
        inputs.lk = true;
      } else if (roll < 0.6) {
        // Low mixup
        const lowMove = ai.def.moves.find((m) => m.hitLevel === 'low');
        if (lowMove) {
          this.applyMoveInput(lowMove, inputs, forwardKey, backKey);
        } else {
          inputs.down = true;
          inputs.lk = true;
        }
      } else if (roll < 0.85) {
        // Fast poke
        const fastPoke = this.selectFastestMove(ai.def.moves);
        if (fastPoke) {
          this.applyMoveInput(fastPoke, inputs, forwardKey, backKey);
        }
      } else {
        // Spacing backstep
        inputs[backKey] = true;
      }
      this.inputHoldFrames = 4;
    } else {
      // Sweet spot striking range (60 - 95 px)
      const roll = Math.random();
      if (roll < 0.7 * config.aggression) {
        const move = this.selectRandomViableMove(ai.def.moves);
        if (move) {
          this.applyMoveInput(move, inputs, forwardKey, backKey);
        }
      } else if (roll < 0.85) {
        inputs[forwardKey] = true;
      } else {
        inputs[backKey] = true;
      }
      this.inputHoldFrames = 4;
    }

    this.currentPlannedInputs = inputs;
    return inputs;
  }

  private evaluateUltimateUsage(
    ai: FighterRuntime,
    player: PerceivedPlayerState,
    config: (typeof DIFFICULTY_CONFIGS)[DifficultyLevel],
    dist: number
  ): boolean {
    if (config.ultimateUsageMode === 'careless') {
      // Easy: uses it carelessly even if out of range or player jumping
      return Math.random() < 0.04;
    }

    if (config.ultimateUsageMode === 'random') {
      // Normal: uses when neutral and roughly in range
      return dist < 220 && Math.random() < 0.05;
    }

    if (config.ultimateUsageMode === 'punish') {
      // Hard: uses as punish when player is in recovery or after block
      const playerInRecovery = player.state === 'attack' && player.frameInMove > player.currentMoveStartup;
      const playerInKnockdownGetup = player.state === 'getting_up';
      return (playerInRecovery || playerInKnockdownGetup) && dist < 200 && player.isGrounded;
    }

    if (config.ultimateUsageMode === 'guaranteed') {
      // Nightmare: only when player CANNOT dodge (in recovery, grounded, close enough)
      const playerTrapped =
        player.state === 'attack' &&
        player.frameInMove > player.currentMoveStartup &&
        player.isGrounded &&
        dist < 180;
      return playerTrapped;
    }

    return false;
  }

  private selectJuggleMove(moves: MoveData[]): MoveData | undefined {
    return moves.find((m) => m.startup <= 12 && (m.hitLevel === 'mid' || m.hitLevel === 'high'));
  }

  private selectFastestMove(moves: MoveData[]): MoveData | undefined {
    return [...moves].sort((a, b) => a.startup - b.startup)[0];
  }

  private selectFastestMidMove(moves: MoveData[]): MoveData | undefined {
    const mids = moves.filter((m) => m.hitLevel === 'mid');
    return mids.sort((a, b) => a.startup - b.startup)[0];
  }

  private selectRandomViableMove(moves: MoveData[]): MoveData | undefined {
    const valid = moves.filter((m) => !m.isUltimate && !m.isThrow);
    return valid[Math.floor(Math.random() * valid.length)];
  }

  private applyMoveInput(
    move: MoveData,
    inputs: RawInputs,
    forwardKey: 'left' | 'right',
    backKey: 'left' | 'right'
  ): void {
    const cmd = move.command;
    if (cmd.includes('df+')) {
      inputs.down = true;
      inputs[forwardKey] = true;
    } else if (cmd.includes('db+')) {
      inputs.down = true;
      inputs[backKey] = true;
    } else if (cmd.includes('d+')) {
      inputs.down = true;
    } else if (cmd.includes('f+')) {
      inputs[forwardKey] = true;
    } else if (cmd.includes('b+')) {
      inputs[backKey] = true;
    }

    if (cmd.includes('LP+LK')) {
      inputs.lp = true;
      inputs.lk = true;
    } else if (cmd.endsWith('LP')) {
      inputs.lp = true;
    } else if (cmd.endsWith('RP')) {
      inputs.rp = true;
    } else if (cmd.endsWith('LK')) {
      inputs.lk = true;
    } else if (cmd.endsWith('RK')) {
      inputs.rk = true;
    }
  }
}
