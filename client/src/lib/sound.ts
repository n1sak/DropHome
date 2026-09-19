/**
 * Tiny synthesized sound effects (no audio files). Everything is triggered by
 * a click or a drop, so browsers allow it. Muted from the menu.
 */
class Sounds {
  enabled = true;
  private ctx: AudioContext | null = null;

  private audio(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(from: number, to: number, dur: number, gain = 0.06, type: OscillatorType = 'sine', delay = 0) {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, from: number, to: number, gain = 0.05, kind: BiquadFilterType = 'lowpass', delay = 0) {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = kind;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(t);
  }

  /** Walking between rooms: a soft whoosh. */
  step() {
    this.noise(0.34, 300, 1400, 0.035);
  }
  /** A drawer sliding or a door swinging open. */
  open() {
    this.noise(0.28, 500, 2200, 0.04);
    this.tone(150, 90, 0.12, 0.07, 'triangle', 0.22);
  }
  close() {
    this.noise(0.18, 1800, 400, 0.03);
    this.tone(120, 70, 0.1, 0.08, 'triangle', 0.12);
  }
  paper() {
    this.noise(0.12, 3000, 6000, 0.03, 'highpass');
  }
  drop() {
    this.tone(520, 300, 0.11, 0.07);
  }
  pin() {
    this.tone(1300, 900, 0.05, 0.05, 'square');
  }
  trash() {
    this.noise(0.09, 2500, 900, 0.05, 'bandpass');
    this.noise(0.12, 1800, 500, 0.045, 'bandpass', 0.09);
  }
  build() {
    this.tone(220, 120, 0.07, 0.09, 'square');
    this.tone(240, 130, 0.07, 0.09, 'square', 0.16);
  }
  chime() {
    this.tone(660, 660, 0.18, 0.05);
    this.tone(880, 880, 0.28, 0.05, 'sine', 0.12);
  }
}

export const sounds = new Sounds();
