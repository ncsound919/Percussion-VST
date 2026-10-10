import { InstrumentTrack, RollType, PitchRampCurve } from '../types';

export type MainstreamArchetypeId =
  | 'metro_boomin'
  | 'wheezy'
  | 'southside'
  | 'pierre_bourne'
  | 'boi_1da'
  | 'murda_beatz'
  | 'j_dilla';

export interface MainstreamArchetype {
  id: MainstreamArchetypeId;
  name: string;
  producerReference: string;
  chartEra: string;
  targetBpm: number;
  recommendedSwing: number;
  description: string;
  primaryRollTypes: RollType[];
  turnaroundSteps: number[]; // 0-indexed (e.g. [13, 14, 15] = steps 14, 15, 16)
  protectedAnchorSteps: number[]; // steps where heavy rolls are prohibited (e.g. 4 and 12 = snare backbeats)
  typicalPitchSweep: { start: number; end: number; curve: 'linear' | 'exponential' };
  chokeStrategy: 'strict_immediate' | 'turnaround_tail' | 'open_sizzle';
  dynamicVelocityCurve: 'exponential_crescendo' | 'linear_rise' | 'ghost_accent';
}

export interface GovernanceRule {
  id: string;
  name: string;
  category: 'anchor' | 'cadence' | 'dynamics' | 'pitch' | 'choke' | 'dialogue';
  nature: 'REAL_MATH' | 'CALIBRATED_PROFILE';
  description: string;
}

export interface GovernanceViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  nature: 'REAL_MATH' | 'CALIBRATED_PROFILE';
  severity: 'error' | 'warning' | 'info';
  stepIndex: number; // 0-indexed
  trackId: string;
  message: string;
  suggestedFix: string;
}

export interface GovernanceDecision {
  stepIndex: number;
  trackId: string;
  action: 'ALLOWED' | 'MODIFIED' | 'PREVENTED' | 'INJECTED';
  ruleName: string;
  details: string;
  nature: 'REAL_MATH' | 'CALIBRATED_PROFILE';
}

export interface GovernanceAuditReport {
  archetypeId: MainstreamArchetypeId;
  archetypeName: string;
  producerReference: string;
  complianceScore: number; // 0 to 100
  violations: GovernanceViolation[];
  totalViolations: number;
  summary: string;
}

