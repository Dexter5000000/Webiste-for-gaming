import { describe, it, expect, beforeEach } from 'vitest';
import { 
  AudioEngine, 
  AudioContextLike, 
  AudioNodeLike, 
  GainNodeLike,
  StereoPannerNodeLike,
  AudioBufferSourceNodeLike,
  AudioBufferLike
} from '../AudioEngine';

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

class MockStereoPannerNode extends MockAudioNode implements StereoPannerNodeLike {
  pan = new MockAudioParam();
}

class MockAudioBufferSourceNode extends MockAudioNode implements AudioBufferSourceNodeLike {
  buffer: AudioBufferLike | null = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  playbackRate = new MockAudioParam();
  onended: (() => void) | null = null;
  start(): void {}
  stop(): void {}
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

class MockAudioContext implements AudioContextLike {
  currentTime = 0;
  sampleRate = 44100;
  destination = new MockAudioNode();
  
  createGain(): GainNodeLike {
    return new MockGainNode();
  }
  
  createStereoPanner(): StereoPannerNodeLike {
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
  
  async resume(): Promise<void> {}
  async suspend(): Promise<void> {}
  async close(): Promise<void> {}
}

describe('Transport', () => {
  let mockContext: MockAudioContext;
  let engine: AudioEngine;
  
  beforeEach(() => {
    mockContext = new MockAudioContext();
    engine = new AudioEngine({ context: mockContext, initialTempo: 120 });
  });
  
  it('should start in stopped state', () => {
    const state = engine.transportState;
    expect(state.isPlaying).toBe(false);
    expect(state.position).toBe(0);
  });
  
  it('should transition to playing state', async () => {
    await engine.play();
    expect(engine.transportState.isPlaying).toBe(true);
  });
  
  it('should update tempo', () => {
    engine.setTempo(140);
    expect(engine.transportState.tempo).toBe(140);
  });
  
  it('should enable loop with range', () => {
    engine.setLoop(true, 0, 16);
    const state = engine.transportState;
    expect(state.loop).toBe(true);
    expect(state.loopStart).toBe(0);
    expect(state.loopEnd).toBe(16);
  });
  
  it('should seek to position', () => {
    engine.seek(8);
    expect(engine.transportState.position).toBe(8);
  });
  
  it('should calculate bar and beat from position', () => {
    engine.setTempo(120);
    engine.seek(2);
    const state = engine.transportState;
    expect(state.bar).toBeGreaterThan(0);
    expect(state.beat).toBeGreaterThan(0);
  });
  
  it('should pause and maintain position', async () => {
    await engine.play();
    mockContext.currentTime = 2;
    await engine.pause();
    const state = engine.transportState;
    expect(state.isPlaying).toBe(false);
  });
  
  it('should stop and reset to zero', async () => {
    await engine.play();
    mockContext.currentTime = 5;
    engine.stop();
    const state = engine.transportState;
    expect(state.isPlaying).toBe(false);
    expect(state.position).toBe(0);
  });
});
