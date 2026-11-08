export class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private sfxVolume = 0.8;
  private musicVolume = 0.4;
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private isMusicPlaying = false;

  constructor() {
    // Lazily initialized on first user interaction to comply with browser autoplay policy
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateVolumes();
    } catch {
      // Audio not supported in this environment
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.updateVolumes();
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    this.updateVolumes();
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    this.updateVolumes();
  }

  private updateVolumes() {
    if (!this.masterGain || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx?.currentTime || 0;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, now);
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, now);
    this.musicGain.gain.setValueAtTime(this.musicVolume, now);
  }

  /**
   * Resumes AudioContext if suspended.
   */
  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Sound effect: Light hit / Jab punch
   */
  public playHitLight() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Sound effect: Heavy hit / Kick impact
   */
  public playHitHeavy() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Sub punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    // Noise snap
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.17);
    noise.start(now);
    noise.stop(now + 0.09);
  }

  /**
   * Sound effect: Block deflection
   */
  public playBlock() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.07);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Sound effect: Whoosh / Swing
   */
  public playWhoosh() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Sound effect: Launcher explosion
   */
  public playLauncher() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.28);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.29);
  }

  /**
   * Sound effect: Ultimate Activated
   */
  public playUltimateStartup() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Dramatic energy riser
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.45);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.linearRampToValueAtTime(0.9, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Chime
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(1320, now + 0.2);
    chimeGain.gain.setValueAtTime(0.5, now + 0.2);
    chimeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    chime.connect(chimeGain);
    chimeGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.51);
    chime.start(now + 0.2);
    chime.stop(now + 0.61);
  }

  /**
   * Sound effect: Ultimate 30% Impact Slam
   */
  public playUltimateImpact() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(180, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.5);

    subGain.gain.setValueAtTime(1.0, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    sub.start(now);
    sub.stop(now + 0.56);
  }

  /**
   * Sound effect: Ultimate Denied (when Q pressed with <100 meter)
   */
  public playUltimateDenied() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(130, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  /**
   * Sound effect: K.O.
   */
  public playKO() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const chord = [220, 277, 330, 440];
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 1.2);

      gain.gain.setValueAtTime(0.4, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.05);
      osc.stop(now + 1.3);
    });
  }

  /**
   * Sound effect: UI Click
   */
  public playClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Procedural Synthwave BGM loop (pulsing bassline + arpeggio)
   */
  public startBGM() {
    if (this.isMusicPlaying) return;
    this.init();
    if (!this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;

    const notes = [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 123.47];
    let step = 0;

    const playBassStep = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
      const now = this.ctx.currentTime;
      const freq = notes[step % notes.length];
      step++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 0.23);
    };

    this.musicInterval = setInterval(playBassStep, 240); // ~125 BPM
  }

  public stopBGM() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
