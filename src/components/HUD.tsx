'use client';

import React from 'react';
import { GameState } from '../game/types';

interface HUDProps {
  state: GameState;
  ultimateKeyLabel: string;
}

export const HUD: React.FC<HUDProps> = ({ state, ultimateKeyLabel }) => {
  const p1 = state.p1;
  const p2 = state.p2;

  const p1HealthPct = Math.max(0, Math.min(100, (p1.health / p1.maxHealth) * 100));
  const p1GhostPct = Math.max(0, Math.min(100, (p1.ghostHealth / p1.maxHealth) * 100));

  const p2HealthPct = Math.max(0, Math.min(100, (p2.health / p2.maxHealth) * 100));
  const p2GhostPct = Math.max(0, Math.min(100, (p2.ghostHealth / p2.maxHealth) * 100));

  const timerSeconds = Math.ceil(state.timerFrames / 60);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 font-mono">
      {/* Top Bar: Health Bars, Round Markers, and Timer */}
      <div className="flex items-start justify-between w-full max-w-5xl mx-auto">
        {/* P1 Section */}
        <div className="flex-1 flex flex-col items-start pr-4">
          <div className="flex items-center justify-between w-full mb-1">
            <span
              className="font-bold text-lg tracking-wider drop-shadow-[0_0_8px_currentColor]"
              style={{ color: p1.def.skeleton.glowColor }}
            >
              {p1.def.name.toUpperCase()}
            </span>
            {/* Round win markers */}
            <div className="flex gap-1.5">
              {[...Array(state.maxRounds)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border border-cyan-400 transition-all ${
                    i < p1.roundsWon
                      ? 'bg-cyan-400 shadow-[0_0_10px_#00f0ff]'
                      : 'bg-transparent opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Health Bar (Reversed from right to left) */}
          <div className="w-full h-6 bg-slate-900/90 border border-slate-700/80 rounded-sm relative overflow-hidden flex justify-end">
            {/* Ghost bar */}
            <div
              className="absolute top-0 bottom-0 bg-red-800/80 transition-all duration-300"
              style={{ width: `${p1GhostPct}%` }}
            />
            {/* Active health bar */}
            <div
              className={`h-full transition-all duration-75 ${
                p1.isRage
                  ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 animate-pulse shadow-[0_0_12px_#ff0033]'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_8px_#00f0ff]'
              }`}
              style={{ width: `${p1HealthPct}%` }}
            />
          </div>

          {/* Ultimate Meter */}
          <div className="w-4/5 mt-1.5">
            <div
              className={`w-full h-3.5 bg-slate-950/90 border rounded-sm relative overflow-hidden transition-all ${
                p1.meterGlow
                  ? 'border-yellow-400 shadow-[0_0_16px_#ffff00] animate-pulse'
                  : 'border-slate-800'
              }`}
            >
              <div
                className={`h-full transition-all duration-100 ${
                  p1.meterGlow
                    ? 'bg-gradient-to-r from-yellow-400 via-amber-300 to-white'
                    : 'bg-gradient-to-r from-blue-700 via-indigo-500 to-cyan-400'
                }`}
                style={{ width: `${p1.meter}%` }}
              />
              {p1.meterGlow && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-black tracking-widest uppercase">
                  PRESS {ultimateKeyLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Timer */}
        <div className="flex flex-col items-center px-4">
          <div className="w-16 h-14 bg-slate-950/90 border-2 border-slate-700/80 rounded flex items-center justify-center shadow-[0_0_16px_rgba(0,0,0,0.8)]">
            <span
              className={`text-3xl font-black ${
                timerSeconds <= 10
                  ? 'text-red-500 animate-ping'
                  : 'text-yellow-400 drop-shadow-[0_0_10px_#ffff00]'
              }`}
            >
              {timerSeconds}
            </span>
          </div>
          <span className="text-[10px] tracking-widest text-slate-400 mt-1 uppercase">
            ROUND {state.round}
          </span>
        </div>

        {/* P2 Section */}
        <div className="flex-1 flex flex-col items-end pl-4">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex gap-1.5">
              {[...Array(state.maxRounds)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border border-rose-400 transition-all ${
                    i < p2.roundsWon
                      ? 'bg-rose-500 shadow-[0_0_10px_#ff0055]'
                      : 'bg-transparent opacity-40'
                  }`}
                />
              ))}
            </div>
            <span
              className="font-bold text-lg tracking-wider drop-shadow-[0_0_8px_currentColor]"
              style={{ color: p2.def.skeleton.glowColor }}
            >
              {p2.def.name.toUpperCase()}
            </span>
          </div>

          {/* Health Bar (From left to right) */}
          <div className="w-full h-6 bg-slate-900/90 border border-slate-700/80 rounded-sm relative overflow-hidden flex justify-start">
            <div
              className="absolute top-0 bottom-0 bg-red-800/80 transition-all duration-300"
              style={{ width: `${p2GhostPct}%` }}
            />
            <div
              className={`h-full transition-all duration-75 ${
                p2.isRage
                  ? 'bg-gradient-to-l from-red-600 via-rose-500 to-amber-400 animate-pulse shadow-[0_0_12px_#ff0033]'
                  : 'bg-gradient-to-l from-emerald-500 via-teal-400 to-cyan-400 shadow-[0_0_8px_#00f0ff]'
              }`}
              style={{ width: `${p2HealthPct}%` }}
            />
          </div>

          {/* Ultimate Meter */}
          <div className="w-4/5 mt-1.5 flex justify-end">
            <div
              className={`w-full h-3.5 bg-slate-950/90 border rounded-sm relative overflow-hidden transition-all ${
                p2.meterGlow
                  ? 'border-yellow-400 shadow-[0_0_16px_#ffff00] animate-pulse'
                  : 'border-slate-800'
              }`}
            >
              <div
                className={`h-full transition-all duration-100 float-right ${
                  p2.meterGlow
                    ? 'bg-gradient-to-l from-yellow-400 via-amber-300 to-white'
                    : 'bg-gradient-to-l from-blue-700 via-indigo-500 to-cyan-400'
                }`}
                style={{ width: `${p2.meter}%` }}
              />
              {p2.meterGlow && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-black tracking-widest uppercase">
                  OVERDRIVE READY
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Combo Readouts */}
      <div className="flex justify-between w-full max-w-5xl mx-auto px-4 mt-2">
        {/* P1 Combo */}
        <div>
          {p1.comboCount > 1 && (
            <div className="animate-bounce">
              <span className="text-3xl font-black text-yellow-300 drop-shadow-[0_0_12px_#ffff00]">
                {p1.comboCount} HITS!
              </span>
              <div className="text-sm font-bold text-rose-400">
                {p1.comboDamage} DAMAGE
              </div>
            </div>
          )}
        </div>

        {/* P2 Combo */}
        <div>
          {p2.comboCount > 1 && (
            <div className="animate-bounce text-right">
              <span className="text-3xl font-black text-yellow-300 drop-shadow-[0_0_12px_#ffff00]">
                {p2.comboCount} HITS!
              </span>
              <div className="text-sm font-bold text-rose-400">
                {p2.comboDamage} DAMAGE
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom info row (Debug & Mode tags) */}
      <div className="flex justify-between items-end w-full text-xs text-slate-500">
        <div>
          {state.debugHitboxes && (
            <span className="bg-red-950/80 border border-red-500 text-red-400 px-2 py-0.5 rounded text-[10px]">
              F1 DEBUG HITBOXES ON
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="uppercase tracking-widest text-slate-400">
            {state.difficulty} MODE
          </span>
        </div>
      </div>
    </div>
  );
};
