// Procedural metallic and percussion synthesis engine for vintage, live round-robin, and modern one-shots
// Produces studio-grade Float32Array AudioBuffers without relying on external network assets

export function extractPeakData(buffer: AudioBuffer, numPeaks: number = 64): number[] {
  const channelData = buffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / numPeaks) || 1;
  const peaks: number[] = [];

  for (let i = 0; i < numPeaks; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize && start + j < channelData.length; j++) {
      const val = Math.abs(channelData[start + j]);
      if (val > max) max = val;
    }
    peaks.push(Math.min(1, max));
  }
  return peaks;
}

// 6 metallic frequencies based on classic analog 808/909 drum machine circuitry
const METALLIC_FREQS = [205.3, 304.4, 369.6, 522.7, 540.0, 800.0];

// High-pass filter helper (single-pole RC digital filter) to strip low mud
function applyHighPass(data: Float32Array, sampleRate: number, cutoffHz: number) {
  const dt = 1 / sampleRate;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const alpha = rc / (rc + dt);
  let prevIn = 0;
  let prevOut = 0;
  for (let i = 0; i < data.length; i++) {
    const currIn = data[i];
    const currOut = alpha * (prevOut + currIn - prevIn);
    prevIn = currIn;
    prevOut = currOut;
    data[i] = currOut;
  }
}

// Bandpass filter helper to shape the metallic sizzling resonance
export function applyBandPass(data: Float32Array, sampleRate: number, centerHz: number, q: number = 2.0) {
  const w0 = 2 * Math.PI * centerHz / sampleRate;
  const alpha = Math.sin(w0) / (2 * q);
  const b0 = alpha;
  const b1 = 0;
  const b2 = -alpha;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;

  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < data.length; i++) {
    const x0 = data[i];
    const y0 = (b0 / a0) * x0 + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
    data[i] = y0;
  }
}

// Standard 909 style closed hat
export function synthesizeClosedHat(ctx: AudioContext, decaySeconds: number = 0.05, openness: number = 0.0): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = Math.max(0.04, decaySeconds + openness * 0.12);
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / (0.012 + openness * 0.035));
    
    let oscMix = 0;
    for (let f = 0; f < METALLIC_FREQS.length; f++) {
      const phase = 2 * Math.PI * METALLIC_FREQS[f] * t;
      oscMix += (Math.sin(phase) > 0 ? 0.3 : -0.3);
    }
    const noise = (Math.random() * 2 - 1) * 0.45;
    const sample = (oscMix * 0.6 + noise) * env;

    left[i] = sample * 0.85;
    right[i] = sample * 0.9;
  }

  applyHighPass(left, sampleRate, 7000);
  applyHighPass(right, sampleRate, 7000);
  return buffer;
}

// Live Acoustic Hat Tip Hit (Left or Right Hand strike for round-robin realism)
export function synthesizeHatTip(ctx: AudioContext, hand: 'left' | 'right'): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.05;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Frequency shift between hands to simulate striking different spots on the cymbal bow
  const freqMultiplier = hand === 'left' ? 1.025 : 0.985;
  const stickClickFreq = hand === 'left' ? 9500 : 8800;

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.012);
    
    let oscMix = 0;
    for (let f = 0; f < METALLIC_FREQS.length; f++) {
      const phase = 2 * Math.PI * (METALLIC_FREQS[f] * freqMultiplier) * t;
      oscMix += (Math.sin(phase) > 0 ? 0.28 : -0.28);
    }
    // High-pitched stick tip ping
    const stickClick = Math.sin(2 * Math.PI * stickClickFreq * t) * Math.exp(-t / 0.003) * 0.4;
    const noise = (Math.random() * 2 - 1) * 0.4;
    const sample = (oscMix * 0.45 + noise + stickClick) * env;

    left[i] = sample * (hand === 'left' ? 0.88 : 0.82);
    right[i] = sample * (hand === 'left' ? 0.82 : 0.88);
  }

  applyHighPass(left, sampleRate, 6200);
  applyHighPass(right, sampleRate, 6200);
  return buffer;
}

