/**
 * A soft tanpura drone made in the browser with the Web Audio API.
 * No music files, no licences: the sound is synthesised live.
 *
 * A tanpura repeats four plucks: Pa, upper Sa, upper Sa, lower Sa.
 * Each pluck is two slightly detuned sawtooth waves through a low-pass filter,
 * with a slow decay so the notes ring into each other.
 */

const SA = 138.59; // C#3, a common tanpura pitch
const PATTERN = [SA * 1.5, SA * 2, SA * 2, SA]; // Pa, Sa', Sa', Sa
const BEAT_S = 0.95;
const LOOKAHEAD_S = 1.2;

export class Tanpura {
  readonly ctx: AudioContext;
  /** Feed this into a MediaRecorder to record the sound with the film. */
  readonly stream: MediaStream;
  private master: GainNode;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextAt = 0;
  private step = 0;

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    const out = this.ctx.createMediaStreamDestination();
    this.master.connect(this.ctx.destination);
    this.master.connect(out);
    this.stream = out.stream;
  }

  async start(volume = 0.16) {
    await this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(volume, t + 1.5);
    this.nextAt = t + 0.05;
    this.step = 0;
    this.stopLoop();
    this.timer = setInterval(() => this.schedule(), 250);
    this.schedule();
  }

  /** Fades out over `seconds`, then goes quiet. */
  fadeOut(seconds = 1.5) {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + seconds);
    setTimeout(() => this.stopLoop(), seconds * 1000 + 100);
  }

  setMuted(muted: boolean) {
    this.master.disconnect(this.ctx.destination);
    if (!muted) this.master.connect(this.ctx.destination);
  }

  close() {
    this.stopLoop();
    void this.ctx.close();
  }

  private stopLoop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private schedule() {
    while (this.nextAt < this.ctx.currentTime + LOOKAHEAD_S) {
      this.pluck(PATTERN[this.step % PATTERN.length]!, this.nextAt);
      this.nextAt += BEAT_S;
      this.step += 1;
    }
  }

  private pluck(freq: number, at: number) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, at);
    filter.frequency.exponentialRampToValueAtTime(700, at + 2.5);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.5, at + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 3.6);
    filter.connect(env).connect(this.master);
    for (const detune of [-4, 5]) {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(at);
      osc.stop(at + 3.7);
    }
  }
}
