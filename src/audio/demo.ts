import { AudioEngine, type AudioBufferLike } from './AudioEngine';
import { AudioStateStore } from './AudioState';

export class AudioEngineDemo {
  private engine: AudioEngine;
  private store: AudioStateStore;
  private sampleBuffer: AudioBufferLike | null = null;

  constructor() {
    this.store = new AudioStateStore();
    this.engine = new AudioEngine({
      initialTempo: 120,
      lookaheadSeconds: 0.1,
      schedulerIntervalMs: 25,
      metronomeEnabled: true,
      metronomeLevel: 0.3,
      positionUpdateInterval: 0.05,
    });

    this.engine.attachStore(this.store);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.engine.on('transport:state', (state) => {
      console.log('Transport:', state.isPlaying ? 'Playing' : state.position > 0 ? 'Paused' : 'Stopped');
      console.log('Tempo:', state.tempo, 'BPM');
      console.log('Position:', `Bar ${state.bar}, Beat ${state.beat}`);
    });

    this.engine.on('transport:position', ({ bar, beat, position }) => {
      this.updateUI({ bar, beat, position });
    });

    this.engine.on('metronome:tick', ({ bar, beat }) => {
      this.flashMetronome(bar, beat);
    });

    this.engine.on('track:updated', (track) => {
      console.log(`Track ${track.id} updated:`, track);
    });

    this.engine.on('engine:error', (error) => {
      console.error('Audio Engine Error:', error);
    });
  }

  async loadSampleBuffer(): Promise<void> {
    const syntheticBuffer = this.engine.audioContext.createBuffer(
      2,
      this.engine.audioContext.sampleRate * 2,
      this.engine.audioContext.sampleRate
    );

    const leftChannel = syntheticBuffer.getChannelData(0);
    const rightChannel = syntheticBuffer.getChannelData(1);

    const frequency = 440;
    const sampleRate = this.engine.audioContext.sampleRate;

    for (let i = 0; i < syntheticBuffer.length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2);
      const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }

    this.sampleBuffer = syntheticBuffer;
    this.engine.buffers.set('demo-sample', syntheticBuffer);
    console.log('Sample buffer loaded');
  }

  setupTracks(): void {
    this.engine.createTrack({
      id: 'drums',
      name: 'Drums',
      type: 'audio',
      volume: 0.8,
      pan: 0,
      cueLevel: 0.5,
    });

    this.engine.createTrack({
      id: 'bass',
      name: 'Bass',
      type: 'audio',
      volume: 0.7,
      pan: -0.2,
      cueLevel: 0.3,
    });

    this.engine.createTrack({
      id: 'melody',
      name: 'Melody',
      type: 'instrument',
      volume: 0.6,
      pan: 0.3,
      sends: {
        reverb: 0.4,
      },
      cueLevel: 0.2,
    });

    console.log('Created tracks:', ['drums', 'bass', 'melody']);
  }

  async play(): Promise<void> {
    await this.engine.play();
    console.log('Playback started');
  }

  async pause(): Promise<void> {
    await this.engine.pause();
    console.log('Playback paused');
  }

  stop(): void {
    this.engine.stop();
    console.log('Playback stopped');
  }

  setTempo(tempo: number): void {
    this.engine.setTempo(tempo);
    console.log('Tempo set to:', tempo, 'BPM');
  }

  enableLoop(start: number, end: number): void {
    this.engine.setLoop(true, start, end);
    console.log(`Loop enabled: ${start}s - ${end}s`);
  }

  disableLoop(): void {
    this.engine.setLoop(false);
    console.log('Loop disabled');
  }

  seek(position: number): void {
    this.engine.seek(position);
    console.log('Seeked to:', position, 'seconds');
  }

  scheduleClips(): void {
    if (!this.sampleBuffer) {
      console.error('Sample buffer not loaded');
      return;
    }

    this.engine.scheduleClip({
      trackId: 'drums',
      buffer: this.sampleBuffer,
      startBeat: 0,
      offset: 0,
      duration: 2,
      loop: true,
    });

    this.engine.scheduleClip({
      trackId: 'bass',
      buffer: this.sampleBuffer,
      startBeat: 4,
      offset: 0,
      duration: 1.5,
      loop: true,
    });

    this.engine.scheduleClip({
      trackId: 'melody',
      buffer: this.sampleBuffer,
      startBeat: 8,
      offset: 0.2,
      duration: 1,
      loop: true,
    });

    console.log('Clips scheduled');
  }

  toggleMetronome(): void {
    const newState = !this.store.getState().metronomeEnabled;
    this.engine.enableMetronome(newState);
    console.log('Metronome:', newState ? 'enabled' : 'disabled');
  }

  updateTrackVolume(trackId: string, volume: number): void {
    this.engine.updateTrack(trackId, { volume });
    console.log(`Track ${trackId} volume:`, volume);
  }

  updateTrackPan(trackId: string, pan: number): void {
    this.engine.updateTrack(trackId, { pan });
    console.log(`Track ${trackId} pan:`, pan);
  }

  private updateUI(_position: { bar: number; beat: number; position: number }): void {
    // Update UI elements with position info
    // This would be called from the transport:position event
  }

  private flashMetronome(bar: number, beat: number): void {
    // Flash visual metronome indicator
    console.log(`♪ Bar ${bar}, Beat ${beat}`);
  }

  cleanup(): void {
    this.engine.dispose();
    console.log('Audio engine disposed');
  }
}

// Example usage:
export function initAudioEngineDemo(): AudioEngineDemo {
  const demo = new AudioEngineDemo();

  (async () => {
    await demo.loadSampleBuffer();
    demo.setupTracks();
    demo.setTempo(128);
    demo.enableLoop(0, 16);
    demo.scheduleClips();

    console.log('Demo initialized. Use the following commands:');
    console.log('  demo.play()');
    console.log('  demo.pause()');
    console.log('  demo.stop()');
    console.log('  demo.setTempo(140)');
    console.log('  demo.toggleMetronome()');
    console.log('  demo.updateTrackVolume("drums", 0.5)');
    console.log('  demo.updateTrackPan("melody", 0.5)');
  })();

  return demo;
}

// For window access in browser console
if (typeof window !== 'undefined') {
  const globalWindow = window as Window & {
    AudioEngineDemo?: typeof AudioEngineDemo;
    initAudioEngineDemo?: typeof initAudioEngineDemo;
  };
  globalWindow.AudioEngineDemo = AudioEngineDemo;
  globalWindow.initAudioEngineDemo = initAudioEngineDemo;
}
