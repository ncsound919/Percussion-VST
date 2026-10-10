import React from 'react';
import { PercussionStep, RollType, PitchRampCurve, HatArticulation } from '../types';
import { Sliders, Activity, Compass, Volume2, Sparkles, HandMetal } from 'lucide-react';

interface StepInspectorProps {
  stepIndex: number;
  trackName: string;
  step: PercussionStep;
  onChange: (updatedStep: PercussionStep) => void;
  onClose: () => void;
}

export const StepInspector: React.FC<StepInspectorProps> = ({
  stepIndex,
  trackName,
  step,
  onChange,
  onClose,
}) => {
  const update = (partial: Partial<PercussionStep>) => {
    onChange({ ...step, ...partial });
  };

  return (
    <div className="bg-[#1c2029] border border-[#2e3442] rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#2b3140] mb-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono-numbers text-xs font-bold">
            {stepIndex + 1}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Step {stepIndex + 1} Inspector</span>
              <span className="text-xs text-slate-400 font-normal">({trackName})</span>
            </h3>
            <p className="text-xs text-slate-400">Trap roll bursts, round-robin articulation &amp; pitch sweep curves</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-[#252b37] border border-[#343b4c] transition-colors"
        >
          Close Drawer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Roll Subdivisions & Live Drum Articulation */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 tracking-wide">
            <Activity className="w-3.5 h-3.5" />
            <span>SUBDIVISION / ROLL BURST</span>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1">Roll Type</label>
            <select
              value={step.rollType}
              onChange={(e) => update({ rollType: e.target.value as RollType })}
              className="w-full bg-[#14171e] border border-[#2f3647] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="none">No Roll (Single 16th Hit)</option>
              <option value="straight_32">1/32nd Straight (2 Hits)</option>
              <option value="straight_64">1/64th Straight (4 Hits)</option>
              <option value="triplet_32">1/32nd Triplet (3 Hits / 1:48)</option>
              <option value="triplet_64">1/64th Triplet (6 Hits / 1:96)</option>
            </select>
          </div>

          {/* Live Drum Articulation / Round-Robin Hand */}
          <div>
            <label className="text-xs text-slate-300 flex items-center gap-1 mb-1">
              <HandMetal className="w-3 h-3 text-cyan-400" />
              <span>Acoustic Hat Articulation</span>
            </label>
            <select
              value={step.articulation || 'auto_round_robin'}
              onChange={(e) => update({ articulation: e.target.value as HatArticulation })}
              className="w-full bg-[#14171e] border border-[#2f3647] rounded-lg px-3 py-1.5 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="auto_round_robin">Auto Round-Robin (Alternate L/R Hands)</option>
              <option value="tip">Tip Strike (Clean Surface Contact)</option>
              <option value="shank">Shank Strike (Heavy Edge Accent)</option>
              <option value="sizzle">Sizzle / Loose Cymbal</option>
              <option value="pedal">Pedal Foot Choke</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Trigger Probability</span>
              <span className="font-mono-numbers text-amber-400">{Math.round(step.probability * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={step.probability}
              onChange={(e) => update({ probability: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 bg-[#12141a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Step Velocity</span>
              <span className="font-mono-numbers text-amber-400">{Math.round(step.baseVelocity * 127)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.01"
              value={step.baseVelocity}
              onChange={(e) => update({ baseVelocity: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 bg-[#12141a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Column 2: Pitch Sweep Curve */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 tracking-wide">
            <Sliders className="w-3.5 h-3.5" />
            <span>PITCH SWEEP (-12 TO +12 SEMITONES)</span>
          </div>

          <div>
            <label className="text-xs text-slate-300 block mb-1">Curve Geometry</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#14171e] rounded-lg border border-[#2f3647]">
              {(['linear', 'exponential', 'logarithmic'] as PitchRampCurve[]).map((curve) => (
                <button
                  key={curve}
                  onClick={() => update({ pitchCurve: curve })}
                  className={`text-[11px] py-1 rounded transition-colors capitalize ${
                    step.pitchCurve === curve
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {curve}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Start Pitch</span>
                <span className="font-mono-numbers text-rose-400">
                  {step.startPitchOffset > 0 ? `+${step.startPitchOffset}` : step.startPitchOffset} st
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={step.startPitchOffset}
                onChange={(e) => update({ startPitchOffset: parseInt(e.target.value) })}
                className="w-full accent-rose-500 bg-[#12141a] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>End Pitch</span>
                <span className="font-mono-numbers text-rose-400">
                  {step.endPitchOffset > 0 ? `+${step.endPitchOffset}` : step.endPitchOffset} st
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={step.endPitchOffset}
                onChange={(e) => update({ endPitchOffset: parseInt(e.target.value) })}
                className="w-full accent-rose-500 bg-[#12141a] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => update({ startPitchOffset: 0, endPitchOffset: 0 })}
              className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-[#161a22] border border-[#2a303d]"
            >
              Reset Pitch
            </button>
            <button
              onClick={() => update({ startPitchOffset: 1, endPitchOffset: -5, rollType: 'straight_32' })}
              className="text-[11px] text-rose-300 hover:text-rose-200 px-2 py-1 rounded bg-rose-500/10 border border-rose-500/30 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Trap Pitch Drop
            </button>
            <button
              onClick={() => update({ startPitchOffset: -2, endPitchOffset: 6, rollType: 'straight_32' })}
              className="text-[11px] text-cyan-300 hover:text-cyan-200 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Upward Riser
            </button>
          </div>
        </div>

        {/* Column 3: Panning & Hat Openness */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 tracking-wide">
            <Compass className="w-3.5 h-3.5" />
            <span>PAN SPREAD &amp; ARTICULATION</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Pan Start</span>
                <span className="font-mono-numbers text-cyan-400">
                  {step.panStart === 0 ? 'C' : step.panStart < 0 ? `L${Math.round(-step.panStart * 100)}` : `R${Math.round(step.panStart * 100)}`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={step.panStart}
                onChange={(e) => update({ panStart: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 bg-[#12141a] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Pan End</span>
                <span className="font-mono-numbers text-cyan-400">
                  {step.panEnd === 0 ? 'C' : step.panEnd < 0 ? `L${Math.round(-step.panEnd * 100)}` : `R${Math.round(step.panEnd * 100)}`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={step.panEnd}
                onChange={(e) => update({ panEnd: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 bg-[#12141a] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-amber-400" />
                <span>Hi-Hat Openness Envelope</span>
              </span>
              <span className="font-mono-numbers text-amber-400">
                {step.hatOpenness < 0.2 ? 'Tight Closed' : step.hatOpenness < 0.5 ? 'Loose' : step.hatOpenness < 0.8 ? 'Half Open' : 'Full Open'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={step.hatOpenness}
              onChange={(e) => update({ hatOpenness: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 bg-[#12141a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Micro-Timing Offset</span>
              <span className="font-mono-numbers text-amber-400">{step.timingOffsetMs} ms</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={step.timingOffsetMs}
              onChange={(e) => update({ timingOffsetMs: parseInt(e.target.value) })}
              className="w-full accent-amber-500 bg-[#12141a] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
