# ⚡ NEON KNUCKLES ⚡
> *A high-octane, Tekken-inspired 1v1 browser fighting game built from scratch with pure TypeScript, HTML5 Canvas, Next.js 16, and Web Audio API.*

[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS%204-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-589%20Passed-729B1B?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Smoke%20Passed-45ba4b?style=for-the-badge&logo=playwright)](https://playwright.dev/)

---

## 🎮 Game Concept & Philosophy

**NEON KNUCKLES** is a technical, single-player and local 2-player fighting game paying homage to legendary 3D fighters like *Tekken*. Built completely from scratch with **zero external image or audio assets**, the game renders dynamic, glowing neon skeleton fighters procedurally in HTML5 Canvas and synthesizes all impacts, lasers, sweeps, and background music in real-time through the browser's Web Audio API.

Every frame of action runs on a deterministic, fixed 60 FPS simulation timestep decoupled from React UI rendering.

---

## 🕹️ Controls

The fighting engine features full keyboard support, standard Gamepad API support, and adaptive mobile touch controls. All keyboard controls are completely rebindable in the Settings menu with collision conflict prevention.

### Player 1 Default Keyboard Controls
| Action | Key | Description |
| :--- | :---: | :--- |
| **Move Left / Walk Back** | <kbd>A</kbd> | Walk backward / High & Mid Guard |
| **Move Right / Walk Forward**| <kbd>D</kbd> | Advance forward |
| **Crouch** | <kbd>S</kbd> | Crouch / Low Guard when holding back |
| **Jump** | <kbd>W</kbd> | Airborne state / Avoid throws & low attacks |
| **Left Punch (LP)** | <kbd>J</kbd> | Fast high poke / combo starter |
| **Right Punch (RP)** | <kbd>K</kbd> | Mid-range heavy blow / launcher link |
| **Left Kick (LK)** | <kbd>N</kbd> | Long-range thrust / low poke |
| **Right Kick (RK)** | <kbd>M</kbd> | Heavy launcher / knockdown strike |
| **Overdrive Strike (Ultimate)**| <kbd>Q</kbd> | Single key press when meter is full (100) |
| **Throw** | <kbd>J</kbd> + <kbd>N</kbd> (LP+LK) | Unblockable close-range throw |
| **Break Throw** | <kbd>J</kbd> or <kbd>N</kbd> | Tech throw escape within 12 frames |
| **Sidestep Up** | Tap <kbd>W</kbd> | 3D axis dodge against linear strikes |
| **Sidestep Down** | Tap <kbd>S</kbd> | 3D axis dodge against linear strikes |
| **Debug Hitboxes** | <kbd>F1</kbd> | Toggle active hitboxes (red), hurtboxes (green), pushboxes (blue) |
| **Pause Menu** | <kbd>Esc</kbd> | Pause match, view full command list, restart, or quit |

### Player 2 Versus Keyboard Controls
- **Movement**: Arrow Keys (<kbd>←</kbd> <kbd>→</kbd> <kbd>↓</kbd> <kbd>↑</kbd>)
- **Attacks**: Numpad <kbd>4</kbd> (LP), Numpad <kbd>5</kbd> (RP), Numpad <kbd>1</kbd> (LK), Numpad <kbd>2</kbd> (RK)
- **Ultimate**: Numpad <kbd>0</kbd>

### Gamepad Controls (Standard Mapping)
- **D-Pad / Left Stick**: Movement, Crouch, Jump, Sidestep
- **X / Square**: Left Punch (LP)
- **Y / Triangle**: **Ultimate Overdrive Strike**
- **A / Cross**: Left Kick (LK)
- **B / Circle**: Right Kick (RK)
- **LB / L1**: Throw (<kbd>LP+LK</kbd>)
- **Start / Options**: Pause Menu

### Mobile Touch Controls
- Virtual glowing D-Pad on the lower left.
- 4 arcade action buttons on the lower right (LP, RP, LK, RK).
- Dynamic **ULTIMATE** button that lights up above the controls when meter reaches 100%.

---

## 💥 Fighting Engine Mechanics

1. **Frame Data Driven System**: Every move defines startup, active, and recovery frames, hitstun, blockstun, damage, pushback, and hit level (`high`, `mid`, `low`).
2. **Blocking Matrix**:
   - **Standing Block** (Hold Back): Blocks `high` and `mid` attacks. Vulnerable to `low` attacks.
   - **Crouch Block** (Hold Down-Back): Blocks `low` and `mid` attacks. High attacks whiff over crouching fighters.
3. **6-Frame Input Buffer & Command Parser**:
   - Supports command motions such as `df+RP` (Down-Forward + RP) and `f+RK` (Forward + RK).
   - Seamless string combos (e.g. `LP` → `RP` → `RK`).
4. **Juggle System & Damage Scaling**:
   - Launchers (`df+RP`, `df+RK`) knock the opponent airborne into a juggleable state.
   - Air juggle hits suffer progressive damage scaling ($100\% \to 80\% \to 60\% \to 45\% \to 30\%$) and limited juggle gravity to eliminate infinite combos.
5. **Overdrive Strikes (Ultimates)**:
   - **Meter (0 - 100)**: Builds $+1\%$ per $1\%$ max HP dealt and $+1.5\%$ per $1\%$ max HP received. Resets to 0 each round.
   - **Damage Rule**: Always deals **EXACTLY 30% of target max health as fixed damage** regardless of combos, rage, difficulty multipliers, or character stats.
   - **Counterplay**: Unblockable, but has 25 frames of visible startup. Whiffs against airborne or sidestepping targets. Hit-cancellation loses full meter. Whiff recovery leaves the user vulnerable for 50 frames.
   - **Cinematic**: Dramatic slow-motion camera zoom, screen flash, and particle effects (respects Reduced Motion setting).
6. **Rage Comeback Mechanic**: When below 20% health, fighters radiate an energetic aura and gain $+20\%$ base attack damage bonus.
7. **Throw & Throw Break**: `LP + LK` executes an unblockable grapple dealing 130-150 damage unless broken within 12 frames by pressing LP or LK.
8. **Sidestepping**: Tapping Up or Down executes a quick 3D axis dodge with invulnerability to linear strikes.

---

## 🥋 8 Original Fighters

Every fighter is defined in an isolated, typed data file with custom joint capsules, signature colors, frame data, 10+ moves, 2 launchers, 3 string combos, a throw, and an ultimate.

| Fighter | Archetype | Health | Speed | Signature Move | Ultimate Strike | Unlock |
| :--- | :--- | :---: | :---: | :--- | :--- | :---: |
| **Kaze** | Fast Striker / Rushdown | 900 | 4.6 | Gale Piercer (`f+LK`) | *Hurricane Barrage* | Default |
| **Brutus** | Heavy Grappler | 1100 | 3.2 | Atlas Lift (`df+RP`) | *Meteor Slam* | Default |
| **Mira** | Agile Taekwondo Kick Specialist | 940 | 4.3 | Lunar Geyser (`df+RP`) | *Moonlight Cascade* | Default |
| **Ronin** | Balanced Precision Martial Artist | 980 | 4.1 | Dragon Fang (`f+RP`) | *Iron Dragon Fist* | Default |
| **Volt** | Electrified Rushdown Boxer | 920 | 4.5 | Spark Upper (`df+RP`) | *Overload Combo* | Default |
| **Sable** | Counter Specialist & Parrier | 960 | 4.2 | Umbral Piercer (`f+RP`) | *Shadow Reversal* | Default |
| **Titan** | Massive Cybernetic Juggernaut | 1080 | 3.4 | Megaton Vault (`df+RK`) | *Crushing Verdict* | Beat Arcade on Hard |
| **ZERO** | Primordial Hybrid AI Boss | 950 | 4.2 | Singularity Upper (`df+RP`)| *Void Collapse* | Beat Arcade on Nightmare |

---

## 🤖 AI Opponent System

The AI behavior engine reads game state and frame advantages using the fighter's move definitions without any hardcoded move names.

| Difficulty | Reaction Delay | Block Rate | Whiff Punish | Combo Mastery | Damage Scaling | Special Traits |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Easy** | 500 ms | 15% | 10% | Basic | 0.7x | Careless ultimate usage, generous 90s timer |
| **Normal** | 300 ms | 45% | 40% | Moderate | 1.0x | Standard 60s timer, strategic ultimate timing |
| **Hard** | 150 ms | 75% | 75% | Advanced | 1.2x | Frame-trap punishes, launches whiffed attacks |
| **Nightmare** | 60 ms | 92% | 95% | Optimal | 1.4x | Habit Tracker adapts to player move spam; no HP regen between rounds |

*(Note: Difficulty damage multipliers do not apply to Ultimates, preserving the strict 30% rule).*

---

## 🎨 Procedural Art & Web Audio Engine

- **Procedural Skeleton Renderer**: Evaluates joint angles in radians to render head, torso, upper limbs, forearms, thighs, and shins as capsules with neon radial gradients and dynamic glow filters.
- **3 Parallax Canvas Stages**:
  - `Neo Tokyo Rooftop`: Shimmering high-rise skyline with illuminated neon billboards and communication towers.
  - `Cyber Alley`: Atmospheric rainy corridor with glowing signs and steam vents.
  - `Synthwave Harbor`: Ocean horizon with reflective waters, palm silhouettes, and a grid sun.
- **Synthesized Web Audio SFX**:
  - Polyphonic punch & kick impacts using modulated oscillator frequency sweeps.
  - Heavy bass-filtered boom for launchers and knockdowns.
  - Metallic chime for throw breaks and ultimate charge notifications.
  - Built-in dynamic synthwave soundtrack synthesized on-the-fly.

---

## 🏆 Modes & Features

- **Arcade Ladder**: 5 escalating stages against random fighters, culminating with boss ZERO on Nightmare difficulty. Points are scored for clear time, health remaining, max combo, perfect rounds, and ultimates landed.
- **Versus Mode**: Local 2-Player duel on a single keyboard or with gamepads.
- **Training Mode**: Practice mode with customizable dummy behavior (Idle, Crouch Guard, Stand Guard, Random), real-time frame data overlay, damage stats, and input history display.
- **Global Leaderboard**: Full Next.js API route (`/api/scores`) with rate limiting, server-side payload validation, and top 10 difficulty rankings.
- **Accessibility**: Reduced Motion option (removes screen shake and flashes), High Contrast / Colorblind palettes, adjustable Audio/Music volumes, keyboard navigable UI, and auto-pause on focus loss.

---

## 🧪 Test Suite & Verification

The project includes unit tests, determinism checks, AI balance tournaments, and Playwright end-to-end smoke tests:

```bash
# Run all 589 unit and engine tests via Vitest
npm run test

# Run Playwright E2E browser smoke tests
npm run test:e2e

# Run ESLint validation
npm run lint

# Production Next.js Turbopack build
npm run build
```

### Verified Test Highlights
- **Frame Data**: 57 assertions checking startup, active, recovery, and hit levels for all 8 fighters.
- **Fixed 30% Ultimate Rule**: 512 automated matrix assertions testing both player-to-AI and AI-to-player hits across all 8 fighters and all 4 difficulties.
- **Determinism**: Identical frame input streams produce bit-for-bit identical game states across 1,200 simulation frames.
- **Competitive AI Balance**: 168 automated AI-vs-AI tournament matches verifying that every match terminates cleanly and no fighter exceeds the 70% win rate cap.

---

## 🚀 Getting Started Locally

```bash
# 1. Clone repository
git clone https://github.com/Bhargav221287/neon-knuckles.git
cd neon-knuckles

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 📄 License

MIT License. Designed and engineered from scratch for optimal browser fighting game performance.
