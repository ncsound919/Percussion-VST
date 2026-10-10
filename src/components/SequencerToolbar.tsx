import React, { useState } from 'react';
import { InstrumentTrack, PercussionStep } from '../types';
import {
  applyStepFillPreset,
  nudgePatternSteps,
  generateEuclideanPattern,
  injectRollPresetToStep,
  applyVelocityCurve,
  applyQuickPatternPreset,
  duplicateBeat1ToAllBeats,
} from '../services/genreAlgorithms';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
  Wand2,
  Zap,
  Sliders,
  Copy,
  ChevronDown,
  Cpu,
} from 'lucide-react';

interface SequencerToolbarProps {
  activeTrack: InstrumentTrack;
  selectedStepIndex: number | null;
  onUpdateTrackSteps: (trackId: string, newSteps: PercussionStep[]) => void;
  onOpenRandomizer: () => void;
  onOpenAgent?: () => void;
}

export const SequencerToolbar: React.FC<SequencerToolbarProps> = ({
  activeTrack,
  selectedStepIndex,
  onUpdateTrackSteps,
  onOpenRandomizer,
  onOpenAgent,
}) => {
  const [showPatternMenu, setShowPatternMenu] = useState(false);
  const [showVelocityMenu, setShowVelocityMenu] = useState(false);
  const currentSteps = activeTrack.steps;

  // Handle Fill Presets
  const handleFill = (type: 'straight_16' | 'eighth' | 'quarter' | 'offbeat') => {
    const updated = applyStepFillPreset(type, currentSteps);
    onUpdateTrackSteps(activeTrack.id, updated);
  };

  // Handle Quick Pattern Presets
  const handlePatternPreset = (
    preset:
      | 'trap_2step'
      | 'trap_16ths'
      | 'wheezy_wave'
      | 'southside_drop'
      | 'pierre_bounce'
      | 'dilla_walk'
      | 'purdie_shuffle'
      | 'detroit_taps'
      | 'offbeat_open'
  ) => {
    const updated = applyQuickPatternPreset(preset, currentSteps);
    onUpdateTrackSteps(activeTrack.id, updated);
    setShowPatternMenu(false);
  };

  // Handle Velocity Curve Presets
  const handleVelocityCurve = (
    curve:
      | 'accent_4ths'
      | 'hand_alternation'
      | 'crescendo'
      | 'decrescendo'
      | 'humanize_flutter'
  ) => {
    const updated = applyVelocityCurve(curve, currentSteps);
    onUpdateTrackSteps(activeTrack.id, updated);
    setShowVelocityMenu(false);
  };

  // Duplicate Beat 1 across Beats 2, 3, 4
  const handleDuplicateBeat1 = () => {
    const updated = duplicateBeat1ToAllBeats(currentSteps);
    onUpdateTrackSteps(activeTrack.id, updated);
  };

  // Handle Nudge
  const handleNudge = (direction: -1 | 1) => {
    const updated = nudgePatternSteps(currentSteps, direction);
    onUpdateTrackSteps(activeTrack.id, updated);
  };

  // Handle Euclidean Generator
  const handleEuclidean = (pulses: number) => {
    const mask = generateEuclideanPattern(pulses, 16);
    const updated = currentSteps.map((step, idx) => ({
      ...step,
      active: mask[idx],
      baseVelocity: mask[idx] ? (idx % 2 === 0 ? 0.9 : 0.7) : step.baseVelocity,
    }));
    onUpdateTrackSteps(activeTrack.id, updated);
  };

  // Invert Steps
  const handleInvert = () => {
    const updated = currentSteps.map((step) => ({
      ...step,
      active: !step.active,
      baseVelocity: !step.active ? 0.75 : step.baseVelocity,
    }));
    onUpdateTrackSteps(activeTrack.id, updated);
  };

  // Clear Track
  const handleClear = () => {
    const updated = currentSteps.map((step) => ({
      ...step,
      active: false,
      rollType: 'none' as const,
      startPitchOffset: 0,
      endPitchOffset: 0,
    }));
    onUpdateTrackSteps(activeTrack.id, updated);
  };

  // Inject Roll onto selected step (or step 6 if none selected)
  const handleInjectRoll = (
    type: 'trap_drop' | 'drill_hop' | 'buzz_64' | 'triplet_stutter' | 'riser_up'
  ) => {
    const targetIdx = selectedStepIndex !== null ? selectedStepIndex : 6;
    const updated = [...currentSteps];
    updated[targetIdx] = injectRollPresetToStep(type, updated[targetIdx]);
    onUpdateTrackSteps(activeTrack.id, updated);
  };

  return (
    <div className="bg-[#12141a] border border-[#212633] rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-sm">
      {/* 1. Quick Pattern & Fill Presets */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Quick Fill</span>
        </span>

        {/* Quick Pattern Presets Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPatternMenu(!showPatternMenu)}
            className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Pattern Preset...</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showPatternMenu && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-[#181c25] border border-[#293142] rounded-xl shadow-2xl py-1 z-30">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase border-b border-[#212836]">
                Trap &amp; Live Rhythm Presets
              </div>
              {[
                { id: 'trap_2step', label: 'Trap 2-Step (8th notes)' },
                { id: 'trap_16ths', label: 'Continuous 16ths' },
                { id: 'wheezy_wave', label: 'Wheezy 32T Wave Rolls' },
                { id: 'southside_drop', label: 'Southside -5st Drop' },
                { id: 'pierre_bounce', label: 'Pierre Melodic Skip' },
                { id: 'dilla_walk', label: 'J Dilla Shank/Tip Walk' },
                { id: 'purdie_shuffle', label: 'Purdie Triplet Shuffle' },
                { id: 'detroit_taps', label: 'Detroit Michigan Taps' },
                { id: 'offbeat_open', label: 'Offbeat Open Hats' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePatternPreset(p.id as any)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-amber-500 hover:text-slate-950 transition-colors whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step Fill Presets */}
        <button
          onClick={() => handleFill('straight_16')}
          className="px-2.5 py-1 rounded-md bg-[#191d26] hover:bg-[#222734] hover:text-amber-300 text-slate-300 border border-[#272e3d] transition-colors whitespace-nowrap shrink-0"
          title="Fill all 16 steps with alternating accents"
        >
          16ths
        </button>
        <button
          onClick={() => handleFill('eighth')}
          className="px-2.5 py-1 rounded-md bg-[#191d26] hover:bg-[#222734] hover:text-amber-300 text-slate-300 border border-[#272e3d] transition-colors whitespace-nowrap shrink-0"
          title="Fill 8th notes on even steps"
        >
          8ths
        </button>
        <button
          onClick={() => handleFill('offbeat')}
          className="px-2.5 py-1 rounded-md bg-[#191d26] hover:bg-[#222734] hover:text-amber-300 text-slate-300 border border-[#272e3d] transition-colors whitespace-nowrap shrink-0"
          title="Fill classic syncopated offbeats"
        >
          Offbeats
        </button>

        {/* Duplicate Beat 1 */}
        <button
          onClick={handleDuplicateBeat1}
          className="px-2.5 py-1 rounded-md bg-[#191d26] hover:bg-[#222734] hover:text-cyan-300 text-slate-300 border border-[#272e3d] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          title="Duplicate Beat 1 (steps 1–4) across all 4 beats"
        >
          <Copy className="w-3 h-3 text-cyan-400" />
          <span>Dup Beat 1</span>
        </button>

        {/* Velocity Curve Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowVelocityMenu(!showVelocityMenu)}
            className="px-2.5 py-1 rounded-md bg-[#191d26] hover:bg-[#222734] hover:text-emerald-300 text-slate-300 border border-[#272e3d] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            <Sliders className="w-3 h-3 text-emerald-400" />
            <span>Velocity Dynamics</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {showVelocityMenu && (
            <div className="absolute left-0 top-full mt-1 w-48 bg-[#181c25] border border-[#293142] rounded-xl shadow-2xl py-1 z-30">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase border-b border-[#212836]">
                Velocity Envelopes
              </div>
              {[
                { id: 'accent_4ths', label: 'Accent Quarter Notes' },
                { id: 'hand_alternation', label: 'L/R Hand Alternation' },
                { id: 'crescendo', label: 'Crescendo (Ramp Up)' },
                { id: 'decrescendo', label: 'Decrescendo (Ramp Down)' },
                { id: 'humanize_flutter', label: 'Humanize Flutter (±12%)' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVelocityCurve(v.id as any)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-emerald-500 hover:text-slate-950 transition-colors whitespace-nowrap"
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-[#212735] mx-1" />

        {/* Euclidean Rhythm Presets */}
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1">
          Euclid:
        </span>
        <button
          onClick={() => handleEuclidean(3)}
          className="px-2 py-1 rounded-md bg-[#191d26] hover:bg-[#222734] text-slate-300 border border-[#272e3d] font-mono-numbers text-xs"
          title="Distribute 3 pulses over 16 steps"
        >
          E(3)
        </button>
        <button
          onClick={() => handleEuclidean(5)}
          className="px-2 py-1 rounded-md bg-[#191d26] hover:bg-[#222734] text-slate-300 border border-[#272e3d] font-mono-numbers text-xs"
          title="Distribute 5 pulses over 16 steps"
        >
          E(5)
        </button>
        <button
          onClick={() => handleEuclidean(7)}
          className="px-2 py-1 rounded-md bg-[#191d26] hover:bg-[#222734] text-slate-300 border border-[#272e3d] font-mono-numbers text-xs"
          title="Distribute 7 pulses over 16 steps"
        >
          E(7)
        </button>
      </div>

      {/* 2. Roll Injector Quick Actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide px-1 flex items-center gap-1">
          <Wand2 className="w-3 h-3 text-rose-400" />
          <span>Roll Inject:</span>
        </span>

        <button
          onClick={() => handleInjectRoll('trap_drop')}
          className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors whitespace-nowrap shrink-0"
          title="Inject 32nd roll with -5st pitch drop"
        >
          Trap Drop (-5st)
        </button>
        <button
          onClick={() => handleInjectRoll('drill_hop')}
          className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors whitespace-nowrap shrink-0"
          title="Inject Drill triplet slide roll"
        >
          Drill Slide
        </button>
        <button
          onClick={() => handleInjectRoll('buzz_64')}
          className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors whitespace-nowrap shrink-0"
          title="Inject high-speed 64th buzz roll"
        >
          64th Buzz
        </button>
        <button
          onClick={() => handleInjectRoll('riser_up')}
          className="px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors whitespace-nowrap shrink-0"
          title="Inject upward pitch riser (+7st)"
        >
          Riser (+7st)
        </button>
      </div>

      {/* 3. Nudge & Pattern Modifiers */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleNudge(-1)}
          className="p-1 rounded-md bg-[#191d26] hover:bg-[#222734] text-slate-300 border border-[#272e3d] transition-colors"
          title="Nudge pattern 1 step left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleNudge(1)}
          className="p-1 rounded-md bg-[#191d26] hover:bg-[#222734] text-slate-300 border border-[#272e3d] transition-colors"
          title="Nudge pattern 1 step right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleInvert}
          className="px-2 py-1 rounded-md bg-[#191d26] hover:bg-[#222734] text-slate-300 border border-[#272e3d] transition-colors whitespace-nowrap shrink-0"
          title="Invert active/inactive steps"
        >
          Invert
        </button>

        <button
          onClick={handleClear}
          className="p-1 rounded-md bg-[#191d26] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#272e3d] transition-colors"
          title="Clear all steps in active track"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#212735] mx-1" />

        {/* Global Smart Randomizer Trigger Button */}
        <button
          onClick={onOpenRandomizer}
          className="px-2.5 py-1 rounded-md bg-[#181d26] hover:bg-[#232834] text-slate-300 border border-[#272e3d] text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Randomizer</span>
        </button>

        {/* Deterministic Governance Agent Trigger */}
        {onOpenAgent && (
          <button
            onClick={onOpenAgent}
            className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap shrink-0"
            title="Open Deterministic Mainstream Programming Agent"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Agent</span>
          </button>
        )}
      </div>
    </div>
  );
};
