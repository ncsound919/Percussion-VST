import { InstrumentTrack, GenrePreset, PercussionStep, RandomizerParams, SectorId, SectorData } from '../types';

export function createEmptySteps(): PercussionStep[] {
  return Array.from({ length: 16 }, () => ({
    active: false,
    baseVelocity: 0.75,
    probability: 1.0,
    rollType: 'none',
    pitchCurve: 'linear',
    startPitchOffset: 0,
    endPitchOffset: 0,
    panStart: 0,
    panEnd: 0,
    hatOpenness: 0,
    timingOffsetMs: 0,
    articulation: 'auto_round_robin',
  }));
}

export function applyGenrePreset(
  preset: GenrePreset,
  tracks: InstrumentTrack[]
): { updatedTracks: InstrumentTrack[]; bpm: number; swing: number; timingJitter: number; laidBackMs: number } {
  const newTracks = tracks.map((t) => ({
    ...t,
    steps: createEmptySteps(),
  }));

  const closedHat = newTracks.find((t) => t.id === 'closed_hat') || newTracks[0];
  const openHat = newTracks.find((t) => t.id === 'open_hat') || newTracks[1];
  const pedalHat = newTracks.find((t) => t.id === 'pedal_hat') || newTracks[2];
  const trapHat = newTracks.find((t) => t.id === 'trap_hat') || closedHat;
  const shaker = newTracks.find((t) => t.id === 'shaker');
  const clave = newTracks.find((t) => t.id === 'clave');
  const perc = newTracks.find((t) => t.id === 'perc');

  let targetBpm = 130;
  let targetSwing = 50.0;
  let targetJitter = 2.0;
  let targetLaidBack = 0.0;

  switch (preset) {
    // 1. Atlanta Dark Trap (Metro Boomin / Southside / 808 Mafia)
    case 'atlanta_dark_trap': {
      targetBpm = 142;
      targetSwing = 51.0;
      targetJitter = 1.5;

      for (let i = 0; i < 16; i++) {
        trapHat.steps[i].active = true;
        trapHat.steps[i].baseVelocity = (i % 2 === 0) ? 0.94 : 0.62;

        // Step 6: 32nd roll with -5st pitch drop
        if (i === 6) {
          trapHat.steps[i].rollType = 'straight_32';
          trapHat.steps[i].startPitchOffset = 1;
          trapHat.steps[i].endPitchOffset = -5;
          trapHat.steps[i].pitchCurve = 'exponential';
          trapHat.steps[i].panStart = -0.35;
          trapHat.steps[i].panEnd = 0.35;
        }
        // Step 11: 32nd triplet stutter
        else if (i === 11) {
          trapHat.steps[i].rollType = 'triplet_32';
          trapHat.steps[i].startPitchOffset = 3;
          trapHat.steps[i].endPitchOffset = 5;
        }
        // Step 14: 64th rapid buzz turnaround roll
        else if (i === 14) {
          trapHat.steps[i].rollType = 'straight_64';
          trapHat.steps[i].startPitchOffset = 4;
          trapHat.steps[i].endPitchOffset = -7;
          trapHat.steps[i].pitchCurve = 'exponential';
          trapHat.steps[i].panStart = 0.5;
          trapHat.steps[i].panEnd = -0.5;
        }
        // Step 15: Upward pitch riser roll into beat 1
        else if (i === 15) {
          trapHat.steps[i].rollType = 'straight_32';
          trapHat.steps[i].startPitchOffset = -2;
          trapHat.steps[i].endPitchOffset = 6;
          trapHat.steps[i].pitchCurve = 'linear';
        }
      }

      openHat.steps[2].active = true;
      openHat.steps[2].baseVelocity = 0.88;
      openHat.steps[2].hatOpenness = 0.9;

      openHat.steps[10].active = true;
      openHat.steps[10].baseVelocity = 0.92;
      openHat.steps[10].hatOpenness = 0.95;
      break;
    }

    // 2. Wheezy Tsunami Waves (Wheezy Outta Here / Gunna / Young Thug)
    case 'wheezy_tsunami': {
      targetBpm = 132;
      targetSwing = 52.0;
      targetJitter = 1.2;

      for (let i = 0; i < 16; i++) {
        trapHat.steps[i].active = true;
        trapHat.steps[i].baseVelocity = (i % 4 === 0) ? 0.96 : (i % 2 === 0) ? 0.78 : 0.55;

        // Step 6: 32nd triplet wave roll with pitch climb (+3st to +7st)
        if (i === 6) {
          trapHat.steps[i].rollType = 'triplet_32';
          trapHat.steps[i].startPitchOffset = 2;
          trapHat.steps[i].endPitchOffset = 7;
          trapHat.steps[i].pitchCurve = 'linear';
          trapHat.steps[i].panStart = -0.4;
          trapHat.steps[i].panEnd = 0.4;
        }
        // Step 7: continuation accent
        else if (i === 7) {
          trapHat.steps[i].baseVelocity = 0.98;
        }
        // Step 13: 32nd roll with pitch swell
        else if (i === 13) {
          trapHat.steps[i].rollType = 'straight_32';
          trapHat.steps[i].startPitchOffset = 0;
          trapHat.steps[i].endPitchOffset = 5;
          trapHat.steps[i].panStart = 0.3;
          trapHat.steps[i].panEnd = -0.3;
        }
        // Step 14: 32nd triplet turnaround swell
        else if (i === 14) {
          trapHat.steps[i].rollType = 'triplet_32';
          trapHat.steps[i].startPitchOffset = 5;
          trapHat.steps[i].endPitchOffset = 9;
        }
      }

      openHat.steps[6].active = true;
      openHat.steps[6].baseVelocity = 0.85;
      openHat.steps[6].hatOpenness = 0.8;

      openHat.steps[14].active = true;
      openHat.steps[14].baseVelocity = 0.9;
      openHat.steps[14].hatOpenness = 0.9;
      break;
    }

    // 3. Southside / 808 Mafia Hard Trap
    case 'southside_808mafia': {
      targetBpm = 144;
      targetSwing = 50.0;
      targetJitter = 1.4;

      for (let i = 0; i < 16; i++) {
        trapHat.steps[i].active = true;
        trapHat.steps[i].baseVelocity = (i % 2 === 0) ? 0.98 : 0.6;

        // Step 6: Signature 808 Mafia -5st drop
        if (i === 6) {
          trapHat.steps[i].rollType = 'straight_32';
          trapHat.steps[i].startPitchOffset = 1;
          trapHat.steps[i].endPitchOffset = -5;
          trapHat.steps[i].pitchCurve = 'exponential';
          trapHat.steps[i].panStart = -0.5;
          trapHat.steps[i].panEnd = 0.5;
        }
        // Step 10: Quick double tap 32nd
        else if (i === 10) {
          trapHat.steps[i].rollType = 'straight_32';
          trapHat.steps[i].startPitchOffset = 2;
          trapHat.steps[i].endPitchOffset = 0;
        }
        // Step 14: 64th turnaround buzz
        else if (i === 14) {
          trapHat.steps[i].rollType = 'straight_64';
          trapHat.steps[i].startPitchOffset = 3;
          trapHat.steps[i].endPitchOffset = -9;
          trapHat.steps[i].pitchCurve = 'exponential';
        }
      }

      openHat.steps[2].active = true;
      openHat.steps[2].baseVelocity = 0.92;
      openHat.steps[2].hatOpenness = 0.95;

      openHat.steps[10].active = true;
      openHat.steps[10].baseVelocity = 0.92;
      openHat.steps[10].hatOpenness = 0.95;
      break;
    }

    // 4. Melodic Trap Bounce (Pierre Bourne / Nick Mira / Lil Uzi Vert)
    case 'melodic_trap': {
      targetBpm = 154;
      targetSwing = 53.5;
      targetJitter = 1.8;

      const melodicSteps = [0, 2, 4, 6, 7, 8, 10, 12, 13, 14];
      melodicSteps.forEach((s) => {
        trapHat.steps[s].active = true;
        trapHat.steps[s].baseVelocity = (s % 4 === 0) ? 0.96 : (s === 7 || s === 13) ? 0.85 : 0.68;
      });

      // Step 7: 32nd roll with upward slide (+2 to +6 st)
      trapHat.steps[7].rollType = 'straight_32';
      trapHat.steps[7].startPitchOffset = 2;
      trapHat.steps[7].endPitchOffset = 6;
      trapHat.steps[7].panStart = -0.4;
      trapHat.steps[7].panEnd = 0.4;

      // Step 14: 32nd Triplet bounce
      trapHat.steps[14].rollType = 'triplet_32';
      trapHat.steps[14].startPitchOffset = 0;
      trapHat.steps[14].endPitchOffset = -4;

      openHat.steps[4].active = true;
      openHat.steps[4].baseVelocity = 0.84;
      openHat.steps[4].hatOpenness = 0.8;
      break;
    }

    // 5. Murda Beatz Bouncy Trap (Murda Beatz / Migos)
    case 'murda_beatz_bounce': {
      targetBpm = 138;
      targetSwing = 52.5;
      targetJitter = 1.6;

      for (let i = 0; i < 16; i++) {
        trapHat.steps[i].active = true;
        trapHat.steps[i].baseVelocity = (i % 2 === 0) ? 0.92 : 0.65;

        // Step 3: Triplet roll early bounce
        if (i === 3) {
          trapHat.steps[i].rollType = 'triplet_32';
          trapHat.steps[i].startPitchOffset = -2;
          trapHat.steps[i].endPitchOffset = 2;
        }
        // Step 7: 32nd roll into clap
        else if (i === 7) {
          trapHat.steps[i].rollType = 'straight_32';
          trapHat.steps[i].startPitchOffset = 2;
          trapHat.steps[i].endPitchOffset = -4;
        }
        // Step 11: Triplet roll
        else if (i === 11) {
          trapHat.steps[i].rollType = 'triplet_32';
          trapHat.steps[i].startPitchOffset = 1;
          trapHat.steps[i].endPitchOffset = 4;
        }
        // Step 15: Fast 64th flick
        else if (i === 15) {
          trapHat.steps[i].rollType = 'straight_64';
          trapHat.steps[i].startPitchOffset = -3;
          trapHat.steps[i].endPitchOffset = 3;
        }
      }

      openHat.steps[2].active = true;
      openHat.steps[2].baseVelocity = 0.9;
      openHat.steps[10].active = true;
      openHat.steps[10].baseVelocity = 0.9;
      break;
    }

    // 6. Metro Boomin Cinematic Dark Trap
    case 'metro_cinematic_trap': {
      targetBpm = 140;
      targetSwing = 50.5;
      targetJitter = 1.3;

      for (let i = 0; i < 16; i++) {
        trapHat.steps[i].active = true;
        trapHat.steps[i].baseVelocity = (i % 4 === 0) ? 0.98 : (i % 2 === 0) ? 0.8 : 0.52;

        // Step 6: Dramatic stereo pan sweep roll
        if (i === 6) {
          trapHat.steps[i].rollType = 'straight_32';
          trapHat.steps[i].startPitchOffset = 3;
          trapHat.steps[i].endPitchOffset = -6;
          trapHat.steps[i].pitchCurve = 'exponential';
          trapHat.steps[i].panStart = -0.7;
          trapHat.steps[i].panEnd = 0.7;
        }
        // Step 11: 32nd triplet roll
        else if (i === 11) {
          trapHat.steps[i].rollType = 'triplet_32';
          trapHat.steps[i].startPitchOffset = 0;
          trapHat.steps[i].endPitchOffset = 4;
        }
        // Step 14: 64th buzz pitch drop
        else if (i === 14) {
          trapHat.steps[i].rollType = 'straight_64';
          trapHat.steps[i].startPitchOffset = 5;
          trapHat.steps[i].endPitchOffset = -12;
          trapHat.steps[i].pitchCurve = 'exponential';
        }
      }

      openHat.steps[2].active = true;
      openHat.steps[2].baseVelocity = 0.95;
      openHat.steps[2].hatOpenness = 1.0;

      openHat.steps[10].active = true;
      openHat.steps[10].baseVelocity = 0.95;
      openHat.steps[10].hatOpenness = 1.0;
      break;
    }

    // 7. Plugg / Mexikodro Playful Bounce
    case 'plugg_mexikodro': {
      targetBpm = 136;
      targetSwing = 51.5;
      targetJitter = 1.5;

      const pluggHits = [0, 2, 3, 5, 6, 8, 10, 11, 13, 14];
      pluggHits.forEach((s) => {
        trapHat.steps[s].active = true;
        trapHat.steps[s].baseVelocity = (s % 4 === 0) ? 0.95 : 0.7;
      });

      trapHat.steps[6].rollType = 'straight_32';
      trapHat.steps[6].startPitchOffset = 3;
      trapHat.steps[6].endPitchOffset = 0;

      trapHat.steps[14].rollType = 'straight_32';
      trapHat.steps[14].startPitchOffset = 0;
      trapHat.steps[14].endPitchOffset = 4;

      if (clave) {
        [4, 12].forEach((s) => {
          clave.steps[s].active = true;
          clave.steps[s].baseVelocity = 0.9;
        });
      }

      openHat.steps[2].active = true;
      openHat.steps[2].baseVelocity = 0.85;
      openHat.steps[2].hatOpenness = 0.85;
      break;
    }

    // 8. Jersey Club Drip Bounce (140 BPM)
    case 'jersey_club_drip': {
      targetBpm = 140;
      targetSwing = 52.0;
      targetJitter = 1.8;

      // 5-beat rhythm: 0, 3, 6, 9, 12
      [0, 3, 6, 9, 12, 14].forEach((s) => {
        trapHat.steps[s].active = true;
        trapHat.steps[s].baseVelocity = (s === 0 || s === 12) ? 0.98 : 0.82;
      });

      // Quick 32nd roll on step 6 and 14
      trapHat.steps[6].rollType = 'straight_32';
      trapHat.steps[6].startPitchOffset = 2;
      trapHat.steps[6].endPitchOffset = -2;

      trapHat.steps[14].rollType = 'triplet_32';
      trapHat.steps[14].startPitchOffset = 0;
      trapHat.steps[14].endPitchOffset = 4;

      openHat.steps[2].active = true;
      openHat.steps[2].baseVelocity = 0.9;
      openHat.steps[8].active = true;
      openHat.steps[8].baseVelocity = 0.9;
      break;
    }

    // 9. Rage Hyper-Trap Skitter (Yeat / Carti / BNYX / Ken Carson)
    case 'rage_hyper_trap': {
      targetBpm = 148;
      targetSwing = 50.0;
      targetJitter = 0.8;

      for (let i = 0; i < 16; i++) {
        trapHat.steps[i].active = true;
        trapHat.steps[i].baseVelocity = (i % 2 === 0) ? 0.98 : 0.72;

        if (i === 2 || i === 10) {
          trapHat.steps[i].rollType = 'straight_32';
          trapHat.steps[i].startPitchOffset = 0;
          trapHat.steps[i].endPitchOffset = -6;
        } else if (i === 6) {
          trapHat.steps[i].rollType = 'straight_64';
          trapHat.steps[i].startPitchOffset = -4;
          trapHat.steps[i].endPitchOffset = 8;
        } else if (i === 14) {
          trapHat.steps[i].rollType = 'straight_64';
          trapHat.steps[i].startPitchOffset = 8;
          trapHat.steps[i].endPitchOffset = -12;
          trapHat.steps[i].panStart = -0.7;
          trapHat.steps[i].panEnd = 0.7;
        }
      }

      openHat.steps[12].active = true;
      openHat.steps[12].baseVelocity = 0.92;
      openHat.steps[12].hatOpenness = 0.95;
      break;
    }

    // 10. Detroit / Michigan Fast Bounce (Babyface Ray / Icewear Vezzo)
    case 'detroit_bounce': {
      targetBpm = 196;
      targetSwing = 50.0;
      targetJitter = 1.0;

      const detroitPattern = [0, 1, 2, 4, 6, 8, 9, 10, 12, 14, 15];
      detroitPattern.forEach((s) => {
        trapHat.steps[s].active = true;
        trapHat.steps[s].baseVelocity = (s === 0 || s === 8) ? 0.98 : (s === 1 || s === 9) ? 0.55 : 0.75;
      });

      trapHat.steps[6].rollType = 'straight_32';
      trapHat.steps[6].startPitchOffset = 3;
      trapHat.steps[6].endPitchOffset = 0;

      pedalHat.steps[4].active = true;
      pedalHat.steps[4].baseVelocity = 0.85;
      pedalHat.steps[12].active = true;
      pedalHat.steps[12].baseVelocity = 0.85;
      break;
    }

    // 11. Memphis Phonk Bounce (Three 6 Mafia / Murda Beatz)
    case 'memphis_phonk': {
      targetBpm = 136;
      targetSwing = 54.0;
      targetJitter = 2.2;

      for (let i = 0; i < 16; i++) {
        trapHat.steps[i].active = true;
        trapHat.steps[i].baseVelocity = (i % 2 === 0) ? 0.92 : 0.58;

        if (i === 7 || i === 15) {
          trapHat.steps[i].rollType = 'triplet_32';
          trapHat.steps[i].startPitchOffset = -2;
          trapHat.steps[i].endPitchOffset = 3;
        }
      }

      if (clave) {
        [0, 3, 6, 8, 11, 14].forEach((s) => {
          clave.steps[s].active = true;
          clave.steps[s].baseVelocity = 0.9;
        });
      }

      openHat.steps[2].active = true;
      openHat.steps[2].baseVelocity = 0.88;
      openHat.steps[10].active = true;
      openHat.steps[10].baseVelocity = 0.88;
      break;
    }

    // 12. UK Drill Slide Hop
    case 'uk_drill': {
      targetBpm = 140;
      targetSwing = 53.0;
      targetJitter = 2.0;

      const drillAccents = [0, 2, 5, 8, 10, 13];
      drillAccents.forEach((stepIdx) => {
        trapHat.steps[stepIdx].active = true;
        trapHat.steps[stepIdx].baseVelocity = 0.95;
      });

      [1, 3, 6, 7, 9, 11, 14, 15].forEach((stepIdx) => {
        trapHat.steps[stepIdx].active = true;
        trapHat.steps[stepIdx].baseVelocity = 0.38;
      });

      trapHat.steps[7].rollType = 'triplet_32';
      trapHat.steps[7].startPitchOffset = 6;
      trapHat.steps[7].endPitchOffset = -2;

      trapHat.steps[15].rollType = 'straight_32';
      trapHat.steps[15].startPitchOffset = -1;
      trapHat.steps[15].endPitchOffset = 4;

      pedalHat.steps[8].active = true;
      pedalHat.steps[8].baseVelocity = 0.85;
      break;
    }

    // 13. Boom Bap J Dilla Layback Groove (Unquantized swing, multi-hat round-robin)
    case 'boombap_dilla': {
      targetBpm = 92;
      targetSwing = 59.5;
      targetJitter = 4.0;
      targetLaidBack = 14.0; // Dilla drunk drag on odd 16th notes

      for (let i = 0; i < 16; i++) {
        closedHat.steps[i].active = true;
        if (i % 4 === 0) {
          closedHat.steps[i].baseVelocity = 0.98;
          closedHat.steps[i].articulation = 'shank'; // Heavier edge shank on downbeats
        } else if (i % 2 === 0) {
          closedHat.steps[i].baseVelocity = 0.74;
          closedHat.steps[i].articulation = 'tip';
        } else {
          closedHat.steps[i].baseVelocity = 0.42;
          closedHat.steps[i].articulation = 'tip'; // Soft tip ghost
        }
      }

      // Loose turnaround sizzle on step 14
      openHat.steps[14].active = true;
      openHat.steps[14].baseVelocity = 0.82;
      openHat.steps[14].hatOpenness = 0.75;
      openHat.steps[14].articulation = 'sizzle';

      // Choke on step 15
      pedalHat.steps[15].active = true;
      pedalHat.steps[15].baseVelocity = 0.8;
      pedalHat.steps[15].articulation = 'pedal';

      if (shaker) {
        for (let i = 0; i < 16; i += 2) {
          shaker.steps[i].active = true;
          shaker.steps[i].baseVelocity = (i % 4 === 0) ? 0.7 : 0.85;
        }
      }
      break;
    }

    // 14. Bernard Purdie Half-Time Shuffle (Steely Dan / Rosanna feel)
    case 'purdie_shuffle': {
      targetBpm = 114;
      targetSwing = 66.7; // True triplet shuffle
      targetJitter = 2.5;

      for (let i = 0; i < 16; i += 2) {
        closedHat.steps[i].active = true;
        closedHat.steps[i].baseVelocity = (i % 4 === 0) ? 0.95 : 0.72;
        closedHat.steps[i].articulation = (i % 4 === 0) ? 'shank' : 'tip';

        // Ghost notes in inner triplet pockets
        if (i === 2 || i === 10) {
          closedHat.steps[i + 1].active = true;
          closedHat.steps[i + 1].baseVelocity = 0.45;
          closedHat.steps[i + 1].articulation = 'tip';
        }
      }

      if (perc) {
        perc.steps[4].active = true;
        perc.steps[4].baseVelocity = 0.92;
        perc.steps[12].active = true;
        perc.steps[12].baseVelocity = 0.92;
        [3, 7, 11].forEach((step) => {
          perc.steps[step].active = true;
          perc.steps[step].baseVelocity = 0.32;
        });
      }

      openHat.steps[14].active = true;
      openHat.steps[14].baseVelocity = 0.84;
      openHat.steps[14].hatOpenness = 0.65;
      openHat.steps[14].articulation = 'sizzle';

      pedalHat.steps[15].active = true;
      pedalHat.steps[15].baseVelocity = 0.78;
      pedalHat.steps[15].articulation = 'pedal';
      break;
    }

    // 15. Live Acoustic Funk Drums (Clyde Stubblefield / Funky Drummer style)
    case 'acoustic_funk_live': {
      targetBpm = 104;
      targetSwing = 55.5;
      targetJitter = 3.0;
      targetLaidBack = 6.0;

      for (let i = 0; i < 16; i++) {
        closedHat.steps[i].active = true;
        if (i % 4 === 0) {
          closedHat.steps[i].baseVelocity = 0.96;
          closedHat.steps[i].articulation = 'shank'; // Accent shank
        } else if (i % 2 === 0) {
          closedHat.steps[i].baseVelocity = 0.76;
          closedHat.steps[i].articulation = 'tip';
        } else {
          closedHat.steps[i].baseVelocity = 0.38;
          closedHat.steps[i].articulation = 'tip'; // Soft tip
        }
      }

      openHat.steps[14].active = true;
      openHat.steps[14].baseVelocity = 0.88;
      openHat.steps[14].hatOpenness = 0.8;
      openHat.steps[14].articulation = 'sizzle';

      pedalHat.steps[15].active = true;
      pedalHat.steps[15].baseVelocity = 0.82;
      pedalHat.steps[15].articulation = 'pedal';

      if (perc) {
        [4, 12].forEach((s) => {
          perc.steps[s].active = true;
          perc.steps[s].baseVelocity = 0.95;
        });
        [7, 9, 11].forEach((s) => {
          perc.steps[s].active = true;
          perc.steps[s].baseVelocity = 0.4;
        });
      }
      break;
    }

    // 16. UK Garage / 2-Step Shuffle
    case 'uk_garage_2step': {
      targetBpm = 134;
      targetSwing = 57.0;
      targetJitter = 2.0;

      const garagePattern = [0, 2, 3, 6, 8, 10, 11, 14];
      garagePattern.forEach((stepIdx) => {
        closedHat.steps[stepIdx].active = true;
        closedHat.steps[stepIdx].baseVelocity = (stepIdx % 4 === 0) ? 0.9 : 0.68;
      });

      [2, 6, 10, 14].forEach((stepIdx) => {
        openHat.steps[stepIdx].active = true;
        openHat.steps[stepIdx].baseVelocity = 0.85;
        openHat.steps[stepIdx].hatOpenness = 0.9;
      });

      pedalHat.steps[4].active = true;
      pedalHat.steps[4].baseVelocity = 0.7;
      pedalHat.steps[12].active = true;
      pedalHat.steps[12].baseVelocity = 0.7;
      break;
    }

    // 17. Amen Breakbeat
    case 'amen_breakbeat': {
      targetBpm = 174;
      targetSwing = 52.0;
      targetJitter = 2.5;

      for (let i = 0; i < 16; i++) {
        closedHat.steps[i].active = true;
        if (i % 4 === 0) {
          closedHat.steps[i].baseVelocity = 0.96;
        } else if (i % 2 === 0) {
          closedHat.steps[i].baseVelocity = 0.72;
        } else {
          closedHat.steps[i].baseVelocity = 0.38;
        }
      }

      openHat.steps[15].active = true;
      openHat.steps[15].baseVelocity = 0.94;
      openHat.steps[15].hatOpenness = 1.0;
      break;
    }

    // 18. Afro-Cuban Cascara & Son Clave
    case 'cascara_clave': {
      targetBpm = 116;
      targetSwing = 55.0;

      if (clave) {
        [0, 3, 6, 10, 12].forEach((step) => {
          clave.steps[step].active = true;
          clave.steps[step].baseVelocity = 0.95;
        });
      }

      [0, 2, 4, 7, 8, 10, 12, 14].forEach((step) => {
        closedHat.steps[step].active = true;
        closedHat.steps[step].baseVelocity = 0.82;
      });

      if (shaker) {
        for (let i = 0; i < 16; i++) {
          shaker.steps[i].active = true;
          shaker.steps[i].baseVelocity = (i % 2 === 0) ? 0.65 : 0.88;
        }
      }
      break;
    }

    // 19. Berlin Dub Techno
    case 'dub_techno': {
      targetBpm = 126;
      targetSwing = 50.0;
      targetJitter = 1.0;

      [2, 6, 10, 14].forEach((step) => {
        openHat.steps[step].active = true;
        openHat.steps[step].baseVelocity = 0.9;
        openHat.steps[step].hatOpenness = 0.85;
      });

      [0, 3, 6, 10, 13].forEach((step) => {
        closedHat.steps[step].active = true;
        closedHat.steps[step].baseVelocity = 0.78;
      });
      break;
    }

    default:
      break;
  }

  return {
    updatedTracks: newTracks,
    bpm: targetBpm,
    swing: targetSwing,
    timingJitter: targetJitter,
    laidBackMs: targetLaidBack,
  };
}

