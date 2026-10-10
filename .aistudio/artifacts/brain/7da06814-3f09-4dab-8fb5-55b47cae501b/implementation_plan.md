# Vintage Drum Machine Hi-Hat & Percussion Programmer

A professional percussion and hi-hat workstation running real-time DSP, micro-timing humanization, continuous openness articulation, and Trap/Drill pitch sweep curves inside a vintage hardware drum machine interface, accompanied by a local sample bank search browser, DAW drag-and-drop export, and a complete downloadable JUCE C++ VST3 project package.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Host Environment Reality Check (JUCE VST3 vs. Web Audio Studio):**
> A web browser container cannot directly compile or install desktop `.vst3` binaries into host operating system directories (`/Library/Audio/Plug-Ins/VST3` or `C:\Program Files\Common Files\VST3`) for direct in-DAW host loading.
> 
> To honor your request for a **JUCE VST3 plugin** while delivering an immediately playable, zero-friction instrument in the browser:
> 1. **Immediate Playable Instrument**: We implement the complete, sample-accurate Web Audio runtime matching the JUCE architecture: Lookahead scheduler, cubic Hermite resampling interpolation, choke dampening (<3ms fast decay), micro-timing jitter + LFO drift, roll burst engines (32nd, 64th, 32T, 64T), live MIDI recording/quantization, and DAW MIDI (.mid) & WAV (.wav) drag-and-drop export.
> 2. **Native JUCE C++ VST3 Codebase**: We provide a dedicated **Export JUCE VST3 Project** module containing the full, build-ready C++ source tree (`CMakeLists.txt`, `PluginProcessor.h/cpp`, `PluginEditor.h/cpp`, `Engine/`, `DSP/`, `Utils/`) matching the exact outlines in `/Hats`, `/dsp`, `/gui`, `/live`, and `/files memory` so you can compile the native `.vst3` on macOS/Windows/Linux with one command (`cmake --build`).

- **Confirmed Decision (Deliverable)**: Dual-layer solution — Full interactive Web Audio workstation + downloadable production-ready JUCE C++ VST3 project source.
- **Confirmed Decision (Sound Source)**: Custom one-shots uploaded from local folder with an integrated Sound Bank Search Browser (tagging, waveform previews, categorization, and drag-and-drop slot assignment), backed by a curated default kit of analog and acoustic percussion.
- **Confirmed Decision (Aesthetic)**: Vintage drum machine aesthetic with retro stepped buttons, illuminated tactile toggle LEDs, warm industrial chassis, and high-precision step parameter drawers.

---

### 1. Overview & Core Concept

- **What It Does**: A dedicated hi-hat and percussion programming studio that eliminates the repetitive, robotic "machine-gun" effect of standard DAW step sequencers. It combines continuous hi-hat openness states (tight closed, loose closed, half open, full open), automatic choke group muting, dynamic velocity weighting, Perlin/LFO drift + short-term jitter, and instant burst rolls with semitone pitch sweeping (-12st to +12st) and stereo pan spreads.
- **Target Audience / Persona**: Music producers, beatmakers, and audio engineers producing Trap, Drill, Drum & Bass, Breakbeats, Latin/Afro-Cuban rhythms, and live acoustic drumming who require fluid groove nuances and swift DAW export.
- **Key Value**: Replaces tedious manual piano-roll drawing and automation lanes with an intuitive, genre-authentic hardware sequencer workflow and instant `.mid` drag-and-drop.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Kit Setup & Bank Browsing**: The user accesses the Sound Bank Drawer or drops a folder of `.wav`/`.flac` one-shots. The app indexes, tags, and displays waveforms. The user audits sounds with single-click auditioning and assigns them to instrument slots (Closed Hat, Open Hat, Pedal Hat, Perc 1, Perc 2, Shaker, Clave).
2. **Step Sequencing & Pattern Building**: The user clicks tactile retro stepped buttons across the 16-step grid (grouped in four distinct 4-step quarter-note blocks with vintage spacing). The steps illuminate with velocity-proportional LED backlight warmth.
3. **Roll & Pitch Sweep Sculpting**: Clicking a step opens the **Step Inspector**:
   - Subdivision selector: Straight 16th, 32nd, 64th, 32nd Triplet (1/48), 64th Triplet (1/96).
   - Pitch ramp: Start semitone (-12 to +12 st), End semitone, and curve profile (Linear, Exponential, Logarithmic).
   - Stereo pan envelope: Pan start (L/R) to Pan end.
