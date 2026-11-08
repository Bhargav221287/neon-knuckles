'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ALL_FIGHTERS, isFighterUnlocked } from '../game/fighters';
import { FighterDefinition } from '../game/types';
import { drawProceduralPortrait } from '../game/render/proceduralPortraits';
import { soundEngine } from '../game/audio/soundEngine';

interface CharacterSelectProps {
  unlockedList: string[];
  mode: 'arcade' | 'versus' | 'training';
  onSelectFighter: (p1: FighterDefinition, p2: FighterDefinition) => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  unlockedList,
  mode,
  onSelectFighter,
  onBack,
}) => {
  const [p1Index, setP1Index] = useState(0);
  const [p2Index, setP2Index] = useState(1);
  const [selectingPlayer, setSelectingPlayer] = useState<'p1' | 'p2'>('p1');
  const [activeTab, setActiveTab] = useState<'stats' | 'moves' | 'ultimate'>('stats');

  const selectedDef = selectingPlayer === 'p1' ? ALL_FIGHTERS[p1Index] : ALL_FIGHTERS[p2Index];
  const isSelectedLocked = !isFighterUnlocked(selectedDef.id, unlockedList);

  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // Draw procedural portraits for all 8 fighters in the grid
  useEffect(() => {
    ALL_FIGHTERS.forEach((fighter, idx) => {
      const canvas = canvasRefs.current[idx];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const locked = !isFighterUnlocked(fighter.id, unlockedList);
      drawProceduralPortrait(ctx, fighter, canvas.width, canvas.height, locked);
    });
  }, [unlockedList]);

  const confirmSelection = useCallback(() => {
    if (isSelectedLocked) {
      soundEngine.playUltimateDenied();
      return;
    }

    soundEngine.playHitHeavy();

    if (mode === 'versus' && selectingPlayer === 'p1') {
      setSelectingPlayer('p2');
    } else {
      const p1Fighter = ALL_FIGHTERS[p1Index];
      const p2Fighter =
        mode === 'versus'
          ? ALL_FIGHTERS[p2Index]
          : ALL_FIGHTERS.filter((f) => f.id !== p1Fighter.id && isFighterUnlocked(f.id, unlockedList))[0] ||
            ALL_FIGHTERS[1];

      onSelectFighter(p1Fighter, p2Fighter);
    }
  }, [isSelectedLocked, mode, selectingPlayer, p1Index, p2Index, unlockedList, onSelectFighter]);

  // Handle keyboard navigation (Arrow keys / WASD, Enter to confirm, Esc to back)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.code === 'KeyD') {
        soundEngine.playClick();
        if (selectingPlayer === 'p1') {
          setP1Index((prev) => (prev + 1) % ALL_FIGHTERS.length);
        } else {
          setP2Index((prev) => (prev + 1) % ALL_FIGHTERS.length);
        }
      } else if (e.key === 'ArrowLeft' || e.code === 'KeyA') {
        soundEngine.playClick();
        if (selectingPlayer === 'p1') {
          setP1Index((prev) => (prev - 1 + ALL_FIGHTERS.length) % ALL_FIGHTERS.length);
        } else {
          setP2Index((prev) => (prev - 1 + ALL_FIGHTERS.length) % ALL_FIGHTERS.length);
        }
      } else if (e.key === 'Enter' || e.code === 'Space') {
        confirmSelection();
      } else if (e.key === 'Escape') {
        onBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectingPlayer, confirmSelection, onBack]);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-6xl mx-auto min-h-[85vh] p-6 text-white font-mono select-none">
      {/* Header */}
      <div className="flex justify-between items-center w-full border-b border-slate-800 pb-3">
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          ← [ESC] BACK
        </button>
        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 drop-shadow-[0_0_12px_rgba(0,240,255,0.4)]">
          CHOOSE YOUR FIGHTER
        </h1>
        <div className="text-xs text-yellow-400 border border-yellow-500/40 px-2.5 py-1 rounded">
          {mode.toUpperCase()} MODE: SELECTING {selectingPlayer.toUpperCase()}
        </div>
      </div>

      {/* Main Grid & Preview Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full my-auto items-center">
        {/* Left: 8 Fighter Portrait Grid (7 cols) */}
        <div className="md:col-span-7 grid grid-cols-4 gap-3">
          {ALL_FIGHTERS.map((fighter, idx) => {
            const isP1 = p1Index === idx;
            const isP2 = mode === 'versus' && p2Index === idx;
            const isCurrent = selectingPlayer === 'p1' ? isP1 : isP2;

            return (
              <div
                key={fighter.id}
                onClick={() => {
                  soundEngine.playClick();
                  if (selectingPlayer === 'p1') setP1Index(idx);
                  else setP2Index(idx);
                }}
                className={`relative cursor-pointer aspect-square rounded-lg overflow-hidden border-2 transition-all p-1.5 flex flex-col items-center justify-center ${
                  isCurrent
                    ? 'border-yellow-400 shadow-[0_0_16px_#ffff00] scale-105 z-10 bg-slate-900/90'
                    : isP1
                    ? 'border-cyan-400 shadow-[0_0_12px_#00f0ff] bg-slate-950/70'
                    : isP2
                    ? 'border-rose-400 shadow-[0_0_12px_#ff0055] bg-slate-950/70'
                    : 'border-slate-800 hover:border-slate-600 bg-slate-950/50'
                }`}
              >
                <canvas
                  ref={(el) => {
                    canvasRefs.current[idx] = el;
                  }}
                  width={110}
                  height={110}
                  className="w-full h-full object-contain"
                />

                {/* Selection Badges */}
                {isP1 && (
                  <span className="absolute top-1 left-1 bg-cyan-500 text-black font-black text-[9px] px-1 rounded shadow">
                    P1
                  </span>
                )}
                {mode === 'versus' && isP2 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-black font-black text-[9px] px-1 rounded shadow">
                    P2
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Selected Fighter Profile & Details (5 cols) */}
        <div className="md:col-span-5 bg-slate-950/90 border border-slate-800 rounded-lg p-5 flex flex-col justify-between shadow-[0_0_24px_rgba(0,0,0,0.8)] h-full min-h-[380px]">
          {isSelectedLocked ? (
            <div className="my-auto text-center flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 rounded-full border-2 border-red-500/60 flex items-center justify-center text-red-500 text-3xl font-black mb-3">
                🔒
              </div>
              <h2 className="text-xl font-bold text-slate-300 mb-2">LOCKED FIGHTER</h2>
              <p className="text-sm text-yellow-400 font-sans max-w-xs mb-4">
                {selectedDef.unlockCondition === 'arcade_hard'
                  ? 'Unlock by completing the Arcade Ladder on Hard difficulty!'
                  : selectedDef.unlockCondition === 'arcade_nightmare'
                  ? 'Unlock by defeating the final boss on Nightmare difficulty!'
                  : 'Unlock condition locked.'}
              </p>
            </div>
          ) : (
            <div>
              {/* Name & Title */}
              <div className="border-b border-slate-800/80 pb-3 mb-3">
                <div className="flex justify-between items-baseline">
                  <h2
                    className="text-2xl font-black tracking-wider"
                    style={{ color: selectedDef.skeleton.glowColor }}
                  >
                    {selectedDef.name.toUpperCase()}
                  </h2>
                  <span className="text-xs text-slate-400 uppercase">
                    HP: {selectedDef.stats.health}
                  </span>
                </div>
                <div className="text-xs text-cyan-400 font-sans tracking-wide">
                  {selectedDef.title}
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2">
                  {selectedDef.bio}
                </p>
              </div>

              {/* Detail Tabs */}
              <div className="flex gap-2 border-b border-slate-800/80 pb-2 mb-3 text-xs">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-2 py-1 rounded transition-colors ${
                    activeTab === 'stats'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  STATS
                </button>
                <button
                  onClick={() => setActiveTab('moves')}
                  className={`px-2 py-1 rounded transition-colors ${
                    activeTab === 'moves'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  MOVES & COMBOS
                </button>
                <button
                  onClick={() => setActiveTab('ultimate')}
                  className={`px-2 py-1 rounded transition-colors ${
                    activeTab === 'ultimate'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  ULTIMATE STRIKE
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'stats' && (
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-400">Walk Speed:</span>
                      <span className="text-cyan-300 font-bold">{selectedDef.stats.walkSpeed}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full"
                        style={{ width: `${(selectedDef.stats.walkSpeed / 5.5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-400">Weight & Density:</span>
                      <span className="text-emerald-300 font-bold">{selectedDef.stats.weight}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full"
                        style={{ width: `${(selectedDef.stats.weight / 130) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-400">Sidestep Agility:</span>
                      <span className="text-pink-300 font-bold">{selectedDef.stats.sidestepSpeed}</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                      <div
                        className="bg-pink-400 h-full"
                        style={{ width: `${(selectedDef.stats.sidestepSpeed / 6.0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'moves' && (
                <div className="space-y-2 text-[11px] max-h-48 overflow-y-auto pr-1">
                  <div className="font-bold text-yellow-400">SIGNATURE STRING COMBOS:</div>
                  {selectedDef.stringCombos.map((combo, i) => (
                    <div key={i} className="bg-slate-900/60 p-1.5 rounded border border-slate-800">
                      <div className="text-cyan-300 font-bold">{combo.name}</div>
                      <div className="text-yellow-300 font-mono tracking-widest">{combo.sequence.join(' ➔ ')}</div>
                      <div className="text-[10px] text-slate-400">{combo.description}</div>
                    </div>
                  ))}
                  <div className="font-bold text-emerald-400 mt-2">COMMAND THROW:</div>
                  <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800 flex justify-between">
                    <span className="text-slate-300">{selectedDef.throwMove.name}</span>
                    <span className="text-amber-400 font-bold">LP + LK</span>
                  </div>
                </div>
              )}

              {activeTab === 'ultimate' && (
                <div className="bg-gradient-to-br from-yellow-950/30 to-amber-950/20 border border-yellow-500/40 p-3 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-yellow-300 text-sm">
                      {selectedDef.ultimateMove.name}
                    </span>
                    <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded font-black text-[10px]">
                      KEY: [Q]
                    </span>
                  </div>
                  <div className="text-rose-400 font-bold text-xs">
                    DAMAGE: EXACTLY 30% OF TARGET MAX HEALTH
                  </div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    Unleashes an unblockable overdrive strike when the meter is full (100). Deals fixed 30% max health damage. Whiffs if target jumps or sidesteps.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={confirmSelection}
            disabled={isSelectedLocked}
            className={`w-full mt-4 py-2.5 rounded font-black text-sm tracking-widest transition-all uppercase ${
              isSelectedLocked
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-black shadow-[0_0_16px_rgba(0,240,255,0.4)]'
            }`}
          >
            {isSelectedLocked ? 'FIGHTER LOCKED' : `CONFIRM ${selectingPlayer.toUpperCase()}`}
          </button>
        </div>
      </div>

      {/* Footer Controls reminder */}
      <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 w-full">
        [A / D] Navigate &nbsp;|&nbsp; [ENTER / SPACE] Select &nbsp;|&nbsp; [ESC] Back
      </div>
    </div>
  );
};