// Intelligent Musical Randomizer with Constrained Rules
export function randomizeGroove(
  tracks: InstrumentTrack[],
  params: RandomizerParams
): InstrumentTrack[] {
  return tracks.map((track) => {
    if (params.lockedTrackIds.includes(track.id)) {
      return track;
    }

    const newSteps = createEmptySteps();

    if (track.id === 'closed_hat' || track.id === 'trap_hat') {
      for (let i = 0; i < 16; i++) {
        let shouldFire = true;

        if (params.style === 'drill') {
          shouldFire = [0, 2, 5, 8, 10, 13].includes(i) || Math.random() < 0.4;
        } else if (params.style === 'garage') {
          shouldFire = [0, 2, 3, 6, 8, 10, 11, 14].includes(i) || Math.random() < 0.25;
        } else if (params.style === 'boombap') {
          shouldFire = (i % 2 === 0) || Math.random() < 0.6;
        } else if (params.style === 'melodic_trap') {
          shouldFire = [0, 2, 4, 6, 7, 8, 10, 12, 13, 14].includes(i) || Math.random() < 0.35;
        } else if (params.style === 'wheezy_wave') {
          shouldFire = true;
        } else if (params.style === 'southside_808') {
          shouldFire = true;
        } else if (params.style === 'jersey_club') {
          shouldFire = [0, 3, 6, 9, 12, 14].includes(i) || Math.random() < 0.3;
        }

        if (shouldFire) {
          newSteps[i].active = true;

          let vel = (i % 4 === 0) ? 0.95 : (i % 2 === 0) ? 0.75 : 0.45;
          if (params.velocityDynamicRange === 'tight') {
            vel = 0.7 + (Math.random() * 0.25 - 0.12);
          } else if (params.velocityDynamicRange === 'wide') {
            vel = (i % 4 === 0) ? 1.0 : (Math.random() * 0.6 + 0.2);
          }
          newSteps[i].baseVelocity = Math.max(0.1, Math.min(1.0, vel));

          // Articulation tagging for round-robin
          if (i % 4 === 0) {
            newSteps[i].articulation = 'shank';
          } else {
            newSteps[i].articulation = 'tip';
          }

          let rollChance = 0;
          switch (params.rollDensity) {
            case 'sparse': rollChance = 0.12; break;
            case 'medium': rollChance = 0.24; break;
            case 'dense': rollChance = 0.42; break;
            case 'extreme': rollChance = 0.65; break;
            default: rollChance = 0;
          }

          // Force roll on turnaround steps 6, 14 for trap styles if medium or higher
          if ((i === 6 || i === 14) && params.rollDensity !== 'none' && Math.random() < 0.8) {
            rollChance = 1.0;
          }

          if (Math.random() < rollChance) {
            const rollTypes: PercussionStep['rollType'][] = 
              params.style === 'wheezy_wave' 
                ? ['triplet_32', 'straight_32', 'triplet_64']
                : ['straight_32', 'triplet_32', 'straight_64'];
            newSteps[i].rollType = rollTypes[Math.floor(Math.random() * rollTypes.length)];

            if (Math.random() < params.pitchSweepChance && params.pitchDirection !== 'none') {
              let startOffset = 0;
              let endOffset = 0;

              if (params.pitchDirection === 'down') {
                startOffset = Math.random() > 0.5 ? 2 : 0;
                endOffset = -Math.floor(Math.random() * 8 + 3); // -3 to -11
              } else if (params.pitchDirection === 'up') {
                startOffset = 0;
                endOffset = Math.floor(Math.random() * 8 + 3); // +3 to +11
              } else {
                // bidirectional
                startOffset = Math.random() > 0.5 ? 2 : 0;
                const semitoneRanges = [-5, -7, -9, 4, 6, -12, 7];
                endOffset = semitoneRanges[Math.floor(Math.random() * semitoneRanges.length)];
              }

              newSteps[i].startPitchOffset = startOffset;
              newSteps[i].endPitchOffset = endOffset;
              newSteps[i].pitchCurve = Math.random() > 0.5 ? 'exponential' : 'linear';
              newSteps[i].panStart = (Math.random() * 0.8 - 0.4);
              newSteps[i].panEnd = -newSteps[i].panStart;
            }
          }
        }
      }
    } else if (track.id === 'open_hat') {
      if (params.openHatStyle === 'offbeats') {
        [2, 6, 10, 14].forEach((s) => {
          newSteps[s].active = true;
          newSteps[s].baseVelocity = 0.88;
          newSteps[s].hatOpenness = 0.9;
        });
      } else if (params.openHatStyle === 'turnarounds') {
        [14, 15].forEach((s) => {
          newSteps[s].active = true;
          newSteps[s].baseVelocity = 0.92;
          newSteps[s].hatOpenness = 1.0;
        });
      } else if (params.openHatStyle === 'sparse') {
        const slots = [2, 10, 14];
        const chosen = slots[Math.floor(Math.random() * slots.length)];
        newSteps[chosen].active = true;
        newSteps[chosen].baseVelocity = 0.85;
        newSteps[chosen].hatOpenness = 0.8;
      }
    } else if (track.id === 'pedal_hat') {
      if (Math.random() > 0.3) {
        newSteps[4].active = true;
        newSteps[4].baseVelocity = 0.75;
        newSteps[12].active = true;
        newSteps[12].baseVelocity = 0.8;
      }
    } else if (track.id === 'shaker' || track.id === 'clave') {
      const pulses = Math.floor(Math.random() * 4) + 3;
      const euclidean = generateEuclideanPattern(pulses, 16);
      euclidean.forEach((isActive, idx) => {
        if (isActive) {
          newSteps[idx].active = true;
          newSteps[idx].baseVelocity = (idx % 2 === 0) ? 0.85 : 0.65;
        }
      });
    }

    return {
      ...track,
      steps: newSteps,
    };
  });
}

