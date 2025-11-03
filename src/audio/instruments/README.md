# Virtual Instruments

Built-in instrument modules for MIDI track playback using Web Audio API.

## Features

- **Polyphonic Subtractive Synth**: Classic analog-style synthesizer with dual oscillators, ADSR envelopes, resonant filter, and LFO modulation
- **FM Synth**: Frequency modulation synthesizer for creating metallic, bell-like, and complex timbres
- **Sampler**: Multi-sample playback instrument with per-note sample mapping and envelope control
- **Drum Machine**: Step sequencer with customizable pads and pattern playback

## Architecture

### Core Interfaces

```typescript
interface Instrument {
  readonly type: InstrumentType;
  readonly context: AudioContext;
  readonly output: GainNode;
  
  noteOn(note: number, velocity: number, time?: number): void;
  noteOff(note: number, time?: number): void;
  allNotesOff(): void;
  
  setParam(param: string, value: number | string | boolean, time?: number): void;
  getParam(param: string): number | string | boolean | undefined;
  
  loadPreset(preset: InstrumentPreset): void;
  getPreset(): InstrumentPreset;
  
  connect(destination: AudioNode): void;
  disconnect(): void;
  dispose(): void;
}
```

## Usage

### Basic Setup

```typescript
import { InstrumentFactory } from './audio/instruments';

const context = new AudioContext();
const instrument = InstrumentFactory.create('subtractive', context);
instrument.connect(context.destination);

// Play a note
instrument.noteOn(60, 100); // Middle C at velocity 100
setTimeout(() => instrument.noteOff(60), 500);

// Cleanup
instrument.dispose();
```

### Loading Presets

```typescript
import { PresetLoader } from './audio/instruments';

// Load presets for an instrument type
const presets = await PresetLoader.loadPresets('subtractive');

// Apply a preset
instrument.loadPreset(presets[0]);

// Save custom preset
const currentPreset = instrument.getPreset();
currentPreset.name = 'My Custom Sound';
PresetLoader.saveCustomPreset(currentPreset);
```

### Instrument Manager

For managing multiple instruments across tracks:

```typescript
import { instrumentManager } from './audio/instruments';

// Initialize with audio context
instrumentManager.initialize(context, masterGain);

// Create instrument for a track
const instrument = instrumentManager.createInstrument('track-1', 'fm');

// Play notes
instrumentManager.noteOn('track-1', 64, 120);
instrumentManager.noteOff('track-1', 64);

// Change parameters
instrumentManager.setParam('track-1', 'volume', 0.8);

// Cleanup
instrumentManager.dispose();
```

### React Hook

```typescript
import { useInstrument } from '../hooks/useInstrument';

function InstrumentComponent({ trackId }: { trackId: string }) {
  const { instrument, noteOn, noteOff, loadPreset } = useInstrument({
    trackId,
    instrumentType: 'subtractive',
  });

  return (
    <button onClick={() => {
      noteOn(60, 100);
      setTimeout(() => noteOff(60), 500);
    }}>
      Play Note
    </button>
  );
}
```

## Instruments

### Subtractive Synth

Classic analog-style synthesis with:
- Dual oscillators (sawtooth, square, triangle, sine)
- Detune control for oscillator 2
- Oscillator mixing
- Resonant lowpass/highpass/bandpass filter
- Independent ADSR envelopes for amplitude and filter
- LFO with rate and amount controls
- LFO routing to pitch, filter, or amplitude

**Key Parameters:**
- `oscillatorType`, `oscillator2Type`: Waveform selection
- `oscillator2Detune`: Detuning in semitones
- `oscillator2Mix`: Blend between oscillators
- `filterFrequency`, `filterQ`: Filter cutoff and resonance
- `filterEnvAmount`: Filter envelope modulation depth
- `lfoRate`, `lfoAmount`: LFO speed and intensity

### FM Synth

