export type RollType = 
  | 'none' 
  | 'straight_32' 
  | 'straight_64' 
  | 'triplet_32' 
  | 'triplet_64';

export type PitchRampCurve = 'linear' | 'exponential' | 'logarithmic';

export type HatZone = 'TightClosed' | 'LooseClosed' | 'HalfOpen' | 'FullOpen';

export type HatArticulation = 'auto_round_robin' | 'tip' | 'shank' | 'sizzle' | 'pedal';

export type QuantizeGrid = 'sixteenth' | 'thirty_second' | 'sixteenth_triplet' | 'off';

export type GenrePreset = 
  | 'atlanta_dark_trap'
  | 'wheezy_tsunami'
  | 'southside_808mafia'
  | 'melodic_trap'
  | 'rage_hyper_trap'
  | 'murda_beatz_bounce'
  | 'metro_cinematic_trap'
  | 'plugg_mexikodro'
  | 'jersey_club_drip'
  | 'detroit_bounce'
  | 'memphis_phonk'
  | 'uk_drill'
  | 'boombap_dilla'
  | 'purdie_shuffle'
  | 'acoustic_funk_live'
  | 'uk_garage_2step'
  | 'amen_breakbeat'
  | 'cascara_clave'
  | 'dub_techno'
  | 'custom';

export interface PercussionStep {
  active: boolean;
  baseVelocity: number;        // 0.0 to 1.0
  probability: number;         // 0.0 to 1.0 trigger probability
  rollType: RollType;
  pitchCurve: PitchRampCurve;
  startPitchOffset: number;    // -12.0 to +12.0 semitones
  endPitchOffset: number;      // -12.0 to +12.0 semitones
  panStart: number;            // -1.0 to +1.0
  panEnd: number;              // -1.0 to +1.0
  hatOpenness: number;         // 0.0 (tight closed) to 1.0 (full open)
  timingOffsetMs: number;      // micro-timing offset
  articulation?: HatArticulation;
}

export interface RoundRobinKit {
  tipL?: AudioBuffer;
  tipR?: AudioBuffer;
  shank?: AudioBuffer;
  sizzle?: AudioBuffer;
  pedal?: AudioBuffer;
}

export interface InstrumentTrack {
  id: string;
  name: string;
  shortLabel: string;
  chokeGroup: number;          // 1 = Hi-Hat group (chokes open hats), 0 = none
  midiNote: number;            // e.g. 42 for Closed Hat, 46 for Open Hat, 44 for Pedal
  steps: PercussionStep[];
  volume: number;              // 0.0 to 1.0
  pan: number;                 // -1.0 to 1.0
  mute: boolean;
  solo: boolean;
  sampleName: string;
  sampleId?: string;
  isSynthesized: boolean;
  sampleBuffer?: AudioBuffer | null;
  roundRobinBuffers?: AudioBuffer[]; // Multi-sample round-robin pool for live acoustic realism
  roundRobinKit?: RoundRobinKit;     // Distinct articulation set (Tip L, Tip R, Shank, Sizzle, Pedal)
}

export interface HumanizerParams {
  timingJitterMs: number;      // 0 to 15 ms
  timingDriftMs: number;       // 0 to 15 ms LFO drift
  velocityJitter: number;      // 0.0 to 0.2
  swingPercent: number;        // 50.0 (straight) to 75.0 (triplet)
  laidBackMs: number;          // 0 to 20 ms
  roundRobinEnabled: boolean;  // Human L/R hand alternation
}

export interface SoundSample {
  id: string;
  name: string;
  category: 'closed_hat' | 'open_hat' | 'pedal_hat' | 'perc' | 'shaker' | 'clave' | 'custom';
  tags: string[];
  fileSize?: string;
  durationSeconds: number;
  buffer: AudioBuffer;
  peakData: number[];          // Waveform visualization points
  isCustom: boolean;
  articulation?: HatArticulation;
}

export type SectorId = 'A' | 'B' | 'C' | 'D';

export interface SectorData {
  id: SectorId;
  name: string;
  tracks: InstrumentTrack[];
  bpm: number;
  humanizer: HumanizerParams;
}

export interface RandomizerParams {
  style: 
    | 'atlanta_trap' 
    | 'wheezy_wave' 
    | 'southside_808' 
    | 'melodic_trap' 
    | 'rage_trap' 
    | 'murda_bounce' 
    | 'metro_dark' 
    | 'drill' 
    | 'boombap' 
    | 'shuffle' 
    | 'garage' 
    | 'afrocuban' 
    | 'jersey_club';
  rollDensity: 'none' | 'sparse' | 'medium' | 'dense' | 'extreme';
  pitchDirection: 'down' | 'up' | 'bidirectional' | 'none';
  pitchSweepChance: number; // 0 to 1
  velocityDynamicRange: 'tight' | 'medium' | 'wide';
  openHatStyle: 'offbeats' | 'turnarounds' | 'sparse' | 'none';
  lockedTrackIds: string[];
  generationMode?: 'single_sector' | 'four_sector_progression';
}