// Generate a complete 4-Sector Song Arrangement (A: Intro/Foundation, B: Main Verse, C: Build/Turnaround, D: Breakdown/Hook)
export function randomize4SectorProgression(
  tracks: InstrumentTrack[],
  params: RandomizerParams,
  baseBpm: number
): Record<SectorId, SectorData> {
  // Sector A: Intro / Clean 16ths
  const introTracks = randomizeGroove(tracks, {
    ...params,
    rollDensity: 'sparse',
    openHatStyle: 'sparse',
  });

  // Sector B: Verse / Main Bouncy Rolls
  const verseTracks = randomizeGroove(tracks, {
    ...params,
    rollDensity: 'medium',
    openHatStyle: 'turnarounds',
  });

  // Sector C: Build / Heavy rolls on turnarounds
  const buildTracks = randomizeGroove(tracks, {
    ...params,
    rollDensity: 'dense',
    openHatStyle: 'offbeats',
  });

  // Sector D: Hook / Intense skitters
  const hookTracks = randomizeGroove(tracks, {
    ...params,
    rollDensity: 'extreme',
    openHatStyle: 'offbeats',
  });

  return {
    A: {
      id: 'A',
      name: 'Intro Foundation',
      tracks: introTracks,
      bpm: baseBpm,
      humanizer: { timingJitterMs: 1.5, timingDriftMs: 3.0, velocityJitter: 0.04, swingPercent: 51.0, laidBackMs: 0, roundRobinEnabled: true },
    },
    B: {
      id: 'B',
      name: 'Main Verse Bounce',
      tracks: verseTracks,
      bpm: baseBpm,
      humanizer: { timingJitterMs: 1.8, timingDriftMs: 3.5, velocityJitter: 0.05, swingPercent: 52.0, laidBackMs: 0, roundRobinEnabled: true },
    },
    C: {
      id: 'C',
      name: 'Build / Turnaround',
      tracks: buildTracks,
      bpm: baseBpm,
      humanizer: { timingJitterMs: 2.0, timingDriftMs: 4.0, velocityJitter: 0.06, swingPercent: 53.0, laidBackMs: 0, roundRobinEnabled: true },
    },
    D: {
      id: 'D',
      name: 'Hook / Extreme Skitter',
      tracks: hookTracks,
      bpm: baseBpm,
      humanizer: { timingJitterMs: 1.2, timingDriftMs: 2.5, velocityJitter: 0.05, swingPercent: 50.5, laidBackMs: 0, roundRobinEnabled: true },
    },
  };
}