export const MAINSTREAM_ARCHETYPES: Record<MainstreamArchetypeId, MainstreamArchetype> = {
  metro_boomin: {
    id: 'metro_boomin',
    name: 'Metro Boomin ("Heroes & Villains" / "Savage Mode")',
    producerReference: 'Metro Boomin, 21 Savage, Future, The Weeknd',
    chartEra: 'Billboard Hot 100 #1 Trap Standard',
    targetBpm: 142,
    recommendedSwing: 51.0,
    description:
      'Governs strict backbeat snare isolation, heavy downbeat 808 pockets, and aggressive 64th cadential turnarounds with -5st pitch plunges.',
    primaryRollTypes: ['straight_32', 'straight_64', 'triplet_32'],
    turnaroundSteps: [13, 14, 15],
    protectedAnchorSteps: [4, 12], // Beat 2 and Beat 4 (Clap / Snare)
    typicalPitchSweep: { start: 1, end: -5, curve: 'exponential' },
    chokeStrategy: 'strict_immediate',
    dynamicVelocityCurve: 'exponential_crescendo',
  },
  wheezy: {
    id: 'wheezy',
    name: 'Wheezy ("Tsunami Wave" / "Wunna")',
    producerReference: 'Wheezy Outta Here, Gunna, Young Thug, Lil Baby',
    chartEra: 'Atlanta Melodic Tsunami Wave',
    targetBpm: 132,
    recommendedSwing: 52.0,
    description:
      'Governs 32nd triplet wave rolls, climbing pitch risers (+2st to +7st), smooth swing syncopation, and fluid ghost velocities.',
    primaryRollTypes: ['triplet_32', 'straight_32'],
    turnaroundSteps: [13, 14],
    protectedAnchorSteps: [4, 12],
    typicalPitchSweep: { start: 2, end: 7, curve: 'linear' },
    chokeStrategy: 'turnaround_tail',
    dynamicVelocityCurve: 'linear_rise',
  },
  southside: {
    id: 'southside',
    name: 'Southside & 808 Mafia ("Machine Gun Drill")',
    producerReference: 'Southside, TM88, Future, G Herbo',
    chartEra: '808 Mafia Signature Atlanta Heavyweight',
    targetBpm: 146,
    recommendedSwing: 50.0,
    description:
      'Governs rapid 64th machine-gun burst clusters, aggressive stereo panning automations (-50% to +50%), and deep pitch drops into downbeats.',
    primaryRollTypes: ['straight_64', 'straight_32', 'triplet_64'],
    turnaroundSteps: [6, 14, 15],
    protectedAnchorSteps: [4, 12],
    typicalPitchSweep: { start: 3, end: -6, curve: 'exponential' },
    chokeStrategy: 'strict_immediate',
    dynamicVelocityCurve: 'exponential_crescendo',
  },
  pierre_bourne: {
    id: 'pierre_bourne',
    name: 'Pierre Bourne ("Plugg / Magnolia Bounce")',
    producerReference: 'Pierre Bourne, Playboi Carti, Lil Uzi Vert',
    chartEra: 'Playful Sparse Melodic Plugg',
    targetBpm: 154,
    recommendedSwing: 50.0,
    description:
      'Governs minimalist hi-hat spaces (skipping steps 2 & 10), crisp un-pitched 32nd roll on step 16 only, and playful open-hat offbeat chokes.',
    primaryRollTypes: ['straight_32'],
    turnaroundSteps: [15],
    protectedAnchorSteps: [4, 12],
    typicalPitchSweep: { start: 0, end: 0, curve: 'linear' },
    chokeStrategy: 'turnaround_tail',
    dynamicVelocityCurve: 'ghost_accent',
  },
  boi_1da: {
    id: 'boi_1da',
    name: 'Boi-1da & 40 ("Toronto OVO Bounce")',
    producerReference: 'Boi-1da, Noah "40" Shebib, Drake, Travis Scott',
    chartEra: 'OVO Sound Dark Toronto Pocket',
    targetBpm: 130,
    recommendedSwing: 53.5,
    description:
      'Governs laid-back micro-timing offsets on odd 16ths, dark pitch drops (-3st), heavy snare transient space, and subtle ghost notes.',
    primaryRollTypes: ['straight_32', 'triplet_32'],
    turnaroundSteps: [14, 15],
    protectedAnchorSteps: [4, 12],
    typicalPitchSweep: { start: 0, end: -3, curve: 'exponential' },
    chokeStrategy: 'strict_immediate',
    dynamicVelocityCurve: 'ghost_accent',
  },
  murda_beatz: {
    id: 'murda_beatz',
    name: 'Murda Beatz ("Flute Trap Bounce")',
    producerReference: 'Murda Beatz, Migos, Quavo, Gucci Mane',
    chartEra: 'Modern Bouncy Radio Trap',
    targetBpm: 140,
    recommendedSwing: 51.5,
    description:
      'Governs clean symmetrical 32nd rolls on step 7 and 15, clean crescendo ramps (0.45 -> 0.95), zero pitch clutter, and high-energy clap punch.',
    primaryRollTypes: ['straight_32', 'straight_64'],
    turnaroundSteps: [6, 14],
    protectedAnchorSteps: [4, 12],
    typicalPitchSweep: { start: 0, end: 0, curve: 'linear' },
    chokeStrategy: 'strict_immediate',
    dynamicVelocityCurve: 'linear_rise',
  },
  j_dilla: {
    id: 'j_dilla',
    name: 'J Dilla ("Detroit Unquantized Swing")',
    producerReference: 'J Dilla, Slum Village, The Roots, Common',
    chartEra: 'Classic Neo-Soul & Unquantized Hip-Hop Standard',
    targetBpm: 92,
    recommendedSwing: 59.5,
    description:
      'Governs organic multi-sample round-robin hand alternation, heavy laid-back layback (+14ms), and unquantized ghost taps on offbeats.',
    primaryRollTypes: ['triplet_32'],
    turnaroundSteps: [14, 15],
    protectedAnchorSteps: [4, 12],
    typicalPitchSweep: { start: 0, end: 0, curve: 'linear' },
    chokeStrategy: 'open_sizzle',
    dynamicVelocityCurve: 'ghost_accent',
  },
};

