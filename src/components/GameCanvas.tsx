'use client';

import React, { useRef, useEffect } from 'react';
import { GameState } from '../game/types';
import { drawStage } from '../game/render/stages';
import { drawFighterSkeleton } from '../game/render/skeletonRenderer';
import { getActiveHitbox, getHurtboxes } from '../game/physics/collision';
import { STAGE_WIDTH, STAGE_HEIGHT } from '../game/physics/collision';
import { soundEngine } from '../game/audio/soundEngine';

interface GameCanvasProps {
  state: GameState;
  reducedMotion?: boolean;
  onToggleDebug?: () => void;
  onPause?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  state,
  reducedMotion = false,
  onToggleDebug,
  onPause,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastP1State = useRef<string>(state.p1.state);
  const lastP2State = useRef<string>(state.p2.state);
  const lastCinematicActive = useRef<boolean>(false);

  // Tab blur pause listener
  useEffect(() => {
    const handleBlur = () => {
      if (onPause) onPause();
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [onPause]);

  // Keyboard shortcut listener for F1 Debug Hitboxes & Esc Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'F1') {
        e.preventDefault();
        if (onToggleDebug) onToggleDebug();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (onPause) onPause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleDebug, onPause]);

  // Audio triggers based on state transitions
  useEffect(() => {
    // Check if ultimate cinematic started
    if (state.cinematic?.active && !lastCinematicActive.current) {
      soundEngine.playUltimateStartup();
    }
    // Check if ultimate damage impact applied
    if (state.cinematic?.phase === 'impact' && !state.cinematic.damageApplied) {
      soundEngine.playUltimateImpact();
    }
    lastCinematicActive.current = !!state.cinematic?.active;

    // Check hit sounds
    if (state.p1.state === 'hitstun' && lastP1State.current !== 'hitstun') {
      soundEngine.playHitHeavy();
    } else if (state.p1.state === 'blockstun' && lastP1State.current !== 'blockstun') {
      soundEngine.playBlock();
    } else if (state.p1.state === 'ko' && lastP1State.current !== 'ko') {
      soundEngine.playKO();
    }

    if (state.p2.state === 'hitstun' && lastP2State.current !== 'hitstun') {
      soundEngine.playHitHeavy();
    } else if (state.p2.state === 'blockstun' && lastP2State.current !== 'blockstun') {
      soundEngine.playBlock();
    } else if (state.p2.state === 'ko' && lastP2State.current !== 'ko') {
      soundEngine.playKO();
    }

    lastP1State.current = state.p1.state;
    lastP2State.current = state.p2.state;
  }, [state.p1.state, state.p2.state, state.cinematic]);

  // Main Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);

    // Apply Camera Transforms (Zoom & Screen Shake)
    const zoom = reducedMotion ? 1.0 : state.camera.zoom;
    const shakeX =
      reducedMotion || state.screenShake <= 0
        ? 0
        : (Math.random() - 0.5) * state.screenShake * 1.5;
    const shakeY =
      reducedMotion || state.screenShake <= 0
        ? 0
        : (Math.random() - 0.5) * state.screenShake * 1.5;

    // Camera center point: midpoint between fighters
    const midX = (state.p1.x + state.p2.x) * 0.5;
    const midY = (state.p1.y + state.p2.y) * 0.5;

    ctx.translate(STAGE_WIDTH * 0.5 + shakeX, STAGE_HEIGHT * 0.5 + shakeY);
    ctx.scale(zoom, zoom);
    ctx.translate(-midX, -midY + 70);

    // 1. Draw Parallax Background Stage
    drawStage(ctx, state.stageId, midX);

    // 2. Draw Fighter Skeletons
    drawFighterSkeleton(ctx, state.p1, reducedMotion);
    drawFighterSkeleton(ctx, state.p2, reducedMotion);

    // 3. Draw Neon Particles (Sparks & Auras)
    state.particles.forEach((p) => {
      ctx.save();
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Draw Floating Combat Text
    state.flyTexts.forEach((t) => {
      ctx.save();
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = t.color;
      ctx.font = `black ${t.size}px monospace`;
      ctx.textAlign = 'center';
      const alpha = Math.max(0, 1 - t.life / t.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });

    // 5. Draw Debug Hitboxes & Hurtboxes (F1 Toggle)
    if (state.debugHitboxes) {
      // P1 Hurtboxes (Green)
      const p1Hurt = getHurtboxes(state.p1);
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1.5;
      p1Hurt.forEach((box) => ctx.strokeRect(box.x, box.y, box.width, box.height));

      // P2 Hurtboxes (Green)
      const p2Hurt = getHurtboxes(state.p2);
      p2Hurt.forEach((box) => ctx.strokeRect(box.x, box.y, box.width, box.height));

      // Active Hitboxes (Red)
      const p1Hit = getActiveHitbox(state.p1);
      if (p1Hit) {
        ctx.strokeStyle = '#ff0033';
        ctx.fillStyle = 'rgba(255, 0, 50, 0.25)';
        ctx.fillRect(p1Hit.x, p1Hit.y, p1Hit.width, p1Hit.height);
        ctx.strokeRect(p1Hit.x, p1Hit.y, p1Hit.width, p1Hit.height);
      }

      const p2Hit = getActiveHitbox(state.p2);
      if (p2Hit) {
        ctx.strokeStyle = '#ff0033';
        ctx.fillStyle = 'rgba(255, 0, 50, 0.25)';
        ctx.fillRect(p2Hit.x, p2Hit.y, p2Hit.width, p2Hit.height);
        ctx.strokeRect(p2Hit.x, p2Hit.y, p2Hit.width, p2Hit.height);
      }
    }

    ctx.restore();

    // 6. Fullscreen Flash Overlays (Ultimate or Heavy Impact)
    if (state.screenFlash && !reducedMotion && state.flashOpacity > 0) {
      ctx.save();
      ctx.fillStyle = state.screenFlash;
      ctx.globalAlpha = state.flashOpacity;
      ctx.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
      ctx.restore();
    }
  }, [state, reducedMotion]);

  return (
    <div className="relative w-full aspect-[12/7] max-h-[85vh] bg-black rounded-lg overflow-hidden border border-slate-800 shadow-[0_0_32px_rgba(0,0,0,0.9)]">
      <canvas
        ref={canvasRef}
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
