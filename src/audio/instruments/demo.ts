import { InstrumentFactory } from './InstrumentFactory';
import { PresetLoader } from './PresetLoader';
import { SampleGenerator } from './SampleGenerator';
import type { Instrument, InstrumentType, DrumMachine } from './types';

export async function demoInstrument(type: InstrumentType): Promise<void> {
  const context = new AudioContext();
  await context.resume();

  const instrument = InstrumentFactory.create(type, context);
  instrument.connect(context.destination);

  if (type === 'drums') {
    await setupDrumMachineSamples(instrument as unknown as DrumMachine, context);
  }

  const presets = await PresetLoader.loadPresets(type);
  if (presets.length > 0) {
    instrument.loadPreset(presets[0]);
  }

  console.log(`Created ${type} instrument:`, instrument);
  console.log('Available presets:', presets);

  if (type === 'drums') {
    playDrumPattern(instrument);
  } else {
    playMelody(instrument);
  }

  setTimeout(() => {
    instrument.dispose();
    context.close();
  }, 10000);
}

function playMelody(instrument: Instrument): void {
  const melody = [60, 62, 64, 65, 67, 69, 71, 72];
  let time = 0;

  melody.forEach((note, index) => {
    setTimeout(() => {
      instrument.noteOn(note, 100);
      setTimeout(() => {
        instrument.noteOff(note);
      }, 400);
    }, time);
    time += 500;
  });
}

function playDrumPattern(instrument: Instrument): void {
  const kicks = [0, 500, 1000, 1500];
  const snares = [500, 1500];
  const hats = [0, 250, 500, 750, 1000, 1250, 1500, 1750];

  kicks.forEach((time) => {
    setTimeout(() => instrument.noteOn(36, 127), time);
  });

  snares.forEach((time) => {
    setTimeout(() => instrument.noteOn(38, 110), time);
  });

  hats.forEach((time) => {
    setTimeout(() => instrument.noteOn(42, 80), time);
  });
}

async function setupDrumMachineSamples(drumMachine: DrumMachine, context: AudioContext): Promise<void> {
  const kickBuffer = SampleGenerator.generateKick(context);
  const snareBuffer = SampleGenerator.generateSnare(context);
  const hatBuffer = SampleGenerator.generateHiHat(context, 0.1, false);
  const openHatBuffer = SampleGenerator.generateHiHat(context, 0.1, true);

  const samples = new Map<number, AudioBuffer>();
  samples.set(36, kickBuffer);
  samples.set(38, snareBuffer);
  samples.set(42, hatBuffer);
  samples.set(46, openHatBuffer);

  // @ts-expect-error - accessing private property for demo purposes
  drumMachine.samples = samples;
}

export async function demoAllInstruments(): Promise<void> {
  const types: InstrumentType[] = ['subtractive', 'fm', 'sampler', 'drums'];
  
  for (const type of types) {
    console.log(`\n=== Demo: ${type} ===`);
    await demoInstrument(type);
    await new Promise((resolve) => setTimeout(resolve, 11000));
  }
}
