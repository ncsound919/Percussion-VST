import React from 'react';
import { Play, Square, Circle, Download, Music, Code2, Disc, Dices, ChevronDown, Repeat, Cpu } from 'lucide-react';
import { GenrePreset, HumanizerParams } from '../types';

interface HardwareHeaderProps {
  isPlaying: boolean;
  isRecording: boolean;
  bpm: number;
  humanizer: HumanizerParams;
  currentGenre: GenrePreset;
  onTogglePlay: () => void;
  onToggleRecord: () => void;
  onChangeBpm: (bpm: number) => void;
  onChangeHumanizer: (params: HumanizerParams) => void;
  onSelectGenre: (genre: GenrePreset) => void;
  onOpenSoundBrowser: () => void;
  onOpenJuceModal: () => void;
  onOpenRandomizer: () => void;
  onOpenAgentModal: () => void;
  onExportMidi: () => void;
  onExportWav: () => void;
  isExportingWav: boolean;
}

export const HardwareHeader: React.FC<HardwareHeaderProps> = ({
  isPlaying,
  isRecording,
  bpm,
  humanizer,
  currentGenre,
  onTogglePlay,
  onToggleRecord,
  onChangeBpm,
  onChangeHumanizer,
  onSelectGenre,
  onOpenSoundBrowser,
  onOpenJuceModal,
  onOpenRandomizer,
  onOpenAgentModal,
  onExportMidi,
  onExportWav,
  isExportingWav,
}) => {
  const genreOptions: { id: GenrePreset; label: string }[] = [
    { id: 'atlanta_dark_trap', label: 'Atlanta Dark Trap (Metro / Southside)' },
    { id: 'wheezy_tsunami', label: 'Wheezy Tsunami Wave (32T Sweeps)' },
    { id: 'southside_808mafia', label: 'Southside 808 Mafia (-5st Drops)' },
    { id: 'melodic_trap', label: 'Melodic Trap Bounce (Pierre / Nick Mira)' },
    { id: 'murda_beatz_bounce', label: 'Murda Beatz Bounce (Migos / Murda)' },
    { id: 'metro_cinematic_trap', label: 'Metro Boomin Cinematic Dark Trap' },
    { id: 'plugg_mexikodro', label: 'Plugg Mexikodro Playful Bounce' },
    { id: 'jersey_club_drip', label: 'Jersey Club 5-Beat Drip (140 BPM)' },
    { id: 'rage_hyper_trap', label: 'Rage Hyper-Trap (Yeat / BNYX / Carti)' },
    { id: 'detroit_bounce', label: 'Detroit Fast Bounce (196 BPM)' },
    { id: 'memphis_phonk', label: 'Memphis Phonk Triplet Bounce' },
    { id: 'uk_drill', label: 'UK Drill Slide Bounce' },
    { id: 'boombap_dilla', label: 'Boom Bap Dilla (Live Round-Robin)' },
    { id: 'purdie_shuffle', label: 'Purdie Triplet Shuffle' },
    { id: 'acoustic_funk_live', label: 'Live Acoustic Funk (Funky Drummer)' },
    { id: 'uk_garage_2step', label: '2-Step UK Garage' },
    { id: 'amen_breakbeat', label: 'Amen Breakbeat Jungle Roller' },
    { id: 'cascara_clave', label: 'Afro-Cuban Clave & Cascara' },
    { id: 'dub_techno', label: 'Berlin Dub Techno 909' },
  ];

  return (
    <header className="border-b border-[#232834] bg-[#12141a]">
      {/* 1. Strict Top Bar Contract: [Brand wordmark] — [Nav links] — [1 Primary Action] */}
      <div className="flex items-center justify-between gap-8 px-6 py-3 border-b border-[#1f232e]">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-black text-xs">
            808
          </div>
          <a
            href="/"
            className="text-base font-extrabold tracking-tight text-slate-100 whitespace-nowrap shrink-0 hover:text-amber-400 transition-colors"
          >
            Percussion Programmer
          </a>
        </div>

        {/* Zone 2: 4–5 single-line clean navigation links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-300">
          <button
            onClick={onOpenAgentModal}
            className="px-3 py-1.5 rounded-lg text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 font-semibold"
            title="Open Deterministic Mainstream Programming Agent"
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Governance Agent</span>
          </button>

          <button
            onClick={onOpenRandomizer}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1f2430] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Dices className="w-3.5 h-3.5 text-amber-400" />
            <span>Randomizer</span>
          </button>

          <button
            onClick={onOpenSoundBrowser}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1f2430] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span>Sound Bank</span>
          </button>

          <button
            onClick={onOpenJuceModal}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1f2430] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>JUCE VST3</span>
          </button>

          <button
            onClick={onExportMidi}
            className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-[#1f2430] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Download Standard MIDI File (.mid)"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export MIDI</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onExportWav}
            disabled={isExportingWav}
            title="Render 16-bit 44.1kHz Stereo WAV Loop"
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 shadow-sm"
          >
            <Disc className="w-3.5 h-3.5" />
            <span>{isExportingWav ? 'Rendering...' : 'Export WAV'}</span>
          </button>
        </div>
      </div>

      {/* 2. Hardware Master Console Panel */}
      <div className="px-6 py-2.5 bg-[#0f1116] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Transport Controls & BPM */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all stepped-key ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 border-amber-400 led-amber-glow'
                : 'bg-[#1b1f28] text-slate-200 border-[#2b3242] hover:bg-[#232834]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            onClick={onToggleRecord}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all stepped-key ${
              isRecording
                ? 'bg-rose-600 text-white border-rose-500 led-red-glow animate-pulse'
                : 'bg-[#1b1f28] text-slate-300 border-[#2b3242] hover:bg-[#232834]'
            }`}
          >
            <Circle className={`w-3.5 h-3.5 fill-current ${isRecording ? 'text-white' : 'text-rose-500'}`} />
            <span>{isRecording ? 'REC ON' : 'RECORD'}</span>
          </button>

          {/* BPM Numerical Input */}
          <div className="flex items-center gap-2 bg-[#14171f] px-2.5 py-1 rounded-lg border border-[#262c3a]">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">BPM</span>
            <input
              type="number"
              min="40"
              max="260"
              value={bpm}
              onChange={(e) => onChangeBpm(parseInt(e.target.value) || 120)}
              className="w-14 bg-[#0c0e12] border border-[#222836] rounded px-1.5 py-0.5 text-xs text-amber-400 font-bold font-mono-numbers text-center focus:outline-none focus:border-amber-500"
            />
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => onChangeBpm(Math.min(260, bpm + 1))}
                className="text-[9px] px-1 bg-[#1e232e] hover:bg-[#272e3d] text-slate-300 rounded transition-colors"
              >
                +
              </button>
              <button
                onClick={() => onChangeBpm(Math.max(40, bpm - 1))}
                className="text-[9px] px-1 bg-[#1e232e] hover:bg-[#272e3d] text-slate-300 rounded transition-colors"
              >
                -
              </button>
            </div>
          </div>
        </div>

        {/* Center: Real Groove Pattern Preset Selector */}
        <div className="flex items-center gap-2 bg-[#14171f] px-3 py-1 rounded-lg border border-[#262c3a]">
          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">
            Groove Preset:
          </span>
          <div className="relative">
            <select
              value={currentGenre}
              onChange={(e) => onSelectGenre(e.target.value as GenrePreset)}
              className="appearance-none bg-[#0c0e12] border border-[#242a38] rounded-md pl-2.5 pr-7 py-1 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer max-w-[280px] truncate"
            >
              {genreOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Round-Robin Toggle & Micro-Timing Humanizer Sliders */}
        <div className="flex items-center gap-3 bg-[#14171f] px-3 py-1 rounded-lg border border-[#262c3a] text-xs">
          {/* Round-Robin Human Hand Alternation Toggle */}
          <button
            onClick={() => onChangeHumanizer({ ...humanizer, roundRobinEnabled: !humanizer.roundRobinEnabled })}
            title="Toggle Live Drummer Left/Right Hand Round-Robin Alternation"
            className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              humanizer.roundRobinEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-[#181c25] text-slate-400 border-[#242b38]'
            }`}
          >
            <Repeat className="w-3 h-3" />
            <span>Hands {humanizer.roundRobinEnabled ? 'On' : 'Off'}</span>
          </button>

          {/* Swing % */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Swing</span>
            <input
              type="range"
              min="50"
              max="75"
              step="0.5"
              value={humanizer.swingPercent}
              onChange={(e) => onChangeHumanizer({ ...humanizer, swingPercent: parseFloat(e.target.value) })}
              className="w-14 accent-amber-500 bg-[#0c0e12] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono-numbers text-amber-400 text-xs w-9 text-right">
              {humanizer.swingPercent.toFixed(1)}%
            </span>
          </div>

          {/* Jitter (ms) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Jitter</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={humanizer.timingJitterMs}
              onChange={(e) => onChangeHumanizer({ ...humanizer, timingJitterMs: parseFloat(e.target.value) })}
              className="w-12 accent-amber-500 bg-[#0c0e12] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono-numbers text-amber-400 text-xs w-8 text-right">
              {humanizer.timingJitterMs}ms
            </span>
          </div>

          {/* Layback (ms) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Layback</span>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={humanizer.laidBackMs}
              onChange={(e) => onChangeHumanizer({ ...humanizer, laidBackMs: parseFloat(e.target.value) })}
              className="w-12 accent-amber-500 bg-[#0c0e12] h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono-numbers text-amber-400 text-xs w-8 text-right">
              {humanizer.laidBackMs}ms
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
