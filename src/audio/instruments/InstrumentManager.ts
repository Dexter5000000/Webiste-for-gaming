import { InstrumentFactory } from './InstrumentFactory';
import type { Instrument, InstrumentType, InstrumentPreset } from './types';

export class InstrumentManager {
  private instruments: Map<string, Instrument> = new Map();
  private context: AudioContext | null = null;
  private destination: AudioNode | null = null;

  initialize(context: AudioContext, destination: AudioNode): void {
    this.context = context;
    this.destination = destination;
  }

  createInstrument(trackId: string, type: InstrumentType): Instrument | null {
    if (!this.context) {
      console.error('InstrumentManager not initialized');
      return null;
    }

    if (this.instruments.has(trackId)) {
      this.removeInstrument(trackId);
    }

    const instrument = InstrumentFactory.create(type, this.context);
    
    if (this.destination) {
      instrument.connect(this.destination);
    }

    this.instruments.set(trackId, instrument);
    return instrument;
  }

  getInstrument(trackId: string): Instrument | undefined {
    return this.instruments.get(trackId);
  }

  removeInstrument(trackId: string): void {
    const instrument = this.instruments.get(trackId);
    if (instrument) {
      instrument.dispose();
      this.instruments.delete(trackId);
    }
  }

  loadPreset(trackId: string, preset: InstrumentPreset): void {
    const instrument = this.instruments.get(trackId);
    if (instrument) {
      instrument.loadPreset(preset);
    }
  }

  noteOn(trackId: string, note: number, velocity: number, time?: number): void {
    const instrument = this.instruments.get(trackId);
    if (instrument) {
      instrument.noteOn(note, velocity, time);
    }
  }

  noteOff(trackId: string, note: number, time?: number): void {
    const instrument = this.instruments.get(trackId);
    if (instrument) {
      instrument.noteOff(note, time);
    }
  }

  allNotesOff(trackId?: string): void {
    if (trackId) {
      const instrument = this.instruments.get(trackId);
      if (instrument) {
        instrument.allNotesOff();
      }
    } else {
      this.instruments.forEach((instrument) => {
        instrument.allNotesOff();
      });
    }
  }

  setParam(trackId: string, param: string, value: number | string | boolean, time?: number): void {
    const instrument = this.instruments.get(trackId);
    if (instrument) {
      instrument.setParam(param, value, time);
    }
  }

  dispose(): void {
    this.instruments.forEach((instrument) => {
      instrument.dispose();
    });
    this.instruments.clear();
    this.context = null;
    this.destination = null;
  }
}

export const instrumentManager = new InstrumentManager();
