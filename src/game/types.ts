import { DifficultyLevel } from './difficulty';

export type HitLevel = 'high' | 'mid' | 'low';

export type FighterState =
  | 'idle'
  | 'walk_forward'
  | 'walk_back'
  | 'crouch'
  | 'jump'
  | 'attack'
  | 'hitstun'
  | 'blockstun'
  | 'knockdown'
  | 'getting_up'
  | 'sidestep'
  | 'throw_startup'
  | 'throw_active'
  | 'throw_recovery'
  | 'thrown'
  | 'ultimate_startup'
  | 'ultimate_active'
  | 'ultimate_recovery'
  | 'ultimate_cinematic'
  | 'victory'
  | 'ko';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HitboxDefinition extends Box {
  id: string;
  damage: number;
  hitLevel: HitLevel;
  hitstun: number;
  blockstun: number;
  launchX?: number;
  launchY?: number;
  isLauncher?: boolean;
  isKnockdown?: boolean;
}

export interface HurtboxDefinition extends Box {
  type: 'body' | 'head' | 'legs';
}

export interface MoveData {
  id: string;
  name: string;
  command: string; // e.g. "LP", "f+RP", "d+LK", "df+RK", "LP+LK", "Q"
  startup: number; // frames before active hitbox
  active: number; // frames hitbox remains active
  recovery: number; // frames to return to neutral
  damage: number;
  hitLevel: HitLevel;
  hitstun: number;
  blockstun: number;
  isLauncher?: boolean;
  launchX?: number;
  launchY?: number;
  isKnockdown?: boolean;
  isThrow?: boolean;
  isUltimate?: boolean;
  // Pushback applied to defender on hit/block
  pushbackOnHit?: number;
  pushbackOnBlock?: number;
  // Forward motion during startup
  forwardMotion?: number;
  // String combo follow-up branch: map from input command to next move id
  combosInto?: Record<string, string>;
  // Cancel frame window (relative to move start)
  cancelWindow?: { start: number; end: number };
  // Keyframe animation pose identifier
  animPose: string;
  // Relative hitbox offset [dx, dy, width, height] relative to fighter center
  hitboxOffset?: [number, number, number, number];
}

export interface SkeletonJointConfig {
  headRadius: number;
  torsoLength: number;
  torsoThickness: number;
  upperArmLength: number;
  forearmLength: number;
  armThickness: number;
  thighLength: number;
  shinLength: number;
  legThickness: number;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  eyeColor: string;
}

export interface JointAngles {
  torsoAngle: number;
  headAngle: number;
  leftShoulder: number;
  leftElbow: number;
  rightShoulder: number;
  rightElbow: number;
  leftHip: number;
  leftKnee: number;
  rightHip: number;
  rightKnee: number;
}

export interface FighterDefinition {
  id: string;
  name: string;
  title: string;
  bio: string;
  unlockCondition?: 'none' | 'arcade_hard' | 'arcade_nightmare';
  stats: {
    health: number;
    walkSpeed: number;
    backWalkSpeed: number;
    jumpSpeed: number;
    weight: number; // affects gravity / juggle fall speed
    sidestepSpeed: number;
  };
  skeleton: SkeletonJointConfig;
  idlePose: JointAngles;
  crouchPose: JointAngles;
  jumpPose: JointAngles;
  moves: MoveData[];
  throwMove: MoveData;
  ultimateMove: MoveData;
  // Specific string combo chains, e.g. ["LP", "RP", "RK"]
  stringCombos: { name: string; sequence: string[]; description: string }[];
}

export interface RawInputs {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  lp: boolean; // Left Punch
  rp: boolean; // Right Punch
  lk: boolean; // Left Kick
  rk: boolean; // Right Kick
  ultimate: boolean; // Q
}

export interface BufferedCommand {
  command: string; // e.g. "LP", "f+RP", "df+RK", "LP+LK", "Q", "sidestep_up", "sidestep_down"
  frame: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  type: 'spark' | 'smoke' | 'aura' | 'flash' | 'impact';
}

export interface FlyText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface FighterRuntime {
  id: 'p1' | 'p2';
  fighterId: string;
  def: FighterDefinition;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1; // 1 = right, -1 = left
  z: number; // 0 = standard line, 1 / -1 during sidestep dodge
  health: number;
  maxHealth: number;
  ghostHealth: number;
  meter: number; // 0 to 100
  meterGlow: boolean;
  state: FighterState;
  currentMove: MoveData | null;
  frameInMove: number;
  stateTime: number; // frames in current state
  isGrounded: boolean;
  isCrouching: boolean;
  isBlocking: boolean;
  isSidestepping: boolean;
  sidestepDirection: 1 | -1;
  sidestepFrames: number;
  hitstunFrames: number;
  blockstunFrames: number;
  knockdownFrames: number;
  comboCount: number;
  comboDamage: number;
  juggleHits: number;
  isRage: boolean;
  hasHitOpponent: boolean;
  throwBreakWindow: number; // frames remaining to break throw
  invulnerableFrames: number;
  roundsWon: number;
  recentInputs: { input: RawInputs; frame: number }[];
  bufferedCommand: string | null;
  bufferTimer: number;
  lastAttackLandedName: string | null;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetZoom: number;
}

export interface CinematicState {
  active: boolean;
  type: 'ultimate' | 'ko';
  attacker: 'p1' | 'p2';
  target: 'p1' | 'p2';
  frame: number;
  maxFrames: number;
  phase: 'push_in' | 'strike_barrage' | 'final_blow' | 'impact';
  damageApplied: boolean;
}

export interface GameState {
  frame: number;
  round: number;
  maxRounds: number; // default 3 (best of 3: first to 2)
  timerFrames: number;
  roundTimerTotalSeconds: number;
  stageId: string;
  p1: FighterRuntime;
  p2: FighterRuntime;
  roundOver: boolean;
  matchOver: boolean;
  winner: 'p1' | 'p2' | 'draw' | null;
  hitstop: number;
  screenShake: number;
  screenFlash: string | null;
  flashOpacity: number;
  cinematic: CinematicState | null;
  camera: CameraState;
  particles: Particle[];
  flyTexts: FlyText[];
  debugHitboxes: boolean;
  difficulty: DifficultyLevel;
  mode: 'arcade' | 'versus' | 'training';
  trainingSettings?: {
    dummyBehavior: 'idle' | 'block_all' | 'block_high' | 'block_low' | 'random';
    autoMeter: boolean;
  };
}

export interface MatchScore {
  difficulty: DifficultyLevel;
  totalScore: number;
  timeRemainingBonus: number;
  healthRemainingBonus: number;
  maxCombo: number;
  perfectRounds: number;
  ultimatesLanded: number;
}
