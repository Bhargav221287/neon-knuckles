import { FighterRuntime, RawInputs } from '../types';
import { GROUND_Y, LEFT_WALL, RIGHT_WALL } from './collision';

export const BASE_GRAVITY = 0.85;

/**
 * Updates fighter position, velocities, jumping, gravity, and ground landing.
 */
export function updateMovement(f: FighterRuntime, inputs: RawInputs, opponentX: number): void {
  // If in hitstop or knockdown or cinematic, position does not update via normal input
  if (f.state === 'knockdown' || f.state === 'ultimate_cinematic' || f.state === 'thrown') {
    return;
  }

  // Airborne physics
  if (!f.isGrounded) {
    f.x += f.vx;
    f.y += f.vy;

    const gravityScale = f.def.stats.weight / 100;
    f.vy += BASE_GRAVITY * gravityScale;

    // Land on ground
    if (f.y >= GROUND_Y) {
      f.y = GROUND_Y;
      f.vy = 0;
      f.vx = 0;
      f.isGrounded = true;

      if (f.state === 'jump') {
        f.state = 'idle';
        f.stateTime = 0;
      } else if (f.state === 'hitstun') {
        // Juggle fall down into knockdown on ground hit
        f.state = 'knockdown';
        f.knockdownFrames = 40;
        f.stateTime = 0;
      }
    }

    // Clamp horizontal bounds in air
    f.x = Math.max(LEFT_WALL, Math.min(RIGHT_WALL, f.x));
    return;
  }

  // Handle sidestep state
  if (f.state === 'sidestep') {
    f.sidestepFrames--;
    // Active dodge window between frames 4 and 14
    if (f.sidestepFrames >= 4 && f.sidestepFrames <= 14) {
      f.isSidestepping = true;
      f.z = f.sidestepDirection;
    } else {
      f.isSidestepping = false;
      f.z = 0;
    }

    if (f.sidestepFrames <= 0) {
      f.state = 'idle';
      f.isSidestepping = false;
      f.z = 0;
      f.stateTime = 0;
    }
    return;
  }

  // Grounded movement for neutral states (idle, walk, crouch)
  if (f.state === 'idle' || f.state === 'walk_forward' || f.state === 'walk_back' || f.state === 'crouch') {
    // Determine auto-facing based on opponent position
    f.facing = f.x <= opponentX ? 1 : -1;

    // Jump initiation
    if (inputs.up && !inputs.down) {
      f.state = 'jump';
      f.isGrounded = false;
      f.isCrouching = false;
      f.isBlocking = false;
      f.vy = -f.def.stats.jumpSpeed;
      f.stateTime = 0;

      // Jump direction
      const forwardKey = f.facing === 1 ? inputs.right : inputs.left;
      const backKey = f.facing === 1 ? inputs.left : inputs.right;
      if (forwardKey) {
        f.vx = f.facing * 4.2;
      } else if (backKey) {
        f.vx = -f.facing * 3.6;
      } else {
        f.vx = 0;
      }
      return;
    }

    // Crouch handling
    if (inputs.down) {
      f.isCrouching = true;
      f.state = 'crouch';
      f.vx = 0;

      // Crouch block if holding back + down
      const holdingBack = f.facing === 1 ? inputs.left : inputs.right;
      f.isBlocking = holdingBack;
      return;
    } else {
      f.isCrouching = false;
    }

    // Horizontal walk handling
    const holdingForward = f.facing === 1 ? inputs.right : inputs.left;
    const holdingBack = f.facing === 1 ? inputs.left : inputs.right;

    if (holdingForward && !holdingBack) {
      f.state = 'walk_forward';
      f.vx = f.facing * f.def.stats.walkSpeed;
      f.isBlocking = false;
    } else if (holdingBack && !holdingForward) {
      f.state = 'walk_back';
      f.vx = -f.facing * f.def.stats.backWalkSpeed;
      // Holding back activates standing block when attacked
      f.isBlocking = true;
    } else {
      f.state = 'idle';
      f.vx = 0;
      f.isBlocking = false;
    }

    f.x += f.vx;
    // Stage bounds clamping
    f.x = Math.max(LEFT_WALL, Math.min(RIGHT_WALL, f.x));
  } else if (f.state === 'hitstun' || f.state === 'blockstun') {
    // Slide backwards from pushback
    f.x += f.vx;
    f.vx *= 0.85; // friction
    f.x = Math.max(LEFT_WALL, Math.min(RIGHT_WALL, f.x));
  } else if (f.state === 'attack') {
    // Attack forward motion
    if (f.currentMove && f.frameInMove < f.currentMove.startup) {
      const step = f.currentMove.forwardMotion ?? 0;
      f.x += f.facing * (step / f.currentMove.startup);
      f.x = Math.max(LEFT_WALL, Math.min(RIGHT_WALL, f.x));
    }
  }
}