export const GOVERNANCE_RULES: GovernanceRule[] = [
  {
    id: 'RULE_ANCHOR_ISOLATION',
    name: 'Backbeat Anchor Isolation',
    category: 'anchor',
    nature: 'REAL_MATH',
    description:
      'Mathematically protects Beat 2 (Step 5) and Beat 4 (Step 13) from high-density roll transients that blur the primary snare/clap anchor.',
  },
  {
    id: 'RULE_CADENCE_MOMENTUM',
    name: 'Bar Turnaround Cadence',
    category: 'cadence',
    nature: 'CALIBRATED_PROFILE',
    description:
      'Enforces that Steps 14–16 contain a cadential acceleration (roll, pitch sweep, or open-hat choke) to drive momentum into bar 1.',
  },
  {
    id: 'RULE_VELOCITY_CONTOUR',
    name: 'Non-Static Dynamic Velocity Ramp',
    category: 'dynamics',
    nature: 'REAL_MATH',
    description:
      'Calculates an exponential or linear crescendo across roll subdivisions. Flat static velocity on rolls is prohibited.',
  },
  {
    id: 'RULE_PITCH_INTERVAL_BOUNDS',
    name: 'Harmonic Pitch Sweep Limits',
    category: 'pitch',
    nature: 'REAL_MATH',
    description:
      'Restricts pitch ramp offsets within valid musical bounds (-12st to +12st) matching the selected producer grammar.',
  },
  {
    id: 'RULE_CHOKE_EXCLUSION',
    name: 'Hi-Hat Choke Group Mutual Exclusion',
    category: 'choke',
    nature: 'REAL_MATH',
    description:
      'Verifies that open hat resonances do not overlap or ring through subsequent closed hat triggers on Choke Group 1.',
  },
  {
    id: 'RULE_MULTI_TRACK_POCKET',
    name: 'Kick & 808 Pocket Alignment',
    category: 'dialogue',
    nature: 'CALIBRATED_PROFILE',
    description:
      'Governs that rhythmic space is preserved for the 808 sub bass downbeat without conflicting polyrhythmic hi-hat clatter.',
  },
];

/**
 * Deterministically audits a pattern against a mainstream producer archetype.
 */
