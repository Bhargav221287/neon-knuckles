'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, RawInputs, FighterDefinition, MatchScore } from '../game/types';
import { createInitialGameState, FightingEngine } from '../game/engine';
import { ALL_FIGHTERS, getFighter, isFighterUnlocked } from '../game/fighters';
import { DifficultyLevel } from '../game/difficulty';
import { AIBrain } from '../game/ai/brain';
import { KeyBindingsManager } from '../game/input/KeyBindings';
import { GamepadManager } from '../game/input/GamepadManager';
import { soundEngine } from '../game/audio/soundEngine';
import { LocalStorageManager, UserSettings } from '../lib/storage';
import { calculateMatchScore } from '../game/scoring';
import { STAGES } from '../game/render/stages';

import { MainMenu } from '../components/MainMenu';
import { CharacterSelect } from '../components/CharacterSelect';
import { GameCanvas } from '../components/GameCanvas';
import { HUD } from '../components/HUD';
import { TouchControls } from '../components/TouchControls';
import { TrainingOverlay } from '../components/TrainingOverlay';
import { PauseModal } from '../components/PauseModal';
import { ResultsModal } from '../components/ResultsModal';
import { LeaderboardView } from '../components/LeaderboardView';
import { SettingsModal } from '../components/SettingsModal';

type AppView = 'menu' | 'char_select' | 'fight' | 'leaderboard';