// Live Acoustic Hat Shank Hit (Heavier shoulder of the stick on cymbal edge for accents)
export function synthesizeHatShank(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.085;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Longer sustain, heavier metallic ring
    const env = Math.exp(-t / 0.024);
    
    let oscMix = 0;
    for (let f = 0; f < METALLIC_FREQS.length; f++) {
      const phase = 2 * Math.PI * METALLIC_FREQS[f] * t;
      oscMix += (Math.sin(phase) > 0 ? 0.35 : -0.35);
    }
    // Low metallic body resonance of the cymbal shoulder
    const bodyThump = Math.sin(2 * Math.PI * 460 * t) * Math.exp(-t / 0.009) * 0.45;
    const noise = (Math.random() * 2 - 1) * 0.55;
    const sample = (oscMix * 0.5 + noise + bodyThump) * env;

    left[i] = sample * 0.95;
    right[i] = sample * 0.95;
  }

  applyHighPass(left, sampleRate, 4800);
  applyHighPass(right, sampleRate, 4800);
  return buffer;
}

// Live Acoustic Hat Sizzle Hit (Slightly loose top cymbal)
export function synthesizeHatSizzle(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.16;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.045);
    
    let oscMix = 0;
    for (let f = 0; f < METALLIC_FREQS.length; f++) {
      const phase = 2 * Math.PI * METALLIC_FREQS[f] * t;
      oscMix += (Math.sin(phase) > 0 ? 0.25 : -0.25);
    }
    // Double cymbal contact chatter/sizzle
    const chatter = Math.sin(2 * Math.PI * 6800 * t) * (1 + 0.35 * Math.sin(2 * Math.PI * 180 * t)) * 0.3;
    const noise = (Math.random() * 2 - 1) * 0.6;
    const sample = (oscMix * 0.45 + noise + chatter) * env;

    left[i] = sample * 0.9;
    right[i] = sample * 0.92;
  }

  applyHighPass(left, sampleRate, 5500);
  applyHighPass(right, sampleRate, 5500);
  return buffer;
}

// Modern Hyper-Crisp Rage / Yeat Hat (Aggressive digital cut)
export function synthesizeRageHat(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.042;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.009);
    let noise = (Math.random() * 2 - 1);
    if (noise > 0.6) noise = 1.0;
    else if (noise < -0.6) noise = -1.0;

    const bite = Math.sin(2 * Math.PI * 11000 * t) * 0.55;
    const sample = (noise * 0.75 + bite) * env;

    left[i] = Math.max(-1, Math.min(1, sample * 1.05));
    right[i] = Math.max(-1, Math.min(1, sample * 1.05));
  }

  applyHighPass(left, sampleRate, 8500);
  applyHighPass(right, sampleRate, 8500);
  return buffer;
}

// Detroit / Michigan 808 Clipped Hat (Short, dry, un-reverbed)
export function synthesizeDetroitHat(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.035;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.007);
    const noise = (Math.random() * 2 - 1) * 0.85;
    const click = Math.sin(2 * Math.PI * 7800 * t) * 0.4;
    const sample = (noise + click) * env;

    left[i] = sample;
    right[i] = sample;
  }

  applyHighPass(left, sampleRate, 7200);
  applyHighPass(right, sampleRate, 7200);
  return buffer;
}

// Wheezy / Gunna Wave Hat (Sizzling, pitched, bright with upper harmonic wave)
export function synthesizeWheezyHat(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.052;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.013);
    const noise = (Math.random() * 2 - 1) * 0.6;
    const sizzle = Math.sin(2 * Math.PI * 9200 * t + Math.sin(2 * Math.PI * 400 * t) * 1.5) * 0.4;
    const sample = (noise + sizzle) * env;

    left[i] = sample * 0.95;
    right[i] = sample * 0.95;
  }

  applyHighPass(left, sampleRate, 7500);
  applyHighPass(right, sampleRate, 7500);
  return buffer;
}

