import React from 'react';
import { SectorId, SectorData } from '../types';
import { Bookmark, Copy, Clipboard, Check, Sparkles, Trash2 } from 'lucide-react';

interface SectorControlBarProps {
  currentSectorId: SectorId;
  sectors: Record<SectorId, SectorData>;
  onSelectSector: (id: SectorId) => void;
  onSaveCurrentSector: () => void;
  onCopySector: () => void;
  onPasteSector: () => void;
  onQuickRandomizeSector: (sectorId: SectorId) => void;
  onClearSector: (sectorId: SectorId) => void;
  hasCopiedSector: boolean;
  saveFeedback: boolean;
}

export const SectorControlBar: React.FC<SectorControlBarProps> = ({
  currentSectorId,
  sectors,
  onSelectSector,
  onSaveCurrentSector,
  onCopySector,
  onPasteSector,
  onQuickRandomizeSector,
  onClearSector,
  hasCopiedSector,
  saveFeedback,
}) => {
  const sectorIds: SectorId[] = ['A', 'B', 'C', 'D'];

  return (
    <div className="bg-[#14161c] border border-[#232834] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
      {/* Left: Sector Variation Selectors (A, B, C, D) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Sector Memory</span>
        </div>

        {/* Clean Segmented Control for Sectors A-D */}
        <div className="flex items-center gap-1 bg-[#0f1116] p-1 rounded-lg border border-[#212633]">
          {sectorIds.map((id) => {
            const isSelected = currentSectorId === id;
            const sector = sectors[id];

            return (
              <button
                key={id}
                onClick={() => onSelectSector(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 stepped-key ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border border-amber-400 led-amber-glow shadow-sm'
                    : 'bg-[#181c25] text-slate-300 hover:text-white hover:bg-[#202532] border border-[#282f3e]'
                }`}
              >
                <span>Sector {id}</span>
                <span
                  className={`text-[10px] font-mono-numbers ${
                    isSelected ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  · {sector.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Sector Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick Randomize This Sector */}
        <button
          onClick={() => onQuickRandomizeSector(currentSectorId)}
          title={`Randomize new groove pattern directly into Sector ${currentSectorId}`}
          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Randomize Sector {currentSectorId}</span>
        </button>

        <button
          onClick={onSaveCurrentSector}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all whitespace-nowrap shrink-0 ${
            saveFeedback
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              : 'bg-[#1c212c] hover:bg-[#242b38] text-slate-200 border-[#2b3344]'
          }`}
        >
          {saveFeedback ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>
            {saveFeedback ? `Saved to Sector ${currentSectorId}` : `Save Sector ${currentSectorId}`}
          </span>
        </button>

        <button
          onClick={onCopySector}
          className="px-2.5 py-1.5 rounded-lg bg-[#181c25] hover:bg-[#202633] text-slate-300 border border-[#272e3d] text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          title="Copy active sector pattern to clipboard"
        >
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </button>

        <button
          onClick={onPasteSector}
          disabled={!hasCopiedSector}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors whitespace-nowrap shrink-0 ${
            hasCopiedSector
              ? 'bg-[#181c25] hover:bg-[#202633] text-cyan-300 border-cyan-500/40'
              : 'bg-[#111319] text-slate-500 border-[#1e232e] cursor-not-allowed opacity-50'
          }`}
          title="Paste copied pattern into current sector"
        >
          <Clipboard className="w-3 h-3" />
          <span>Paste</span>
        </button>

        <button
          onClick={() => onClearSector(currentSectorId)}
          className="p-1.5 rounded-lg bg-[#181c25] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#272e3d] transition-colors"
          title={`Clear all tracks in Sector ${currentSectorId}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
