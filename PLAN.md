# NEON KNUCKLES - Implementation Plan

## Overview
**NEON KNUCKLES** is a high-octane, Tekken-inspired 1v1 fighting game built in Next.js, HTML5 Canvas, and pure TypeScript with a deterministic 60 FPS fighting engine. Fighters are procedurally rendered neon wireframe skeletons with glowing joint capsules, bone linkages, and keyframe-driven martial arts animation.

---

## 1. Architecture & Modular Design

```
neon-knuckles/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── scores/             # GET (top 10 by difficulty) & POST (submit score)
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Main entry point & view switcher
│   │   └── globals.css
│   ├── components/
│   │   ├── GameCanvas.tsx          # HTML5 Canvas viewport & render loop connection
│   │   ├── HUD.tsx                 # Health bars, ghost damage, round markers, timer, combo counter, ultimate meter
│   │   ├── MainMenu.tsx            # Title, Arcade, Versus, Training, Leaderboard, Settings
│   │   ├── CharacterSelect.tsx     # 8 procedural fighter portraits, stats, moves, unlock locks
│   │   ├── PauseModal.tsx          # Esc menu: command list with dynamic bindings, restart, quit
│   │   ├── ResultsModal.tsx        # Round/match victory, score breakdown, leaderboard submission
│   │   ├── LeaderboardView.tsx     # Top 10 per difficulty with tab switching
│   │   ├── SettingsModal.tsx       # Key rebinding, audio volume, reduced motion, colorblind mode
│   │   ├── TrainingOverlay.tsx     # Dummy mode, frame data display, input history, instant meter button
│   │   └── TouchControls.tsx       # Virtual D-pad, 4 attack buttons (LP, RP, LK, RK), dynamic Q button
│   ├── game/
│   │   ├── types.ts                # Hitboxes, Hurtboxes, FighterState, FrameData, Input, RoundState
│   │   ├── difficulty.ts           # Easy, Normal, Hard, Nightmare AI configs & damage multipliers
│   │   ├── input/
│   │   │   ├── InputBuffer.ts      # 6-frame buffer, motion command parser (d, df, f+RP, etc.)
│   │   │   ├── KeyBindings.ts      # P1/P2 default bindings, rebinding logic, conflict detection
│   │   │   └── GamepadManager.ts   # Gamepad API integration (Standard mapping, Y/Triangle = Ultimate)
│   │   ├── fighters/
│   │   │   ├── types.ts            # FighterDefinition, MoveData, JointAngles, SkeletonConfig
│   │   │   ├── kaze.ts             # 1. Kaze: Fast striker, Hurricane Barrage
│   │   │   ├── brutus.ts           # 2. Brutus: Heavy grappler, Meteor Slam
│   │   │   ├── mira.ts             # 3. Mira: Long-range kickboxer, Moonlight Cascade
│   │   │   ├── ronin.ts            # 4. Ronin: Balanced martial artist, Iron Dragon Fist
│   │   │   ├── volt.ts             # 5. Volt: Rushdown & frame traps, Overload Combo
│   │   │   ├── sable.ts            # 6. Sable: Counter/parry fighter, Shadow Reversal
│   │   │   ├── titan.ts            # 7. Titan: Heavy reach & power, Crushing Verdict (Unlock: Hard)
│   │   │   ├── zero.ts             # 8. ZERO: Boss hybrid, Void Collapse (Unlock: Nightmare)
│   │   │   └── index.ts            # Fighter registry and unlock logic
│   │   ├── physics/
│   │   │   ├── collision.ts        # Capsule and AABB intersection, pushbox resolution
│   │   │   └── movement.ts         # Velocities, gravity, jumping, walk forward/back, sidestep
│   │   ├── combat/
│   │   │   ├── stateMachine.ts     # Neutral, Attack, Hitstun, Blockstun, Knockdown, Wakeup, Ultimate
│   │   │   ├── hitResolution.ts    # High/Mid/Low blocking rules, throw logic & throw tech
│   │   │   ├── juggle.ts           # Juggle limits & diminishing damage scaling
│   │   │   ├── rage.ts             # <20% HP damage buff & aura
│   │   │   └── ultimate.ts         # 30% fixed damage, startup counterplay, cinematic trigger
│   │   ├── ai/
│   │   │   ├── brain.ts            # Generic frame-data driven AI (no hardcoded moves)
│   │   │   ├── habitTracker.ts     # Player habit analyzer for Hard and Nightmare
│   │   │   └── behaviorTree.ts     # Distance spacing, whiff punishing, mixups, ultimate logic
│   │   ├── render/
│   │   │   ├── skeletonRenderer.ts # Procedural bone and capsule drawing with glow & neon colors
│   │   │   ├── stages.ts           # 3 Parallax canvas stages: Neo Tokyo, Cyber Alley, Synth Harbor
│   │   │   ├── particles.ts        # Neon hit sparks, block sparks, rage aura, ultimate aura
│   │   │   ├── camera.ts           # Dynamic fight camera, hit zoom, slow-motion KO, ultimate push-in
│   │   │   └── proceduralPortraits.ts # Procedural character select portraits
│   │   ├── audio/
│   │   │   └── soundEngine.ts      # Web Audio API synthesizer: hits, whooshes, KO, UI, BGM synth
│   │   └── engine.ts               # Deterministic 60 FPS fixed timestep fight loop
│   └── lib/
│       ├── storage.ts              # LocalStorage wrapper (scores, unlocks, settings)
│       └── db.ts                   # Leaderboard persistence (KV / in-memory store)
```

