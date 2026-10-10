import { InstrumentTrack, HumanizerParams } from '../types';

interface ActiveVoice {
  id: string;
  chokeGroup: number;
  stopTime: number;
  gainNode: GainNode;
  sourceNode: AudioBufferSourceNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private bpm: number = 130;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private lookaheadInterval: number | null = null;
  private activeVoices: ActiveVoice[] = [];
  private onStepCallback: ((stepIndex: number) => void) | null = null;

  // Round-robin index counter per track
  private trackRoundRobinIndices: Map<string, number> = new Map();

  // Track references
  private tracks: InstrumentTrack[] = [];
  private humanizer: HumanizerParams = {
    timingJitterMs: 2.0,
    timingDriftMs: 4.0,
    velocityJitter: 0.05,
    swingPercent: 50.0,
    laidBackMs: 0.0,
    roundRobinEnabled: true,
  };

  private masterGain: GainNode | null = null;

  public init(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.95;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getContext(): AudioContext {
    return this.init();
  }

  public setTracks(tracks: InstrumentTrack[]) {
    this.tracks = tracks;
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(260, bpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setHumanizer(params: HumanizerParams) {
    this.humanizer = params;
  }

  public setOnStepCallback(cb: (stepIndex: number) => void) {
    this.onStepCallback = cb;
  }

  public start() {
    const ctx = this.init();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = ctx.currentTime + 0.05;

    this.lookaheadInterval = window.setInterval(() => {
      this.scheduler();
    }, 25);
  }

  public stop() {
    this.isPlaying = false;
    if (this.lookaheadInterval !== null) {
      clearInterval(this.lookaheadInterval);
      this.lookaheadInterval = null;
    }
    this.chokeAll();
    this.currentStep = 0;
    if (this.onStepCallback) {
      this.onStepCallback(-1);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private scheduler() {
    if (!this.ctx || !this.isPlaying) return;

    while (this.nextStepTime < this.ctx.currentTime + 0.1) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
  }

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const secondsPer16th = secondsPerBeat / 4.0;

    this.nextStepTime += secondsPer16th;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleStep(stepIndex: number, rawTime: number) {
    if (!this.ctx || !this.masterGain) return;

    const secondsPerBeat = 60.0 / this.bpm;
    const stepDuration = secondsPerBeat / 4.0;
    const ppq = stepIndex * 0.25;

    // Visual playhead indicator
    const uiDelayMs = Math.max(0, (rawTime - this.ctx.currentTime) * 1000);
    setTimeout(() => {
      if (this.isPlaying && this.onStepCallback) {
        this.onStepCallback(stepIndex);
      }
    }, uiDelayMs);

    const hasSolo = this.tracks.some((t) => t.solo);
    this.tracks.forEach((track) => {
      if (track.mute) return;
      if (hasSolo && !track.solo) return;

      const step = track.steps[stepIndex];
      if (!step || !step.active) return;

      // Probability check
      if (step.probability < 1.0 && Math.random() > step.probability) {
        return;
      }

      let timingOffsetSec = 0;

      // 1. Swing calculation (odd 16th notes delayed)
      if (stepIndex % 2 !== 0 && this.humanizer.swingPercent > 50.0) {
        const swingRatio = (this.humanizer.swingPercent - 50.0) / 100.0;
        timingOffsetSec += swingRatio * (stepDuration * 0.666);
      }

      // 2. Short-term random jitter
      if (this.humanizer.timingJitterMs > 0) {
        const jitter = (Math.random() * 2 - 1) * (this.humanizer.timingJitterMs / 1000.0);
        timingOffsetSec += jitter;
      }

      // 3. Long-term LFO drift
      if (this.humanizer.timingDriftMs > 0) {
        const drift = Math.sin(ppq * 0.25 * Math.PI) * (this.humanizer.timingDriftMs / 1000.0);
        timingOffsetSec += drift;
      }

      // 4. Laid-back micro-timing (J Dilla drunk push/pull on odd 16ths)
      if (this.humanizer.laidBackMs > 0 && stepIndex % 2 !== 0) {
        timingOffsetSec += this.humanizer.laidBackMs / 1000.0;
      }

      // 5. Per-step custom micro-timing offset
      if (step.timingOffsetMs !== 0) {
        timingOffsetSec += step.timingOffsetMs / 1000.0;
      }

      const scheduledBaseTime = Math.max(this.ctx!.currentTime, rawTime + timingOffsetSec);

      // Determine roll subdivisions
      let numSubdivisions = 1;
      switch (step.rollType) {
        case 'straight_32':
          numSubdivisions = 2;
          break;
        case 'straight_64':
          numSubdivisions = 4;
          break;
        case 'triplet_32':
          numSubdivisions = 3;
          break;
        case 'triplet_64':
          numSubdivisions = 6;
          break;
        default:
          numSubdivisions = 1;
      }

      const subDuration = stepDuration / numSubdivisions;

      for (let s = 0; s < numSubdivisions; s++) {
        const subTime = scheduledBaseTime + s * subDuration;
        const progress = numSubdivisions > 1 ? s / (numSubdivisions - 1) : 0;

        // Pitch envelope interpolation
        let pitchOffset = step.startPitchOffset;
        if (numSubdivisions > 1 && step.startPitchOffset !== step.endPitchOffset) {
          switch (step.pitchCurve) {
            case 'linear':
              pitchOffset = step.startPitchOffset + progress * (step.endPitchOffset - step.startPitchOffset);
              break;
            case 'exponential':
              pitchOffset = step.startPitchOffset + Math.pow(progress, 2) * (step.endPitchOffset - step.startPitchOffset);
              break;
            case 'logarithmic':
              pitchOffset = step.startPitchOffset + Math.sqrt(progress) * (step.endPitchOffset - step.startPitchOffset);
              break;
          }
        }

        // Stereo pan interpolation
        let panVal = step.panStart + progress * (step.panEnd - step.panStart);

        // Velocity with jitter and sub-decay
        let velocity = step.baseVelocity;
        if (this.humanizer.velocityJitter > 0) {
          velocity += (Math.random() * 2 - 1) * this.humanizer.velocityJitter;
        }

        // Live drummer hand alternation: left hand hits are naturally ~8% softer
        if (this.humanizer.roundRobinEnabled && stepIndex % 2 !== 0) {
          velocity *= 0.92;
          panVal -= 0.05; // slight physical stereo difference between hands
        }

        if (numSubdivisions > 1) {
          velocity *= (1.0 - progress * 0.22);
        }
        velocity = Math.max(0.05, Math.min(1.0, velocity)) * track.volume;

        // Choke handling: Closed or Pedal hats choke active Open voices in same group
        if (track.chokeGroup > 0 && step.hatOpenness < 0.25) {
          this.chokeGroup(track.chokeGroup, subTime);
        }

        // Select Buffer with Articulation Kit & Round-Robin Support
        let chosenBuffer = track.sampleBuffer;

        if (track.roundRobinKit && this.humanizer.roundRobinEnabled) {
          const kit = track.roundRobinKit;
          if (step.articulation === 'shank' && kit.shank) {
            chosenBuffer = kit.shank;
          } else if (step.articulation === 'sizzle' && kit.sizzle) {
            chosenBuffer = kit.sizzle;
          } else if (step.articulation === 'pedal' && kit.pedal) {
            chosenBuffer = kit.pedal;
          } else if (step.articulation === 'tip' || step.articulation === 'auto_round_robin' || !step.articulation) {
            // Downbeats / accents use Right Hand, Upbeats / ghost notes use Left Hand
            const isRightHand = (stepIndex % 2 === 0);
            chosenBuffer = isRightHand ? (kit.tipR || kit.tipL || track.sampleBuffer) : (kit.tipL || kit.tipR || track.sampleBuffer);
          }
        } else if (track.roundRobinBuffers && track.roundRobinBuffers.length > 0 && this.humanizer.roundRobinEnabled) {
          const currentIndex = this.trackRoundRobinIndices.get(track.id) || 0;
          chosenBuffer = track.roundRobinBuffers[currentIndex % track.roundRobinBuffers.length];
          this.trackRoundRobinIndices.set(track.id, currentIndex + 1);
        }

        // Trigger individual hit
        if (chosenBuffer) {
          this.playVoiceWithBuffer(chosenBuffer, track, subTime, velocity, pitchOffset, panVal, step.hatOpenness);
        }
      }
    });
  }

  public playVoiceWithBuffer(
    buffer: AudioBuffer,
    track: InstrumentTrack,
    time: number,
    velocity: number,
    pitchSemitones: number,
    pan: number,
    hatOpenness: number
  ) {
    if (!this.ctx || !this.masterGain) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const playbackRatio = Math.pow(2, pitchSemitones / 12.0);
    source.playbackRate.setValueAtTime(playbackRatio, time);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(velocity, time);

    // If tight closed hat, enforce fast natural decay to keep machine tight
    if (hatOpenness < 0.2 && track.chokeGroup > 0) {
      gainNode.gain.setValueAtTime(velocity, time + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    }

    const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan + track.pan)), time);
      source.connect(gainNode);
      gainNode.connect(panner);
      panner.connect(this.masterGain);
    } else {
      source.connect(gainNode);
      gainNode.connect(this.masterGain);
    }

    source.start(time);

    const voiceId = Math.random().toString(36).substring(2, 9);
    const duration = buffer.duration / playbackRatio;
    const stopTime = time + duration;

    const voiceEntry: ActiveVoice = {
      id: voiceId,
      chokeGroup: track.chokeGroup,
      stopTime,
      gainNode,
      sourceNode: source,
    };

    this.activeVoices.push(voiceEntry);

    source.onended = () => {
      this.activeVoices = this.activeVoices.filter(v => v.id !== voiceId);
    };
  }

  public playVoice(
    track: InstrumentTrack,
    time: number,
    velocity: number,
    pitchSemitones: number,
    pan: number,
    hatOpenness: number
  ) {
    if (track.sampleBuffer) {
      this.playVoiceWithBuffer(track.sampleBuffer, track, time, velocity, pitchSemitones, pan, hatOpenness);
    }
  }

  public chokeGroup(groupNumber: number, chokeTime: number) {
    for (const voice of this.activeVoices) {
      if (voice.chokeGroup === groupNumber && voice.stopTime > chokeTime) {
        try {
          voice.gainNode.gain.cancelScheduledValues(chokeTime);
          voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, chokeTime);
          // 3ms smooth click-free anti-pop decay
          voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, chokeTime + 0.003);
          voice.sourceNode.stop(chokeTime + 0.004);
        } catch {
          // ignore
        }
      }
    }
    this.activeVoices = this.activeVoices.filter(v => v.chokeGroup !== groupNumber || v.stopTime <= chokeTime);
  }

  public chokeAll() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const voice of this.activeVoices) {
      try {
        voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.003);
        voice.sourceNode.stop(now + 0.004);
      } catch {
        // ignore
      }
    }
    this.activeVoices = [];
  }

  public auditionSample(buffer: AudioBuffer, velocity: number = 0.85, pitchSemitones: number = 0) {
    const ctx = this.init();
    if (!this.masterGain) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = Math.pow(2, pitchSemitones / 12.0);

    const gain = ctx.createGain();
    gain.gain.value = velocity;

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }
}

export const audioEngine = new AudioEngine();