// Metro Boomin Dark 808 Hat (Punchy, dark analog transient, heavy snap)
export function synthesizeMetroHat(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.048;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.011);
    const noise = (Math.random() * 2 - 1) * 0.7;
    const click = Math.sin(2 * Math.PI * 6200 * t) * Math.exp(-t / 0.002) * 0.6;
    const metallic = Math.sin(2 * Math.PI * 8400 * t) * 0.35;
    const sample = (noise + click + metallic) * env;

    left[i] = sample * 0.9;
    right[i] = sample * 0.92;
  }

  applyHighPass(left, sampleRate, 6800);
  applyHighPass(right, sampleRate, 6800);
  return buffer;
}

// Murda Beatz Bouncy Trap Hat
export function synthesizeMurdaHat(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.045;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.01);
    const noise = (Math.random() * 2 - 1) * 0.75;
    const bite = Math.sin(2 * Math.PI * 7600 * t) * 0.35;
    const sample = (noise + bite) * env;

    left[i] = sample;
    right[i] = sample;
  }

  applyHighPass(left, sampleRate, 7000);
  applyHighPass(right, sampleRate, 7000);
  return buffer;
}

export function synthesizeOpenHat(ctx: AudioContext, decaySeconds: number = 0.38): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = decaySeconds;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.12);
    
    let oscMix = 0;
    for (let f = 0; f < METALLIC_FREQS.length; f++) {
      const phase = 2 * Math.PI * METALLIC_FREQS[f] * t;
      oscMix += (Math.sin(phase) > 0 ? 0.25 : -0.25);
    }
    const noise = (Math.random() * 2 - 1) * 0.55;
    const sizzle = Math.sin(2 * Math.PI * 7200 * t) * 0.25;
    const sample = (oscMix * 0.5 + noise + sizzle) * env;

    left[i] = sample * 0.82;
    right[i] = sample * 0.85;
  }

  applyHighPass(left, sampleRate, 6000);
  applyHighPass(right, sampleRate, 6000);
  return buffer;
}

export function synthesizePedalHat(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.08;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.015);
    const noise = (Math.random() * 2 - 1) * 0.65;
    const thud = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t / 0.01) * 0.55;
    const sample = (noise * 0.6 + thud) * env;

    left[i] = sample;
    right[i] = sample;
  }

  applyHighPass(left, sampleRate, 250);
  applyHighPass(right, sampleRate, 250);
  return buffer;
}

export function synthesizeTrap808Hat(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.055;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.014);
    const noise = (Math.random() * 2 - 1);
    const bite = Math.sin(2 * Math.PI * 8500 * t) * 0.45;
    const sample = (noise * 0.7 + bite) * env;

    left[i] = sample;
    right[i] = sample;
  }

  applyHighPass(left, sampleRate, 7200);
  applyHighPass(right, sampleRate, 7200);
  return buffer;
}

export function synthesizeLatinShaker(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.11;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const attack = Math.min(1, t / 0.02);
    const decay = Math.exp(-(t - 0.02) / 0.035);
    const env = attack * (t < 0.02 ? 1 : decay);
    const noise = (Math.random() * 2 - 1) * 0.8;
    const seedTone = Math.sin(2 * Math.PI * 4800 * t) * 0.2;
    const sample = (noise + seedTone) * env;

    left[i] = sample * 0.9;
    right[i] = sample * 0.85;
  }

  applyHighPass(left, sampleRate, 4500);
  applyHighPass(right, sampleRate, 4500);
  return buffer;
}

export function synthesizeClave(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.09;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t / 0.015);
    const fundamental = Math.sin(2 * Math.PI * 2420 * t);
    const harmonic = Math.sin(2 * Math.PI * 4840 * t) * 0.25;
    const click = (i < 10 ? (Math.random() * 2 - 1) * 0.5 : 0);
    const sample = (fundamental + harmonic + click) * env;

    left[i] = sample;
    right[i] = sample;
  }

  return buffer;
}

export function synthesizeGhostSnare(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.09;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const toneEnv = Math.exp(-t / 0.025);
    const noiseEnv = Math.exp(-t / 0.04);
    const tone = Math.sin(2 * Math.PI * (220 - t * 600) * t) * toneEnv * 0.4;
    const noise = (Math.random() * 2 - 1) * noiseEnv * 0.6;
    const sample = (tone + noise);

    left[i] = sample;
    right[i] = sample;
  }

  return buffer;
}
