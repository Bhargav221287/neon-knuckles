import { FighterRuntime, JointAngles } from '../types';

/**
 * Draws a rounded capsule with neon glow on a 2D canvas context.
 */
export function drawCapsule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius: number,
  fillColor: string,
  strokeColor: string,
  glowColor: string,
  glowBlur = 12
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;

  const nx = -dy / len;
  const ny = dx / len;

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = glowBlur;
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  // Arc around start
  ctx.arc(x1, y1, radius, Math.atan2(ny, nx), Math.atan2(-ny, -nx));
  // Arc around end
  ctx.arc(x2, y2, radius, Math.atan2(-ny, -nx), Math.atan2(ny, nx));
  ctx.closePath();

  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Returns joint angles based on current state, move pose, or posture.
 */
export function getInterpolatedJointAngles(f: FighterRuntime): JointAngles {
  const base = f.isCrouching
    ? f.def.crouchPose
    : !f.isGrounded
    ? f.def.jumpPose
    : f.def.idlePose;

  const angles: JointAngles = { ...base };

  // Idle breathing cycle
  if (f.state === 'idle') {
    const breath = Math.sin(f.stateTime * 0.08) * 0.04;
    angles.torsoAngle += breath;
    angles.leftShoulder += breath * 0.5;
    angles.rightShoulder -= breath * 0.5;
    angles.leftHip -= breath * 0.3;
    angles.rightHip += breath * 0.3;
  } else if (f.state === 'walk_forward') {
    // Walking stride
    const stride = Math.sin(f.stateTime * 0.22);
    angles.leftHip = base.leftHip + stride * 0.5;
    angles.rightHip = base.rightHip - stride * 0.5;
    angles.leftKnee = base.leftKnee - Math.max(0, stride * 0.6);
    angles.rightKnee = base.rightKnee - Math.max(0, -stride * 0.6);
    angles.leftShoulder = base.leftShoulder - stride * 0.4;
    angles.rightShoulder = base.rightShoulder + stride * 0.4;
  } else if (f.state === 'walk_back') {
    // Retreating stride
    const stride = Math.sin(f.stateTime * 0.18);
    angles.leftHip = base.leftHip - stride * 0.4;
    angles.rightHip = base.rightHip + stride * 0.4;
    angles.leftKnee = base.leftKnee - Math.max(0, -stride * 0.5);
    angles.rightKnee = base.rightKnee - Math.max(0, stride * 0.5);
    angles.torsoAngle -= 0.05;
  } else if (f.state === 'attack' && f.currentMove) {
    const pose = f.currentMove.animPose;
    const progress = Math.min(1, f.frameInMove / (f.currentMove.startup + f.currentMove.active));

    if (pose === 'punch_left') {
      angles.torsoAngle += 0.15 * progress;
      angles.leftShoulder = -0.2 - 1.2 * progress;
      angles.leftElbow = -0.2;
    } else if (pose === 'punch_right') {
      angles.torsoAngle += 0.25 * progress;
      angles.rightShoulder = -0.3 - 1.3 * progress;
      angles.rightElbow = -0.2;
    } else if (pose === 'kick_left') {
      angles.leftHip = -1.2 * progress;
      angles.leftKnee = -0.2;
      angles.torsoAngle -= 0.2 * progress;
    } else if (pose === 'kick_right_high') {
      angles.rightHip = -1.6 * progress;
      angles.rightKnee = -0.15;
      angles.torsoAngle -= 0.35 * progress;
    } else if (pose === 'uppercut') {
      angles.torsoAngle += 0.3 * progress;
      angles.rightShoulder = -1.8 * progress;
      angles.rightElbow = -1.2 + 0.9 * progress;
      angles.leftHip = 0.5;
      angles.rightHip = -0.4;
    } else if (pose === 'kick_spiral') {
      angles.rightHip = -1.9 * progress;
      angles.rightKnee = -0.1;
      angles.leftHip = 0.8 * progress;
      angles.torsoAngle = -0.4 * progress;
    } else if (pose === 'sweep_low') {
      angles.torsoAngle = 0.45;
      angles.leftHip = 1.2;
      angles.leftKnee = -1.9;
      angles.rightHip = -1.4 * progress;
      angles.rightKnee = -0.1;
    } else if (pose === 'slide') {
      angles.torsoAngle = 0.55;
      angles.rightHip = -1.6 * progress;
      angles.rightKnee = -0.1;
      angles.leftHip = 1.3;
      angles.leftKnee = -2.0;
    } else if (pose === 'axe_kick') {
      angles.rightHip = -2.1 * progress;
      angles.rightKnee = -0.1;
      angles.torsoAngle = -0.3;
    } else if (pose === 'hook') {
      angles.torsoAngle = 0.35 * progress;
      angles.rightShoulder = -0.6 * progress;
      angles.rightElbow = -1.5;
    }
  } else if (f.state === 'hitstun') {
    // Flinch backwards
    angles.torsoAngle = -0.35;
    angles.headAngle = -0.3;
    angles.leftShoulder = -0.5;
    angles.rightShoulder = -0.4;
  } else if (f.state === 'blockstun') {
    // Guard pose
    angles.torsoAngle = -0.15;
    angles.leftShoulder = 0.4;
    angles.leftElbow = -1.8;
    angles.rightShoulder = 0.2;
    angles.rightElbow = -1.7;
  } else if (f.state === 'knockdown') {
    // Prone on ground
    angles.torsoAngle = 1.55;
    angles.headAngle = 0;
    angles.leftHip = 0.1;
    angles.rightHip = 0.1;
    angles.leftKnee = -0.1;
    angles.rightKnee = -0.1;
    angles.leftShoulder = 0.3;
    angles.rightShoulder = 0.3;
  } else if (f.state === 'ultimate_startup') {
    // Charged power stance
    const pulse = Math.sin(f.stateTime * 0.35) * 0.1;
    angles.torsoAngle = -0.15 + pulse;
    angles.leftShoulder = 0.8;
    angles.leftElbow = -1.5;
    angles.rightShoulder = 0.8;
    angles.rightElbow = -1.5;
    angles.leftHip = 0.6;
    angles.rightHip = -0.5;
  }

  return angles;
}

