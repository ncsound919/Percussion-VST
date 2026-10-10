import React, { useState, useMemo } from 'react';
import { InstrumentTrack, SectorId } from '../types';
import {
  MAINSTREAM_ARCHETYPES,
  MainstreamArchetypeId,
  auditPattern,
  enforceGovernance,
  generateGovernedPattern,
  GovernanceDecision,
} from '../services/deterministicAgent';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  RefreshCw,
  X,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface DeterministicAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: InstrumentTrack[];
  activeTrackId: string;
  onUpdateTracks: (newTracks: InstrumentTrack[]) => void;
  currentSectorId: SectorId;
  onChangeBpm: (bpm: number) => void;
}

export const DeterministicAgentModal: React.FC<DeterministicAgentModalProps> = ({
  isOpen,
  onClose,
  tracks,
  activeTrackId,
  onUpdateTracks,
  currentSectorId,
  onChangeBpm,
}) => {
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<MainstreamArchetypeId>('metro_boomin');
  const [seed, setSeed] = useState<number>(42);
  const [applyScope, setApplyScope] = useState<'active_only' | 'full_rack'>('full_rack');
  const [liveLog, setLiveLog] = useState<GovernanceDecision[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const selectedArchetype = MAINSTREAM_ARCHETYPES[selectedArchetypeId];

  // Perform live deterministic audit of the active pattern
  const auditReport = useMemo(() => {
    return auditPattern(tracks, selectedArchetypeId, activeTrackId);
  }, [tracks, selectedArchetypeId, activeTrackId]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // 1. One-click enforce governance to repair violations
  const handleEnforceGovernance = () => {
    const { updatedTracks, auditLog } = enforceGovernance(tracks, selectedArchetypeId, activeTrackId);
    onUpdateTracks(updatedTracks);
    setLiveLog(auditLog);
    showFeedback(`Enforced ${selectedArchetype.name} governance rules across pattern.`);
  };

  // 2. Generate new deterministic pattern from seed and archetype
  const handleGenerateFromArchetype = () => {
    const { updatedTracks, auditLog, bpm } = generateGovernedPattern(
      selectedArchetypeId,
      seed,
      tracks,
      applyScope === 'active_only' ? activeTrackId : undefined
    );

    if (applyScope === 'active_only') {
      const activeGenTrack = updatedTracks.find((t) => t.id === activeTrackId);
      if (activeGenTrack) {
        onUpdateTracks(
          tracks.map((t) => (t.id === activeTrackId ? { ...t, steps: activeGenTrack.steps } : t))
        );
      }
    } else {
      onUpdateTracks(updatedTracks);
      onChangeBpm(bpm);
    }

    setLiveLog(auditLog);
    showFeedback(`Generated governed pattern for Seed #${seed} (${bpm} BPM).`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#101218] border border-[#262c3e] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141822] border-b border-[#202636]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Deterministic Programming Agent
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono-numbers bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  100% REPRODUCIBLE MATH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Governs drum &amp; percussion programming via analyzed mainstream hit producer grammars
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e2330] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {actionFeedback && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2 text-xs font-semibold text-amber-300 flex items-center justify-between animate-fadeIn">
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Mainstream Archetype Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Select Mainstream Reference Grammar
              </span>
              <span className="text-xs text-slate-400 font-mono-numbers">
                Target BPM: {selectedArchetype.targetBpm} · Swing: {selectedArchetype.recommendedSwing}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {Object.values(MAINSTREAM_ARCHETYPES).map((arch) => {
                const isSelected = arch.id === selectedArchetypeId;
                return (
                  <button
                    key={arch.id}
                    onClick={() => setSelectedArchetypeId(arch.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-slate-100 shadow-sm ring-1 ring-amber-500/30'
                        : 'bg-[#151821] border-[#222836] text-slate-300 hover:border-[#323b4e] hover:bg-[#191d28]'
                    }`}
                  >
                    <div>
                      <div
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-amber-400' : 'text-slate-200'
                        }`}
                      >
                        {arch.name.split(' (')[0]}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {arch.chartEra.split(' ')[0]}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono-numbers text-slate-400 mt-2 flex items-center justify-between">
                      <span>{arch.targetBpm} BPM</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-2.5 p-3 rounded-xl bg-[#131620] border border-[#202636] text-xs text-slate-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">{selectedArchetype.name}:</span>{' '}
                <span className="text-slate-400">{selectedArchetype.description}</span>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-400 font-mono-numbers">
                  <span>Producers: {selectedArchetype.producerReference}</span>
                  <span>·</span>
                  <span>Turnaround Steps: {selectedArchetype.turnaroundSteps.map((s) => s + 1).join(', ')}</span>
                  <span>·</span>
                  <span>Pitch Sweep: {selectedArchetype.typicalPitchSweep.start}st to {selectedArchetype.typicalPitchSweep.end}st</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Live Pattern Audit & Compliance Deck */}
          <div className="bg-[#131620] border border-[#202636] rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#1c212c]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  2. Pattern Compliance Audit (Sector {currentSectorId})
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded font-mono-numbers font-bold ${
                    auditReport.complianceScore >= 90
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : auditReport.complianceScore >= 70
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  Score: {auditReport.complianceScore}%
                </span>
              </div>

              <button
                onClick={handleEnforceGovernance}
                disabled={auditReport.violations.length === 0}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enforce Mainstream Governance ({auditReport.violations.length} Fixes)</span>
              </button>
            </div>

            {auditReport.violations.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  All pattern steps strictly comply with {selectedArchetype.name} structural invariants. Zero collisions detected.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {auditReport.violations.map((viol) => (
                  <div
                    key={viol.id}
                    className="p-2.5 rounded-lg bg-[#0e1017] border border-[#1b202c] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      {viol.severity === 'error' ? (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{viol.ruleName}</span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-mono-numbers ${
                              viol.nature === 'REAL_MATH'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            [{viol.nature.replace('_', ' ')}]
                          </span>
                        </div>
                        <p className="text-slate-400 mt-0.5">{viol.message}</p>
                        <p className="text-amber-400/90 text-[11px] font-mono-numbers mt-1">
                          Fix: {viol.suggestedFix}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Deterministic Seed & Pattern Synthesis Engine */}
          <div className="bg-[#131620] border border-[#202636] rounded-xl p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1c212c]">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                3. Deterministic Pattern Synthesis Engine
              </span>
              <span className="text-xs text-slate-400">
                Mathematical Seed Generator (Zero LLM Hallucinations)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Seed Control */}
              <div className="bg-[#0e1017] border border-[#1b202c] p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Deterministic Seed
                  </span>
                  <div className="text-base font-mono-numbers font-black text-amber-400">
                    #{seed}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSeed((prev) => Math.max(1, prev - 1))}
                    className="p-1 rounded bg-[#181d28] hover:bg-[#222938] text-slate-300 text-xs font-mono-numbers px-2 transition-colors"
                  >
                    -
                  </button>
                  <button
                    onClick={() => setSeed((prev) => prev + 1)}
                    className="p-1 rounded bg-[#181d28] hover:bg-[#222938] text-slate-300 text-xs font-mono-numbers px-2 transition-colors"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setSeed(Math.floor(Math.random() * 9999) + 1)}
                    title="Cycle to next pseudorandom seed"
                    className="p-1 rounded bg-[#181d28] hover:bg-[#222938] text-amber-400 px-2 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scope Selector */}
              <div className="bg-[#0e1017] border border-[#1b202c] p-3 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    Target Scope
                  </span>
                  <div className="text-xs font-bold text-slate-200">
                    {applyScope === 'full_rack' ? 'Complete 7-Voice Rack' : 'Active Track Only'}
                  </div>
                </div>
                <div className="flex rounded-lg bg-[#141822] p-0.5 border border-[#222836] text-[10px] font-semibold">
                  <button
                    onClick={() => setApplyScope('active_only')}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      applyScope === 'active_only' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Voice Only
                  </button>
                  <button
                    onClick={() => setApplyScope('full_rack')}
                    className={`px-2 py-1 rounded-md transition-colors ${
                      applyScope === 'full_rack' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Full Rack
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  onClick={handleGenerateFromArchetype}
                  className="w-full h-full py-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Synthesize Seed #{seed}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Execution & Governance Decision Graph */}
          {liveLog.length > 0 && (
            <div className="bg-[#131620] border border-[#202636] rounded-xl p-4">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-2">
                4. Live Governance Decision Log ({liveLog.length} Operations Executed)
              </span>
              <div className="max-h-40 overflow-y-auto space-y-1.5 font-mono-numbers text-xs">
                {liveLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-[#0b0d12] border border-[#181d28] flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold ${
                          log.action === 'INJECTED'
                            ? 'text-emerald-400'
                            : log.action === 'MODIFIED'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        [{log.action}]
                      </span>
                      <span className="text-slate-300 font-semibold">
                        Step {log.stepIndex + 1}:
                      </span>
                      <span className="text-slate-400">{log.details}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1 rounded ${
                        log.nature === 'REAL_MATH' ? 'text-cyan-400' : 'text-purple-400'
                      }`}
                    >
                      {log.nature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Governance Laws Reference Deck (Distinguishing Real Math vs Calibrated Constants) */}
          <div className="bg-[#0e1017] border border-[#1b202c] rounded-xl p-4">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              5. Governance System Foundations (Brutal Transparency)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#141822] border border-[#222836]">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                  <span>[REAL MATH] Real Mathematical Formulations</span>
                </div>
                <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                  <li>Exponential velocity roll curves: v(t) = v0 + Δv · (i/N)²</li>
                  <li>Stereo pan micro-interpolation: P(t) = P_start + t · ΔP</li>
                  <li>Choke Group 1 lock-free voice mutual exclusion state machine</li>
                  <li>Sub-division micro-timing offsets (-20ms to +20ms)</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-[#141822] border border-[#222836]">
                <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
                  <span>[CALIBRATED PROFILE] Mainstream Producer Rules</span>
                </div>
                <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                  <li>Metro Boomin &amp; 808 Mafia backbeat anchor isolation (Step 5 &amp; 13)</li>
                  <li>Cadential turnaround zone enforcement (Steps 14–16)</li>
                  <li>Wheezy Tsunami pitch sweep intervals (+2st to +7st)</li>
                  <li>Pierre Bourne minimalist 8th-note pocket (Step 2 &amp; 10 exclusion)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#141822] border-t border-[#202636] flex items-center justify-between text-xs text-slate-400">
          <span>Active Instrument Voice: <strong className="text-amber-400">{activeTrackId}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#222836] hover:bg-[#2b3346] text-slate-200 font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