export function auditPattern(
  tracks: InstrumentTrack[],
  archetypeId: MainstreamArchetypeId,
  activeTrackId: string
): GovernanceAuditReport {
  const archetype = MAINSTREAM_ARCHETYPES[archetypeId] || MAINSTREAM_ARCHETYPES.metro_boomin;
  const targetTrack = tracks.find((t) => t.id === activeTrackId) || tracks.find((t) => t.id.includes('hat')) || tracks[0];
  const violations: GovernanceViolation[] = [];

  const openHatTrack = tracks.find((t) => t.id === 'open_hat');

  // 1. Audit Anchor Protection on steps 4 and 12 (0-indexed: Beat 2 and Beat 4)
  archetype.protectedAnchorSteps.forEach((stepIdx) => {
    const step = targetTrack.steps[stepIdx];
    if (step && step.active && (step.rollType === 'straight_64' || step.rollType === 'triplet_64')) {
      violations.push({
        id: `anchor_viol_${stepIdx}`,
        ruleId: 'RULE_ANCHOR_ISOLATION',
        ruleName: 'Backbeat Anchor Isolation',
        nature: 'REAL_MATH',
        severity: 'error',
        stepIndex: stepIdx,
        trackId: targetTrack.id,
        message: `Step ${stepIdx + 1} (Beat ${stepIdx === 4 ? 2 : 4}) has a high-density ${step.rollType} roll which collides with the primary backbeat transient.`,
        suggestedFix: `Reduce to straight 16th hit or relocate the roll to Step ${stepIdx} (anticipation) or Step ${stepIdx + 2}.`,
      });
    }
  });

  // 2. Audit Cadence / Turnaround presence in steps 13, 14, 15 (0-indexed)
  const hasTurnaroundRoll = archetype.turnaroundSteps.some((stepIdx) => {
    const step = targetTrack.steps[stepIdx];
    return step && step.active && step.rollType !== 'none';
  });

  if (!hasTurnaroundRoll) {
    violations.push({
      id: 'cadence_missing',
      ruleId: 'RULE_CADENCE_MOMENTUM',
      ruleName: 'Bar Turnaround Cadence',
      nature: 'CALIBRATED_PROFILE',
      severity: 'warning',
      stepIndex: 14, // Step 15
      trackId: targetTrack.id,
      message: `Pattern lacks a mainstream cadential turnaround in Steps 14–16. In ${archetype.name}, momentum into the downbeat requires a cadential roll or sweep.`,
      suggestedFix: `Inject a ${archetype.primaryRollTypes[0]} turnaround roll on Step 15 with pitch sweep (${archetype.typicalPitchSweep.start}st to ${archetype.typicalPitchSweep.end}st).`,
    });
  }

  // 3. Audit Velocity Dynamics on all active rolls
  targetTrack.steps.forEach((step, sIdx) => {
    if (step.active && step.rollType !== 'none') {
      // Check if velocity is low or un-sculpted
      if (step.baseVelocity > 0.95 && step.startPitchOffset === 0 && step.endPitchOffset === 0) {
        violations.push({
          id: `static_vel_${sIdx}`,
          ruleId: 'RULE_VELOCITY_CONTOUR',
          ruleName: 'Non-Static Dynamic Velocity Ramp',
          nature: 'REAL_MATH',
          severity: 'info',
          stepIndex: sIdx,
          trackId: targetTrack.id,
          message: `Step ${sIdx + 1} roll uses flat full-scale velocity (1.0). Mainstream rolls employ dynamic crescendo ramps.`,
          suggestedFix: `Apply exponential crescendo ramp starting at 0.55 velocity up to 0.92.`,
        });
      }
    }
  });

  // 4. Audit Pitch Sweep bounds
  targetTrack.steps.forEach((step, sIdx) => {
    if (step.active && (Math.abs(step.startPitchOffset) > 12 || Math.abs(step.endPitchOffset) > 12)) {
      violations.push({
        id: `pitch_bound_${sIdx}`,
        ruleId: 'RULE_PITCH_INTERVAL_BOUNDS',
        ruleName: 'Harmonic Pitch Sweep Limits',
        nature: 'REAL_MATH',
        severity: 'error',
        stepIndex: sIdx,
        trackId: targetTrack.id,
        message: `Step ${sIdx + 1} pitch offset (${step.startPitchOffset}st to ${step.endPitchOffset}st) exceeds ±12 semitone musical threshold.`,
        suggestedFix: `Clamp pitch sweep within ${archetype.typicalPitchSweep.start}st to ${archetype.typicalPitchSweep.end}st.`,
      });
    }
  });

  // 5. Audit Choke & Open Hat interaction
  if (openHatTrack) {
    openHatTrack.steps.forEach((ohStep, sIdx) => {
      if (ohStep.active && sIdx < 15) {
        const nextStep = targetTrack.steps[sIdx + 1];
        if (!nextStep?.active && sIdx !== 14) {
          violations.push({
            id: `choke_unclosed_${sIdx}`,
            ruleId: 'RULE_CHOKE_EXCLUSION',
            ruleName: 'Hi-Hat Choke Group Mutual Exclusion',
            nature: 'REAL_MATH',
            severity: 'info',
            stepIndex: sIdx,
            trackId: openHatTrack.id,
            message: `Open Hat on Step ${sIdx + 1} is not choked by a closed hat on Step ${sIdx + 2}, leaving an unmanaged resonant tail.`,
            suggestedFix: `Place an active closed hat trigger on Step ${sIdx + 2} to enforce choke cut.`,
          });
        }
      }
    });
  }

  // Calculate Compliance Score (100 minus weighted penalties)
  let score = 100;
  violations.forEach((v) => {
    if (v.severity === 'error') score -= 25;
    else if (v.severity === 'warning') score -= 12;
    else score -= 5;
  });
  score = Math.max(0, Math.min(100, score));

  return {
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    producerReference: archetype.producerReference,
    complianceScore: score,
    violations,
    totalViolations: violations.length,
    summary:
      score >= 90
        ? `Pattern is highly compliant with ${archetype.name} mainstream governance.`
        : score >= 70
        ? `Pattern generally adheres to mainstream trap pocket, but has ${violations.length} structural warnings.`
        : `Pattern requires governance enforcement to achieve authentic ${archetype.name} pocketing.`,
  };
}

