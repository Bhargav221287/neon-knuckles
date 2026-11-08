'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { soundEngine } from '../game/audio/soundEngine';
import { DifficultyLevel } from '../game/difficulty';

interface MainMenuProps {
  onStartArcade: (difficulty: DifficultyLevel) => void;
  onStartVersus: () => void;
  onStartTraining: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartArcade,
  onStartVersus,
  onStartTraining,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('normal');
  const [focusedIndex, setFocusedIndex] = useState(0);

  const menuItems = useMemo(
    () => [
      { label: 'ARCADE LADDER', action: () => setShowDifficultySelect(true) },
      { label: 'VERSUS PRACTICE (2P)', action: onStartVersus },
      { label: 'TRAINING MODE', action: onStartTraining },
      { label: 'LEADERBOARD', action: onOpenLeaderboard },
      { label: 'SETTINGS', action: onOpenSettings },
    ],
    [onStartVersus, onStartTraining, onOpenLeaderboard, onOpenSettings]
  );

  const difficulties: { id: DifficultyLevel; name: string; desc: string }[] = [
    { id: 'easy', name: 'EASY', desc: 'Relaxed AI, 90s timer, 0.7x AI damage, 8-frame buffer' },
    { id: 'normal', name: 'NORMAL', desc: 'Standard arcade challenge, mixed offense and blocking' },
    { id: 'hard', name: 'HARD', desc: 'Fast punishes & air juggles. Unlocks TITAN on completion!' },
    { id: 'nightmare', name: 'NIGHTMARE', desc: 'Near-instant reactions, no health regen. Unlocks ZERO!' },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundEngine.resume();

      if (!showDifficultySelect) {
        if (e.key === 'ArrowDown' || e.code === 'KeyS') {
          soundEngine.playClick();
          setFocusedIndex((prev) => (prev + 1) % menuItems.length);
        } else if (e.key === 'ArrowUp' || e.code === 'KeyW') {
          soundEngine.playClick();
          setFocusedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
        } else if (e.key === 'Enter' || e.code === 'Space') {
          soundEngine.playClick();
          menuItems[focusedIndex].action();
        }
      } else {
        if (e.key === 'Escape') {
          setShowDifficultySelect(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDifficultySelect, focusedIndex, menuItems]);

  return (
    <div className="flex flex-col items-center justify-between min-h-[85vh] w-full max-w-4xl mx-auto p-6 text-white font-mono select-none">
      {/* Title Logo */}
      <div className="flex flex-col items-center mt-6 text-center">
        <div className="text-xs tracking-[0.5em] text-cyan-400 mb-2 uppercase drop-shadow-[0_0_8px_#00f0ff]">
          TEKKEN-INSPIRED 1V1 NEON FIGHTER
        </div>
        <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 via-pink-500 to-yellow-300 drop-shadow-[0_0_35px_rgba(255,0,128,0.7)] animate-pulse">
          NEON KNUCKLES
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <span className="h-[1px] w-12 bg-cyan-500" />
          <span className="text-xs text-yellow-400 font-bold tracking-widest uppercase">
            OVERDRIVE ENGINE 60 FPS
          </span>
          <span className="h-[1px] w-12 bg-cyan-500" />
        </div>
      </div>

      {/* Main Menu Navigation or Difficulty Dialog */}
      {!showDifficultySelect ? (
        <div className="flex flex-col gap-3 w-full max-w-md my-auto">
          {menuItems.map((item, idx) => {
            const isFocused = idx === focusedIndex;
            return (
              <button
                key={item.label}
                onMouseEnter={() => {
                  soundEngine.playClick();
                  setFocusedIndex(idx);
                }}
                onClick={() => {
                  soundEngine.resume();
                  soundEngine.playHitLight();
                  item.action();
                }}
                className={`py-3.5 px-6 rounded-md font-black tracking-widest text-sm transition-all duration-150 flex items-center justify-between border-2 ${
                  isFocused
                    ? 'bg-gradient-to-r from-cyan-500/30 to-pink-500/30 border-cyan-400 text-white shadow-[0_0_20px_rgba(0,240,255,0.5)] translate-x-1'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-xs ${isFocused ? 'text-yellow-300 animate-ping' : 'opacity-0'}`}>
                  ▶
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        /* Difficulty Select Dialog */
        <div className="flex flex-col gap-4 w-full max-w-lg my-auto bg-slate-950/95 border-2 border-cyan-500/80 p-6 rounded-lg shadow-[0_0_30px_rgba(0,240,255,0.4)]">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-xl font-black text-cyan-400 tracking-wider">
              SELECT DIFFICULTY
            </h2>
            <button
              onClick={() => setShowDifficultySelect(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              [ESC] BACK
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {difficulties.map((d) => {
              const isSelected = selectedDifficulty === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedDifficulty(d.id);
                  }}
                  className={`p-3 rounded border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-yellow-400 bg-yellow-950/30 shadow-[0_0_14px_#ffff00]'
                      : 'border-slate-800 hover:border-slate-600 bg-slate-900/40'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm tracking-widest text-white">
                      {d.name}
                    </span>
                    {d.id === 'hard' && (
                      <span className="text-[10px] bg-cyan-900/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-400">
                        UNLOCKS TITAN
                      </span>
                    )}
                    {d.id === 'nightmare' && (
                      <span className="text-[10px] bg-rose-900/80 text-rose-300 px-1.5 py-0.5 rounded border border-rose-400">
                        UNLOCKS ZERO
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mt-1">
                    {d.desc}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              soundEngine.playHitHeavy();
              onStartArcade(selectedDifficulty);
            }}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-black font-black tracking-widest text-sm rounded shadow-[0_0_18px_rgba(0,240,255,0.5)] transition-all uppercase mt-2"
          >
            ENTER ARCADE LADDER ({selectedDifficulty.toUpperCase()})
          </button>
        </div>
      )}

      {/* Footer Instructions */}
      <div className="flex justify-between items-center w-full text-xs text-slate-500 border-t border-slate-900 pt-3">
        <span>CONTROLS: WASD + J, K, N, M + [Q] ULTIMATE</span>
        <span>VERSION 1.0.0</span>
      </div>
    </div>
  );
};
