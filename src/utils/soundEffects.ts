// Web Audio API Sound System for BACS Canada Immigration Quiz Engine
// Integrates:
// 1. Original built-in ambient quiz audio bed (continuous, low-level, educational, modern)
// 2. Three-stage question countdown audio (25-11s neutral, 10-6s urgent, 5-1s final)
// 3. Audio ducking during final 5 seconds of countdown
// 4. Short professional time-expired confirmation tone at 0s
// 5. Unified mixer with master gain, mute control, and offline rendering for video export

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgGain: GainNode | null = null;
  private muted: boolean = false;
  private customDestination: AudioNode | null = null;

  // Background Audio State
  private isBgPlaying: boolean = false;
  private bgSourceNode: AudioBufferSourceNode | null = null;
  private ambientBuffer: AudioBuffer | null = null;
  private isDucked: boolean = false;

  public setCustomDestination(dest: AudioNode | null) {
    this.customDestination = dest;
    if (this.masterGain && this.customDestination) {
      try {
        this.masterGain.connect(this.customDestination);
      } catch (e) {}
    }
  }

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && !this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      if (this.customDestination) {
        this.masterGain.connect(this.customDestination);
      }
    }

    if (this.ctx && !this.bgGain && this.masterGain) {
      this.bgGain = this.ctx.createGain();
      this.bgGain.gain.setValueAtTime(0.032, this.ctx.currentTime);
      this.bgGain.connect(this.masterGain);
    }
  }

  public getAudioContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    this.init();
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, now);
    }

    if (this.muted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }

    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Generates a 16-second seamless, original ambient audio loop buffer:
   * - Gentle Dm9 and Bbmaj9 chordal pad
   * - Soft harmonic low-pass contour (300Hz - 450Hz)
   * - Subtle 1-second cadence pulse (quiet thinking tempo)
   * - Constant-power crossfade for seamless looping without clicks
   */
  private getOrCreateAmbientBuffer(): AudioBuffer | null {
    this.init();
    if (!this.ctx) return null;
    if (this.ambientBuffer) return this.ambientBuffer;

    const sampleRate = this.ctx.sampleRate || 48000;
    const loopSec = 16;
    const totalSamples = Math.round(sampleRate * loopSec);
    const buffer = this.ctx.createBuffer(2, totalSamples, sampleRate);
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.getChannelData(1);

    // Harmonically tuned frequencies to complete exact cycles in 16s
    const c1 = [73.42, 110.0, 174.61, 261.63, 329.63].map((f) => Math.round(f * loopSec) / loopSec);
    const c2 = [58.27, 87.31, 146.83, 220.0, 261.63].map((f) => Math.round(f * loopSec) / loopSec);
    const amps = [0.08, 0.06, 0.05, 0.04, 0.03];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const phase = (t / loopSec) * 2 * Math.PI;
      const w1 = Math.pow(Math.cos(phase * 0.5), 2);
      const w2 = Math.pow(Math.sin(phase * 0.5), 2);

      let sL = 0;
      let sR = 0;

      // Chord 1 (Dm9)
      for (let n = 0; n < c1.length; n++) {
        const f1 = c1[n];
        const a = amps[n];
        sL += Math.sin(2 * Math.PI * f1 * 1.0008 * t) * a * w1;
        sR += Math.sin(2 * Math.PI * f1 * 0.9992 * t) * a * w1;
      }

      // Chord 2 (Bbmaj9)
      for (let n = 0; n < c2.length; n++) {
        const f2 = c2[n];
        const a = amps[n];
        sL += Math.sin(2 * Math.PI * f2 * 1.0008 * t) * a * w2;
        sR += Math.sin(2 * Math.PI * f2 * 0.9992 * t) * a * w2;
      }

      // Subtle 1-second pulse for assessment focus (thinking cadence)
      const frac = t - Math.floor(t);
      if (frac < 0.04) {
        const p = Math.sin(2 * Math.PI * 220 * frac) * Math.exp(-frac * 90) * 0.018;
        sL += p;
        sR += p;
      }

      ch0[i] = sL;
      ch1[i] = sR;
    }

    this.ambientBuffer = buffer;
    return this.ambientBuffer;
  }

  /**
   * Starts the continuous background ambient bed.
   * Prevents duplicate instances, respects mute status.
   */
  public startBackgroundMusic() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.bgGain) return;

    if (this.isBgPlaying) return; // Prevent duplicate loops

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const buffer = this.getOrCreateAmbientBuffer();
      if (!buffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Connect to background gain node
      source.connect(this.bgGain);

      const now = this.ctx.currentTime;
      this.bgGain.gain.cancelScheduledValues(now);
      this.bgGain.gain.setValueAtTime(0.001, now);
      this.bgGain.gain.linearRampToValueAtTime(this.isDucked ? 0.014 : 0.032, now + 0.6);

      source.start(now);
      this.bgSourceNode = source;
      this.isBgPlaying = true;
    } catch (e) {
      console.warn('Could not start background audio:', e);
    }
  }

  /**
   * Stops the background ambient bed cleanly.
   */
  public stopBackgroundMusic() {
    if (!this.isBgPlaying || !this.bgSourceNode) return;

    try {
      if (this.bgGain && this.ctx) {
        const now = this.ctx.currentTime;
        this.bgGain.gain.cancelScheduledValues(now);
        this.bgGain.gain.setValueAtTime(this.bgGain.gain.value, now);
        this.bgGain.gain.linearRampToValueAtTime(0.0001, now + 0.2);
      }

      const nodeToStop = this.bgSourceNode;
      setTimeout(() => {
        try {
          nodeToStop.stop();
          nodeToStop.disconnect();
        } catch (e) {}
      }, 220);
    } catch (e) {}

    this.bgSourceNode = null;
    this.isBgPlaying = false;
  }

  /**
   * Automatically reduces background music slightly during the final 5 seconds
   * so countdown tones remain completely prominent and audible.
   */
  public duckBackgroundMusic(duck: boolean) {
    this.isDucked = duck;
    if (!this.bgGain || !this.ctx || this.muted) return;

    try {
      const now = this.ctx.currentTime;
      this.bgGain.gain.cancelScheduledValues(now);
      const targetGain = duck ? 0.014 : 0.032;
      this.bgGain.gain.linearRampToValueAtTime(targetGain, now + 0.25);
    } catch (e) {}
  }

  public stopCountdownAudio() {
    // Resets ducking when countdown finishes
    this.duckBackgroundMusic(false);
  }

  public stopAll() {
    this.stopBackgroundMusic();
    this.stopCountdownAudio();
  }

  // --- QUESTION COUNTDOWN AUDIO SYSTEM ---

  /**
   * Stage 1 (25s - 11s): Soft, neutral professional tick (580Hz)
   */
  public playNormalCountdownTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {}
  }

  /**
   * Stage 2 (10s - 6s): Slightly stronger, higher pitch, urgent tick (820Hz)
   */
  public playUrgencyCountdownTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, now);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch (e) {}
  }

  /**
   * Stage 3 (5s - 1s): Distinct sharper final-countdown tone (1120Hz triangle)
   */
  public playFinalCountdownTick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1120, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.075);
    } catch (e) {}
  }

  /**
   * At 0s: Short professional time-expired/reveal confirmation tone (520Hz -> 370Hz)
   */
  public playTimeExpired() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(370, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);

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
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (e) {}
  }

  public playFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      arpeggio.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.12, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.4);
      });
    } catch (e) {}
  }

  public playCorrect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.5, now + 0.3);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(now + 0.6);
    } catch (e) {}
  }

  public playReveal() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  /**
   * Renders the complete, mixed quiz audio track (Ambient Background Bed + 3-Stage Countdown
   * + Ducking in final 5s + Expired/Reveal Tones) into an AudioBuffer using OfflineAudioContext.
   * This is used by VideoRecorderStudio for WebCodecs and MediaRecorder exports.
   */
  public async renderFullQuizAudio(
    durationSec: number,
    singleQuestionDuration: number,
    qThinkTime: number,
    sampleRate: number = 48000
  ): Promise<AudioBuffer> {
    const totalAudioSamples = Math.round(sampleRate * durationSec);
    const offlineCtx = new OfflineAudioContext(2, totalAudioSamples, sampleRate);

    // 1. Synthesize Continuous Ambient Background Bed
    const loopSec = 16;
    const c1 = [73.42, 110.0, 174.61, 261.63, 329.63].map((f) => Math.round(f * loopSec) / loopSec);
    const c2 = [58.27, 87.31, 146.83, 220.0, 261.63].map((f) => Math.round(f * loopSec) / loopSec);
    const amps = [0.08, 0.06, 0.05, 0.04, 0.03];

    // Background master gain node in offline context
    const bgGain = offlineCtx.createGain();
    bgGain.gain.setValueAtTime(0.032, 0);

    // Automate Ducking for each question during final 5 seconds (qThinkTime - 5 to qThinkTime)
    const numQuestions = Math.ceil(durationSec / singleQuestionDuration);
    for (let q = 0; q < numQuestions; q++) {
      const qStart = q * singleQuestionDuration;
      const duckStart = qStart + Math.max(0, qThinkTime - 5);
      const duckEnd = qStart + qThinkTime;

      if (duckStart < durationSec) {
        bgGain.gain.setValueAtTime(0.032, qStart);
        bgGain.gain.linearRampToValueAtTime(0.014, Math.min(duckStart + 0.25, durationSec));
        if (duckEnd < durationSec) {
          bgGain.gain.setValueAtTime(0.014, duckEnd);
          bgGain.gain.linearRampToValueAtTime(0.032, Math.min(duckEnd + 0.3, durationSec));
        }
      }
    }

    // Create and connect ambient oscillators in offline context
    for (let n = 0; n < c1.length; n++) {
      const osc1 = offlineCtx.createOscillator();
      const oscGain1 = offlineCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(c1[n], 0);
      oscGain1.gain.setValueAtTime(amps[n] * 0.7, 0);

      osc1.connect(oscGain1);
      oscGain1.connect(bgGain);
      osc1.start(0);
      osc1.stop(durationSec);

      const osc2 = offlineCtx.createOscillator();
      const oscGain2 = offlineCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(c2[n], 0);
      oscGain2.gain.setValueAtTime(amps[n] * 0.5, 0);

      osc2.connect(oscGain2);
      oscGain2.connect(bgGain);
      osc2.start(0);
      osc2.stop(durationSec);
    }

    bgGain.connect(offlineCtx.destination);

    // 2. Synthesize Countdown and Transition Tones across the duration
    for (let sec = 0; sec < durationSec; sec++) {
      const secInQ = sec % singleQuestionDuration;

      if (secInQ < qThinkTime) {
        const secRemaining = Math.round(qThinkTime - secInQ);
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();

        if (secRemaining >= 11) {
          // Stage 1 (25-11s): Soft neutral tick (580Hz)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(580, sec);
          gain.gain.setValueAtTime(0.045, sec);
          gain.gain.exponentialRampToValueAtTime(0.0001, sec + 0.04);
          osc.connect(gain);
          gain.connect(offlineCtx.destination);
          osc.start(sec);
          osc.stop(sec + 0.04);
        } else if (secRemaining >= 6) {
          // Stage 2 (10-6s): Urgency tick (820Hz)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(820, sec);
          gain.gain.setValueAtTime(0.07, sec);
          gain.gain.exponentialRampToValueAtTime(0.0001, sec + 0.055);
          osc.connect(gain);
          gain.connect(offlineCtx.destination);
          osc.start(sec);
          osc.stop(sec + 0.055);
        } else {
          // Stage 3 (5-1s): Final countdown (1120Hz triangle)
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1120, sec);
          gain.gain.setValueAtTime(0.09, sec);
          gain.gain.exponentialRampToValueAtTime(0.0001, sec + 0.075);
          osc.connect(gain);
          gain.connect(offlineCtx.destination);
          osc.start(sec);
          osc.stop(sec + 0.075);
        }
      } else if (Math.abs(secInQ - qThinkTime) < 1) {
        // At 0s: Short professional time-expired confirmation tone (520Hz -> 370Hz)
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, sec);
        osc.frequency.exponentialRampToValueAtTime(370, sec + 0.18);
        gain.gain.setValueAtTime(0.08, sec);
        gain.gain.exponentialRampToValueAtTime(0.0001, sec + 0.22);
        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(sec);
        osc.stop(sec + 0.22);
      } else {
        // Review tone
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, sec);
        gain.gain.setValueAtTime(0.025, sec);
        gain.gain.exponentialRampToValueAtTime(0.0001, sec + 0.08);
        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(sec);
        osc.stop(sec + 0.08);
      }
    }

    return await offlineCtx.startRendering();
  }
}

export const sounds = new SoundManager();
