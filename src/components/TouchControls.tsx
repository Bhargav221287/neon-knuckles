'use client';

import React from 'react';
import { RawInputs } from '../game/types';

interface TouchControlsProps {
  onInputDown: (key: keyof RawInputs) => void;
  onInputUp: (key: keyof RawInputs) => void;
  showUltimate: boolean;
  ultimateKeyLabel: string;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onInputDown,
  onInputUp,
  showUltimate,
  ultimateKeyLabel,
}) => {
  const handleTouchStart = (key: keyof RawInputs) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInputDown(key);
  };

  const handleTouchEnd = (key: keyof RawInputs) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onInputUp(key);
  };

  return (
    <div className="md:hidden absolute inset-0 pointer-events-none z-30 select-none flex justify-between items-end p-6 pb-8">
      {/* Virtual D-Pad on bottom left */}
      <div className="pointer-events-auto relative w-36 h-36">
        {/* UP */}
        <button
          className="absolute top-0 left-12 w-12 h-12 bg-slate-900/80 border-2 border-cyan-500/60 active:bg-cyan-500/40 rounded flex items-center justify-center text-cyan-300 font-bold text-lg active:scale-95 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
          onTouchStart={handleTouchStart('up')}
          onTouchEnd={handleTouchEnd('up')}
          onMouseDown={handleTouchStart('up')}
          onMouseUp={handleTouchEnd('up')}
        >
          ▲
        </button>
        {/* DOWN */}
        <button
          className="absolute bottom-0 left-12 w-12 h-12 bg-slate-900/80 border-2 border-cyan-500/60 active:bg-cyan-500/40 rounded flex items-center justify-center text-cyan-300 font-bold text-lg active:scale-95 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
          onTouchStart={handleTouchStart('down')}
          onTouchEnd={handleTouchEnd('down')}
          onMouseDown={handleTouchStart('down')}
          onMouseUp={handleTouchEnd('down')}
        >
          ▼
        </button>
        {/* LEFT */}
        <button
          className="absolute top-12 left-0 w-12 h-12 bg-slate-900/80 border-2 border-cyan-500/60 active:bg-cyan-500/40 rounded flex items-center justify-center text-cyan-300 font-bold text-lg active:scale-95 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
          onTouchStart={handleTouchStart('left')}
          onTouchEnd={handleTouchEnd('left')}
          onMouseDown={handleTouchStart('left')}
          onMouseUp={handleTouchEnd('left')}
        >
          ◀
        </button>
        {/* RIGHT */}
        <button
          className="absolute top-12 right-0 w-12 h-12 bg-slate-900/80 border-2 border-cyan-500/60 active:bg-cyan-500/40 rounded flex items-center justify-center text-cyan-300 font-bold text-lg active:scale-95 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
          onTouchStart={handleTouchStart('right')}
          onTouchEnd={handleTouchEnd('right')}
          onMouseDown={handleTouchStart('right')}
          onMouseUp={handleTouchEnd('right')}
        >
          ▶
        </button>
      </div>

      {/* Action Buttons on bottom right */}
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {/* Dedicated Ultimate Button: Appears when meter is full */}
        {showUltimate && (
          <button
            className="w-48 h-12 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-2 border-yellow-200 rounded-full font-black text-black tracking-widest uppercase shadow-[0_0_24px_#ffff00] animate-pulse active:scale-95"
            onTouchStart={handleTouchStart('ultimate')}
            onTouchEnd={handleTouchEnd('ultimate')}
            onMouseDown={handleTouchStart('ultimate')}
            onMouseUp={handleTouchEnd('ultimate')}
          >
            OVERDRIVE [{ultimateKeyLabel}]
          </button>
        )}

        {/* 4 Attack Buttons in Diamond Layout */}
        <div className="relative w-40 h-40">
          {/* LP: Left Punch (Top Left) */}
          <button
            className="absolute top-0 left-2 w-14 h-14 rounded-full bg-slate-900/90 border-2 border-cyan-400 active:bg-cyan-400/40 flex flex-col items-center justify-center text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)] active:scale-95"
            onTouchStart={handleTouchStart('lp')}
            onTouchEnd={handleTouchEnd('lp')}
            onMouseDown={handleTouchStart('lp')}
            onMouseUp={handleTouchEnd('lp')}
          >
            <span className="text-sm">LP</span>
            <span className="text-[9px] text-cyan-400/70">PUNCH</span>
          </button>

          {/* RP: Right Punch (Top Right) */}
          <button
            className="absolute top-0 right-2 w-14 h-14 rounded-full bg-slate-900/90 border-2 border-emerald-400 active:bg-emerald-400/40 flex flex-col items-center justify-center text-emerald-300 font-bold shadow-[0_0_12px_rgba(0,255,128,0.4)] active:scale-95"
            onTouchStart={handleTouchStart('rp')}
            onTouchEnd={handleTouchEnd('rp')}
            onMouseDown={handleTouchStart('rp')}
            onMouseUp={handleTouchEnd('rp')}
          >
            <span className="text-sm">RP</span>
            <span className="text-[9px] text-emerald-400/70">PUNCH</span>
          </button>

          {/* LK: Left Kick (Bottom Left) */}
          <button
            className="absolute bottom-0 left-2 w-14 h-14 rounded-full bg-slate-900/90 border-2 border-amber-400 active:bg-amber-400/40 flex flex-col items-center justify-center text-amber-300 font-bold shadow-[0_0_12px_rgba(255,170,0,0.4)] active:scale-95"
            onTouchStart={handleTouchStart('lk')}
            onTouchEnd={handleTouchEnd('lk')}
            onMouseDown={handleTouchStart('lk')}
            onMouseUp={handleTouchEnd('lk')}
          >
            <span className="text-sm">LK</span>
            <span className="text-[9px] text-amber-400/70">KICK</span>
          </button>

          {/* RK: Right Kick (Bottom Right) */}
          <button
            className="absolute bottom-0 right-2 w-14 h-14 rounded-full bg-slate-900/90 border-2 border-rose-400 active:bg-rose-400/40 flex flex-col items-center justify-center text-rose-300 font-bold shadow-[0_0_12px_rgba(255,0,80,0.4)] active:scale-95"
            onTouchStart={handleTouchStart('rk')}
            onTouchEnd={handleTouchEnd('rk')}
            onMouseDown={handleTouchStart('rk')}
            onMouseUp={handleTouchEnd('rk')}
          >
            <span className="text-sm">RK</span>
            <span className="text-[9px] text-rose-400/70">KICK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
