'use client';

import React, { useState, useEffect } from 'react';
import { DifficultyLevel } from '../game/difficulty';
import { LeaderboardEntry } from '../lib/db';
import { soundEngine } from '../game/audio/soundEngine';

interface LeaderboardViewProps {
  onBack: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onBack }) => {
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('normal');
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/scores?difficulty=${difficulty}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setScores(data.scores || []);
        }
      } catch {
        if (!ignore) setScores([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [difficulty]);

  return (
    <div className="flex flex-col items-center justify-between min-h-[85vh] w-full max-w-4xl mx-auto p-6 text-white font-mono select-none">
      {/* Header */}
      <div className="flex justify-between items-center w-full border-b border-slate-800 pb-3">
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest"
        >
          ← [ESC] BACK
        </button>
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-rose-400 drop-shadow-[0_0_12px_#ffff00]">
          GLOBAL HALL OF FAME
        </h1>
        <div className="w-16" />
      </div>

      {/* Difficulty Tabs */}
      <div className="flex gap-2 my-4">
        {(['easy', 'normal', 'hard', 'nightmare'] as DifficultyLevel[]).map((diff) => (
          <button
            key={diff}
            onClick={() => {
              soundEngine.playClick();
              setDifficulty(diff);
            }}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${
              difficulty === diff
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_12px_#00f0ff]'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {diff}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="w-full bg-slate-950/90 border border-slate-800 rounded-lg overflow-hidden shadow-xl my-auto">
        <div className="grid grid-cols-12 bg-slate-900/80 px-4 py-2.5 text-xs font-bold text-slate-400 border-b border-slate-800">
          <div className="col-span-2">RANK</div>
          <div className="col-span-4">FIGHTER NAME</div>
          <div className="col-span-3">HERO</div>
          <div className="col-span-3 text-right">SCORE</div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
            RETRIEVING LEADERBOARD DATA...
          </div>
        ) : scores.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No recorded scores yet for this difficulty. Be the first to claim glory!
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 text-xs">
            {scores.map((entry, idx) => {
              const rank = idx + 1;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={entry.id}
                  className={`grid grid-cols-12 px-4 py-2.5 items-center transition-colors hover:bg-slate-900/40 ${
                    rank === 1
                      ? 'bg-yellow-950/20 text-yellow-300 font-bold'
                      : rank === 2
                      ? 'text-slate-200'
                      : rank === 3
                      ? 'text-amber-300'
                      : 'text-slate-400'
                  }`}
                >
                  <div className="col-span-2 flex items-center gap-1.5 font-black">
                    {isTop3 && <span>👑</span>}
                    <span>#{rank}</span>
                  </div>
                  <div className="col-span-4 font-mono font-bold tracking-wide">
                    {entry.name}
                  </div>
                  <div className="col-span-3 uppercase text-[11px] text-cyan-400">
                    {entry.character}
                  </div>
                  <div className="col-span-3 text-right font-black text-sm text-yellow-400">
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-slate-500 text-center pt-4">
        TOP 10 PER DIFFICULTY • SCORES RECORDED GLOBALLY
      </div>
    </div>
  );
};
