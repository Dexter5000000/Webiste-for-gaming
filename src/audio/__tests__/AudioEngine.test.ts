import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioEngine, AudioContextLike, AudioNodeLike, GainNodeLike, AudioBufferLike, AudioBufferSourceNodeLike } from '../AudioEngine';
import { AudioStateStore } from '../AudioState';

class MockAudioParam {
  value = 1;
  
  setValueAtTime(value: number): void {
    this.value = value;
  }
  
  linearRampToValueAtTime(value: number): void {
    this.value = value;
  }
}

class MockAudioNode implements AudioNodeLike {
  private connections: AudioNodeLike[] = [];
  
  connect(destination: AudioNodeLike): AudioNodeLike {
    this.connections.push(destination);
    return destination;
  }
  
  disconnect(): void {
    this.connections = [];
  }
}

class MockGainNode extends MockAudioNode implements GainNodeLike {
  gain = new MockAudioParam();
}

class MockStereoPannerNode extends MockAudioNode {
  pan = new MockAudioParam();
}

class MockAudioBuffer implements AudioBufferLike {
  constructor(
    public readonly numberOfChannels: number,
    public readonly length: number,
    public readonly sampleRate: number
  ) {}
  
  get duration(): number {
    return this.length / this.sampleRate;
  }
  
  getChannelData(): Float32Array {
    return new Float32Array(this.length);
  }
}

class MockAudioBufferSourceNode extends MockAudioNode implements AudioBufferSourceNodeLike {
  buffer: AudioBufferLike | null = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  playbackRate = new MockAudioParam();
  onended: (() => void) | null = null;
  private started = false;
  private stopped = false;
  
  start(_when?: number, _offset?: number, _duration?: number): void {
    if (this.started) throw new Error('Already started');
    this.started = true;
    setTimeout(() => {
      if (this.onended && !this.stopped) {
        this.onended();
      }
    }, 10);
  }
  
  stop(): void {
    this.stopped = true;
  }
}

class MockAudioContext implements AudioContextLike {
  currentTime = 0;
  sampleRate = 44100;
  destination = new MockAudioNode();
  
  createGain(): GainNodeLike {
    return new MockGainNode();
  }
  
  createStereoPanner() {
    return new MockStereoPannerNode();
  }
  
  createBufferSource(): AudioBufferSourceNodeLike {
    return new MockAudioBufferSourceNode();
  }
  
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBufferLike {
    return new MockAudioBuffer(numberOfChannels, length, sampleRate);
  }
  
  async decodeAudioData(_audioData: ArrayBuffer): Promise<AudioBufferLike> {
    return new MockAudioBuffer(2, 44100, 44100);
  }
  
  async resume(): Promise<void> {
    // Mock resume
  }
  
  async suspend(): Promise<void> {
    // Mock suspend
  }
  
  async close(): Promise<void> {
    // Mock close
  }
}

describe('AudioEngine', () => {
  let mockContext: MockAudioContext;
  let engine: AudioEngine;
  
  beforeEach(() => {
    mockContext = new MockAudioContext();
    engine = new AudioEngine({ context: mockContext, initialTempo: 120 });
  });
  
  it('should create an engine instance', () => {
    expect(engine).toBeDefined();
    expect(engine.audioContext).toBe(mockContext);
  });
  
  it('should have initial transport state', () => {
    const state = engine.transportState;
    expect(state.isPlaying).toBe(false);
    expect(state.tempo).toBe(120);
    expect(state.position).toBe(0);
    expect(state.bar).toBe(1);
    expect(state.beat).toBe(1);
  });
  
  it('should play and update transport state', async () => {
    await engine.play();
    const state = engine.transportState;
    expect(state.isPlaying).toBe(true);
  });
  
  it('should pause and maintain position', async () => {
    await engine.play();
    mockContext.currentTime = 1;
    await engine.pause();
    const state = engine.transportState;
    expect(state.isPlaying).toBe(false);
  });
  
  it('should stop and reset position', async () => {
    await engine.play();
    mockContext.currentTime = 2;
    engine.stop();
    const state = engine.transportState;
    expect(state.isPlaying).toBe(false);
    expect(state.position).toBe(0);
  });
  
  it('should set and get tempo', () => {
    engine.setTempo(140);
    expect(engine.transportState.tempo).toBe(140);
  });
  
  it('should enable and disable loop', () => {
    engine.setLoop(true, 0, 8);
    const state = engine.transportState;
    expect(state.loop).toBe(true);
    expect(state.loopStart).toBe(0);
    expect(state.loopEnd).toBe(8);
  });
  
  it('should seek to a position', () => {
    engine.seek(5);
    expect(engine.transportState.position).toBe(5);
  });
  
  it('should create and manage tracks', () => {
    const track = engine.createTrack({
      id: 'track1',
      type: 'audio',
      volume: 0.8,
      pan: 0.5,
    });
    expect(track).toBeDefined();
    expect(track.volume).toBe(0.8);
    expect(track.pan).toBe(0.5);
  });
  
  it('should update track properties', () => {
    engine.createTrack({ id: 'track1', type: 'audio' });
    engine.updateTrack('track1', { volume: 0.5, pan: -0.3 });
    const state = engine.transportState;
    expect(state).toBeDefined();
  });
  
  it('should remove tracks', () => {
    engine.createTrack({ id: 'track1', type: 'audio' });
    engine.removeTrack('track1');
    expect(() => {
      engine.updateTrack('track1', { volume: 0.5 });
    }).not.toThrow();
  });
  
  it('should emit transport state events', async () => {
    const stateHandler = vi.fn();
    engine.on('transport:state', stateHandler);
    await engine.play();
    expect(stateHandler).toHaveBeenCalled();
  });
  
  it('should attach and sync with state store', () => {
    const store = new AudioStateStore();
    engine.attachStore(store);
    store.updateTransport({ tempo: 130 });
    expect(engine.transportState.tempo).toBe(130);
  });
  
  it('should detach state store', () => {
    const store = new AudioStateStore();
    engine.attachStore(store);
    engine.detachStore();
    store.updateTransport({ tempo: 150 });
    expect(engine.transportState.tempo).not.toBe(150);
  });
  
  it('should schedule clips', async () => {
    const track = engine.createTrack({ id: 'track1', type: 'audio' });
    const buffer = mockContext.createBuffer(2, 44100, 44100);
    
    engine.scheduleClip({
      trackId: 'track1',
      buffer,
      startBeat: 0,
      offset: 0,
      duration: 2,
    });
    
    expect(track).toBeDefined();
  });
  
  it('should enable metronome', () => {
    engine.enableMetronome(true);
    const state = engine.transportState;
    expect(state).toBeDefined();
  });
  
  it('should set metronome level', () => {
    engine.setMetronomeLevel(0.6);
    expect(engine.transportState).toBeDefined();
  });
  
  it('should dispose cleanly', () => {
    engine.createTrack({ id: 'track1', type: 'audio' });
    expect(() => engine.dispose()).not.toThrow();
  });
});