export function generateEuclideanPattern(pulses: number, steps: number = 16): boolean[] {
  const result: boolean[] = new Array(steps).fill(false);
  if (pulses <= 0) return result;
  if (pulses >= steps) return new Array(steps).fill(true);

  let bucket = 0;
  for (let i = 0; i < steps; i++) {
    bucket += pulses;
    if (bucket >= steps) {
      bucket -= steps;
      result[i] = true;
    }
  }
  return result;
}

export function applyStepFillPreset(
  type: 'straight_16' | 'eighth' | 'quarter' | 'offbeat',
  steps: PercussionStep[]
): PercussionStep[] {
  return steps.map((step, idx) => {
    let active = false;
    let vel = 0.75;

    switch (type) {
      case 'straight_16':
        active = true;
        vel = (idx % 4 === 0) ? 0.95 : (idx % 2 === 0) ? 0.72 : 0.45;
        break;
      case 'eighth':
        active = (idx % 2 === 0);
        vel = (idx % 4 === 0) ? 0.95 : 0.7;
        break;
      case 'quarter':
        active = (idx % 4 === 0);
        vel = 0.95;
        break;
      case 'offbeat':
        active = (idx % 4 === 2);
        vel = 0.88;
        break;
    }

    return {
      ...step,
      active,
      baseVelocity: vel,
      articulation: (idx % 4 === 0) ? 'shank' : 'tip',
    };
  });
}

