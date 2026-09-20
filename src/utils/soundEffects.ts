// Web Audio API Sound Effects synthesizer matching Blessing Chigozie & BACS live challenge audio cues

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private customDestination: AudioNode | null = null;

  public setCustomDestination(dest: AudioNode | null) {
    this.customDestination = dest;
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public getAudioContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playNormalCountdownTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Stage 1 (25s - 11s): Soft, low volume, neutral professional tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.customDestination) {
        gain.connect(this.customDestination);
      }

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  public playUrgencyCountdownTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Stage 2 (10s - 6s): Slightly more noticeable, higher pitch, urgent but professional
      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.customDestination) {
        gain.connect(this.customDestination);
      }

      osc.start(now);
      osc.stop(now + 0.055);
    } catch (e) {}
  }

  public playFinalCountdownTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Stage 3 (5s - 1s): Sharper, distinct, high-pitched countdown tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1120, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.customDestination) {
        gain.connect(this.customDestination);
      }

      osc.start(now);
      osc.stop(now + 0.075);
    } catch (e) {}
  }

  public playTimeExpired() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // At 0s: Short, gentle descending confirmation tone (not a siren/buzzer)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(370, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.customDestination) {
        gain.connect(this.customDestination);
      }

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  public playQuestionCountdownTick(secondsRemaining: number) {
    if (this.muted) return;
    if (secondsRemaining >= 11) {
      this.playNormalCountdownTick();
    } else if (secondsRemaining >= 6) {
      this.playUrgencyCountdownTick();
    } else if (secondsRemaining >= 1) {
      this.playFinalCountdownTick();
    }
  }

  public playTick() {
    this.playNormalCountdownTick();
  }

  public playUrgentTick() {
    this.playFinalCountdownTick();
  }

  public playMilestone() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 triumphant chord
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        if (this.customDestination) {
          gain.connect(this.customDestination);
        }

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (e) {}
  }

  public playFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      arpeggio.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        if (this.customDestination) {
          gain.connect(this.customDestination);
        }

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.4);
      });
    } catch (e) {}
  }

  public playCorrect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.customDestination) {
        gain.connect(this.customDestination);
      }

      osc.start();
      osc.stop(now + 0.6);
    } catch (e) {}
  }

  public playReveal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      if (this.customDestination) {
        gain.connect(this.customDestination);
      }

      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {}
  }
}

export const sounds = new SoundManager();