/**
 * Deterministically applies mainstream governance corrections to fix all rule violations.
 */
export function enforceGovernance(
  tracks: InstrumentTrack[],
  archetypeId: MainstreamArchetypeId,
  activeTrackId: string
): { updatedTracks: InstrumentTrack[]; auditLog: GovernanceDecision[] } {
  const archetype = MAINSTREAM_ARCHETYPES[archetypeId] || MAINSTREAM_ARCHETYPES.metro_boomin;
  const auditLog: GovernanceDecision[] = [];

  const updatedTracks = tracks.map((t) => ({
    ...t,
    steps: t.steps.map((s) => ({ ...s })),
  }));

  const targetTrack = updatedTracks.find((t) => t.id === activeTrackId) || updatedTracks[0];
  const openHatTrack = updatedTracks.find((t) => t.id === 'open_hat');

  // Rule 1: Fix Backbeat Anchor Collisions on Steps 4 and 12 (0-indexed)
  archetype.protectedAnchorSteps.forEach((stepIdx) => {
    const step = targetTrack.steps[stepIdx];
    if (step && step.active && (step.rollType === 'straight_64' || step.rollType === 'triplet_64')) {
      step.rollType = 'none';
      step.baseVelocity = 0.85;
      step.startPitchOffset = 0;
      step.endPitchOffset = 0;

      // Relocate roll to pre-backbeat anticipation (stepIdx - 1)
      if (stepIdx > 0) {
        const prevStep = targetTrack.steps[stepIdx - 1];
        prevStep.active = true;
        prevStep.rollType = 'straight_32';
        prevStep.baseVelocity = 0.72;
        prevStep.startPitchOffset = 1;
        prevStep.endPitchOffset = -2;
      }

      auditLog.push({
        stepIndex: stepIdx,
        trackId: targetTrack.id,
        action: 'MODIFIED',
        ruleName: 'Backbeat Anchor Isolation',
        details: `Removed 64th roll from backbeat Step ${stepIdx + 1}; converted to clean anchor hit and relocated roll to Step ${stepIdx} anticipation.`,
        nature: 'REAL_MATH',
      });
    }
  });

  // Rule 2: Enforce Bar Turnaround Cadence in Steps 14-16
  const primaryTurnaroundIdx = archetype.turnaroundSteps[archetype.turnaroundSteps.length - 1];
  const turnaroundStep = targetTrack.steps[primaryTurnaroundIdx];
  if (turnaroundStep && (!turnaroundStep.active || turnaroundStep.rollType === 'none')) {
    turnaroundStep.active = true;
    turnaroundStep.rollType = archetype.primaryRollTypes[0];
    turnaroundStep.baseVelocity = 0.88;
    turnaroundStep.startPitchOffset = archetype.typicalPitchSweep.start;
    turnaroundStep.endPitchOffset = archetype.typicalPitchSweep.end;
    turnaroundStep.pitchCurve = archetype.typicalPitchSweep.curve;

    auditLog.push({
      stepIndex: primaryTurnaroundIdx,
      trackId: targetTrack.id,
      action: 'INJECTED',
      ruleName: 'Bar Turnaround Cadence',
      details: `Injected authentic ${archetype.primaryRollTypes[0]} turnaround on Step ${primaryTurnaroundIdx + 1} with ${archetype.typicalPitchSweep.start}st to ${archetype.typicalPitchSweep.end}st pitch sweep.`,
      nature: 'CALIBRATED_PROFILE',
    });
  }

  // Rule 3: Enforce Velocity Contours on All Active Rolls
  targetTrack.steps.forEach((step, sIdx) => {
    if (step.active && step.rollType !== 'none') {
      if (step.baseVelocity > 0.9) {
        step.baseVelocity = 0.78; // headroom for sub-division crescendo
        auditLog.push({
          stepIndex: sIdx,
          trackId: targetTrack.id,
          action: 'MODIFIED',
          ruleName: 'Non-Static Dynamic Velocity Ramp',
          details: `Sculpted Step ${sIdx + 1} roll velocity from 1.0 to 0.78 to permit natural acoustic crescendo.`,
          nature: 'REAL_MATH',
        });
      }
    }
  });

  // Rule 4: Harmonic Pitch Limits
  targetTrack.steps.forEach((step) => {
    if (step.active) {
      if (step.startPitchOffset > 12) step.startPitchOffset = 12;
      if (step.startPitchOffset < -12) step.startPitchOffset = -12;
      if (step.endPitchOffset > 12) step.endPitchOffset = 12;
      if (step.endPitchOffset < -12) step.endPitchOffset = -12;
    }
  });

  // Rule 5: Hi-Hat Choke Group Mutual Exclusion
  if (openHatTrack) {
    openHatTrack.steps.forEach((ohStep, sIdx) => {
      if (ohStep.active && sIdx < 15) {
        const nextStep = targetTrack.steps[sIdx + 1];
        if (!nextStep.active) {
          nextStep.active = true;
          nextStep.baseVelocity = 0.7;
          nextStep.hatOpenness = 0.0;
          auditLog.push({
            stepIndex: sIdx + 1,
            trackId: targetTrack.id,
            action: 'INJECTED',
            ruleName: 'Hi-Hat Choke Group Mutual Exclusion',
            details: `Added closed hat on Step ${sIdx + 2} to choke Step ${sIdx + 1} open hat resonance.`,
            nature: 'REAL_MATH',
          });
        }
      }
    });
  }

  return { updatedTracks, auditLog };
}

