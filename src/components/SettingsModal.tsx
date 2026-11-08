'use client';

import React, { useState, useEffect } from 'react';
import { KeyBindingsManager, PlayerKeyMap } from '../game/input/KeyBindings';
import { LocalStorageManager, UserSettings } from '../lib/storage';
import { soundEngine } from '../game/audio/soundEngine';

interface SettingsModalProps {
  keyBindings: KeyBindingsManager;
  onClose: () => void;
  onSettingsChange?: (settings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  keyBindings,
  onClose,
  onSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'audio' | 'accessibility'>('controls');
  const [p1Keys, setP1Keys] = useState<PlayerKeyMap>(keyBindings.getP1Keys());
  const [bindingAction, setBindingAction] = useState<keyof PlayerKeyMap | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [settings, setSettings] = useState<UserSettings>(LocalStorageManager.getSettings());

  // Listen for key press during rebinding
  useEffect(() => {
    if (!bindingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newKey = e.code;
      const res = keyBindings.setP1Key(bindingAction, newKey);

      if (res.success) {
        soundEngine.playHitLight();
        setP1Keys(keyBindings.getP1Keys());
        setBindingAction(null);
        setConflictError(null);
      } else {
        soundEngine.playUltimateDenied();
        setConflictError(`Key ${newKey} is already bound to ${res.conflictAction?.toUpperCase()}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindingAction, keyBindings]);

  const updateSetting = <K extends keyof UserSettings>(key: K, val: UserSettings[K]) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    LocalStorageManager.saveSettings(updated);

    if (key === 'sfxVolume') soundEngine.setSfxVolume(val as number);
    if (key === 'musicVolume') soundEngine.setMusicVolume(val as number);
    if (key === 'isMuted') soundEngine.setMuted(val as boolean);

    if (onSettingsChange) onSettingsChange(updated);
  };

  const resetControls = () => {
    keyBindings.resetToDefaults();
    setP1Keys(keyBindings.getP1Keys());
    setConflictError(null);
    soundEngine.playClick();
  };

  const actionLabels: Record<keyof PlayerKeyMap, string> = {
    up: 'Jump / Sidestep Up',
    down: 'Crouch / Sidestep Down',
    left: 'Move Left / Block',
    right: 'Move Right / Block',
    lp: 'Left Punch (LP)',
    rp: 'Right Punch (RP)',
    lk: 'Left Kick (LK)',
    rk: 'Right Kick (RK)',
    ultimate: 'Dedicated Ultimate (Overdrive)',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-slate-950 border-2 border-cyan-500 rounded-lg p-6 max-w-xl w-full shadow-[0_0_35px_rgba(0,240,255,0.4)] flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-xl font-black text-cyan-400 tracking-wider">GAME SETTINGS</h2>
          <button
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-white"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'controls'
                ? 'bg-cyan-500 text-black font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            CONTROLS (P1)
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'audio'
                ? 'bg-cyan-500 text-black font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AUDIO
          </button>
          <button
            onClick={() => setActiveTab('accessibility')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'accessibility'
                ? 'bg-cyan-500 text-black font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ACCESSIBILITY
          </button>
        </div>

        {/* Controls Rebinding Tab */}
        {activeTab === 'controls' && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-2 text-xs">
            <div className="text-[11px] text-slate-400 mb-2">
              Click any button to rebind. Conflicts are automatically detected and blocked.
            </div>

            {conflictError && (
              <div className="bg-red-950/80 border border-red-500 text-red-300 p-2 rounded text-[11px] font-bold">
                ⚠ {conflictError}
              </div>
            )}

            <div className="space-y-1.5">
              {(Object.keys(p1Keys) as (keyof PlayerKeyMap)[]).map((action) => {
                const isListening = bindingAction === action;
                return (
                  <div
                    key={action}
                    className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800"
                  >
                    <span className="text-slate-300 font-bold">{actionLabels[action]}</span>
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        setBindingAction(action);
                        setConflictError(null);
                      }}
                      className={`px-3 py-1 rounded font-mono font-bold text-xs uppercase min-w-20 transition-all ${
                        isListening
                          ? 'bg-yellow-400 text-black animate-pulse shadow-[0_0_10px_#ffff00]'
                          : action === 'ultimate'
                          ? 'bg-yellow-950/80 border border-yellow-500 text-yellow-300'
                          : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
                      }`}
                    >
                      {isListening ? 'PRESS KEY' : keyBindings.formatKeyName(p1Keys[action])}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={resetControls}
              className="mt-3 w-full py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white rounded text-[11px] font-bold"
            >
              RESET CONTROLS TO DEFAULTS
            </button>
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="space-y-4 text-xs py-2">
            <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded border border-slate-800">
              <span className="font-bold text-slate-300">MUTE ALL AUDIO</span>
              <input
                type="checkbox"
                checked={settings.isMuted}
                onChange={(e) => updateSetting('isMuted', e.target.checked)}
                className="w-5 h-5 accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="bg-slate-900/60 p-3 rounded border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-slate-300">SOUND EFFECTS VOLUME</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => updateSetting('sfxVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="bg-slate-900/60 p-3 rounded border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="font-bold text-slate-300">SYNTHWAVE MUSIC VOLUME</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => updateSetting('musicVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Accessibility Tab */}
        {activeTab === 'accessibility' && (
          <div className="space-y-3 text-xs py-2">
            <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded border border-slate-800">
              <div>
                <div className="font-bold text-slate-300">REDUCED MOTION</div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                  Disables screen shake, flashes, and shortens cinematics.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
                className="w-5 h-5 accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded border border-slate-800">
              <div>
                <div className="font-bold text-slate-300">COLORBLIND-SAFE PALETTES</div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                  Enhances contrast and clarifies health bars with high-contrast borders.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.colorblindMode}
                onChange={(e) => updateSetting('colorblindMode', e.target.checked)}
                className="w-5 h-5 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
          className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black tracking-widest text-xs uppercase rounded transition-colors"
        >
          SAVE & CLOSE [ESC]
        </button>
      </div>
    </div>
  );
};
