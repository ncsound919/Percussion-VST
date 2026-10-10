import { InstrumentTrack, HumanizerParams } from '../types';

// Encodes Variable Length Quantity (VLQ) for standard MIDI format
function encodeVLQ(value: number): number[] {
  const bytes: number[] = [];
  let buffer = value & 0x7f;
  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= 0x80;
    buffer += (value & 0x7f);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }
  return bytes;
}

export function generateMidiFile(
  tracks: InstrumentTrack[],
  bpm: number,
  humanizer: HumanizerParams
): Blob {
  const TICKS_PER_BEAT = 480;
  const TICKS_PER_16TH = TICKS_PER_BEAT / 4; // 120 ticks

  const activeTracks = tracks.filter(t => !t.mute && t.steps.some(s => s.active));
  const numTracks = 1 + activeTracks.length;

  const header = [
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // length 6
    0x00, 0x01,             // format 1
    (numTracks >> 8) & 0xff, numTracks & 0xff,
    (TICKS_PER_BEAT >> 8) & 0xff, TICKS_PER_BEAT & 0xff
  ];

  const fileChunks: number[][] = [header];

  // 1. Tempo Track
  const tempoBytes: number[] = [];
  const microsPerBeat = Math.round(60000000 / bpm);
  
  // Track Name
  const trackName = "Tempo / Master";
  tempoBytes.push(0x00); // delta 0
  tempoBytes.push(0xff, 0x03, trackName.length, ...trackName.split('').map(c => c.charCodeAt(0)));

  // Set Tempo Meta Event: FF 51 03 tttttt
  tempoBytes.push(0x00); // delta 0
  tempoBytes.push(0xff, 0x51, 0x03);
  tempoBytes.push((microsPerBeat >> 16) & 0xff, (microsPerBeat >> 8) & 0xff, microsPerBeat & 0xff);

  // Time Signature: 4/4
  tempoBytes.push(0x00);
  tempoBytes.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  // End of Track
  tempoBytes.push(0x00, 0xff, 0x2f, 0x00);

  // MTrk header for Tempo Track
  const tempoTrackChunk = [
    0x4d, 0x54, 0x72, 0x6b,
    (tempoBytes.length >> 24) & 0xff,
    (tempoBytes.length >> 16) & 0xff,
    (tempoBytes.length >> 8) & 0xff,
    tempoBytes.length & 0xff,
    ...tempoBytes
  ];
  fileChunks.push(tempoTrackChunk);

  // 2. Instrument Tracks
  activeTracks.forEach((track) => {
    interface MidiEventItem {
      tick: number;
      type: 'on' | 'off';
      note: number;
      vel: number;
    }

    const events: MidiEventItem[] = [];

    for (let stepIndex = 0; stepIndex < 16; stepIndex++) {
      const step = track.steps[stepIndex];
      if (!step || !step.active) continue;

      let baseTick = stepIndex * TICKS_PER_16TH;

      // Swing offset for odd 16th notes
      if (stepIndex % 2 !== 0 && humanizer.swingPercent > 50.0) {
        const swingFactor = (humanizer.swingPercent - 50.0) / 100.0;
        baseTick += Math.round(swingFactor * (TICKS_PER_16TH * 0.666));
      }

      // Timing Jitter offset
      if (humanizer.timingJitterMs > 0) {
        const jitterTicks = Math.round(((Math.random() * 2 - 1) * humanizer.timingJitterMs * bpm * TICKS_PER_BEAT) / 60000);
        baseTick += jitterTicks;
      }

      // Laid-back delay
      if (humanizer.laidBackMs > 0 && stepIndex % 2 !== 0) {
        baseTick += Math.round((humanizer.laidBackMs * bpm * TICKS_PER_BEAT) / 60000);
      }

      // Subdivisions
      let numSubdivisions = 1;
      switch (step.rollType) {
        case 'straight_32': numSubdivisions = 2; break;
        case 'straight_64': numSubdivisions = 4; break;
        case 'triplet_32': numSubdivisions = 3; break;
        case 'triplet_64': numSubdivisions = 6; break;
        default: numSubdivisions = 1;
      }

      const subDurationTicks = Math.round(TICKS_PER_16TH / numSubdivisions);

      for (let s = 0; s < numSubdivisions; s++) {
        const eventTick = Math.max(0, baseTick + s * subDurationTicks);
        const progress = numSubdivisions > 1 ? s / (numSubdivisions - 1) : 0;

        // Interpolated Pitch for Roll Sweeps
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

        // Velocity decay for rolls
        let velocityVal = Math.round(step.baseVelocity * 127);
        if (humanizer.roundRobinEnabled && stepIndex % 2 !== 0) {
          velocityVal = Math.round(velocityVal * 0.92);
        }
        if (numSubdivisions > 1) {
          velocityVal = Math.round(velocityVal * (1.0 - progress * 0.22));
        }
        velocityVal = Math.max(1, Math.min(127, velocityVal));

        const noteNumber = Math.max(0, Math.min(127, track.midiNote + Math.round(pitchOffset)));

        events.push({
          tick: eventTick,
          type: 'on',
          note: noteNumber,
          vel: velocityVal,
        });

        const offTick = eventTick + Math.max(15, Math.round(subDurationTicks * 0.8));
        events.push({
          tick: offTick,
          type: 'off',
          note: noteNumber,
          vel: 0,
        });
      }
    }

    // Sort events by tick (with note-off before note-on at the exact same tick)
    events.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      if (a.type === 'off' && b.type === 'on') return -1;
      if (a.type === 'on' && b.type === 'off') return 1;
      return 0;
    });

    const trackBytes: number[] = [];
    const tName = track.name;
    trackBytes.push(0x00, 0xff, 0x03, tName.length, ...tName.split('').map(c => c.charCodeAt(0)));

    let lastTick = 0;
    events.forEach((ev) => {
      const delta = Math.max(0, ev.tick - lastTick);
      lastTick = ev.tick;
      trackBytes.push(...encodeVLQ(delta));

      if (ev.type === 'on') {
        trackBytes.push(0x99, ev.note, ev.vel); // Channel 10 (0x99) standard drum channel
      } else {
        trackBytes.push(0x89, ev.note, 0x00);
      }
    });

    // End of Track
    trackBytes.push(0x00, 0xff, 0x2f, 0x00);

    const trackChunk = [
      0x4d, 0x54, 0x72, 0x6b,
      (trackBytes.length >> 24) & 0xff,
      (trackBytes.length >> 16) & 0xff,
      (trackBytes.length >> 8) & 0xff,
      trackBytes.length & 0xff,
      ...trackBytes
    ];

    fileChunks.push(trackChunk);
  });

  const flatBytes = fileChunks.reduce((acc, chunk) => acc.concat(chunk), []);
  const uint8 = new Uint8Array(flatBytes);
  return new Blob([uint8], { type: 'audio/midi' });
}
