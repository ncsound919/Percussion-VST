import { SoundSample, RoundRobinKit } from '../types';
import {
  extractPeakData,
  synthesizeClosedHat,
  synthesizeOpenHat,
  synthesizePedalHat,
  synthesizeTrap808Hat,
  synthesizeLatinShaker,
  synthesizeClave,
  synthesizeGhostSnare,
  synthesizeHatTip,
  synthesizeHatShank,
  synthesizeHatSizzle,
  synthesizeRageHat,
  synthesizeDetroitHat,
  synthesizeWheezyHat,
  synthesizeMetroHat,
  synthesizeMurdaHat,
} from '../audio/dspSynthesizer';

const DB_NAME = 'PercussionProgrammerDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_samples';

export class SampleLibraryService {
  private samples: SoundSample[] = [];
  private db: IDBDatabase | null = null;
  private isInitialized: boolean = false;
  private acousticKit: RoundRobinKit | null = null;

  public async init(ctx: AudioContext): Promise<SoundSample[]> {
    if (this.isInitialized) return this.samples;

    const defaultSamples = this.createDefaultKit(ctx);
    this.samples = [...defaultSamples];

    // Build the authentic acoustic kit
    const tipL = synthesizeHatTip(ctx, 'left');
    const tipR = synthesizeHatTip(ctx, 'right');
    const shank = synthesizeHatShank(ctx);
    const sizzle = synthesizeHatSizzle(ctx);
    const pedal = synthesizePedalHat(ctx);

    this.acousticKit = {
      tipL,
      tipR,
      shank,
      sizzle,
      pedal,
    };

    try {
      await this.initDB();
      const savedUserSamples = await this.loadSamplesFromDB(ctx);
      this.samples = [...this.samples, ...savedUserSamples];
    } catch {
      // IndexedDB fallback
    }

    this.isInitialized = true;
    return this.samples;
  }

  public getSamples(): SoundSample[] {
    return this.samples;
  }

  public getSampleById(id: string): SoundSample | undefined {
    return this.samples.find((s) => s.id === id);
  }

  // Returns array of acoustic round-robin buffers for live human drummer emulation
  public getAcousticRoundRobinPool(ctx: AudioContext): AudioBuffer[] {
    const tipL = synthesizeHatTip(ctx, 'left');
    const tipR = synthesizeHatTip(ctx, 'right');
    const shank = synthesizeHatShank(ctx);
    return [tipR, tipL, shank, tipR];
  }

  // Returns full articulation kit for multi-sample drum programming
  public getAcousticKit(ctx: AudioContext): RoundRobinKit {
    if (this.acousticKit) return this.acousticKit;
    const tipL = synthesizeHatTip(ctx, 'left');
    const tipR = synthesizeHatTip(ctx, 'right');
    const shank = synthesizeHatShank(ctx);
    const sizzle = synthesizeHatSizzle(ctx);
    const pedal = synthesizePedalHat(ctx);
    this.acousticKit = { tipL, tipR, shank, sizzle, pedal };
    return this.acousticKit;
  }