---

## 3. Implementation Status & Deployment (All Completed ✅)

| Phase | Description | Status |
| :--- | :--- | :---: |
| **Phase 1** | Deterministic 60 FPS fighting engine, state machine, physics, pushboxes | ✅ Completed |
| **Phase 2** | Movement, jump arcs, 3D sidestep dodge, AABB/capsule hitboxes/hurtboxes, F1 debug overlay | ✅ Completed |
| **Phase 3** | High/Mid/Low blocking, crouching duck, hitstop freeze, screen shake, spark particles | ✅ Completed |
| **Phase 4** | 6-frame input buffer, motion command parser, juggles with scaling, throws & tech breaks, rage | ✅ Completed |
| **Phase 5** | 8 Original Fighters (Kaze, Brutus, Mira, Ronin, Volt, Sable, Titan, ZERO) | ✅ Completed |
| **Phase 6** | Overdrive Strikes (Ultimates): Exact 30% fixed damage, startup counterplay, cinematic freeze | ✅ Completed |
| **Phase 7** | AI Opponent (Easy, Normal, Hard, Nightmare with habit tracker) reading frame data | ✅ Completed |
| **Phase 8** | Web Audio API sound synthesizer, 3 parallax canvas stages, procedural skeleton renderer | ✅ Completed |
| **Phase 9** | Full UI (Arcade, Versus, Training, Settings, Leaderboards), Touch Controls, Gamepad API | ✅ Completed |
| **Phase 10** | Vitest suite (589 tests passed: 30% rule, determinism, balance tournament, frame data) | ✅ Completed |
| **Phase 11** | Playwright E2E smoke test & ESLint validation (0 errors, 0 warnings) | ✅ Completed |
| **Phase 12** | GitHub Repository creation & push (`Bhargav221287/neon-knuckles`) | ✅ Completed |
| **Phase 13** | Vercel Production deployment & live API verification (`neon-knuckles.vercel.app`) | ✅ Completed |

- **GitHub Repository**: [https://github.com/Bhargav221287/neon-knuckles](https://github.com/Bhargav221287/neon-knuckles)
- **Live Vercel Production App**: [https://neon-knuckles.vercel.app](https://neon-knuckles.vercel.app)


1. **Engine Core & State Machine**
   - Fixed 60 FPS deterministic loop (`update(inputState): GameState`)
   - Fighter state machine: Idle, Walk, Crouch, Jump, Attack, Hitstun, Blockstun, Knockdown, GettingUp, Sidestep, Ultimate Startup/Active/Recovery, KO, Victory.
2. **Movement & Hitboxes**
   - Pushbox collision to avoid fighter clipping.
   - Walk speeds, jump arcs, gravity, stage boundary clamping.
   - Sidestep mechanic (temporary Z-axis dodge frame window dodging linear attacks).
   - Hitboxes and Hurtboxes per frame with F1 debug display.
3. **Combat, Blocking & Hit Resolution**
   - High / Mid / Low attack levels.
   - Standing block (blocks High & Mid, vulnerable to Low).
   - Crouching block (blocks Low & Mid, ducks High attacks!).
   - Hitstop (freeze frames on hit/block), screen shake, spark particle generation.
4. **Combos, Juggles & Throws**
   - Input buffer (6 frames) + command recognition (motions like d, df, f + RP).
   - Juggle system: airborne launch, aerial follow-ups, damage scaling per hit (100% -> 80% -> 60% -> 40% -> 20% floor).
   - Throws (LP+LK) unblockable at close range, with throw-break window (LP+LK).
   - Rage state (<20% health: damage boost + visual aura).
5. **Fighters 1 & 2 (Kaze & Brutus) + AI System**
   - Complete move list (10+ moves, 2 launchers, 3 string combos, 1 throw each).
   - Procedural skeleton definition & joint keyframes.
   - AI decision system based on frame advantage, range, and difficulty parameters.
6. **Ultimate System (Overdrive Strikes)**
   - 0-100 meter: +1% damage dealt = +1 meter, +1% damage taken = +1.5 meter.
   - Q button activation when full in neutral/recovery.
   - Startup (25f), whiffable on jump/sidestep/airborne, whiff recovery (50f).
   - Fixed EXACTLY 30% max health damage rule on connect (ignores difficulty multipliers, character stats, combo scaling).
   - Procedural cinematic sequence (1-2s camera push-in, sparks, slow-mo) respecting reduced-motion.
   - Unit tests strictly validating the 30% damage rule.
7. **Remaining 6 Fighters (Mira, Ronin, Volt, Sable, Titan, ZERO)**
   - Full movesets, stats, animations, and unique ultimates.
   - Unlock mechanics for Titan (beat Arcade on Hard) and ZERO (beat Arcade on Nightmare).
8. **UI, Modes & Audio**
   - Main Menu, Arcade Ladder (5 stages, scoring, unlocks), Versus Practice, Training Mode (frame data, instant meter fill), Settings, Leaderboard.
   - Procedural character portraits on canvas.
   - Web Audio API synthesizer for all sounds (hits, blocks, whooshes, KO, UI, background synth).
   - Touch controls & Gamepad support.
9. **Testing & Polish**
   - Vitest suite: frame data, 30% ultimate damage, determinism, juggle scaling, input buffer, balance sanity AI vs AI (<70% win cap).
   - Playwright smoke test.
   - Build, lint, GitHub push, Vercel deployment, verification.