4. **Groove & Humanization Tuning**: In the master console, adjust Swing % (50% straight to 75% heavy triplet), Timing Jitter (ms), LFO Drift (ms), and Laid-back / Push-pull micro-timing.
5. **Live Performance & Recording**: Connect any MIDI pad controller or click on-screen trigger pads. With Record armed, incoming hits snap to the quantize grid (16th, 32nd, 16T) with dynamic velocity capture.
6. **DAW & VST Export**:
   - Drag or click **Export MIDI (.mid)** directly into Ableton, FL Studio, Logic, or Reaper.
   - Click **Export Audio Loop (.wav)** to bounce 16-bit 44.1kHz stereo audio.
   - Click **Download JUCE C++ VST3 Project** to download the clean CMake C++ codebase.

#### Visual Identity & Theme
- **Aesthetic Direction**: Vintage drum machine hardware console (inspired by classic hardware drum machines like TR-808/909, SP-1200, MPC-60) fused with modern precision audio metering.
- **Color Palette**:
  - Chassis Canvas: Deep textured charcoal and vintage cream-slate (`#181a1f`, `#21252d`, `#2d323e`).
  - Active Step Backlight: Warm amber-gold (`#f59e0b`) and punchy cadmium orange (`#f97316`) for downbeat accents.
  - Roll & Pitch Modulation Badges: Vibrant vintage vermilion (`#ef4444`) and crisp teal accents (`#14b8a6`).
  - Muted Hairline Frames: Subtle hardware bezel outlines (`#374151`, `#4b5563`).
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` / `Outfit` with bold tracking.
  - Sequencer Metrics & Numeric Readouts: Monospace tabular numerals (`JetBrains Mono`, `tabular-nums`) for pitch semitones, milliseconds, PPQ offsets, and BPM.
- **Component Styling & Layout**:
  - Stepped Buttons: Tactile retro plastic keys with beveled edges, realistic inset shadow depth, and glowing status LED pips.
  - Control Knobs & Faders: Precision hardware rotary dials and horizontal sliders with calibrated numeric readouts.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual Architecture (Web Audio Engine + JUCE Project Package)**
  - *Chosen Approach*: Deliver both the full Web Audio in-browser engine and a downloadable production C++ JUCE VST3 project structure.
  - *Why*: The user explicitly requested a JUCE VST3 plugin; since web sandboxes cannot compile binary plugins directly into local OS DAW directories, generating the C++ project alongside a live browser studio provides immediate usability and native code delivery.
  - *Alternatives Considered*: Building only C++ files without web playback would leave the user with an empty screen and no testable interface in AI Studio.

- **Decision 2: Audio Scheduling Architecture**
  - *Chosen Approach*: Decoupled Lookahead Scheduler (25ms timer intervals scheduling 100ms ahead into the Web Audio API timeline) combined with a high-performance voice pool.
  - *Why*: JavaScript `setInterval` suffers from UI thread jitter. Web Audio's native clock (`AudioContext.currentTime`) guarantees sample-accurate playback without audio glitches.
  - *Alternatives Considered*: Direct AudioWorklet script processor. Web Audio lookahead with audio-buffer nodes and gain/playbackRate ramps provides identical micro-timing precision with 100% cross-browser reliability and instant sample hot-swapping.

- **Decision 3: Local Folder Ingestion & Sound Bank Search Browser**
  - *Chosen Approach*: Browser File System Directory Picker / HTML5 folder upload combined with local IndexedDB storage, acoustic waveform rendering, tag indexing, and instantaneous search.
  - *Why*: Allows producers to import their own sample libraries from disk, browse and audition one-shots instantly, and tag them (kick, closed hat, open hat, perc, shaker).
  - *Alternatives Considered*: Server-side file upload; client-side IndexedDB is private, instantaneous, and zero-latency.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MAIN USER INTERFACE                             │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐ │
│  │ Sound Bank Browser    │  │ 16-Step Vintage Sequencer Grid         │ │
│  │ - Local Folder Search │  │ - Tactile Stepped Buttons & LEDs       │ │
│  │ - Tag / Category Filter│  │ - Velocity Heatmap & Subdivision Badges│ │
│  │ - Waveform Audition   │  │ - Quarter-Note Visual Grouping         │ │
│  └───────────┬───────────┘  └───────────────────┬────────────────────┘ │
│              │ Drop Sample                      │ Step Select          │
│              ▼                                  ▼                      │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Step Inspector Drawer (Roll Subdivisions, Pitch Sweeps, Pan Start/End)│
│  └──────────────────────────────────┬────────────────────────────────┘ │
│                                     │ Parameter Updates                │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SEQUENCING & LOGIC CORE                         │
│  - Pattern Memory Store (16 Steps x Multi-Track Slots)                 │
│  - Genre Pattern Engines (Trap/Drill, Breakbeat, Latin, Acoustic)      │
│  - Micro-Timing & Humanizer (LFO Drift, Jitter, Swing Quantize)        │
│  - Live MIDI Pad Recorder (Real-time Input & Grid Quantization)        │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │ Lookahead Scheduled Triggers
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      REAL-TIME WEB AUDIO DSP ENGINE                    │
│  - Lookahead Scheduler (25ms Interval / 100ms Buffer Window)           │
│  - Polyphonic Voice Allocator & Choke Manager (<3ms Decay Choke)       │
│  - Cubic Hermite / Linear PlaybackRate Pitch Envelope Sweeper          │
│  - Stereo Panning & Dynamic Velocity Gain Envelopes                    │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│ DAW Drag-and-Drop Export  │                   │ JUCE C++ VST3 Exporter    │
│ - Standard MIDI (.mid)    │                   │ - CMakeLists.txt          │
│ - Rendered Audio (.wav)   │                   │ - Processor, Editor & DSP │
└───────────────────────────┘                   └───────────────────────────┘
```