// Automatic Velocity Curves (One-click "It Just Works" Dynamics)
export function applyVelocityCurve(
  curveType: 'accent_4ths' | 'hand_alternation' | 'crescendo' | 'decrescendo' | 'humanize_flutter',
  steps: PercussionStep[]
): PercussionStep[] {
  return steps.map((step, idx) => {
    if (!step.active) return step;

    let vel = step.baseVelocity;
    switch (curveType) {
      case 'accent_4ths':
        vel = (idx % 4 === 0) ? 1.0 : (idx % 2 === 0) ? 0.75 : 0.5;
        break;
      case 'hand_alternation':
        // Right Hand accent, Left Hand soft
        vel = (idx % 2 === 0) ? 0.96 : 0.62;
        break;
      case 'crescendo':
        vel = 0.35 + (idx / 15.0) * 0.65;
        break;
      case 'decrescendo':
        vel = 1.0 - (idx / 15.0) * 0.65;
        break;
      case 'humanize_flutter':
        vel = Math.max(0.2, Math.min(1.0, vel + (Math.random() * 0.24 - 0.12)));
        break;
    }

    return {
      ...step,
      baseVelocity: vel,
      articulation: (idx % 4 === 0) ? 'shank' : 'tip',
    };
  });
}

// One-Click "It Just Works" Quick Pattern Presets for Active Track
export function applyQuickPatternPreset(
  preset: 'trap_2step' | 'trap_16ths' | 'wheezy_wave' | 'southside_drop' | 'pierre_bounce' | 'dilla_walk' | 'purdie_shuffle' | 'detroit_taps' | 'offbeat_open',
  _steps?: PercussionStep[]
): PercussionStep[] {
  const result = createEmptySteps();

  switch (preset) {
    case 'trap_2step':
      for (let i = 0; i < 16; i += 2) {
        result[i].active = true;
        result[i].baseVelocity = (i % 4 === 0) ? 0.95 : 0.7;
      }
      break;

    case 'trap_16ths':
      for (let i = 0; i < 16; i++) {
        result[i].active = true;
        result[i].baseVelocity = (i % 4 === 0) ? 0.95 : (i % 2 === 0) ? 0.72 : 0.5;
      }
      break;

    case 'wheezy_wave':
      for (let i = 0; i < 16; i++) {
        result[i].active = true;
        result[i].baseVelocity = (i % 4 === 0) ? 0.95 : 0.65;
      }
      // Step 6: 32T triplet wave roll
      result[6].rollType = 'triplet_32';
      result[6].startPitchOffset = 2;
      result[6].endPitchOffset = 6;
      result[6].panStart = -0.4;
      result[6].panEnd = 0.4;
      // Step 14: 32T turnaround
      result[14].rollType = 'triplet_32';
      result[14].startPitchOffset = 4;
      result[14].endPitchOffset = 8;
      break;

    case 'southside_drop':
      for (let i = 0; i < 16; i++) {
        result[i].active = true;
        result[i].baseVelocity = (i % 2 === 0) ? 0.96 : 0.6;
      }
      // Step 6: -5st drop
      result[6].rollType = 'straight_32';
      result[6].startPitchOffset = 1;
      result[6].endPitchOffset = -5;
      result[6].pitchCurve = 'exponential';
      // Step 14: 64th turnaround
      result[14].rollType = 'straight_64';
      result[14].startPitchOffset = 3;
      result[14].endPitchOffset = -8;
      break;

    case 'pierre_bounce':
      [0, 2, 4, 6, 7, 8, 10, 12, 13, 14].forEach((s) => {
        result[s].active = true;
        result[s].baseVelocity = (s % 4 === 0) ? 0.96 : (s === 7 || s === 13) ? 0.88 : 0.68;
      });
      result[7].rollType = 'straight_32';
      result[7].startPitchOffset = 2;
      result[7].endPitchOffset = 6;
      result[14].rollType = 'triplet_32';
      result[14].startPitchOffset = 0;
      result[14].endPitchOffset = -4;
      break;

    case 'dilla_walk':
      for (let i = 0; i < 16; i++) {
        result[i].active = true;
        result[i].baseVelocity = (i % 4 === 0) ? 0.98 : (i % 2 === 0) ? 0.74 : 0.4;
        result[i].articulation = (i % 4 === 0) ? 'shank' : 'tip';
      }
      break;

    case 'purdie_shuffle':
      for (let i = 0; i < 16; i += 2) {
        result[i].active = true;
        result[i].baseVelocity = (i % 4 === 0) ? 0.95 : 0.72;
        result[i].articulation = (i % 4 === 0) ? 'shank' : 'tip';
      }
      [3, 11].forEach((s) => {
        result[s].active = true;
        result[s].baseVelocity = 0.42;
        result[s].articulation = 'tip';
      });
      break;

    case 'detroit_taps':
      [0, 1, 4, 6, 8, 9, 12, 14, 15].forEach((s) => {
        result[s].active = true;
        result[s].baseVelocity = (s === 0 || s === 8) ? 0.98 : 0.65;
      });
      result[6].rollType = 'straight_32';
      result[6].startPitchOffset = 3;
      result[6].endPitchOffset = 0;
      break;

    case 'offbeat_open':
      [2, 6, 10, 14].forEach((s) => {
        result[s].active = true;
        result[s].baseVelocity = 0.9;
        result[s].hatOpenness = 0.9;
      });
      break;
  }

  return result;
}