/**
 * Deterministically generates a pattern governed completely by a mainstream archetype and integer seed.
 * 100% reproducible with zero random hallucinations.
 */
export function generateGovernedPattern(
  archetypeId: MainstreamArchetypeId,
  seed: number,
  tracks: InstrumentTrack[],
  _targetTrackId?: string
): { updatedTracks: InstrumentTrack[]; auditLog: GovernanceDecision[]; bpm: number } {
  const archetype = MAINSTREAM_ARCHETYPES[archetypeId] || MAINSTREAM_ARCHETYPES.metro_boomin;
  const auditLog: GovernanceDecision[] = [];

  const updatedTracks = tracks.map((t) => ({
    ...t,
    steps: t.steps.map(() => ({
      active: false,
      baseVelocity: 0.75,
      probability: 1.0,
      rollType: 'none' as RollType,
      pitchCurve: 'linear' as PitchRampCurve,
      startPitchOffset: 0,
      endPitchOffset: 0,
      panStart: 0,
      panEnd: 0,
      hatOpenness: 0,
      timingOffsetMs: 0,
      articulation: 'auto_round_robin' as const,
    })),
  }));

  // Deterministic pseudo-random generator from integer seed (Linear Congruential Generator)
  let state = Math.abs(seed) || 12345;
  const nextRand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  const trapHat = updatedTracks.find((t) => t.id === 'trap_hat') || updatedTracks[0];
  const openHat = updatedTracks.find((t) => t.id === 'open_hat');
  const clap = updatedTracks.find((t) => t.id === 'clap');
  const snare = updatedTracks.find((t) => t.id === 'snare');
  const kick = updatedTracks.find((t) => t.id === 'bass_808' || t.id === 'kick');

  // 1. Clap / Snare Backbeat Foundation (Governed Anchor)
  if (clap || snare) {
    const backbeatTrack = clap || snare!;
    backbeatTrack.steps[4].active = true;
    backbeatTrack.steps[4].baseVelocity = 0.96;
    backbeatTrack.steps[12].active = true;
    backbeatTrack.steps[12].baseVelocity = 0.98;

    auditLog.push({
      stepIndex: 4,
      trackId: backbeatTrack.id,
      action: 'INJECTED',
      ruleName: 'Backbeat Anchor Isolation',
      details: 'Locked Beat 2 (Step 5) and Beat 4 (Step 13) backbeat clap anchors.',
      nature: 'REAL_MATH',
    });
  }

  // 2. Mainstream Hi-Hat Pulse & Roll Grammar
  for (let i = 0; i < 16; i++) {
    // Basic pulse: 8th or 16th notes depending on archetype
    const isEighth = i % 2 === 0;
    const isDownbeat = i % 4 === 0;

    if (archetype.id === 'pierre_bourne') {
      // Pierre Bourne skips steps 1 and 9 (0-indexed: steps 2 and 10 in 1-based)
      if (i === 1 || i === 9) continue;
    }

    trapHat.steps[i].active = true;
    trapHat.steps[i].baseVelocity = isDownbeat ? 0.92 : isEighth ? 0.78 : 0.58;

    // Check for cadential turnaround on steps 13, 14, 15
    if (i === 14) {
      // Turnaround roll
      trapHat.steps[i].rollType = archetype.primaryRollTypes[0];
      trapHat.steps[i].startPitchOffset = archetype.typicalPitchSweep.start;
      trapHat.steps[i].endPitchOffset = archetype.typicalPitchSweep.end;
      trapHat.steps[i].pitchCurve = archetype.typicalPitchSweep.curve as PitchRampCurve;

      if (archetype.id === 'southside') {
        trapHat.steps[i].panStart = -0.45;
        trapHat.steps[i].panEnd = 0.45;
      }

      auditLog.push({
        stepIndex: i,
        trackId: trapHat.id,
        action: 'INJECTED',
        ruleName: 'Bar Turnaround Cadence',
        details: `Turnaround roll governed by ${archetype.name} profile (${archetype.primaryRollTypes[0]} with pitch sweep).`,
        nature: 'CALIBRATED_PROFILE',
      });
    } else if (i === 6 && nextRand() > 0.3) {
      // Mid-bar turnaround on step 7 (leading into beat 3)
      const rollChoice = archetype.primaryRollTypes[Math.min(1, archetype.primaryRollTypes.length - 1)];
      trapHat.steps[i].rollType = rollChoice;
      trapHat.steps[i].startPitchOffset = archetype.typicalPitchSweep.start > 0 ? 2 : 0;
      trapHat.steps[i].endPitchOffset = archetype.typicalPitchSweep.end < 0 ? -4 : 4;

      auditLog.push({
        stepIndex: i,
        trackId: trapHat.id,
        action: 'INJECTED',
        ruleName: 'Mid-Bar Cadence Anchor',
        details: `Mid-bar pivot roll injected into Step 7 (${rollChoice}).`,
        nature: 'CALIBRATED_PROFILE',
      });
    } else if (i === 10 && nextRand() > 0.5 && archetype.id !== 'pierre_bourne') {
      // Step 11 stutter
      trapHat.steps[i].rollType = 'triplet_32';
      trapHat.steps[i].startPitchOffset = 2;
      trapHat.steps[i].endPitchOffset = 5;
    }
  }

  // 3. Open Hat Turnaround & Choke Placement
  if (openHat) {
    if (archetype.id === 'wheezy' || archetype.id === 'metro_boomin') {
      openHat.steps[2].active = true;
      openHat.steps[2].baseVelocity = 0.88;
      openHat.steps[2].hatOpenness = 0.9;

      openHat.steps[10].active = true;
      openHat.steps[10].baseVelocity = 0.92;
      openHat.steps[10].hatOpenness = 0.95;

      auditLog.push({
        stepIndex: 2,
        trackId: openHat.id,
        action: 'INJECTED',
        ruleName: 'Hi-Hat Choke Group Mutual Exclusion',
        details: 'Placed offbeat open hats on Beat 1.3 and 3.3 with Choke Group 1 cut.',
        nature: 'REAL_MATH',
      });
    } else if (archetype.id === 'pierre_bourne') {
      openHat.steps[14].active = true;
      openHat.steps[14].baseVelocity = 0.9;
      openHat.steps[14].hatOpenness = 1.0;
    }
  }

  // 4. Kick / 808 Pocket Alignment
  if (kick) {
    kick.steps[0].active = true;
    kick.steps[0].baseVelocity = 0.98;

    kick.steps[7].active = true;
    kick.steps[7].baseVelocity = 0.92;

    kick.steps[10].active = true;
    kick.steps[10].baseVelocity = 0.94;

    auditLog.push({
      stepIndex: 0,
      trackId: kick.id,
      action: 'INJECTED',
      ruleName: 'Kick & 808 Pocket Alignment',
      details: 'Governed downbeat kick pocket on Step 1, Step 8, and Step 11.',
      nature: 'CALIBRATED_PROFILE',
    });
  }

  return {
    updatedTracks,
    auditLog,
    bpm: archetype.targetBpm,
  };
}