  private createDefaultKit(ctx: AudioContext): SoundSample[] {
    const list: SoundSample[] = [];

    // 1. Analog 909 Closed Hat
    const closedBuf = synthesizeClosedHat(ctx, 0.05, 0.0);
    list.push({
      id: 'default_closed_hat',
      name: 'Analog 909 Closed Hat',
      category: 'closed_hat',
      tags: ['analog', 'vintage', 'tight', '909'],
      durationSeconds: closedBuf.duration,
      buffer: closedBuf,
      peakData: extractPeakData(closedBuf, 48),
      isCustom: false,
    });

    // 2. Analog 909 Open Sizzle
    const openBuf = synthesizeOpenHat(ctx, 0.35);
    list.push({
      id: 'default_open_hat',
      name: 'Analog 909 Open Sizzle',
      category: 'open_hat',
      tags: ['analog', 'vintage', 'sizzle', 'open'],
      durationSeconds: openBuf.duration,
      buffer: openBuf,
      peakData: extractPeakData(openBuf, 48),
      isCustom: false,
    });

    // 3. 808 Trap Clean Hat
    const trap808Buf = synthesizeTrap808Hat(ctx);
    list.push({
      id: 'default_trap_hat',
      name: '808 Clean Trap Hat',
      category: 'closed_hat',
      tags: ['trap', 'drill', '808', 'clean', 'standard'],
      durationSeconds: trap808Buf.duration,
      buffer: trap808Buf,
      peakData: extractPeakData(trap808Buf, 48),
      isCustom: false,
    });

    // 4. Wheezy Wave Hat
    const wheezyBuf = synthesizeWheezyHat(ctx);
    list.push({
      id: 'wheezy_wave_hat',
      name: 'Wheezy Wave Sizzle Hat',
      category: 'closed_hat',
      tags: ['trap', 'wheezy', 'gunna', 'wave', 'pitched'],
      durationSeconds: wheezyBuf.duration,
      buffer: wheezyBuf,
      peakData: extractPeakData(wheezyBuf, 48),
      isCustom: false,
    });

    // 5. Metro Dark 808 Hat
    const metroBuf = synthesizeMetroHat(ctx);
    list.push({
      id: 'metro_dark_hat',
      name: 'Metro Dark Punch Hat',
      category: 'closed_hat',
      tags: ['trap', 'metro', 'dark', 'snap', 'punch'],
      durationSeconds: metroBuf.duration,
      buffer: metroBuf,
      peakData: extractPeakData(metroBuf, 48),
      isCustom: false,
    });

    // 6. Murda Beatz Bounce Hat
    const murdaBuf = synthesizeMurdaHat(ctx);
    list.push({
      id: 'murda_bounce_hat',
      name: 'Murda Bounce Crisp Hat',
      category: 'closed_hat',
      tags: ['trap', 'murda', 'migos', 'bounce', 'crisp'],
      durationSeconds: murdaBuf.duration,
      buffer: murdaBuf,
      peakData: extractPeakData(murdaBuf, 48),
      isCustom: false,
    });

    // 7. Rage Hyper-Pop Hat (Yeat / Carti / BNYX)
    const rageBuf = synthesizeRageHat(ctx);
    list.push({
      id: 'rage_hyper_hat',
      name: 'Rage Hyper-Crisp Hat',
      category: 'closed_hat',
      tags: ['rage', 'yeat', 'carti', 'bnyx', 'skitter'],
      durationSeconds: rageBuf.duration,
      buffer: rageBuf,
      peakData: extractPeakData(rageBuf, 48),
      isCustom: false,
    });

    // 8. Detroit Fast Bounce Hat
    const detroitBuf = synthesizeDetroitHat(ctx);
    list.push({
      id: 'detroit_clipped_hat',
      name: 'Detroit Fast Bounce Hat',
      category: 'closed_hat',
      tags: ['detroit', 'michigan', 'clipped', 'fast'],
      durationSeconds: detroitBuf.duration,
      buffer: detroitBuf,
      peakData: extractPeakData(detroitBuf, 48),
      isCustom: false,
    });

    // 9. Live Acoustic Hat Tip (Hand L - Round-Robin)
    const tipLBuf = synthesizeHatTip(ctx, 'left');
    list.push({
      id: 'live_hat_tip_l',
      name: 'Live Hat Tip (Left Hand)',
      category: 'closed_hat',
      tags: ['acoustic', 'live', 'tip', 'round-robin', 'boombap'],
      durationSeconds: tipLBuf.duration,
      buffer: tipLBuf,
      peakData: extractPeakData(tipLBuf, 48),
      isCustom: false,
      articulation: 'tip',
    });

    // 10. Live Acoustic Hat Tip (Hand R - Round-Robin)
    const tipRBuf = synthesizeHatTip(ctx, 'right');
    list.push({
      id: 'live_hat_tip_r',
      name: 'Live Hat Tip (Right Hand)',
      category: 'closed_hat',
      tags: ['acoustic', 'live', 'tip', 'round-robin', 'boombap'],
      durationSeconds: tipRBuf.duration,
      buffer: tipRBuf,
      peakData: extractPeakData(tipRBuf, 48),
      isCustom: false,
      articulation: 'tip',
    });

    // 11. Live Acoustic Hat Shank (Edge Accent)
    const shankBuf = synthesizeHatShank(ctx);
    list.push({
      id: 'live_hat_shank',
      name: 'Live Hat Shank (Edge Accent)',
      category: 'closed_hat',
      tags: ['acoustic', 'live', 'shank', 'accent', 'purdie'],
      durationSeconds: shankBuf.duration,
      buffer: shankBuf,
      peakData: extractPeakData(shankBuf, 48),
      isCustom: false,
      articulation: 'shank',
    });

    // 12. Live Acoustic Hat Sizzle (Loose)
    const sizzleBuf = synthesizeHatSizzle(ctx);
    list.push({
      id: 'live_hat_sizzle',
      name: 'Live Hat Sizzle (Loose)',
      category: 'open_hat',
      tags: ['acoustic', 'live', 'sizzle', 'loose'],
      durationSeconds: sizzleBuf.duration,
      buffer: sizzleBuf,
      peakData: extractPeakData(sizzleBuf, 48),
      isCustom: false,
      articulation: 'sizzle',
    });

    // 13. Pedal Foot Hat
    const pedalBuf = synthesizePedalHat(ctx);
    list.push({
      id: 'default_pedal_hat',
      name: 'Pedal Foot Click',
      category: 'pedal_hat',
      tags: ['pedal', 'acoustic', 'thud', 'choke'],
      durationSeconds: pedalBuf.duration,
      buffer: pedalBuf,
      peakData: extractPeakData(pedalBuf, 48),
      isCustom: false,
      articulation: 'pedal',
    });

    // 14. Latin Shaker
    const shakerBuf = synthesizeLatinShaker(ctx);
    list.push({
      id: 'default_shaker',
      name: 'Afro-Latin Shaker',
      category: 'shaker',
      tags: ['latin', 'percussion', 'shaker', 'organic'],
      durationSeconds: shakerBuf.duration,
      buffer: shakerBuf,
      peakData: extractPeakData(shakerBuf, 48),
      isCustom: false,
    });

    // 15. Wooden Clave
    const claveBuf = synthesizeClave(ctx);
    list.push({
      id: 'default_clave',
      name: 'Hardwood Clave Block',
      category: 'clave',
      tags: ['latin', 'clave', 'wood', 'pitched'],
      durationSeconds: claveBuf.duration,
      buffer: claveBuf,
      peakData: extractPeakData(claveBuf, 48),
      isCustom: false,
    });

    // 16. Ghost Snare / Rimshot
    const ghostSnareBuf = synthesizeGhostSnare(ctx);
    list.push({
      id: 'default_ghost_snare',
      name: 'Acoustic Break Ghost Snare',
      category: 'perc',
      tags: ['breakbeat', 'ghost', 'snare', 'acoustic', 'purdie'],
      durationSeconds: ghostSnareBuf.duration,
      buffer: ghostSnareBuf,
      peakData: extractPeakData(ghostSnareBuf, 48),
      isCustom: false,
    });

    return list;
  }