Frequency modulation synthesis for bell-like and metallic tones:
- Carrier and modulator oscillators
- Independent waveform selection
- Carrier/modulator ratio control
- Modulation index (depth)
- ADSR envelope

**Key Parameters:**
- `carrierRatio`, `modulatorRatio`: Frequency multipliers
- `modulationIndex`: FM depth (0-1000)
- `attack`, `decay`, `sustain`, `release`: Envelope

### Sampler

Multi-sample playback with pitch shifting:
- Per-note sample mapping with automatic fallback
- Pitch-shifted playback for unmapped notes
- Filter with envelope control
- Loop support with start/end points
- Lazy loading of samples

**Key Parameters:**
- `filterFrequency`, `filterQ`: Post-sample filtering
- `playbackRate`: Speed adjustment
- `loopEnabled`, `loopStart`, `loopEnd`: Looping controls
- `attack`, `decay`, `sustain`, `release`: Amplitude envelope

**Loading Samples:**
```typescript
const sampler = instrument as Sampler;
await sampler.loadSample(60, '/assets/samples/piano_C4.wav');
await sampler.loadMultiSamples({
  60: '/assets/samples/piano_C4.wav',
  64: '/assets/samples/piano_E4.wav',
  67: '/assets/samples/piano_G4.wav',
});
```

### Drum Machine

Step sequencer with pattern playback:
- 4+ customizable drum pads
- Per-pad volume and pan
- Pattern programming with up to 32 steps
- Swing control
- Individual sample loading per pad

**Key Parameters:**
- `swing`: Swing amount (0-0.75)
- `stepLength`: Time per step in seconds
- `padVolume-{note}`: Volume for specific pad
- `padPan-{note}`: Pan for specific pad

**Pattern Playback:**
```typescript
const drums = instrument as DrumMachine;

// Load samples
await drums.loadPadSample(36, '/assets/samples/kick.wav');
await drums.loadPadSample(38, '/assets/samples/snare.wav');

// Set pattern
drums.setPattern({
  id: 'pattern-1',
  name: 'Basic Beat',
  steps: 16,
  beatDivision: 4,
  pads: new Map([
    [36, [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false]],
    [38, [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]],
  ]),
});

// Start pattern
drums.startPattern();
```

## Presets

Preset files are JSON arrays located in `/public/assets/presets/`:
- `subtractive-presets.json`
- `fm-presets.json`
- `sampler-presets.json`
- `drum-presets.json`

Each preset includes:
```typescript
{
  "id": "unique-id",
  "name": "Preset Name",
  "instrumentType": "subtractive",
  "author": "Author Name",
  "description": "Brief description",
  "tags": ["tag1", "tag2"],
  "params": {
    // Instrument-specific parameters
  }
}
```

## Sample Assets

Audio samples are stored in `/public/assets/samples/`:
- `drums/`: Drum machine samples (kick, snare, hi-hats, etc.)
- `sampler/`: Melodic samples for sampler instruments

Samples are:
- Lazy loaded on demand
- Cached via service worker for offline use
- Decoded once and reused across instrument instances

## Caching Strategy

The service worker caches instrument assets using `StaleWhileRevalidate`:
- Presets load from cache when available
- Samples load from cache for instant playback
- Background updates keep assets fresh
- Offline support for all instruments

## Performance

- Polyphonic: All instruments support multiple simultaneous voices
- Voice management: Automatic cleanup of released voices
- Efficient scheduling: Uses Web Audio's built-in timing
- Lazy loading: Samples load only when needed
- Memory management: Buffers shared across instrument instances

## Extending

To add a new instrument:

1. Implement the `Instrument` interface
2. Register in `InstrumentFactory`
3. Create preset JSON file
4. Update `InstrumentType` union
5. Add UI controls in `InstrumentPanel.tsx`

Example:
```typescript
export class MyNewSynth implements Instrument {
  readonly type = 'mynewsynth' as const;
  // ... implement interface methods
}
```
