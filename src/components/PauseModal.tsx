'use client';

import React from 'react';
import { FighterDefinition } from '../game/types';
import { soundEngine } from '../game/audio/soundEngine';

interface PauseModalProps {
  fighter: FighterDefinition;
  ultimateKeyLabel: string;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  fighter,
  ultimateKeyLabel,
  onResume,
  onRestart,
  onQuit,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-cyan-500 rounded-lg p-6 max-w-2xl w-full shadow-[0_0_30px_rgba(0,240,255,0.4)] flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-2xl font-black text-cyan-400 tracking-wider">PAUSED</h2>
          <span className="text-xs text-yellow-400 uppercase tracking-widest font-bold">
            {fighter.name.toUpperCase()} COMMAND LIST
          </span>
        </div>

        {/* Command List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs max-h-72 overflow-y-auto pr-2">
          {/* Left: String Combos & Throw */}
          <div className="space-y-3">
            <div className="text-cyan-300 font-bold uppercase border-b border-slate-800 pb-1">
              STRING COMBOS
            </div>
            {fighter.stringCombos.map((combo, i) => (
              <div key={i} className="bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <div className="text-white font-bold">{combo.name}</div>
                <div className="text-yellow-400 font-mono tracking-widest text-[11px] mt-0.5">
                  {combo.sequence.join(' ➔ ')}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{combo.description}</div>
              </div>
            ))}

            <div className="text-emerald-300 font-bold uppercase border-b border-slate-800 pb-1 mt-3">
              THROW & DEFENSE
            </div>
            <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Command Throw:</span>
                <span className="text-amber-400 font-bold">LP + LK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Throw Break / Escape:</span>
                <span className="text-cyan-300 font-bold">LP + LK (on grab)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Sidestep Dodge:</span>
                <span className="text-purple-300 font-bold">Double-Tap ↑ or ↓</span>
              </div>
            </div>
          </div>

          {/* Right: Ultimate & Special Moves */}
          <div className="space-y-3">
            <div className="text-yellow-300 font-bold uppercase border-b border-slate-800 pb-1">
              OVERDRIVE STRIKE (ULTIMATE)
            </div>
            <div className="bg-yellow-950/20 border border-yellow-500/40 p-2.5 rounded text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-yellow-300">{fighter.ultimateMove.name}</span>
                <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded font-black text-[10px]">
                  KEY: [{ultimateKeyLabel}]
                </span>
              </div>
              <div className="text-rose-400 font-bold text-[11px]">
                DEALS EXACTLY 30% TARGET MAX HEALTH
              </div>
              <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
                Requires 100% full meter. Unblockable fixed damage. Counterplay: whiffs if target jumps or sidesteps!
              </p>
            </div>

            <div className="text-cyan-300 font-bold uppercase border-b border-slate-800 pb-1 mt-3">
              KEY LAUNCHERS & SWEEPS
            </div>
            <div className="space-y-1.5 text-[11px]">
              {fighter.moves
                .filter((m) => m.isLauncher || m.isKnockdown || m.hitLevel === 'low')
                .slice(0, 4)
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex justify-between bg-slate-900/40 px-2 py-1 rounded border border-slate-800/60"
                  >
                    <span className="text-slate-300">{m.name}</span>
                    <span className="text-cyan-400 font-bold">{m.command}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              soundEngine.playClick();
              onResume();
            }}
            className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black tracking-widest text-xs uppercase rounded transition-colors"
          >
            RESUME [ESC]
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onRestart();
            }}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold tracking-widest text-xs uppercase rounded transition-colors"
          >
            RESTART MATCH
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onQuit();
            }}
            className="flex-1 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 font-bold tracking-widest text-xs uppercase rounded transition-colors"
          >
            QUIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
};
