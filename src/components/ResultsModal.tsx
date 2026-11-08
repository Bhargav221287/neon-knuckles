'use client';

import React, { useState } from 'react';
import { MatchScore } from '../game/types';
import { LocalStorageManager } from '../lib/storage';
import { soundEngine } from '../game/audio/soundEngine';

interface ResultsModalProps {
  isVictory: boolean;
  score: MatchScore;
  characterId: string;
  unlockedFighterId?: string | null;
  onPlayAgain: () => void;
  onQuit: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  isVictory,
  score,
  characterId,
  unlockedFighterId,
  onPlayAgain,
  onQuit,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting || submitted) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName.trim(),
          score: score.totalScore,
          difficulty: score.difficulty,
          character: characterId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        soundEngine.playHitLight();
        setSubmitted(true);
        // Also update local best score
        LocalStorageManager.saveScore(score.difficulty, score.totalScore);
      } else {
        setErrorMsg(data.error || 'Submission failed');
      }
    } catch {
      setErrorMsg('Network error submitting score');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-cyan-500 rounded-lg p-6 max-w-lg w-full shadow-[0_0_35px_rgba(0,240,255,0.4)] flex flex-col gap-4">
        {/* Banner */}
        <div className="text-center border-b border-slate-800 pb-3">
          <h1
            className={`text-4xl font-black italic tracking-wider ${
              isVictory
                ? 'text-yellow-300 drop-shadow-[0_0_16px_#ffff00]'
                : 'text-red-500 drop-shadow-[0_0_16px_#ff0033]'
            }`}
          >
            {isVictory ? 'VICTORY!' : 'DEFEATED'}
          </h1>
          <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
            {score.difficulty.toUpperCase()} ARCADE LADDER COMPLETE
          </div>
        </div>

        {/* Unlock Alert */}
        {unlockedFighterId && (
          <div className="bg-gradient-to-r from-yellow-950/40 via-amber-900/50 to-yellow-950/40 border border-yellow-400 p-3 rounded text-center animate-pulse">
            <span className="text-xs font-bold text-yellow-300 tracking-wider">
              🎉 NEW FIGHTER UNLOCKED: {unlockedFighterId.toUpperCase()}!
            </span>
          </div>
        )}

        {/* Score Breakdown */}
        <div className="bg-slate-900/60 p-3.5 rounded border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between text-slate-300">
            <span>Time Remaining Bonus:</span>
            <span className="font-bold text-cyan-300">+{score.timeRemainingBonus}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Health Remaining Bonus:</span>
            <span className="font-bold text-emerald-300">+{score.healthRemainingBonus}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Max Combo:</span>
            <span className="font-bold text-yellow-300">{score.maxCombo} HITS</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Perfect Rounds:</span>
            <span className="font-bold text-purple-300">{score.perfectRounds}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Ultimates Landed:</span>
            <span className="font-bold text-rose-300">{score.ultimatesLanded}</span>
          </div>

          <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline font-black">
            <span className="text-slate-400">TOTAL SCORE:</span>
            <span className="text-2xl text-yellow-300 drop-shadow-[0_0_10px_#ffff00]">
              {score.totalScore.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Leaderboard Submission Form */}
        {!submitted ? (
          <form onSubmit={handleSubmitScore} className="space-y-2">
            <label className="text-xs text-cyan-300 font-bold block">
              SUBMIT TO GLOBAL LEADERBOARD:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={15}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="ENTER NAME (2-15 CHARS)"
                className="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={isSubmitting || playerName.trim().length < 2}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-black font-black text-xs rounded transition-colors uppercase"
              >
                {isSubmitting ? 'SENDING...' : 'SUBMIT'}
              </button>
            </div>
            {errorMsg && <div className="text-[11px] text-red-400">{errorMsg}</div>}
          </form>
        ) : (
          <div className="text-center py-2 text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-500/40 rounded">
            ✓ SCORE SUBMITTED TO LEADERBOARD!
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              onPlayAgain();
            }}
            className="flex-1 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black tracking-widest text-xs uppercase rounded transition-all"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onQuit();
            }}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold tracking-widest text-xs uppercase rounded transition-colors"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