export default function Home() {
  const [view, setView] = useState<AppView>('menu');
  const [mode, setMode] = useState<'arcade' | 'versus' | 'training'>('arcade');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal');
  const [arcadeStage, setArcadeStage] = useState(1);
  const [arcadeOpponents, setArcadeOpponents] = useState<string[]>([]);

  const [p1Def, setP1Def] = useState<FighterDefinition>(ALL_FIGHTERS[0]);
  const [p2Def, setP2Def] = useState<FighterDefinition>(ALL_FIGHTERS[1]);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [matchScore, setMatchScore] = useState<MatchScore | null>(null);
  const [unlockedFighterNotification, setUnlockedFighterNotification] = useState<string | null>(null);
  const [unlockedList, setUnlockedList] = useState<string[]>(() => LocalStorageManager.getUnlockedFighters());
  const [settings, setSettings] = useState<UserSettings>(() => LocalStorageManager.getSettings());

  const [keyBindings] = useState(() => new KeyBindingsManager());
  const [ultimateKeyLabel, setUltimateKeyLabel] = useState(() =>
    keyBindings.formatKeyName(keyBindings.getP1Keys().ultimate)
  );

  // References for Engine, AI Brain, and Gamepad
  const engineRef = useRef<FightingEngine>(new FightingEngine());
  const aiRef = useRef<AIBrain>(new AIBrain());
  const gamepadRef = useRef<GamepadManager>(new GamepadManager());
  const touchInputsRef = useRef<RawInputs>({
    up: false,
    down: false,
    left: false,
    right: false,
    lp: false,
    rp: false,
    lk: false,
    rk: false,
    ultimate: false,
  });

  const gameStateRef = useRef<GameState | null>(null);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const roundEndDelayRef = useRef(0);

  // Match stats accumulators for scoring
  const matchStatsRef = useRef({
    totalTimeRemaining: 0,
    maxCombo: 0,
    perfectRounds: 0,
    ultimatesLanded: 0,
    matchesWon: 0,
  });

  // Global Keyboard input capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundEngine.resume();
      keyBindings.handleKeyDown(e.code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyBindings.handleKeyUp(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keyBindings]);

  // Apply audio settings
  useEffect(() => {
    soundEngine.setSfxVolume(settings.sfxVolume);
    soundEngine.setMusicVolume(settings.musicVolume);
    soundEngine.setMuted(settings.isMuted);
  }, [settings]);

  // Initialize a match
  const initMatch = useCallback(
    (
      player1: FighterDefinition,
      player2: FighterDefinition,
      diff: DifficultyLevel,
      gameMode: 'arcade' | 'versus' | 'training',
      stageNum = 1
    ) => {
      const stageId = STAGES[(stageNum - 1) % STAGES.length].id;
      const initial = createInitialGameState(player1, player2, diff, gameMode, stageId);

      engineRef.current.resetBuffers();
      aiRef.current.reset();
      roundEndDelayRef.current = 0;

      setGameState(initial);
      setIsPaused(false);
      setShowResults(false);
      setView('fight');

      soundEngine.startBGM();
    },
    []
  );

  // Match ending handler
  const handleMatchEnd = useCallback(
    (finalState: GameState) => {
      const isP1Winner = finalState.winner === 'p1';

      if (mode === 'arcade' && isP1Winner && arcadeStage < 5) {
        // Advance to next arcade stage!
        const nextStage = arcadeStage + 1;
        setArcadeStage(nextStage);
        matchStatsRef.current.matchesWon++;
        matchStatsRef.current.totalTimeRemaining += Math.ceil(finalState.timerFrames / 60);

        const nextOpponentId = arcadeOpponents[nextStage - 1] || ALL_FIGHTERS[nextStage].id;
        const nextOpponent = getFighter(nextOpponentId);
        setP2Def(nextOpponent);

        initMatch(p1Def, nextOpponent, difficulty, 'arcade', nextStage);
        return;
      }

      // Arcade complete or defeat!
      const finalScore = calculateMatchScore({
        difficulty: finalState.difficulty,
        totalTimeRemainingSeconds:
          matchStatsRef.current.totalTimeRemaining + Math.ceil(finalState.timerFrames / 60),
        finalHealthPercent: Math.round((finalState.p1.health / finalState.p1.maxHealth) * 100),
        maxCombo: matchStatsRef.current.maxCombo,
        perfectRounds: matchStatsRef.current.perfectRounds,
        ultimatesLanded: matchStatsRef.current.ultimatesLanded,
        matchesWon: matchStatsRef.current.matchesWon + (isP1Winner ? 1 : 0),
      });

      setMatchScore(finalScore);

      // Check unlocks
      let unlockId: string | null = null;
      if (mode === 'arcade' && isP1Winner && arcadeStage >= 5) {
        if (difficulty === 'hard') {
          LocalStorageManager.unlockFighter('titan');
          unlockId = 'titan';
        } else if (difficulty === 'nightmare') {
          LocalStorageManager.unlockFighter('zero');
          unlockId = 'zero';
        }
        setUnlockedList(LocalStorageManager.getUnlockedFighters());
      }
      setUnlockedFighterNotification(unlockId);
      setShowResults(true);
    },
    [mode, arcadeStage, arcadeOpponents, difficulty, initMatch, p1Def]
  );

  // Main 60 FPS deterministic game loop
  useEffect(() => {
    if (view !== 'fight' || isPaused || !gameState) return;

    let animId: number;
    let lastTime = performance.now();
    const frameDuration = 1000 / 60; // 16.666ms

    const loop = (currentTime: number) => {
      const delta = currentTime - lastTime;

      if (delta >= frameDuration - 2) {
        lastTime = currentTime;
        const current = gameStateRef.current;
        if (current && !current.matchOver) {
          // 1. Gather P1 Inputs (Keyboard + Gamepad 0 + Touch)
          const keyP1 = keyBindings.getRawInputs('p1');
          const padP1 = gamepadRef.current.pollGamepad(0);
          const touch = touchInputsRef.current;

          const p1Input: RawInputs = {
            up: keyP1.up || !!padP1?.up || touch.up,
            down: keyP1.down || !!padP1?.down || touch.down,
            left: keyP1.left || !!padP1?.left || touch.left,
            right: keyP1.right || !!padP1?.right || touch.right,
            lp: keyP1.lp || !!padP1?.lp || touch.lp,
            rp: keyP1.rp || !!padP1?.rp || touch.rp,
            lk: keyP1.lk || !!padP1?.lk || touch.lk,
            rk: keyP1.rk || !!padP1?.rk || touch.rk,
            ultimate: keyP1.ultimate || !!padP1?.ultimate || touch.ultimate,
          };

          // 2. Gather P2 Inputs (Keyboard 2P / Gamepad 1 OR AI Brain)
          let p2Input: RawInputs;
          if (current.mode === 'versus') {
            const keyP2 = keyBindings.getRawInputs('p2');
            const padP2 = gamepadRef.current.pollGamepad(1);
            p2Input = {
              up: keyP2.up || !!padP2?.up,
              down: keyP2.down || !!padP2?.down,
              left: keyP2.left || !!padP2?.left,
              right: keyP2.right || !!padP2?.right,
              lp: keyP2.lp || !!padP2?.lp,
              rp: keyP2.rp || !!padP2?.rp,
              lk: keyP2.lk || !!padP2?.lk,
              rk: keyP2.rk || !!padP2?.rk,
              ultimate: keyP2.ultimate || !!padP2?.ultimate,
            };
          } else if (current.mode === 'training') {
            // Training dummy controls
            const dummyMode = current.trainingSettings?.dummyBehavior || 'idle';
            if (dummyMode === 'block_all' || dummyMode === 'block_high') {
              p2Input = {
                up: false,
                down: false,
                left: current.p2.facing === 1,
                right: current.p2.facing === -1,
                lp: false,
                rp: false,
                lk: false,
                rk: false,
                ultimate: false,
              };
            } else if (dummyMode === 'block_low') {
              p2Input = {
                up: false,
                down: true,
                left: current.p2.facing === 1,
                right: current.p2.facing === -1,
                lp: false,
                rp: false,
                lk: false,
                rk: false,
                ultimate: false,
              };
            } else if (dummyMode === 'random') {
              p2Input = aiRef.current.update(current.p2, current.p1, current, current.difficulty);
            } else {
              // Idle
              p2Input = {
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
            }
          } else {
            // Arcade AI Opponent
            p2Input = aiRef.current.update(current.p2, current.p1, current, current.difficulty);
          }

          // 3. Update Fighting Engine Deterministically
          engineRef.current.update(current, p1Input, p2Input, settings.reducedMotion);

          // Track stats
          if (current.p1.comboCount > matchStatsRef.current.maxCombo) {
            matchStatsRef.current.maxCombo = current.p1.comboCount;
          }
          if (
            current.cinematic?.phase === 'impact' &&
            current.cinematic.attacker === 'p1' &&
            !current.cinematic.damageApplied
          ) {
            matchStatsRef.current.ultimatesLanded++;
          }

          // 4. Handle Round End or Match End
          if (current.roundOver) {
            roundEndDelayRef.current++;
            if (roundEndDelayRef.current > 90) {
              roundEndDelayRef.current = 0;

              if (
                current.p1.roundsWon > current.p1.roundsWon - 1 &&
                current.p1.health === current.p1.maxHealth
              ) {
                matchStatsRef.current.perfectRounds++;
              }

              if (current.matchOver) {
                handleMatchEnd(current);
              } else {
                engineRef.current.startNextRound(current);
                aiRef.current.reset();
              }
            }
          }

          // Trigger React re-render of HUD
          setGameState({ ...current });
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [view, isPaused, gameState, settings.reducedMotion, keyBindings, handleMatchEnd]);

  // Touch control callbacks
  const handleTouchDown = (key: keyof RawInputs) => {
    touchInputsRef.current[key] = true;
  };
  const handleTouchUp = (key: keyof RawInputs) => {
    touchInputsRef.current[key] = false;
  };

  // Navigation handlers
  const startArcade = (diff: DifficultyLevel) => {
    setMode('arcade');
    setDifficulty(diff);
    setArcadeStage(1);

    const pool = ALL_FIGHTERS.map((f) => f.id);
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const opponents = shuffled.slice(0, 4);
    const isZeroUnlocked = isFighterUnlocked('zero', unlockedList);
    opponents.push(isZeroUnlocked ? 'zero' : shuffled[4] || 'brutus');
    setArcadeOpponents(opponents);

    matchStatsRef.current = {
      totalTimeRemaining: 0,
      maxCombo: 0,
      perfectRounds: 0,
      ultimatesLanded: 0,
      matchesWon: 0,
    };

    setView('char_select');
  };

  const startVersus = () => {
    setMode('versus');
    setView('char_select');
  };

  const startTraining = () => {
    setMode('training');
    setView('char_select');
  };

  const handleSelectFighters = (p1: FighterDefinition, p2: FighterDefinition) => {
    setP1Def(p1);
    setP2Def(p2);
    initMatch(p1, p2, difficulty, mode, 1);
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Background Neon Grid Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,0,255,0.25),rgba(255,255,255,0))] pointer-events-none" />

      {/* View Switcher */}
      {view === 'menu' && (
        <MainMenu
          onStartArcade={startArcade}
          onStartVersus={startVersus}
          onStartTraining={startTraining}
          onOpenLeaderboard={() => setView('leaderboard')}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {view === 'char_select' && (
        <CharacterSelect
          unlockedList={unlockedList}
          mode={mode}
          onSelectFighter={handleSelectFighters}
          onBack={() => setView('menu')}
        />
      )}

      {view === 'leaderboard' && <LeaderboardView onBack={() => setView('menu')} />}

      {view === 'fight' && gameState && (
        <div className="relative w-full max-w-6xl p-2 flex flex-col items-center">
          {/* Main Stage Viewport Canvas */}
          <GameCanvas
            state={gameState}
            reducedMotion={settings.reducedMotion}
            onToggleDebug={() => {
              setGameState((prev) => {
                if (!prev) return null;
                return { ...prev, debugHitboxes: !prev.debugHitboxes };
              });
            }}
            onPause={() => setIsPaused(true)}
          />

          {/* Heads-Up Display (HUD) */}
          <HUD state={gameState} ultimateKeyLabel={ultimateKeyLabel} />

          {/* Mobile Touch Controls */}
          <TouchControls
            onInputDown={handleTouchDown}
            onInputUp={handleTouchUp}
            showUltimate={gameState.p1.meterGlow}
            ultimateKeyLabel={ultimateKeyLabel}
          />

          {/* Training Mode Overlay Toolbar */}
          {mode === 'training' && (
            <TrainingOverlay
              state={gameState}
              onSetDummyBehavior={(behavior) => {
                setGameState((prev) => {
                  if (!prev) return null;
                  const trainingSettings = prev.trainingSettings || { dummyBehavior: 'idle', autoMeter: false };
                  return { ...prev, trainingSettings: { ...trainingSettings, dummyBehavior: behavior } };
                });
              }}
              onFillMeter={() => {
                soundEngine.playHitLight();
                setGameState((prev) => {
                  if (!prev) return null;
                  const updatedP1 = { ...prev.p1, meter: 100, meterGlow: true };
                  return { ...prev, p1: updatedP1 };
                });
              }}
              onResetPositions={() => {
                setGameState((prev) => {
                  if (!prev) return null;
                  const updatedP1 = { ...prev.p1, x: 460, y: 560, vx: 0, vy: 0, state: 'idle' as const };
                  const updatedP2 = { ...prev.p2, x: 740, y: 560, vx: 0, vy: 0, state: 'idle' as const };
                  return { ...prev, p1: updatedP1, p2: updatedP2 };
                });
              }}
            />
          )}

          {/* Pause Modal (Esc) */}
          {isPaused && (
            <PauseModal
              fighter={p1Def}
              ultimateKeyLabel={ultimateKeyLabel}
              onResume={() => setIsPaused(false)}
              onRestart={() => initMatch(p1Def, p2Def, difficulty, mode, arcadeStage)}
              onQuit={() => {
                soundEngine.stopBGM();
                setView('menu');
              }}
            />
          )}

          {/* Results Modal */}
          {showResults && matchScore && (
            <ResultsModal
              isVictory={gameState.winner === 'p1'}
              score={matchScore}
              characterId={p1Def.id}
              unlockedFighterId={unlockedFighterNotification}
              onPlayAgain={() => initMatch(p1Def, p2Def, difficulty, mode, 1)}
              onQuit={() => {
                soundEngine.stopBGM();
                setView('menu');
              }}
            />
          )}
        </div>
      )}

      {/* Global Settings Modal */}
      {showSettings && (
        <SettingsModal
          keyBindings={keyBindings}
          onClose={() => {
            setUltimateKeyLabel(keyBindings.formatKeyName(keyBindings.getP1Keys().ultimate));
            setShowSettings(false);
          }}
          onSettingsChange={(s) => setSettings(s)}
        />
      )}
    </main>
  );
}