// Instant 1-bar replication: duplicate beat 1 across beats 2, 3, 4
export function duplicateBeat1ToAllBeats(steps: PercussionStep[]): PercussionStep[] {
  const result = [...steps];
  for (let b = 1; b < 4; b++) {
    for (let s = 0; s < 4; s++) {
      result[b * 4 + s] = { ...steps[s] };
    }
  }
  return result;
}

export function nudgePatternSteps(steps: PercussionStep[], offset: number): PercussionStep[] {
  const len = steps.length;
  const shifted: PercussionStep[] = new Array(len);
  for (let i = 0; i < len; i++) {
    const targetIdx = (i + offset + len) % len;
    shifted[targetIdx] = { ...steps[i] };
  }
  return shifted;
}

export function injectRollPresetToStep(
  type: 'trap_drop' | 'drill_hop' | 'buzz_64' | 'triplet_stutter' | 'riser_up',
  step: PercussionStep
): PercussionStep {
  switch (type) {
    case 'trap_drop':
      return {
        ...step,
        active: true,
        rollType: 'straight_32',
        startPitchOffset: 1,
        endPitchOffset: -5,
        pitchCurve: 'exponential',
        panStart: -0.4,
        panEnd: 0.4,
      };
    case 'drill_hop':
      return {
        ...step,
        active: true,
        rollType: 'triplet_32',
        startPitchOffset: 5,
        endPitchOffset: -2,
        pitchCurve: 'linear',
      };
    case 'buzz_64':
      return {
        ...step,
        active: true,
        rollType: 'straight_64',
        startPitchOffset: 3,
        endPitchOffset: -8,
        pitchCurve: 'exponential',
        panStart: 0.6,
        panEnd: -0.6,
      };
    case 'triplet_stutter':
      return {
        ...step,
        active: true,
        rollType: 'triplet_32',
        startPitchOffset: 2,
        endPitchOffset: 4,
      };
    case 'riser_up':
      return {
        ...step,
        active: true,
        rollType: 'straight_32',
        startPitchOffset: -2,
        endPitchOffset: 7,
        pitchCurve: 'linear',
      };
  }
}
