import { useState, useEffect, useCallback } from 'react';
import {
  InstrumentTrack,
  PercussionStep,
  GenrePreset,
  HumanizerParams,
  SoundSample,
  QuantizeGrid,
  SectorId,
  SectorData,
  RandomizerParams,
  RollType,
} from './types';
import { audioEngine } from './audio/audioEngine';
import { sampleLibrary } from './services/sampleLibrary';
import { generateMidiFile } from './services/exportMidi';
import { renderLoopToWav } from './services/exportWav';
import {
  applyGenrePreset,
  randomizeGroove,
  randomize4SectorProgression,
  createEmptySteps,
} from './services/genreAlgorithms';

import { HardwareHeader } from './components/HardwareHeader';
import { SectorControlBar } from './components/SectorControlBar';
import { SequencerToolbar } from './components/SequencerToolbar';
import { SequencerGrid } from './components/SequencerGrid';
import { StepInspector } from './components/StepInspector';
import { LivePadsSection } from './components/LivePadsSection';
import { SoundBankBrowser } from './components/SoundBankBrowser';
import { JuceCodeModal } from './components/JuceCodeModal';
import { RandomizerModal } from './components/RandomizerModal';
import { DeterministicAgentModal } from './components/DeterministicAgentModal';

function createDefault16Steps(patternType: 'eighth' | 'sixteenth' | 'turnaround' | 'empty'): PercussionStep[] {
  return Array.from({ length: 16 }, (_, i) => {
    let active = false;
    let baseVelocity = 0.75;
    let hatOpenness = 0;

    if (patternType === 'sixteenth') {
      active = true;
      baseVelocity = (i % 4 === 0) ? 0.95 : (i % 2 === 0) ? 0.72 : 0.45;
    } else if (patternType === 'eighth') {
      active = (i % 2 === 0);
      baseVelocity = (i % 4 === 0) ? 0.9 : 0.65;
    } else if (patternType === 'turnaround') {
      active = (i === 14);
      baseVelocity = 0.88;
      hatOpenness = 0.85;
    }

    return {
      active,
      baseVelocity,
      probability: 1.0,
      rollType: 'none',
      pitchCurve: 'linear',
      startPitchOffset: 0,
      endPitchOffset: 0,
      panStart: 0,
      panEnd: 0,
      hatOpenness,
      timingOffsetMs: 0,
      articulation: (i % 4 === 0) ? 'shank' : 'tip',
    };
  });
}

function createInitialTracks(): InstrumentTrack[] {
  return [
    {
      id: 'trap_hat',
      name: '808 Trap Hat',
      shortLabel: '808',
      chokeGroup: 1,
      midiNote: 42,
      steps: createDefault16Steps('sixteenth'),
      volume: 0.85,
      pan: 0.0,
      mute: false,
      solo: false,
      sampleName: '808 Clean Trap Hat',
      isSynthesized: true,
      sampleBuffer: null,
    },
    {
      id: 'closed_hat',
      name: 'Live Acoustic Hat',
      shortLabel: 'LIV',
      chokeGroup: 1,
      midiNote: 42,
      steps: createDefault16Steps('empty'),
      volume: 0.85,
      pan: -0.05,
      mute: false,
      solo: false,
      sampleName: 'Live Hat Tip (Right Hand)',
      isSynthesized: true,
      sampleBuffer: null,
    },
    {
      id: 'open_hat',
      name: 'Analog Open Hat',
      shortLabel: 'OH',
      chokeGroup: 1,
      midiNote: 46,
      steps: createDefault16Steps('turnaround'),
      volume: 0.8,
      pan: 0.1,
      mute: false,
      solo: false,
      sampleName: 'Analog 909 Open Sizzle',
      isSynthesized: true,
      sampleBuffer: null,
    },
    {
      id: 'pedal_hat',
      name: 'Pedal Foot Hat',
      shortLabel: 'PD',
      chokeGroup: 1,
      midiNote: 44,
      steps: createDefault16Steps('empty'),
      volume: 0.75,
      pan: -0.1,
      mute: false,
      solo: false,
      sampleName: 'Pedal Foot Click',
      isSynthesized: true,
      sampleBuffer: null,
    },
    {
      id: 'shaker',
      name: 'Latin Shaker',
      shortLabel: 'SHK',
      chokeGroup: 0,
      midiNote: 70,
      steps: createDefault16Steps('empty'),
      volume: 0.7,
      pan: 0.3,
      mute: false,
      solo: false,
      sampleName: 'Afro-Latin Shaker',
      isSynthesized: true,
      sampleBuffer: null,
    },
    {
      id: 'clave',
      name: 'Hardwood Clave',
      shortLabel: 'CLV',
      chokeGroup: 0,
      midiNote: 75,
      steps: createDefault16Steps('empty'),
      volume: 0.75,
      pan: -0.25,
      mute: false,
      solo: false,
      sampleName: 'Hardwood Clave Block',
      isSynthesized: true,
      sampleBuffer: null,
    },
    {
      id: 'perc',
      name: 'Ghost Snare',
      shortLabel: 'SNR',
      chokeGroup: 0,
      midiNote: 38,
      steps: createDefault16Steps('empty'),
      volume: 0.7,
      pan: 0.0,
      mute: false,
      solo: false,
      sampleName: 'Acoustic Break Ghost Snare',
      isSynthesized: true,
      sampleBuffer: null,
    },
  ];
}

