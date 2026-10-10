import React from 'react';
import { InstrumentTrack, PercussionStep } from '../types';
import { Headphones, Music, Sliders } from 'lucide-react';

interface SequencerGridProps {
  tracks: InstrumentTrack[];
  activeTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onToggleStep: (trackId: string, stepIndex: number) => void;
  onInspectStep: (trackId: string, stepIndex: number) => void;
  onCycleStepRoll?: (trackId: string, stepIndex: number) => void;
  selectedStepIndex: number | null;
  currentPlayheadStep: number;
  onAuditionTrack: (track: InstrumentTrack) => void;
  onUpdateTrack: (trackId: string, partial: Partial<InstrumentTrack>) => void;
  onOpenSoundBrowserForTrack: (trackId: string) => void;
}

// Vintage 808/909 step key color tones for each beat block
const BEAT_PALETTES = [
  {
    name: 'Beat 1',
    inactiveBg: 'bg-[#2a1d1d] hover:bg-[#382626]',
    inactiveBorder: 'border-[#4a2e2e]',
    activeBg: 'bg-gradient-to-b from-rose-600 to-rose-700 text-white border-rose-500',
    ledActive: 'bg-rose-400 border-rose-300 led-red-glow',
    accentText: 'text-rose-400',
  },
  {
    name: 'Beat 2',
    inactiveBg: 'bg-[#29221a] hover:bg-[#382e22]',
    inactiveBorder: 'border-[#4a3b2b]',
    activeBg: 'bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 border-amber-400',
    ledActive: 'bg-amber-300 border-amber-200 led-amber-glow',
    accentText: 'text-amber-400',
  },
  {
    name: 'Beat 3',
    inactiveBg: 'bg-[#25251b] hover:bg-[#353523]',
    inactiveBorder: 'border-[#45452d]',
    activeBg: 'bg-gradient-to-b from-yellow-500 to-yellow-600 text-slate-950 border-yellow-400',
    ledActive: 'bg-yellow-300 border-yellow-200 led-amber-glow',
    accentText: 'text-yellow-400',
  },
  {
    name: 'Beat 4',
    inactiveBg: 'bg-[#1f242c] hover:bg-[#29303b]',
    inactiveBorder: 'border-[#333c4a]',
    activeBg: 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-950 border-white',
    ledActive: 'bg-white border-slate-200 led-cyan-glow',
    accentText: 'text-slate-300',
  },
];

