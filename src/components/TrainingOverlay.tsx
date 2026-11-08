'use client';

import React from 'react';
import { GameState } from '../game/types';

interface TrainingOverlayProps {
  state: GameState;
  onSetDummyBehavior: (behavior: 'idle' | 'block_all' | 'block_high' | 'block_low' | 'random') => void;
  onFillMeter: () => void;
  onResetPositions: () => void;
}

export const TrainingOverlay: React.FC<TrainingOverlayProps> = ({
  state,
  onSetDummyBehavior,
  onFillMeter,
  onResetPositions,
}) => {
  const currentMove = state.p1.currentMove;
  const dummyBehavior = state.trainingSettings?.dummyBehavior || 'idle';

  return (
    <div className="absolute top-24 left-4 z-20 pointer-events-auto flex flex-col gap-2 font-mono select-none">
      {/* Training Controls Toolbar */}
      <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-lg flex flex-wrap gap-2 text-xs shadow-lg">
        {/* Dummy Mode Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">DUMMY:</span>
          {(['idle', 'block_all', 'block_high', 'block_low', 'random'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onSetDummyBehavior(mode)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                dummyBehavior === mode
                  ? 'bg-cyan-500 text-black shadow-[0_0_8px_#00f0ff]'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {mode.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Instant Meter Button */}
        <button
          onClick={onFillMeter}
          className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black shadow-[0_0_10px_#ffff00] transition-all"
        >
          ⚡ FILL METER (100%)
        </button>

        {/* Reset Positions Button */}
        <button
          onClick={onResetPositions}
          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          RESET POSITIONS
        </button>
      </div>

      {/* Real-time Frame Data Box */}
      <div className="bg-slate-950/85 border border-slate-800/80 p-2.5 rounded-lg text-xs w-64 shadow-md">
        <div className="text-[10px] text-cyan-400 font-bold uppercase border-b border-slate-800 pb-1 mb-1.5 flex justify-between">
          <span>FRAME DATA MONITOR</span>
          <span className="text-slate-500">{state.p1.state.toUpperCase()}</span>
        </div>

        {currentMove ? (
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between font-bold text-white">
              <span>{currentMove.name}</span>
              <span className="text-yellow-400 uppercase">[{currentMove.hitLevel}]</span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-300 pt-1">
              <div className="bg-slate-900/80 p-1 rounded text-center">
                <div className="text-slate-500 text-[8px]">STARTUP</div>
                <div className="font-bold text-cyan-300">{currentMove.startup}f</div>
              </div>
              <div className="bg-slate-900/80 p-1 rounded text-center">
                <div className="text-slate-500 text-[8px]">ACTIVE</div>
                <div className="font-bold text-emerald-300">{currentMove.active}f</div>
              </div>
              <div className="bg-slate-900/80 p-1 rounded text-center">
                <div className="text-slate-500 text-[8px]">RECOVERY</div>
                <div className="font-bold text-rose-300">{currentMove.recovery}f</div>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
              <span>HITSTUN: +{currentMove.hitstun}f</span>
              <span>BLOCKSTUN: {currentMove.blockstun}f</span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 italic py-2 text-center">
            Neutral / Idle
          </div>
        )}
      </div>

      {/* Input History */}
      <div className="bg-slate-950/85 border border-slate-800/80 p-2 rounded-lg text-xs w-48 shadow-md">
        <div className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-800 pb-1 mb-1">
          INPUT STREAM
        </div>
        <div className="space-y-0.5 max-h-24 overflow-hidden text-[10px] text-slate-300">
          {state.p1.recentInputs.slice(-6).map((item, idx) => {
            const keys: string[] = [];
            if (item.input.up) keys.push('↑');
            if (item.input.down) keys.push('↓');
            if (item.input.left) keys.push('←');
            if (item.input.right) keys.push('→');
            if (item.input.lp) keys.push('LP');
            if (item.input.rp) keys.push('RP');
            if (item.input.lk) keys.push('LK');
            if (item.input.rk) keys.push('RK');
            if (item.input.ultimate) keys.push('ULT');

            return (
              <div key={idx} className="flex justify-between font-mono">
                <span className="text-slate-500">#{item.frame}</span>
                <span className="text-cyan-300 font-bold">{keys.join(' + ') || '—'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
