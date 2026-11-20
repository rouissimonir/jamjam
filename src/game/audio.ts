/**
 * Procedural Web Audio API ASMR synthesizer for Royal Post: Wax & Ribbon.
 * Synthesizes crisp brittle sealing-wax cracks, silky satin ribbon zips,
 * wooden bobbin chimes, and music-box heirloom reveals with zero external assets.
 */
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
   * Plays a brief filtered noise burst (silk brush or brittle wax crackle).
   */
  private playNoiseBurst(
    duration: number,
    centerFreq: number,
    q: number,
    peakGain: number,
    delaySec: number = 0
  ) {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp((-i / length) * 4.5);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, this.ctx.currentTime + delaySec);
    filter.Q.setValueAtTime(q, this.ctx.currentTime + delaySec);

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime + delaySec;
    gain.gain.setValueAtTime(peakGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    src.start(t);
    src.stop(t + duration);
  }

  /**
   * Satin ribbon unhook & elastic recoil zip (silky noise brush + Parisian D-major pentatonic celesta pluck)
   */
  public playPinUnscrew(pitchMultiplier: number = 1.0, streakStep: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const pitch = Math.max(0.8, Math.min(1.6, pitchMultiplier));
    const t = this.ctx.currentTime;

    // 1. Silky satin whisper transient
    this.playNoiseBurst(0.09, 2600 * pitch, 2.4, 0.14);

    // 2. Warm wooden bobbin pluck
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(340 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(760 * pitch, t + 0.11);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);

    // 3. Ascending D-Major Pentatonic Music-Box Harmonic Note (so rhythmic play sings!)
    const pentatonic = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66, 1318.51, 1479.98];
    const noteIndex = Math.max(0, Math.floor(streakStep)) % pentatonic.length;
    const bellFreq = pentatonic[noteIndex];
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(bellFreq, t + 0.018);

    bellGain.gain.setValueAtTime(0.09, t + 0.018);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    bellOsc.connect(bellGain);
    bellGain.connect(this.ctx.destination);

    bellOsc.start(t + 0.018);
    bellOsc.stop(t + 0.24);
  }

  /**
   * Brass Signet Medallion unlock chime
   */
  public playKeyUnlockChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.06, 3200, 4.0, 0.16);
    const notes = [659.25, 880, 1174.66, 1318.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  /**
   * Blocked weave tap: muted taut fabric / solid wax knock
   */
  public playBlockedThud() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, t);
    osc.frequency.exponentialRampToValueAtTime(62, t + 0.12);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  /**
   * Winding a ribbon onto the Velvet Bobbin or parking on a Brass Peg
   */
  public playDepositPin(matched: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = matched ? 540 : 370;
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.42, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  /**
   * Warm mahogany music-box celesta chord when a 3-Ribbon Velvet Bobbin completes
   * and advances the Live Centerpiece Heirloom Unboxing Stage
   */
  public playBoxCompleted() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + i * 0.055;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  /**
   * Soft parchment rustle & velvet flap release
   */
  public playPlateClack() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.11, 1400, 1.4, 0.16);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, t);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.09);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Gentle wooden tone when 5-Peg Ribbon Rack is full ("One Ribbon Short")
   */
  public playAlmostWonFail() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(290, t);
    osc.frequency.linearRampToValueAtTime(175, t + 0.32);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * Heirloom display & Curio Cabinet flourish
   */
  public playWorkshopUpgrade() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.075;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  /**
   * Brittle wax flake cascade & crystal heirloom shimmer when a parcel ribbon strap clears
   */
  public playCrystalShatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.08, 2900, 3.2, 0.18);
    const harmonics = [987.77, 1318.5, 1567.98, 1975.53];
    harmonics.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.032;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.08, t + 0.22);

      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  /**
   * Silky ribbon unspooling cascade
   */
  public playYarnUnravel() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.14, 2200, 2.0, 0.16);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(720, t + 0.17);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.19);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  /**
   * Gentle Parcel Shake [G]: warm wood desk rustle + hanging gift-tag swing
   */
  public playGravityNudge() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.12, 900, 1.2, 0.14);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.17);
  }

  /**
   * Candlelight Layer Peek [E]: crisp parchment fold lift
   */
  public playLayerExplode(active: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.07, active ? 2100 : 1500, 1.8, 0.12);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(active ? 480 : 660, t);
    osc.frequency.exponentialRampToValueAtTime(active ? 720 : 420, t + 0.1);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Velvet Bobbin Swap [S]: smooth wooden spindle turn
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
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t + 0.12);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  /**
   * Golden Scissors [W]: metallic tailoring snip + bright golden harmonic chord
   */
  public playMoltenWildcard() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Crisp tailoring scissor blades snip
    this.playNoiseBurst(0.045, 4200, 5.5, 0.22);
    this.playNoiseBurst(0.05, 5100, 6.0, 0.16, 0.04);

    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + 0.04 + idx * 0.04;

      osc.type = 'triangle';
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
   * Brittle Sealing Wax Crack & Shatter (WAX×2 -> WAX×1 -> Shatter)
   * Crisp high-Q snap transient (1.8kHz–3.2kHz) mimicking real lacquered wax cracking!
   */
  public playFrostCrackChime(shattered: boolean = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Brittle wax crack transients
    this.playNoiseBurst(0.045, 2100, 4.2, 0.28);
    if (shattered) {
      this.playNoiseBurst(0.06, 3100, 3.8, 0.24, 0.035);
      this.playNoiseBurst(0.05, 2600, 3.2, 0.18, 0.075);
    }

    const notes = shattered ? [880, 1174.66, 1567.98, 2093] : [783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.035;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.09, t + 0.14);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  /**
   * Tied Satin Bow Pair (BOW): Silky double-untie flourish when both ribbons release together
   */
  public playChainReleaseChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.11, 2400, 2.2, 0.16);
    this.playNoiseBurst(0.1, 2900, 2.5, 0.14, 0.06);

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.045;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  /**
   * Grand Wax-Seal Break Ceremony: deep crimson lacquer snap + velvet lid rise + warm unboxing chord
   */
  public playGrandWaxSealCrack() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // 1. Crisp multi-layered sealing-wax snap
    this.playNoiseBurst(0.055, 1950, 4.4, 0.3);
    this.playNoiseBurst(0.07, 3050, 3.6, 0.24, 0.04);
    this.playNoiseBurst(0.14, 1500, 1.5, 0.16, 0.09);

    // 2. Warm antique mahogany celesta unboxing chord
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + 0.07 + idx * 0.05;

      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.42);
    });
  }

  /**
   * Wax Re-Stamp Undo: gentle reverse silk glide + warm wax seal press thump
   */
  public playWaxRestampUndo() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.08, 1900, 2.0, 0.12);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.13);

    gain.gain.setValueAtTime(0.17, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Playable Curio 1: Imperial Songbird Egg — celesta wind-up + golden songbird trill
   */
  public playSongbirdTrill() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const melody = [1046.5, 1318.5, 1567.98, 2093.0, 1760.0, 2093.0];
    melody.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.065;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * (idx === 3 ? 1.06 : 1.02), t + 0.09);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  /**
   * Playable Curio 2: Venetian Astral Watch — mechanical escapement ticks + sapphire bell
   */
  public playWatchEscapement() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    for (let i = 0; i < 4; i++) {
      this.playNoiseBurst(0.02, i % 2 === 0 ? 4400 : 3600, 6.5, 0.18, i * 0.075);
    }
    const t = this.ctx.currentTime + 0.24;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, t);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * Playable Curio 3: Kyoto Lacquer Tea Chest — paulownia wood resonance + kintsugi porcelain bell
   */
  public playLacquerChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.09, 1300, 1.8, 0.14);
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  /**
   * Playable Curio 4: Grand Botanical Orrery — celestial glass-harp triad sweep
   */
  public playOrreryHarp() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [587.33, 739.99, 880, 1174.66, 1479.98];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.055;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.44);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.44);
    });
  }

  /**
   * Victory 3-Star Wax Mastery Stamp: crisp brass seal press + rising gold harmonic bell
   */
  public playStarStamp(starIndex: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [587.33, 739.99, 1174.66];
    const freq = notes[Math.max(0, Math.min(2, starIndex))];
    this.playNoiseBurst(0.04, 2200 + starIndex * 450, 3.8, 0.18);

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.04, t + 0.18);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.34);
  }

  /**
   * Live Heirloom Stage Advance Fanfare (Stage 1 -> 2 -> 3)
   */
  public playStageAdvanceChime(stage: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const chord =
      stage >= 3
        ? [587.33, 739.99, 880, 1174.66, 1479.98]
        : stage === 2
        ? [523.25, 659.25, 783.99, 1046.5]
        : [440, 554.37, 659.25];

    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.045;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.32);
    });
  }

  /**
   * Royal Courier Commission Claimed Flourish
   */
  public playCommissionClaim() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.playNoiseBurst(0.05, 3400, 4.2, 0.16);
    const notes = [659.25, 880, 1174.66, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = this.ctx!.currentTime + idx * 0.05;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }
}

export const soundManager = new SoundManager();
