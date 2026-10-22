/**
 * Procedural Web Audio API sound synthesizer for tactile workshop feedback.
 * No external audio files needed; guarantees instant zero-latency feedback.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Ratchet sound of pulling / unscrewing a pin (with optional Combo Fever harmonic pitch climb)
   */
  public playPinUnscrew(pitchMultiplier: number = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const pitch = Math.max(0.8, Math.min(1.6, pitchMultiplier));
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(780 * pitch, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  /**
   * Golden Star-Keyhole Clasp unlock fanfare
   */
  public playKeyUnlockChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [659.25, 880, 1174.66, 1318.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  /**
   * Occluded blocked tap: metallic dull thud with rapid pitch dip
   */
  public playBlockedThud() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Snap/deposit of pin into active toolbox or buffer
   */
  public playDepositPin(matched: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = matched ? 520 : 380;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Celebratory chime when a 3-slot toolbox is filled
   */
  public playBoxCompleted() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + i * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  /**
   * Plate clack when released or colliding
   */
  public playPlateClack() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.09);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Warning siren / tone when buffer overflows (Almost Won fail state)
   */
  public playAlmostWonFail() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.3);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * Workshop upgrade / renovation hammer & drill sound
   */
  public playWorkshopUpgrade() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  /**
   * 3rd-Gen Theme (Stained Glass): Harmonic crystal bell chime & glass shatter shimmer
   */
  public playCrystalShatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const harmonics = [1046.5, 1318.5, 1567.98, 2093.0];
    harmonics.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t + 0.24);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  /**
   * 3rd-Gen Theme (Knit & Yarn): Soft textile ribbon unraveling cascade
   */
  public playYarnUnravel() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(690, t + 0.18);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Kinetic Gravity Nudge: Low-end pneumatic thump + metallic pendulum swing whoosh
   */
  public playGravityNudge() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, t);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.16);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Layer Explode Peek: Precision mechanical iris separation click
   */
  public playLayerExplode(active: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(active ? 460 : 680, t);
    osc.frequency.exponentialRampToValueAtTime(active ? 720 : 410, t + 0.1);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Active <-> Next Toolbox Swap Once: Mechanical rack-and-pinion slide chime
   */
  public playToolboxSwap() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [493.88, 659.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.055;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, t + 0.12);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  /**
   * Molten Combo Wildcard: Harmonic forge chord when a wildcard pin melts into the active toolbox
   */
  public playMoltenWildcard() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.04;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  /**
   * Crystal Frost Cap (ICE): Crystalline chime when winter frost cracks or shatters free
   */
  public playFrostCrackChime(shattered: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = shattered ? [1046.5, 1318.5, 1567.98, 2093] : [987.77, 1318.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t + 0.14);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  /**
   * Twin Brass Chain-Link (CHAIN): Metallic double-ratchet chime when both chained pins release together
   */
  public playChainReleaseChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.045;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  }
}

export const soundManager = new SoundManager();
