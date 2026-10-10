import React, { useState } from 'react';
import { InstrumentTrack, RandomizerParams, SectorId } from '../types';
import { Dices, Lock, Unlock, X, Sparkles, Sliders, Layers } from 'lucide-react';

interface RandomizerModalProps {
  tracks: InstrumentTrack[];
  currentSectorId: SectorId;
  onApplyRandomization: (params: RandomizerParams, targetSectorId: SectorId) => void;
  onApply4SectorProgression?: (params: RandomizerParams) => void;
  onClose: () => void;
}

export const RandomizerModal: React.FC<RandomizerModalProps> = ({
  tracks,
  currentSectorId,
  onApplyRandomization,
  onApply4SectorProgression,
  onClose,
}) => {
  const [style, setStyle] = useState<RandomizerParams['style']>('atlanta_trap');
  const [rollDensity, setRollDensity] = useState<RandomizerParams['rollDensity']>('medium');
  const [pitchDirection, setPitchDirection] = useState<RandomizerParams['pitchDirection']>('down');
  const [pitchSweepChance, setPitchSweepChance] = useState<number>(0.65);
  const [velocityDynamicRange, setVelocityDynamicRange] = useState<RandomizerParams['velocityDynamicRange']>('medium');
  const [openHatStyle, setOpenHatStyle] = useState<RandomizerParams['openHatStyle']>('turnarounds');
  const [lockedTrackIds, setLockedTrackIds] = useState<string[]>([]);
  const [targetSectorId, setTargetSectorId] = useState<SectorId>(currentSectorId);
  const [is4SectorProgression, setIs4SectorProgression] = useState<boolean>(false);

  const toggleTrackLock = (trackId: string) => {
    setLockedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleExecute = () => {
    const params: RandomizerParams = {
      style,
      rollDensity,
      pitchDirection,
      pitchSweepChance,
      velocityDynamicRange,
      openHatStyle,
      lockedTrackIds,
      generationMode: is4SectorProgression ? 'four_sector_progression' : 'single_sector',
    };

    if (is4SectorProgression && onApply4SectorProgression) {
      onApply4SectorProgression(params);
    } else {
      onApplyRandomization(params, targetSectorId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#2e3444] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden hardware-chassis flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#262c3a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Intelligent Musical Groove Randomizer</span>
              </h2>
              <p className="text-xs text-slate-400">Constrained algorithmic generator with mainstream trap &amp; live shuffle rules</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#252b38] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Generation Scope Mode */}
          <div className="bg-[#13151b] p-3 rounded-xl border border-[#242937]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400">Generation Target Mode</span>
              <button
                type="button"
                onClick={() => setIs4SectorProgression(!is4SectorProgression)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                  is4SectorProgression
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-[#1a1e28] text-slate-400 border-[#2a3040] hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>{is4SectorProgression ? '4-Sector Song Arrangement (A-D)' : 'Single Sector Target'}</span>
              </button>
            </div>

            {!is4SectorProgression ? (
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">
                  Write Randomization Result Into Sector:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as SectorId[]).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTargetSectorId(sec)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                        targetSectorId === sec
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-[#1b1f2a] text-slate-300 border-[#2d3446] hover:bg-[#222736]'
                      }`}
                    >
                      SECTOR {sec}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-cyan-300/90 bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/30 leading-relaxed">
                Generates a coherent 4-part arrangement: Sector A (Clean Intro), Sector B (Main Verse), Sector C (Build Turnaround), and Sector D (Hook Skitter).
              </div>
            )}
          </div>

          {/* Musical Groove Style Engine */}
          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-1.5">
              Groove Style Engine
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'atlanta_trap', label: 'Atlanta Trap' },
                { id: 'wheezy_wave', label: 'Wheezy Wave' },
                { id: 'southside_808', label: 'Southside 808' },
                { id: 'melodic_trap', label: 'Melodic Bounce' },
                { id: 'rage_trap', label: 'Rage Hyper' },
                { id: 'murda_bounce', label: 'Murda Bounce' },
                { id: 'metro_dark', label: 'Metro Dark' },
                { id: 'jersey_club', label: 'Jersey Club' },
                { id: 'drill', label: 'UK Drill Hop' },
                { id: 'boombap', label: 'Boom Bap Dilla' },
                { id: 'shuffle', label: 'Purdie Shuffle' },
                { id: 'garage', label: '2-Step Garage' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStyle(item.id as RandomizerParams['style'])}
                  className={`py-2 px-2 rounded-lg text-xs transition-colors border ${
                    style === item.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                      : 'bg-[#15171e] text-slate-400 border-[#262c3b] hover:bg-[#1d212b]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Roll Density & Pitch Sweep Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-slate-200 mb-1">
                <span>Roll Burst Density</span>
                <span className="font-mono-numbers text-amber-400 capitalize">{rollDensity}</span>
              </div>
              <select
                value={rollDensity}
                onChange={(e) => setRollDensity(e.target.value as RandomizerParams['rollDensity'])}
                className="w-full bg-[#13151b] border border-[#2a3040] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="none">None (No Rolls)</option>
                <option value="sparse">Sparse (1–2 occasional fills)</option>
                <option value="medium">Medium (3–4 rolls across 16 steps)</option>
                <option value="dense">Dense (Frequent 32nd/64th bursts)</option>
                <option value="extreme">Extreme Trap Skitter (Yeat / Metro)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-200 mb-1">
                <span>Pitch Sweep Direction</span>
                <span className="font-mono-numbers text-rose-400 capitalize">{pitchDirection}</span>
              </div>
              <select
                value={pitchDirection}
                onChange={(e) => setPitchDirection(e.target.value as RandomizerParams['pitchDirection'])}
                className="w-full bg-[#13151b] border border-[#2a3040] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="down">Downward Drops (-4st to -12st)</option>
                <option value="up">Upward Risers (+3st to +8st)</option>
                <option value="bidirectional">Bi-directional (Drops &amp; Risers)</option>
                <option value="none">Flat (No Pitch Modification)</option>
              </select>
            </div>
          </div>

          {/* Pitch Sweep Chance & Dynamic Velocity Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-slate-200 mb-1">
                <span>Pitch Sweep Probability</span>
                <span className="font-mono-numbers text-rose-400">{Math.round(pitchSweepChance * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={pitchSweepChance}
                onChange={(e) => setPitchSweepChance(parseFloat(e.target.value))}
                className="w-full accent-rose-500 bg-[#13151b] h-2 rounded-lg appearance-none cursor-pointer mt-2"
              />
            </div>

            <div>
              <label className="text-xs text-slate-200 block mb-1">Velocity Dynamics</label>
              <select
                value={velocityDynamicRange}
                onChange={(e) => setVelocityDynamicRange(e.target.value as RandomizerParams['velocityDynamicRange'])}
                className="w-full bg-[#13151b] border border-[#2a3040] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="tight">Tight (Subtle human variance)</option>
                <option value="medium">Medium (Standard shank/tip dynamics)</option>
                <option value="wide">Wide (Dramatic ghost notes &amp; accents)</option>
              </select>
            </div>
          </div>

          {/* Open Hat Placement */}
          <div>
            <label className="text-xs text-slate-200 block mb-1">Open Hat Placement</label>
            <select
              value={openHatStyle}
              onChange={(e) => setOpenHatStyle(e.target.value as RandomizerParams['openHatStyle'])}
              className="w-full bg-[#13151b] border border-[#2a3040] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="offbeats">Strict Offbeats (2, 6, 10, 14)</option>
              <option value="turnarounds">Turnarounds Only (Step 14/15)</option>
              <option value="sparse">Sparse Accents</option>
              <option value="none">No Open Hats</option>
            </select>
          </div>

          {/* Track Lock Safeguards */}
          <div className="bg-[#13151b] p-3 rounded-xl border border-[#242937]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>Track Locks (Protect specific instruments from being modified)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono-numbers">
                {lockedTrackIds.length} locked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tracks.map((track) => {
                const isLocked = lockedTrackIds.includes(track.id);

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => toggleTrackLock(track.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between border transition-colors ${
                      isLocked
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                        : 'bg-[#1b1f2a] text-slate-400 border-[#282f40] hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{track.name}</span>
                    {isLocked ? <Lock className="w-3 h-3 text-cyan-400 shrink-0 ml-1" /> : <Unlock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#262c3a] bg-[#12141a] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 bg-[#1b1f29] border border-[#2b3242]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {is4SectorProgression
                ? 'Generate 4-Sector Song Progression (A-D)'
                : `Generate Groove into Sector ${targetSectorId}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