#### Core Data Models
```typescript
interface PercussionStep {
  active: boolean;
  baseVelocity: number;        // 0.0 to 1.0
  probability: number;         // 0.0 to 1.0
  rollType: 'none' | 'straight_32' | 'straight_64' | 'triplet_32' | 'triplet_64';
  pitchCurve: 'linear' | 'exponential' | 'logarithmic';
  startPitchOffset: number;    // -12.0 to +12.0 semitones
  endPitchOffset: number;      // -12.0 to +12.0 semitones
  panStart: number;            // -1.0 (Left) to +1.0 (Right)
  panEnd: number;              // -1.0 (Left) to +1.0 (Right)
  hatOpenness: number;         // 0.0 (Tight) to 1.0 (Full Open)
  timingOffsetMs: number;      // Micro-timing offset
}

interface InstrumentTrack {
  id: string;
  name: string;
  chokeGroup: number;          // 1 = Hi-Hat Choke, 0 = None
  defaultMidiNote: number;     // 42 (Closed), 46 (Open), etc.
  sampleBuffer: AudioBuffer | null;
  sampleName: string;
  steps: PercussionStep[];
}
```

#### Verification & Delivery Plan
1. **Scaffold React + Vite + Tailwind Audio Environment**: Set up clean project structure with Web Audio API context management.
2. **Implement Sound Engine & DSP**: Lookahead scheduler, voice allocation, choke groups, pitch ramps, and default analog/acoustic one-shot samples.
3. **Build Vintage Sequencer & Step Inspector**: 16-step grid with tactile buttons, LED states, velocity sliders, and pitch/pan modulation curves.
4. **Build Sound Bank Search Browser**: Local folder indexing, sample auditioning, tag filtering, and drag-and-drop assignment to tracks.
5. **Implement Groove & MIDI Engines**: Live MIDI recording, quantization, genre generators, and `.mid` / `.wav` export.
6. **Package JUCE VST3 C++ Project**: Exportable ZIP/directory containing complete, verified CMake C++ plugin code matching all blueprint files.
