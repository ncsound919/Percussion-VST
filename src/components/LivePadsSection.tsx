import React, { useEffect } from 'react';
import { InstrumentTrack, QuantizeGrid } from '../types';
import { Radio } from 'lucide-react';

interface LivePadsSectionProps {
  tracks: InstrumentTrack[];
  isRecording: boolean;
  quantizeGrid: QuantizeGrid;
  onChangeQuantizeGrid: (grid: QuantizeGrid) => void;
  onTriggerPad: (track: InstrumentTrack, velocity: number) => void;
}

const KEY_MAPPINGS: Record<string, number> = {
  q: 0,
  w: 1,
  e: 2,
  r: 3,
  t: 4,
  y: 5,
  u: 6,
};

export const LivePadsSection: React.FC<LivePadsSectionProps> = ({
  tracks,
  isRecording,
  quantizeGrid,
  onChangeQuantizeGrid,
  onTriggerPad,
}) => {
  // Listen for keyboard hotkeys (Q, W, E, R, T, Y, U) for live pad finger drumming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing into input or textarea
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key in KEY_MAPPINGS) {
        const trackIdx = KEY_MAPPINGS[key];
        if (tracks[trackIdx]) {
          onTriggerPad(tracks[trackIdx], 0.88);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tracks, onTriggerPad]);

  return (
    <div className="bg-[#14161c] border border-[#232834] rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1f2430]">
        <div className="flex items-center gap-2 text-xs">
          <Radio className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
          <span className="font-semibold text-slate-300 tracking-wider">
            Live Performance Pads
          </span>
          {isRecording && (
            <span className="text-rose-400 font-bold ml-1">
              · Overdub Recording Active
            </span>
          )}
        </div>

        {/* Quantize Grid Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Quantize:</span>
          <div className="flex items-center gap-1 bg-[#0f1116] p-0.5 rounded-lg border border-[#212633]">
            {(['sixteenth', 'thirty_second', 'sixteenth_triplet', 'off'] as QuantizeGrid[]).map(
              (grid) => (
                <button
                  key={grid}
                  onClick={() => onChangeQuantizeGrid(grid)}
                  className={`px-2.5 py-0.5 text-xs rounded transition-colors whitespace-nowrap ${
                    quantizeGrid === grid
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {grid === 'sixteenth'
                    ? '1/16'
                    : grid === 'thirty_second'
                    ? '1/32'
                    : grid === 'sixteenth_triplet'
                    ? '1/16T'
                    : 'Off'}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 7 Performance Drum Pads */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
        {tracks.map((track, idx) => {
          const keyLabel = Object.keys(KEY_MAPPINGS)
            .find((k) => KEY_MAPPINGS[k] === idx)
            ?.toUpperCase();

          return (
            <button
              key={track.id}
              onClick={() => onTriggerPad(track, 0.88)}
              className="h-20 rounded-xl bg-[#1b202a] border border-[#2b3343] hover:border-amber-500/60 hover:bg-[#222836] active:scale-95 transition-all p-2 flex flex-col justify-between items-center text-center stepped-key group select-none shadow-sm"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] px-1 py-0.2 rounded bg-[#101319] text-amber-400 font-mono-numbers font-bold border border-[#212735]">
                  [{keyLabel}]
                </span>
                {track.chokeGroup > 0 && (
                  <span className="text-[9px] text-slate-400 font-mono-numbers">
                    Grp {track.chokeGroup}
                  </span>
                )}
              </div>

              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors truncate max-w-full">
                {track.name}
              </span>

              <div className="w-full flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/30 group-active:bg-amber-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/30 group-active:bg-amber-300" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/30 group-active:bg-amber-300" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