export function App() {
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [bpm, setBpm] = useState(142);
  const [currentPlayheadStep, setCurrentPlayheadStep] = useState<number>(-1);
  const [currentGenre, setCurrentGenre] = useState<GenrePreset>('atlanta_dark_trap');

  const [humanizer, setHumanizer] = useState<HumanizerParams>({
    timingJitterMs: 1.5,
    timingDriftMs: 3.5,
    velocityJitter: 0.05,
    swingPercent: 51.0,
    laidBackMs: 0.0,
    roundRobinEnabled: true,
  });

  const [quantizeGrid, setQuantizeGrid] = useState<QuantizeGrid>('sixteenth');
  const [samples, setSamples] = useState<SoundSample[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string>('trap_hat');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // Sector Pattern Memory State (Sector A, B, C, D)
  const [currentSectorId, setCurrentSectorId] = useState<SectorId>('A');
  const [copiedSectorTracks, setCopiedSectorTracks] = useState<InstrumentTrack[] | null>(null);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const [sectors, setSectors] = useState<Record<SectorId, SectorData>>(() => {
    const defaultTracks = createInitialTracks();
    const trapResult = applyGenrePreset('atlanta_dark_trap', defaultTracks);
    const wheezyResult = applyGenrePreset('wheezy_tsunami', defaultTracks);
    const boomBapResult = applyGenrePreset('boombap_dilla', defaultTracks);
    const southsideResult = applyGenrePreset('southside_808mafia', defaultTracks);

    return {
      A: { id: 'A', name: 'Atlanta Trap', tracks: trapResult.updatedTracks, bpm: 142, humanizer: { timingJitterMs: 1.5, timingDriftMs: 3.5, velocityJitter: 0.05, swingPercent: 51.0, laidBackMs: 0, roundRobinEnabled: true } },
      B: { id: 'B', name: 'Wheezy Wave', tracks: wheezyResult.updatedTracks, bpm: 132, humanizer: { timingJitterMs: 1.2, timingDriftMs: 3.0, velocityJitter: 0.04, swingPercent: 52.0, laidBackMs: 0, roundRobinEnabled: true } },
      C: { id: 'C', name: 'Boom Bap Dilla', tracks: boomBapResult.updatedTracks, bpm: 92, humanizer: { timingJitterMs: 4.0, timingDriftMs: 4.5, velocityJitter: 0.08, swingPercent: 59.5, laidBackMs: 14, roundRobinEnabled: true } },
      D: { id: 'D', name: 'Southside 808', tracks: southsideResult.updatedTracks, bpm: 144, humanizer: { timingJitterMs: 1.4, timingDriftMs: 2.5, velocityJitter: 0.05, swingPercent: 50.0, laidBackMs: 0, roundRobinEnabled: true } },
    };
  });

  // Active Working Tracks
  const [tracks, setTracks] = useState<InstrumentTrack[]>(() => {
    const initial = createInitialTracks();
    const trapResult = applyGenrePreset('atlanta_dark_trap', initial);
    return trapResult.updatedTracks;
  });

  // Modals
  const [isSoundBrowserOpen, setIsSoundBrowserOpen] = useState(false);
  const [isJuceModalOpen, setIsJuceModalOpen] = useState(false);
  const [isRandomizerOpen, setIsRandomizerOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isExportingWav, setIsExportingWav] = useState(false);

  // Initialize Web Audio and Sound Bank Library + Full Articulation Round-Robin Kit
  useEffect(() => {
    const initSoundBank = async () => {
      const ctx = audioEngine.init();
      const loadedSamples = await sampleLibrary.init(ctx);
      setSamples(loadedSamples);

      // Full articulation kit (tipL, tipR, shank, sizzle, pedal) for multi-sample drum programming
      const acousticKit = sampleLibrary.getAcousticKit(ctx);
      const acousticRRPool = sampleLibrary.getAcousticRoundRobinPool(ctx);

      setTracks((prev) =>
        prev.map((t) => {
          const match = loadedSamples.find(
            (s) => s.name.toLowerCase() === t.sampleName.toLowerCase()
          );
          return {
            ...t,
            sampleBuffer: match ? match.buffer : loadedSamples[0]?.buffer || null,
            roundRobinBuffers: t.id === 'closed_hat' ? acousticRRPool : undefined,
            roundRobinKit: t.id === 'closed_hat' ? acousticKit : undefined,
          };
        })
      );

      audioEngine.setOnStepCallback((stepIdx) => {
        setCurrentPlayheadStep(stepIdx);
      });

      setIsAudioReady(true);
    };

    initSoundBank();
  }, []);

  useEffect(() => {
    audioEngine.setTracks(tracks);
  }, [tracks]);

  useEffect(() => {
    audioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    audioEngine.setHumanizer(humanizer);
  }, [humanizer]);

  // Global Spacebar transport shortcut (Play / Stop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) {
          audioEngine.stop();
          setIsPlaying(false);
          setCurrentPlayheadStep(-1);
        } else {
          audioEngine.start();
          setIsPlaying(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);
  const handleSelectSector = (targetId: SectorId) => {
    setSectors((prev) => ({
      ...prev,
      [currentSectorId]: {
        ...prev[currentSectorId],
        tracks: tracks.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })),
        bpm,
        humanizer: { ...humanizer },
      },
    }));

    const targetSector = sectors[targetId];
    if (targetSector) {
      const rehydrated = targetSector.tracks.map((t) => {
        const matchingLive = tracks.find((lt) => lt.id === t.id);
        return {
          ...t,
          sampleBuffer: matchingLive?.sampleBuffer || null,
          roundRobinBuffers: matchingLive?.roundRobinBuffers,
          roundRobinKit: matchingLive?.roundRobinKit,
        };
      });
      setTracks(rehydrated);
      setBpm(targetSector.bpm);
      setHumanizer(targetSector.humanizer);
      setCurrentSectorId(targetId);
      setSelectedStepIndex(null);
    }
  };

  const handleSaveCurrentSector = () => {
    setSectors((prev) => ({
      ...prev,
      [currentSectorId]: {
        ...prev[currentSectorId],
        tracks: tracks.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })),
        bpm,
        humanizer: { ...humanizer },
      },
    }));
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleCopySector = () => {
    setCopiedSectorTracks(tracks.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })));
  };

  const handlePasteSector = () => {
    if (!copiedSectorTracks) return;
    const pasted = copiedSectorTracks.map((ct) => {
      const live = tracks.find((t) => t.id === ct.id);
      return {
        ...ct,
        sampleBuffer: live?.sampleBuffer || null,
        roundRobinBuffers: live?.roundRobinBuffers,
        roundRobinKit: live?.roundRobinKit,
      };
    });
    setTracks(pasted);
  };

  const handleQuickRandomizeSector = (secId: SectorId) => {
    const randomized = randomizeGroove(tracks, {
      style: currentGenre === 'wheezy_tsunami' ? 'wheezy_wave' : currentGenre === 'southside_808mafia' ? 'southside_808' : 'atlanta_trap',
      rollDensity: 'medium',
      pitchDirection: 'down',
      pitchSweepChance: 0.65,
      velocityDynamicRange: 'medium',
      openHatStyle: 'turnarounds',
      lockedTrackIds: [],
    });

    setSectors((prev) => ({
      ...prev,
      [secId]: {
        ...prev[secId],
        tracks: randomized.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })),
        bpm,
        humanizer,
      },
    }));

    if (secId === currentSectorId) {
      setTracks(randomized);
    } else {
      handleSelectSector(secId);
    }
  };

  const handleClearSector = (secId: SectorId) => {
    const cleared = tracks.map((t) => ({
      ...t,
      steps: createEmptySteps(),
    }));

    setSectors((prev) => ({
      ...prev,
      [secId]: {
        ...prev[secId],
        tracks: cleared,
      },
    }));

    if (secId === currentSectorId) {
      setTracks(cleared);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentPlayheadStep(-1);
    } else {
      audioEngine.start();
      setIsPlaying(true);
    }
  };

  const handleToggleRecord = () => {
    setIsRecording((prev) => !prev);
  };

  const handleToggleStep = (trackId: string, stepIndex: number) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const newSteps = [...t.steps];
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          active: !newSteps[stepIndex].active,
        };
        return { ...t, steps: newSteps };
      })
    );
  };

  // Quick Cycle Roll Subdivisions right on the step button
  const handleCycleStepRoll = (trackId: string, stepIndex: number) => {
    const rollCycle: RollType[] = ['none', 'straight_32', 'straight_64', 'triplet_32', 'triplet_64'];
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const newSteps = [...t.steps];
        const currentRoll = newSteps[stepIndex].rollType;
        const currentIdx = rollCycle.indexOf(currentRoll);
        const nextRoll = rollCycle[(currentIdx + 1) % rollCycle.length];

        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          rollType: nextRoll,
          // If turning on a roll and pitch offsets are flat, add a subtle default drop
          startPitchOffset: nextRoll !== 'none' && newSteps[stepIndex].endPitchOffset === 0 ? 1 : newSteps[stepIndex].startPitchOffset,
          endPitchOffset: nextRoll !== 'none' && newSteps[stepIndex].endPitchOffset === 0 ? -5 : newSteps[stepIndex].endPitchOffset,
        };
        return { ...t, steps: newSteps };
      })
    );
  };

  const handleInspectStep = (trackId: string, stepIndex: number) => {
    setActiveTrackId(trackId);
    setSelectedStepIndex(stepIndex);
  };

  const handleUpdateStep = (updatedStep: PercussionStep) => {
    if (selectedStepIndex === null) return;
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== activeTrackId) return t;
        const newSteps = [...t.steps];
        newSteps[selectedStepIndex] = updatedStep;
        return { ...t, steps: newSteps };
      })
    );
  };

  const handleUpdateTrack = (trackId: string, partial: Partial<InstrumentTrack>) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...partial } : t))
    );
  };

  const handleUpdateTrackSteps = (trackId: string, newSteps: PercussionStep[]) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, steps: newSteps } : t))
    );
  };

  const handleAuditionTrack = (track: InstrumentTrack) => {
    if (track.sampleBuffer) {
      audioEngine.auditionSample(track.sampleBuffer, track.volume);
    }
  };

  const handleAuditionSample = (sample: SoundSample) => {
    audioEngine.auditionSample(sample.buffer);
  };

  const handleAssignSampleToTrack = (sample: SoundSample, trackId: string) => {
    const ctx = audioEngine.getContext();
    const acousticKit = sampleLibrary.getAcousticKit(ctx);

    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const isAcousticTarget = sample.category === 'closed_hat' && (sample.tags.includes('acoustic') || sample.tags.includes('live'));
        return {
          ...t,
          sampleName: sample.name,
          sampleId: sample.id,
          sampleBuffer: sample.buffer,
          isSynthesized: !sample.isCustom,
          roundRobinKit: isAcousticTarget ? acousticKit : undefined,
        };
      })
    );
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    const ctx = audioEngine.getContext();
    const added = await sampleLibrary.addAudioFiles(files, ctx);
    if (added.length > 0) {
      setSamples([...sampleLibrary.getSamples()]);
    }
  };

  const handleSelectGenre = (genre: GenrePreset) => {
    setCurrentGenre(genre);
    const result = applyGenrePreset(genre, tracks);
    setTracks(result.updatedTracks);
    setBpm(result.bpm);
    setHumanizer((prev) => ({
      ...prev,
      swingPercent: result.swing,
      timingJitterMs: result.timingJitter,
      laidBackMs: result.laidBackMs,
    }));
  };

  const handleApplyRandomization = (params: RandomizerParams, targetSectorId: SectorId) => {
    const randomized = randomizeGroove(tracks, params);

    setSectors((prev) => ({
      ...prev,
      [targetSectorId]: {
        ...prev[targetSectorId],
        tracks: randomized.map((t) => ({ ...t, steps: t.steps.map((s) => ({ ...s })) })),
        bpm,
        humanizer,
      },
    }));

    if (targetSectorId === currentSectorId) {
      setTracks(randomized);
    } else {
      handleSelectSector(targetSectorId);
    }
  };

  const handleApply4SectorProgression = (params: RandomizerParams) => {
    const fourSectors = randomize4SectorProgression(tracks, params, bpm);
    setSectors(fourSectors);

    // Load Sector A immediately
    const sectorA = fourSectors.A;
    const rehydrated = sectorA.tracks.map((t) => {
      const live = tracks.find((lt) => lt.id === t.id);
      return {
        ...t,
        sampleBuffer: live?.sampleBuffer || null,
        roundRobinBuffers: live?.roundRobinBuffers,
        roundRobinKit: live?.roundRobinKit,
      };
    });
    setTracks(rehydrated);
    setBpm(sectorA.bpm);
    setHumanizer(sectorA.humanizer);
    setCurrentSectorId('A');
  };

  const handleTriggerPad = useCallback((track: InstrumentTrack, velocity: number) => {
    if (track.sampleBuffer) {
      audioEngine.auditionSample(track.sampleBuffer, velocity);
    }

    if (isRecording && isPlaying && currentPlayheadStep >= 0) {
      let targetStep = currentPlayheadStep;
      if (quantizeGrid === 'sixteenth') {
        targetStep = currentPlayheadStep;
      }

      setTracks((prev) =>
        prev.map((t) => {
          if (t.id !== track.id) return t;
          const newSteps = [...t.steps];
          newSteps[targetStep] = {
            ...newSteps[targetStep],
            active: true,
            baseVelocity: velocity,
          };
          return { ...t, steps: newSteps };
        })
      );
    }
  }, [isRecording, isPlaying, currentPlayheadStep, quantizeGrid]);

  const handleExportMidi = () => {
    const blob = generateMidiFile(tracks, bpm, humanizer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HiHat_Sector_${currentSectorId}_${bpm}BPM.mid`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWav = async () => {
    setIsExportingWav(true);
    try {
      const blob = await renderLoopToWav(tracks, bpm, humanizer);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HiHat_Sector_${currentSectorId}_${bpm}BPM.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('WAV render failed:', err);
    } finally {
      setIsExportingWav(false);
    }
  };

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0];

  return (
    <div className="min-h-screen bg-[#111317] text-slate-100 flex flex-col antialiased">
      <HardwareHeader
        isPlaying={isPlaying}
        isRecording={isRecording}
        bpm={bpm}
        humanizer={humanizer}
        currentGenre={currentGenre}
        onTogglePlay={handleTogglePlay}
        onToggleRecord={handleToggleRecord}
        onChangeBpm={setBpm}
        onChangeHumanizer={setHumanizer}
        onSelectGenre={handleSelectGenre}
        onOpenSoundBrowser={() => setIsSoundBrowserOpen(true)}
        onOpenJuceModal={() => setIsJuceModalOpen(true)}
        onOpenRandomizer={() => setIsRandomizerOpen(true)}
        onOpenAgentModal={() => setIsAgentModalOpen(true)}
        onExportMidi={handleExportMidi}
        onExportWav={handleExportWav}
        isExportingWav={isExportingWav}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6 space-y-4">
        {!isAudioReady && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-4 py-2 rounded-xl flex items-center justify-between">
            <span>Loading built-in percussion sound bank &amp; acoustic round-robin set...</span>
          </div>
        )}

        <SectorControlBar
          currentSectorId={currentSectorId}
          sectors={sectors}
          onSelectSector={handleSelectSector}
          onSaveCurrentSector={handleSaveCurrentSector}
          onCopySector={handleCopySector}
          onPasteSector={handlePasteSector}
          onQuickRandomizeSector={handleQuickRandomizeSector}
          onClearSector={handleClearSector}
          hasCopiedSector={copiedSectorTracks !== null}
          saveFeedback={saveFeedback}
        />

        <SequencerToolbar
          activeTrack={activeTrack}
          selectedStepIndex={selectedStepIndex}
          onUpdateTrackSteps={handleUpdateTrackSteps}
          onOpenRandomizer={() => setIsRandomizerOpen(true)}
          onOpenAgent={() => setIsAgentModalOpen(true)}
        />

        <SequencerGrid
          tracks={tracks}
          activeTrackId={activeTrackId}
          onSelectTrack={setActiveTrackId}
          onToggleStep={handleToggleStep}
          onInspectStep={handleInspectStep}
          onCycleStepRoll={handleCycleStepRoll}
          selectedStepIndex={selectedStepIndex}
          currentPlayheadStep={currentPlayheadStep}
          onAuditionTrack={handleAuditionTrack}
          onUpdateTrack={handleUpdateTrack}
          onOpenSoundBrowserForTrack={(tId) => {
            setActiveTrackId(tId);
            setIsSoundBrowserOpen(true);
          }}
        />

        {selectedStepIndex !== null && activeTrack.steps[selectedStepIndex] && (
          <StepInspector
            stepIndex={selectedStepIndex}
            trackName={activeTrack.name}
            step={activeTrack.steps[selectedStepIndex]}
            onChange={handleUpdateStep}
            onClose={() => setSelectedStepIndex(null)}
          />
        )}

        <LivePadsSection
          tracks={tracks}
          isRecording={isRecording}
          quantizeGrid={quantizeGrid}
          onChangeQuantizeGrid={setQuantizeGrid}
          onTriggerPad={handleTriggerPad}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-[#14161c] border border-[#232834] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
              <span>01. Mainstream Trap Programming</span>
              <span className="text-[10px] text-amber-400 font-mono-numbers">Metro · Wheezy · Southside</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Atlanta Dark Trap (Metro upward risers), Wheezy Tsunami Wave (32T rolling triplets), Southside 808 Mafia (-5st drop), Melodic Trap (Pierre skips), Murda bounce, and Rage 64th skitters.
            </p>
          </div>

          <div className="bg-[#14161c] border border-[#232834] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
              <span>02. Acoustic Multi-Sample Round-Robin</span>
              <span className="text-[10px] text-cyan-400 font-mono-numbers">L/R Hands · Shank · Sizzle</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authentic acoustic hi-hat articulation kit: Right Hand Tip (downbeats), Left Hand Tip (upbeats &amp; ghost notes), Shank Shoulder (edge accents), Sizzle (loose open), and Pedal Foot click.
            </p>
          </div>

          <div className="bg-[#14161c] border border-[#232834] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-200 mb-1 flex items-center justify-between">
              <span>03. Boom Bap &amp; Shuffle Dynamics</span>
              <span className="text-[10px] text-amber-400 font-mono-numbers">Purdie 66.7% · Dilla 59.5%</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bernard Purdie 66.7% triplet ghost shuffles, J Dilla 59.5% drunk layback drag (+14ms odd step offset), Clyde Stubblefield funk dynamics, and instant 4-sector song arrangement randomizer.
            </p>
          </div>
        </div>

        {/* Quiet, Clean Editorial Footer */}
        <footer className="pt-4 pb-2 border-t border-[#1f2430] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Vintage Drum Machine Hi-Hat &amp; Percussion Programmer</span>
            <span aria-hidden="true">·</span>
            <span>Web Audio 44.1kHz DSP &amp; JUCE C++ VST3</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono-numbers">
            <span>Keys: [Q–U] Finger Drum</span>
            <span aria-hidden="true">·</span>
            <span>Space: Play/Stop</span>
            <span aria-hidden="true">·</span>
            <span>Click Roll Badge: Cycle 32/64/32T/64T</span>
          </div>
        </footer>
      </main>

      {isSoundBrowserOpen && (
        <SoundBankBrowser
          samples={samples}
          tracks={tracks}
          activeTrackId={activeTrackId}
          onAuditionSample={handleAuditionSample}
          onAssignSampleToTrack={handleAssignSampleToTrack}
          onUploadFiles={handleUploadFiles}
          onClose={() => setIsSoundBrowserOpen(false)}
        />
      )}

      {isJuceModalOpen && (
        <JuceCodeModal onClose={() => setIsJuceModalOpen(false)} />
      )}

      {isRandomizerOpen && (
        <RandomizerModal
          tracks={tracks}
          currentSectorId={currentSectorId}
          onApplyRandomization={handleApplyRandomization}
          onApply4SectorProgression={handleApply4SectorProgression}
          onClose={() => setIsRandomizerOpen(false)}
        />
      )}

      {isAgentModalOpen && (
        <DeterministicAgentModal
          isOpen={isAgentModalOpen}
          onClose={() => setIsAgentModalOpen(false)}
          tracks={tracks}
          activeTrackId={activeTrackId}
          onUpdateTracks={setTracks}
          currentSectorId={currentSectorId}
          onChangeBpm={setBpm}
        />
      )}
    </div>
  );
}
export default App;
