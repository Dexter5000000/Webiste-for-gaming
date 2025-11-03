import { SubtractiveSynth } from './SubtractiveSynth';
import { FMSynth } from './FMSynth';
import { Sampler } from './Sampler';
import { DrumMachine } from './DrumMachine';
import type { Instrument, InstrumentType } from './types';

export class InstrumentFactory {
  static create(type: InstrumentType, context: AudioContext): Instrument {
    switch (type) {
      case 'subtractive':
        return new SubtractiveSynth(context);
      case 'fm':
        return new FMSynth(context);
      case 'sampler':
        return new Sampler(context);
      case 'drums':
        return new DrumMachine(context);
      default:
        throw new Error(`Unknown instrument type: ${type}`);
    }
  }

  static getAvailableInstruments(): { type: InstrumentType; name: string; description: string }[] {
    return [
      {
        type: 'subtractive',
        name: 'Subtractive Synth',
        description: 'Classic polyphonic synthesizer with oscillators, envelopes, and filter',
      },
      {
        type: 'fm',
        name: 'FM Synth',
        description: 'Frequency modulation synthesizer for metallic and bell-like tones',
      },
      {
        type: 'sampler',
        name: 'Sampler',
        description: 'Multi-sample instrument with per-note sample playback',
      },
      {
        type: 'drums',
        name: 'Drum Machine',
        description: 'Step sequencer with drum pads for rhythmic patterns',
      },
    ];
  }
}