/**
 * Draws a complete procedural neon skeleton fighter.
 */
export function drawFighterSkeleton(
  ctx: CanvasRenderingContext2D,
  f: FighterRuntime,
  reducedMotion = false
): void {
  const sk = f.def.skeleton;
  const angles = getInterpolatedJointAngles(f);
  const facing = f.facing;

  ctx.save();

  // Sidestep Z-scale offset: scale slightly up/down when sidestepping
  const zScale = f.isSidestepping ? 1.0 + f.z * 0.12 : 1.0;
  ctx.translate(f.x, f.y);
  ctx.scale(facing * zScale, zScale);

  // Rage aura when below 20% health
  if (f.isRage && !reducedMotion) {
    ctx.save();
    ctx.shadowColor = '#ff0033';
    ctx.shadowBlur = 24 + Math.sin(f.stateTime * 0.2) * 10;
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -65, 38, 70, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Hip / Pelvis origin point
  const hipX = 0;
  const hipY = f.isCrouching ? -48 : -68;

  // 1. Draw Legs (back leg, then front leg)
  // Left Leg (Back leg)
  const lThighEndX = hipX + Math.sin(angles.leftHip) * sk.thighLength;
  const lThighEndY = hipY + Math.cos(angles.leftHip) * sk.thighLength;
  const lShinEndX = lThighEndX + Math.sin(angles.leftHip + angles.leftKnee) * sk.shinLength;
  const lShinEndY = lThighEndY + Math.cos(angles.leftHip + angles.leftKnee) * sk.shinLength;

  drawCapsule(
    ctx,
    hipX,
    hipY,
    lThighEndX,
    lThighEndY,
    sk.legThickness,
    '#111122',
    sk.secondaryColor,
    sk.glowColor,
    8
  );
  drawCapsule(
    ctx,
    lThighEndX,
    lThighEndY,
    lShinEndX,
    lShinEndY,
    sk.legThickness * 0.85,
    '#050510',
    sk.secondaryColor,
    sk.glowColor,
    8
  );

  // Right Leg (Front leg)
  const rThighEndX = hipX + Math.sin(angles.rightHip) * sk.thighLength;
  const rThighEndY = hipY + Math.cos(angles.rightHip) * sk.thighLength;
  const rShinEndX = rThighEndX + Math.sin(angles.rightHip + angles.rightKnee) * sk.shinLength;
  const rShinEndY = rThighEndY + Math.cos(angles.rightHip + angles.rightKnee) * sk.shinLength;

  drawCapsule(
    ctx,
    hipX,
    hipY,
    rThighEndX,
    rThighEndY,
    sk.legThickness,
    '#1a1a2e',
    sk.primaryColor,
    sk.glowColor,
    14
  );
  drawCapsule(
    ctx,
    rThighEndX,
    rThighEndY,
    rShinEndX,
    rShinEndY,
    sk.legThickness * 0.85,
    '#0f0f20',
    sk.primaryColor,
    sk.glowColor,
    14
  );

  // 2. Torso (Spine & Ribcage)
  const neckX = hipX - Math.sin(angles.torsoAngle) * sk.torsoLength;
  const neckY = hipY - Math.cos(angles.torsoAngle) * sk.torsoLength;

  drawCapsule(
    ctx,
    hipX,
    hipY,
    neckX,
    neckY,
    sk.torsoThickness,
    '#121224',
    sk.primaryColor,
    sk.glowColor,
    16
  );

  // 3. Head & Neon Visor
  const headCenterX = neckX - Math.sin(angles.torsoAngle + angles.headAngle) * (sk.headRadius + 8);
  const headCenterY = neckY - Math.cos(angles.torsoAngle + angles.headAngle) * (sk.headRadius + 8);

  ctx.save();
  ctx.shadowColor = sk.glowColor;
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#0a0a18';
  ctx.strokeStyle = sk.primaryColor;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(headCenterX, headCenterY, sk.headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Neon eye visor slit
  ctx.shadowColor = sk.eyeColor;
  ctx.shadowBlur = 10;
  ctx.fillStyle = sk.eyeColor;
  ctx.beginPath();
  ctx.roundRect(headCenterX + 2, headCenterY - 3, 7, 3, 1.5);
  ctx.fill();
  ctx.restore();

  // 4. Arms (Back arm, then Front arm)
  // Left Arm (Back arm)
  const lShoulderX = neckX;
  const lShoulderY = neckY + 6;
  const lElbowX = lShoulderX + Math.sin(angles.leftShoulder) * sk.upperArmLength;
  const lElbowY = lShoulderY + Math.cos(angles.leftShoulder) * sk.upperArmLength;
  const lHandX = lElbowX + Math.sin(angles.leftShoulder + angles.leftElbow) * sk.forearmLength;
  const lHandY = lElbowY + Math.cos(angles.leftShoulder + angles.leftElbow) * sk.forearmLength;

  drawCapsule(
    ctx,
    lShoulderX,
    lShoulderY,
    lElbowX,
    lElbowY,
    sk.armThickness * 0.9,
    '#111122',
    sk.secondaryColor,
    sk.glowColor,
    8
  );
  drawCapsule(
    ctx,
    lElbowX,
    lElbowY,
    lHandX,
    lHandY,
    sk.armThickness * 0.8,
    '#050510',
    sk.secondaryColor,
    sk.glowColor,
    8
  );

  // Right Arm (Front arm)
  const rShoulderX = neckX;
  const rShoulderY = neckY + 6;
  const rElbowX = rShoulderX + Math.sin(angles.rightShoulder) * sk.upperArmLength;
  const rElbowY = rShoulderY + Math.cos(angles.rightShoulder) * sk.upperArmLength;
  const rHandX = rElbowX + Math.sin(angles.rightShoulder + angles.rightElbow) * sk.forearmLength;
  const rHandY = rElbowY + Math.cos(angles.rightShoulder + angles.rightElbow) * sk.forearmLength;

  drawCapsule(
    ctx,
    rShoulderX,
    rShoulderY,
    rElbowX,
    rElbowY,
    sk.armThickness,
    '#1a1a2e',
    sk.primaryColor,
    sk.glowColor,
    14
  );
  drawCapsule(
    ctx,
    rElbowX,
    rElbowY,
    rHandX,
    rHandY,
    sk.armThickness * 0.85,
    '#0f0f20',
    sk.primaryColor,
    sk.glowColor,
    14
  );

  // Glowing fist/hand capsule
  ctx.save();
  ctx.shadowColor = sk.glowColor;
  ctx.shadowBlur = 12;
  ctx.fillStyle = sk.glowColor;
  ctx.beginPath();
  ctx.arc(rHandX, rHandY, sk.armThickness * 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
