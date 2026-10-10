import React, { useState, useRef } from 'react';
import { SoundSample, InstrumentTrack } from '../types';
import { Search, FolderUp, Play, Music, Check, Upload, X } from 'lucide-react';

interface SoundBankBrowserProps {
  samples: SoundSample[];
  tracks: InstrumentTrack[];
  activeTrackId: string;
  onAuditionSample: (sample: SoundSample) => void;
  onAssignSampleToTrack: (sample: SoundSample, trackId: string) => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onClose: () => void;
}

export const SoundBankBrowser: React.FC<SoundBankBrowserProps> = ({
  samples,
  tracks,
  activeTrackId,
  onAuditionSample,
  onAssignSampleToTrack,
  onUploadFiles,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
  const [targetTrackId, setTargetTrackId] = useState<string>(activeTrackId);
  const [isDragOver, setIsDragOver] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'all', label: 'All Sounds' },
    { id: 'closed_hat', label: 'Closed Hats' },
    { id: 'open_hat', label: 'Open Hats' },
    { id: 'pedal_hat', label: 'Pedal / Choke' },
    { id: 'shaker', label: 'Shakers' },
    { id: 'clave', label: 'Claves' },
    { id: 'perc', label: 'Perc / Snare' },
    { id: 'custom', label: 'My Uploads' },
  ];

  const filteredSamples = samples.filter((sample) => {
    // Category match
    if (selectedCategory === 'custom' && !sample.isCustom) return false;
    if (selectedCategory !== 'all' && selectedCategory !== 'custom' && sample.category !== selectedCategory) {
      return false;
    }
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = sample.name.toLowerCase().includes(q);
      const tagMatch = sample.tags.some(t => t.toLowerCase().includes(q));
      if (!nameMatch && !tagMatch) return false;
    }
    return true;
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-[#2e3444] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden hardware-chassis">
        {/* Top Header */}
        <div className="p-4 border-b border-[#262c3a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Sound Bank &amp; One-Shot Browser</span>
                <span className="text-xs text-slate-400 font-mono-numbers font-normal">
                  · {samples.length} sounds
                </span>
              </h2>
              <p className="text-xs text-slate-400">Audition waveforms, upload local sample folders &amp; assign to tracks</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Hidden Folder & File Inputs */}
            <input
              type="file"
              ref={folderInputRef}
              // @ts-expect-error webkitdirectory attribute
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onUploadFiles(e.target.files);
                }
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept=".wav,.aif,.aiff,.flac,.mp3,.ogg"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onUploadFiles(e.target.files);
                }
              }}
            />

            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FolderUp className="w-3.5 h-3.5" />
              <span>Upload Local Folder</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-[#252b38] hover:bg-[#303747] text-slate-300 border border-[#3b4356] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Add Audio Files</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#252b38] rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar & Category Tabs */}
        <div className="p-4 border-b border-[#232835] bg-[#14161c] space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search one-shots by name or tag (e.g. 808, sizzle, wood, break, tight)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1b1f28] border border-[#2d3444] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Target Track Assignment Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Target Track:</span>
              <select
                value={targetTrackId}
                onChange={(e) => setTargetTrackId(e.target.value)}
                className="bg-[#1b1f28] border border-[#2d3444] rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
              >
                {tracks.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#1e232e] text-slate-400 hover:text-slate-200 hover:bg-[#252b38]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drop Zone Area for Audio Files */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`px-4 py-2 text-center text-xs transition-colors border-b border-[#232835] ${
            isDragOver
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-[#13151b] text-slate-400'
          }`}
        >
          {isDragOver ? 'Drop .wav, .flac or .aiff files here to import!' : 'Drag & drop audio files or folders directly into this window to add them'}
        </div>

        {/* Sample List View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredSamples.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No percussion samples found matching "{searchQuery}".
            </div>
          ) : (
            filteredSamples.map((sample) => {
              const isSelected = selectedSampleId === sample.id;
              const targetTrack = tracks.find(t => t.id === targetTrackId);
              const isCurrentTrackSample = targetTrack?.sampleName === sample.name;

              return (
                <div
                  key={sample.id}
                  onClick={() => setSelectedSampleId(sample.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    isSelected
                      ? 'bg-[#222835] border-amber-500/60 shadow-md'
                      : 'bg-[#15181f] border-[#252b38] hover:border-[#353d4f] hover:bg-[#1b202a]'
                  }`}
                >
                  {/* Left: Play button & Name */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAuditionSample(sample);
                      }}
                      className="w-8 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center transition-transform active:scale-95 shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{sample.name}</span>
                        {sample.isCustom && (
                          <span className="text-[10px] text-cyan-400 font-medium">
                            · Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span className="capitalize">{sample.category.replace('_', ' ')}</span>
                        <span>·</span>
                        <span className="font-mono-numbers">{Math.round(sample.durationSeconds * 1000)}ms</span>
                        {sample.fileSize && (
                          <>
                            <span>·</span>
                            <span className="font-mono-numbers">{sample.fileSize}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Waveform Visualization */}
                  <div className="flex-1 max-w-[280px] h-8 flex items-center gap-0.5 px-2 bg-[#101217] rounded border border-[#212633]">
                    {sample.peakData.slice(0, 36).map((val, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-amber-400/80 rounded-full"
                        style={{
                          height: `${Math.max(12, val * 100)}%`,
                          opacity: 0.4 + val * 0.6,
                        }}
                      />
                    ))}
                  </div>

                  {/* Clean unboxed tags */}
                  <div className="hidden md:flex items-center gap-1.5 max-w-[140px] text-[10px] text-slate-400">
                    <span>{sample.tags.slice(0, 2).join(' · ')}</span>
                  </div>

                  {/* Right: Assign Button */}
                  <div className="shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssignSampleToTrack(sample, targetTrackId);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isCurrentTrackSample
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isCurrentTrackSample ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active on Track</span>
                        </>
                      ) : (
                        <span>Assign to {targetTrack?.name || 'Track'}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
