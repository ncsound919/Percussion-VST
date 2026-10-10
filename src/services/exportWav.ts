import { InstrumentTrack, HumanizerParams } from '../types';

export async function renderLoopToWav(
  tracks: InstrumentTrack[],
  bpm: number,
  humanizer: HumanizerParams
): Promise<Blob> {
  const sampleRate = 44100;
  const secondsPerBeat = 60.0 / bpm;
  const loopDuration = secondsPerBeat * 4.0; // 4 beats = 16 16th notes
  // Add 0.5s tail for cymbal release/reverb
  const totalDuration = loopDuration + 0.5;

  const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * totalDuration), sampleRate);
  const stepDuration = secondsPerBeat / 4.0;

  tracks.forEach((track) => {
    if (track.mute) return;

    track.steps.forEach((step, stepIndex) => {
      if (!step.active) return;
      if (step.probability < 1.0 && Math.random() > step.probability) return;

      const ppq = stepIndex * 0.25;
      let timingOffset = 0;

      // 1. Swing offset for odd 16th notes
      if (stepIndex % 2 !== 0 && humanizer.swingPercent > 50.0) {
        const swingRatio = (humanizer.swingPercent - 50.0) / 100.0;
        timingOffset += swingRatio * (stepDuration * 0.666);
      }

      // 2. Jitter & drift
      if (humanizer.timingJitterMs > 0) {
        timingOffset += ((Math.random() * 2 - 1) * humanizer.timingJitterMs) / 1000.0;
      }
      if (humanizer.timingDriftMs > 0) {
        timingOffset += (Math.sin(ppq * 0.25 * Math.PI) * humanizer.timingDriftMs) / 1000.0;
      }
      // 3. Laid back push/pull
      if (humanizer.laidBackMs > 0 && stepIndex % 2 !== 0) {
        timingOffset += humanizer.laidBackMs / 1000.0;
      }
      // 4. Per step timing offset
      if (step.timingOffsetMs !== 0) {
        timingOffset += step.timingOffsetMs / 1000.0;
      }

      const rawStepTime = stepIndex * stepDuration + timingOffset;

      // Determine buffer with Articulation Kit & Round-Robin Support
      let chosenBuffer = track.sampleBuffer;
      if (track.roundRobinKit && humanizer.roundRobinEnabled) {
        const kit = track.roundRobinKit;
        if (step.articulation === 'shank' && kit.shank) {
          chosenBuffer = kit.shank;
        } else if (step.articulation === 'sizzle' && kit.sizzle) {
          chosenBuffer = kit.sizzle;
        } else if (step.articulation === 'pedal' && kit.pedal) {
          chosenBuffer = kit.pedal;
        } else if (step.articulation === 'tip' || step.articulation === 'auto_round_robin' || !step.articulation) {
          const isRightHand = (stepIndex % 2 === 0);
          chosenBuffer = isRightHand ? (kit.tipR || kit.tipL || track.sampleBuffer) : (kit.tipL || kit.tipR || track.sampleBuffer);
        }
      } else if (track.roundRobinBuffers && track.roundRobinBuffers.length > 0 && humanizer.roundRobinEnabled) {
        chosenBuffer = track.roundRobinBuffers[stepIndex % track.roundRobinBuffers.length];
      }

      if (!chosenBuffer) return;

      let numSubdivisions = 1;
      switch (step.rollType) {
        case 'straight_32': numSubdivisions = 2; break;
        case 'straight_64': numSubdivisions = 4; break;
        case 'triplet_32': numSubdivisions = 3; break;
        case 'triplet_64': numSubdivisions = 6; break;
        default: numSubdivisions = 1;
      }

      const subDuration = stepDuration / numSubdivisions;

      for (let s = 0; s < numSubdivisions; s++) {
        const hitTime = Math.max(0, rawStepTime + s * subDuration);
        const progress = numSubdivisions > 1 ? s / (numSubdivisions - 1) : 0;

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

        const source = offlineCtx.createBufferSource();
        source.buffer = chosenBuffer;
        source.playbackRate.value = Math.pow(2, pitchOffset / 12.0);

        let velocity = step.baseVelocity;
        if (humanizer.roundRobinEnabled && stepIndex % 2 !== 0) {
          velocity *= 0.92;
        }
        if (numSubdivisions > 1) {
          velocity *= (1.0 - progress * 0.22);
        }
        velocity *= track.volume;

        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = Math.max(0.01, Math.min(1.0, velocity));

        // If closed hat with choke group, enforce tight envelope
        if (step.hatOpenness < 0.2 && track.chokeGroup > 0) {
          gainNode.gain.setValueAtTime(gainNode.gain.value, hitTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.08);
        }

        // Panning
        const pan = Math.max(-1, Math.min(1, step.panStart + track.pan + (numSubdivisions > 1 ? progress * (step.panEnd - step.panStart) : 0)));
        if (offlineCtx.createStereoPanner) {
          const panner = offlineCtx.createStereoPanner();
          panner.pan.value = pan;
          source.connect(gainNode);
          gainNode.connect(panner);
          panner.connect(offlineCtx.destination);
        } else {
          source.connect(gainNode);
          gainNode.connect(offlineCtx.destination);
        }

        source.start(hitTime);
      }
    });
  });

  const renderedBuffer = await offlineCtx.startRendering();
  return bufferToWave(renderedBuffer, renderedBuffer.length);
}

// Convert AudioBuffer to 16-bit PCM WAV Blob
function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16);          // 16 for PCM
  setUint16(1);           // Linear quantization
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2);                      // block align
  setUint16(16);                                 // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  // write interleaved samples
  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}
