# Audio Engine Core

A comprehensive audio engine built on the Web Audio API with transport controls, precise scheduling, and track management.

## Features

- **Transport System**: Play, pause, stop, loop controls with tempo and bar/beat clock
- **Track Management**: Audio and instrument tracks with gain, pan, sends, and master bus routing
- **Precise Scheduling**: Lookahead scheduler with sample-accurate timing via AudioWorklet
- **State Management**: Reactive state store that integrates with tracks and transport
- **Metronome**: Built-in click track with bar/beat events
- **Buffer Cache**: Efficient audio buffer loading and caching
- **Event System**: Typed events for UI integration (position updates, state changes)

## Basic Usage

```typescript
import { AudioEngine, AudioStateStore } from './audio/AudioEngine';
import { AudioStateStore as Store } from './audio/AudioState';

// Create audio engine
const engine = new AudioEngine({
  initialTempo: 120,
  lookaheadSeconds: 0.1,
  metronomeEnabled: true,
  metronomeLevel: 0.4,
});

// Create and attach state store for reactive updates
const store = new Store();
engine.attachStore(store);

// Listen to transport events
engine.on('transport:state', (state) => {
  console.log('Transport state:', state);
});

engine.on('transport:position', ({ bar, beat, position }) => {
  console.log(`Position: Bar ${bar}, Beat ${beat}, ${position.toFixed(2)}s`);
});

engine.on('metronome:tick', ({ bar, beat }) => {
  console.log(`Metronome: Bar ${bar}, Beat ${beat}`);
});

// Create tracks
const audioTrack = engine.createTrack({
  id: 'track1',
  type: 'audio',
  volume: 0.8,
  pan: 0.2,
});

const instrumentTrack = engine.createTrack({
  id: 'track2',
  type: 'instrument',
  volume: 0.9,
  pan: -0.1,
});

// Load and cache audio buffer
const response = await fetch('/audio/sample.wav');
const arrayBuffer = await response.arrayBuffer();
const buffer = await engine.audioContext.decodeAudioData(arrayBuffer);
engine.buffers.set('sample1', buffer);

// Schedule clips
engine.scheduleClip({
  trackId: 'track1',
  buffer,
  startBeat: 0,
  offset: 0,
  duration: 4,
  loop: true,
});

// Transport controls
await engine.play();
engine.setTempo(140);
engine.setLoop(true, 0, 16);
engine.seek(8);
await engine.pause();
engine.stop();

// Cleanup
engine.dispose();
```

## State Store Integration

The Audio Engine can be attached to a state store for reactive updates:

```typescript
import { AudioStateStore } from './audio/AudioState';

const store = new AudioStateStore();
engine.attachStore(store);

// Subscribe to state changes
store.subscribe((state) => {
  console.log('Audio state updated:', state);
});

// Update state (will sync to engine)
store.updateTransport({ tempo: 130 });
store.addTrack({
  id: 'newTrack',
  name: 'New Track',
  type: 'audio',
  gain: 0.8,
  pan: 0,
  muted: false,
  solo: false,
  sends: new Map(),
});
```

## Tempo-Synced Utilities

```typescript
import {
  beatsToSeconds,
  secondsToBeats,
  barsToBeats,
  barsToSeconds,
  beatsToBars,
} from './audio/utils/tempo';

const tempo = 120;
const timeSignature = { beatsPerBar: 4, beatValue: 4 };

// Convert between time units
const seconds = beatsToSeconds(16, tempo); // 8 seconds at 120 BPM
const beats = secondsToBeats(8, tempo); // 16 beats at 120 BPM
const bars = beatsToBars(16, timeSignature); // 4 bars
```

## Architecture

### AudioEngine
Main controller that coordinates all subsystems:
- Creates and manages AudioContext
- Hosts Transport, Scheduler, Metronome, and Clock
- Manages track graphs and master bus
- Provides buffer cache and event emission

### Transport
Controls playback state and timing:
- Play/pause/stop/seek operations
- Tempo and loop management
- Position tracking with bar/beat clock
- Emits position updates for UI

### Scheduler
Lookahead scheduler for precise event timing:
- Schedules events ahead of playback
- Processes events within lookahead window
- Used for clip scheduling and metronome

### Track Graph
Audio node graph for each track:
- Gain and pan nodes
- Send/return routing
- Cue bus support
- Clip scheduling and playback

### Metronome
Click track implementation:
- Scheduled via lookahead scheduler
- Emits tick events with bar/beat info
- Configurable level

### Buffer Cache
Manages decoded audio buffers:
- Load and cache audio assets
- Prevent redundant decoding
- Handle concurrent requests

## Testing

The audio engine includes comprehensive unit tests using mocked Web Audio API:

```bash
npm test
```

## Events

### transport:state
Emitted when transport state changes (play, pause, stop, tempo, loop)

### transport:position
Emitted periodically during playback with current position, bar, and beat

### track:updated
Emitted when track properties change (volume, pan, cue level)

### metronome:tick
Emitted on each metronome beat with bar and beat numbers

### engine:error
Emitted when errors occur during operation