export const SequencerGrid: React.FC<SequencerGridProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  onToggleStep,
  onInspectStep,
  onCycleStepRoll,
  selectedStepIndex,
  currentPlayheadStep,
  onAuditionTrack,
  onUpdateTrack,
  onOpenSoundBrowserForTrack,
}) => {
  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];

  const getRollBadge = (step: PercussionStep) => {
    switch (step.rollType) {
      case 'straight_32': return '32nd';
      case 'straight_64': return '64th';
      case 'triplet_32': return '32T';
      case 'triplet_64': return '64T';
      default: return null;
    }
  };

  const handleRollBadgeClick = (e: React.MouseEvent, stepIndex: number) => {
    e.stopPropagation();
    if (onCycleStepRoll) {
      onCycleStepRoll(activeTrack.id, stepIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Modular Voice Rack Enclosure (Chassis) */}
      <div className="bg-[#0b0c10] border border-[#222838] rounded-2xl p-3 shadow-2xl relative overflow-hidden">
        {/* Top Chassis Rack Rail with mounting screws and bus status */}
        <div className="flex items-center justify-between px-3 py-1.5 mb-3 bg-gradient-to-r from-[#11141c] via-[#161a25] to-[#11141c] border border-[#1e2330] rounded-xl text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 led-green-glow" />
              <span className="text-[11px] font-bold text-slate-200 tracking-wider">
                SYS-700 MODULAR VOICE RACK
              </span>
            </div>
            <span className="hidden sm:inline text-[10px] text-slate-400 font-mono-numbers">
              7-CH 500-SERIES CHASSIS · 24-BIT / 96KHZ BUS
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="hidden md:inline font-mono-numbers">
              PATCH: <span className="text-amber-400 font-semibold">{activeTrack.name.toUpperCase()}</span>
            </span>
            <span className="text-slate-400 text-[10px]">
              Tap module to patch
            </span>
          </div>
        </div>

        {/* 7 Modular Channel Strips Bay */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {tracks.map((track, trackIdx) => {
            const isSelected = track.id === activeTrackId;
            const activeStepCount = track.steps.filter((s) => s.active).length;
            const isHitNow = currentPlayheadStep >= 0 && track.steps[currentPlayheadStep]?.active;
            const isAcousticRR = Boolean(track.roundRobinKit || (track.roundRobinBuffers && track.roundRobinBuffers.length > 0));

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={`rounded-xl border transition-all cursor-pointer relative select-none flex flex-col justify-between p-2.5 ${
                  isSelected
                    ? 'hardware-strip-active border-amber-500/80 ring-1 ring-amber-500/40'
                    : 'hardware-strip-panel border-[#232938] hover:border-[#343e54]'
                }`}
              >
                {/* Top Faceplate Mounting Rail with Machine Screws & Module Code */}
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#1c212e] mb-2">
                    <div className="hardware-screw" title="Rack mount bolt" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono-numbers text-slate-400 font-semibold tracking-wider">
                        MOD-{String(trackIdx + 1).padStart(2, '0')}
                      </span>
                      {/* Hardware Signal Jewel LED */}
                      <span
                        title={isHitNow ? 'Signal Active' : isSelected ? 'Module Selected' : 'Standby'}
                        className={`w-2 h-2 rounded-full border transition-all ${
                          isHitNow
                            ? 'bg-emerald-400 border-emerald-200 led-green-glow'
                            : isSelected
                            ? 'bg-amber-400 border-amber-200 led-amber-glow'
                            : 'bg-[#101418] border-[#222a36]'
                        }`}
                      />
                    </div>
                    <div className="hardware-screw hardware-screw-alt" title="Rack mount bolt" />
                  </div>

                  {/* Stamped Instrument Title & Specifications */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black tracking-tight truncate ${
                          isSelected ? 'text-amber-400' : 'text-slate-100'
                        }`}
                      >
                        {track.name}
                      </span>
                      {track.chokeGroup > 0 ? (
                        <span className="text-[9px] px-1 py-0.2 rounded font-mono-numbers font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          CHK {track.chokeGroup}
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono-numbers text-slate-400">
                          FREE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono-numbers">MID #{track.midiNote}</span>
                      {isAcousticRR && (
                        <span className="text-[9px] font-mono-numbers text-cyan-400 flex items-center gap-1 font-medium">
                          <span className="w-1 h-1 rounded-full bg-cyan-400" />
                          RR-KIT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 16-Step Pattern Micro-LED Matrix Preview */}
                  <div
                    title="16-Step Pattern Activity (Click to inspect)"
                    className="bg-[#090b10] border border-[#1a1f2b] rounded-lg p-1.5 mb-2.5"
                  >
                    <div className="flex items-center justify-between mb-1 text-[9px] font-mono-numbers text-slate-400">
                      <span>PATTERN</span>
                      <span className="text-slate-300 font-semibold">{activeStepCount}/16</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 1, 2, 3].map((bIdx) => (
                        <div key={bIdx} className="flex items-center justify-between gap-0.5">
                          {[0, 1, 2, 3].map((sIdx) => {
                            const stepNumber = bIdx * 4 + sIdx;
                            const st = track.steps[stepNumber];
                            const isCursor = currentPlayheadStep === stepNumber;
                            const hasHit = st?.active;
                            const isRoll = hasHit && st.rollType !== 'none';

                            return (
                              <span
                                key={sIdx}
                                className={`w-1.5 h-1.5 rounded-xs transition-all ${
                                  isCursor
                                    ? 'bg-white shadow-[0_0_4px_#fff] scale-125'
                                    : hasHit
                                    ? isRoll
                                      ? 'bg-rose-500 shadow-[0_0_3px_#f43f5e]'
                                      : 'bg-amber-400 shadow-[0_0_3px_#f59e0b]'
                                    : 'bg-[#151922]'
                                }`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactile Hardware Level Trim Fader */}
                  <div className="bg-[#0e1017] border border-[#1b202c] rounded-lg p-1.5 mb-2.5">
                    <div className="flex items-center justify-between text-[9px] font-mono-numbers text-slate-400 mb-1">
                      <span>TRIM</span>
                      <span className="text-slate-200 font-bold">
                        {Math.round(track.volume * 100)}%
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={track.volume}
                        onChange={(e) => {
                          e.stopPropagation();
                          onUpdateTrack(track.id, { volume: parseFloat(e.target.value) });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title={`Gain Trim: ${Math.round(track.volume * 100)}%`}
                        className="w-full h-1.5 bg-[#08090d] rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-hidden"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono-numbers text-slate-400 mt-1">
                      <span>-∞</span>
                      <span>0dB</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Console Push-Buttons & Inset Cartridge Bezel */}
                <div>
                  {/* Console Action Buttons: SOLO, MUTE, CUE */}
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <button
                      type="button"
                      title={track.solo ? 'Release Solo' : 'Solo Channel (Isolate)'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTrack(track.id, { solo: !track.solo });
                      }}
                      className={`h-6 rounded text-[10px] font-mono-numbers font-black transition-all flex items-center justify-center hardware-button ${
                        track.solo
                          ? 'bg-amber-400 text-slate-950 border-amber-300 led-amber-glow shadow-sm'
                          : 'text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
                      }`}
                    >
                      SOLO
                    </button>

                    <button
                      type="button"
                      title={track.mute ? 'Unmute Channel' : 'Mute Channel'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTrack(track.id, { mute: !track.mute });
                      }}
                      className={`h-6 rounded text-[10px] font-mono-numbers font-black transition-all flex items-center justify-center hardware-button ${
                        track.mute
                          ? 'bg-rose-600 text-white border-rose-400 led-red-glow shadow-sm'
                          : 'text-slate-400 hover:text-rose-400 hover:border-rose-500/40'
                      }`}
                    >
                      MUTE
                    </button>

                    <button
                      type="button"
                      title="Audition Voice Sample"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAuditionTrack(track);
                      }}
                      className="h-6 rounded text-[10px] font-mono-numbers font-bold text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all flex items-center justify-center hardware-button"
                    >
                      <Headphones className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Inset ROM Sample Cartridge Bezel */}
                  <button
                    type="button"
                    title={`Assigned: ${track.sampleName} (Click to change)`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSoundBrowserForTrack(track.id);
                    }}
                    className="w-full bg-[#080a0f] hover:bg-[#121622] border border-[#1c2230] hover:border-cyan-500/50 rounded-lg px-2 py-1 flex items-center justify-between text-[10px] text-slate-400 hover:text-cyan-300 transition-all text-left group"
                  >
                    <span className="truncate max-w-[85px] font-mono-numbers font-medium">
                      {track.sampleName}
                    </span>
                    <Music className="w-2.5 h-2.5 shrink-0 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                  </button>

                  {/* Bottom Faceplate Mounting Screws */}
                  <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-[#181d29]">
                    <div className="hardware-screw" title="Chassis screw" />
                    <span className="text-[8px] font-mono-numbers text-slate-400 uppercase tracking-widest">
                      CH-0{trackIdx + 1}
                    </span>
                    <div className="hardware-screw hardware-screw-alt" title="Chassis screw" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Tactile Stepped Button 16-Step Grid (Grouped by Quarter-Note Beats) */}
      <div className="bg-[#14161c] border border-[#232834] rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1f2430]">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-amber-400 tracking-wider">
              {activeTrack.name} Pattern
            </span>
            <span className="text-slate-400">· 16-Step Vintage Rhythm Grid</span>
          </div>

          {/* Clean unboxed legend */}
          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Active Hit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Roll / Slide
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Playhead
            </span>
          </div>
        </div>

        {/* 16 Steps split into 4 beat blocks with physical spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((beatIdx) => {
            const palette = BEAT_PALETTES[beatIdx];

            return (
              <div
                key={beatIdx}
                className="bg-[#0f1116] p-2 rounded-xl border border-[#1e232e]"
              >
                <div className="text-[10px] font-mono-numbers text-slate-400 font-semibold mb-2 px-1 flex justify-between">
                  <span className={palette.accentText}>BEAT {beatIdx + 1}</span>
                  <span className="text-slate-400">
                    Steps {beatIdx * 4 + 1}–{beatIdx * 4 + 4}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((subIdx) => {
                    const stepIndex = beatIdx * 4 + subIdx;
                    const step = activeTrack.steps[stepIndex];
                    const isActive = step?.active;
                    const isCurrentPlayhead = currentPlayheadStep === stepIndex;
                    const isSelected = selectedStepIndex === stepIndex;
                    const rollBadge = step ? getRollBadge(step) : null;
                    const hasPitchMod =
                      step && (step.startPitchOffset !== 0 || step.endPitchOffset !== 0);

                    // Dynamic opacity based on velocity
                    const velocityAlpha = step ? 0.4 + 0.6 * step.baseVelocity : 0.8;

                    return (
                      <div key={stepIndex} className="flex flex-col gap-1 items-center">
                        {/* Vintage Drum Machine Tactile Stepped Key */}
                        <button
                          onClick={() => onToggleStep(activeTrack.id, stepIndex)}
                          className={`w-full h-16 rounded-lg flex flex-col justify-between p-1.5 border relative transition-all stepped-key select-none ${
                            isCurrentPlayhead
                              ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0f1116]'
                              : ''
                          }`}
                          style={{
                            opacity: isActive ? velocityAlpha : 1,
                          }}
                        >
                          {/* Top Row: Step Index & Hardware Jewel LED */}
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={`text-[10px] font-mono-numbers font-bold ${
                                isActive ? 'text-slate-950 font-black' : 'text-slate-400'
                              }`}
                            >
                              {stepIndex + 1}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full border transition-all ${
                                isCurrentPlayhead
                                  ? 'bg-white border-white led-amber-glow animate-pulse'
                                  : isActive
                                  ? palette.ledActive
                                  : 'bg-[#101318] border-[#29303d]'
                              }`}
                            />
                          </div>

                          {/* Middle: Articulation or Pitch Shift Indicator */}
                          <div className="w-full flex justify-center text-[9px] font-mono-numbers font-semibold leading-tight">
                            {hasPitchMod ? (
                              <span
                                className={
                                  isActive ? 'text-slate-950 underline' : 'text-rose-400'
                                }
                              >
                                {step.startPitchOffset > 0
                                  ? `+${step.startPitchOffset}`
                                  : step.startPitchOffset}
                                st
                              </span>
                            ) : isActive && step.hatOpenness > 0.4 ? (
                              <span className="text-amber-950 font-bold">OPEN</span>
                            ) : isActive && step.articulation === 'shank' ? (
                              <span className="text-slate-900 font-bold">SHANK</span>
                            ) : isActive && step.articulation === 'sizzle' ? (
                              <span className="text-slate-900 font-bold">SIZZLE</span>
                            ) : null}
                          </div>

                          {/* Bottom: Roll Sub-division (interactive click) or Velocity */}
                          <div className="w-full flex justify-center">
                            {rollBadge ? (
                              <span
                                onClick={(e) => handleRollBadgeClick(e, stepIndex)}
                                title="Click to cycle roll subdivision"
                                className="text-[9px] px-1 py-0.2 rounded font-black bg-rose-600 hover:bg-rose-500 text-white shadow-sm font-mono-numbers cursor-pointer active:scale-90 transition-transform"
                              >
                                {rollBadge}
                              </span>
                            ) : (
                              <span
                                onClick={(e) => {
                                  if (isActive) handleRollBadgeClick(e, stepIndex);
                                }}
                                className={`text-[8px] font-mono-numbers ${
                                  isActive
                                    ? 'text-slate-900/80 hover:text-slate-950 cursor-pointer font-bold'
                                    : 'text-slate-400'
                                }`}
                              >
                                {isActive ? Math.round(step.baseVelocity * 127) : '—'}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Step Fine Edit Button */}
                        <button
                          title={`Fine inspect Step ${stepIndex + 1}`}
                          onClick={() => onInspectStep(activeTrack.id, stepIndex)}
                          className={`text-[10px] px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d26]'
                          }`}
                        >
                          <Sliders className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