  // File Upload Handlers (Local Folder Browser)
  public async addAudioFiles(files: FileList | File[], ctx: AudioContext): Promise<SoundSample[]> {
    const newlyAdded: SoundSample[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.match(/\.(wav|aif|aiff|mp3|ogg|flac)$/i)) continue;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const peakData = extractPeakData(audioBuffer, 48);

        let category: SoundSample['category'] = 'custom';
        const nameLower = file.name.toLowerCase();
        if (nameLower.includes('open') || nameLower.includes('oh')) {
          category = 'open_hat';
        } else if (nameLower.includes('pedal') || nameLower.includes('foot')) {
          category = 'pedal_hat';
        } else if (nameLower.includes('shaker')) {
          category = 'shaker';
        } else if (nameLower.includes('clave') || nameLower.includes('rim')) {
          category = 'clave';
        } else if (nameLower.includes('snare') || nameLower.includes('perc')) {
          category = 'perc';
        } else if (nameLower.includes('hat') || nameLower.includes('ch') || nameLower.includes('hihat')) {
          category = 'closed_hat';
        }

        const sample: SoundSample = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          category,
          tags: ['custom', 'uploaded', category],
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          durationSeconds: audioBuffer.duration,
          buffer: audioBuffer,
          peakData,
          isCustom: true,
        };

        newlyAdded.push(sample);
        this.samples.push(sample);

        // Store into IndexedDB
        await this.saveSampleToDB(sample, arrayBuffer);
      } catch (err) {
        console.warn(`Could not decode audio file ${file.name}:`, err);
      }
    }

    return newlyAdded;
  }

  // IndexedDB Storage
  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  private saveSampleToDB(sample: SoundSample, rawData: ArrayBuffer): Promise<void> {
    if (!this.db) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        id: sample.id,
        name: sample.name,
        category: sample.category,
        tags: sample.tags,
        fileSize: sample.fileSize,
        durationSeconds: sample.durationSeconds,
        peakData: sample.peakData,
        isCustom: true,
        rawData,
      };
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private loadSamplesFromDB(ctx: AudioContext): Promise<SoundSample[]> {
    if (!this.db) return Promise.resolve([]);
    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = async () => {
        const records = req.result || [];
        const loaded: SoundSample[] = [];

        for (const rec of records) {
          try {
            const audioBuffer = await ctx.decodeAudioData(rec.rawData.slice(0));
            loaded.push({
              id: rec.id,
              name: rec.name,
              category: rec.category,
              tags: rec.tags,
              fileSize: rec.fileSize,
              durationSeconds: rec.durationSeconds,
              buffer: audioBuffer,
              peakData: rec.peakData,
              isCustom: true,
            });
          } catch {
            // ignore decode error on cached buffer
          }
        }
        resolve(loaded);
      };

      req.onerror = () => resolve([]);
    });
  }
}

export const sampleLibrary = new SampleLibraryService();
