import { describe, it, expect, beforeEach } from 'vitest';
import { SubtractiveSynth } from '../SubtractiveSynth';

class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  destination = { connect: () => {}, disconnect: () => {} };

  createOscillator() {
    return {
      type: 'sine' as OscillatorType,
      frequency: { value: 440, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
      detune: { value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
    };
  }

  createGain() {
    return {
      gain: { value: 1, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, cancelScheduledValues: () => {} },
      connect: () => {},
      disconnect: () => {},
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass' as BiquadFilterType,
      frequency: { value: 1000, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, cancelScheduledValues: () => {} },
      Q: { value: 1, setValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
    };
  }
}

describe('SubtractiveSynth', () => {
  let context: MockAudioContext;
  let synth: SubtractiveSynth;

  beforeEach(() => {
    context = new MockAudioContext();
    synth = new SubtractiveSynth(context as unknown as AudioContext);
  });

  it('should create a synth instance', () => {
    expect(synth).toBeDefined();
    expect(synth.type).toBe('subtractive');
  });

  it('should have an output node', () => {
    expect(synth.output).toBeDefined();
  });

  it('should trigger noteOn', () => {
    expect(() => synth.noteOn(60, 100)).not.toThrow();
  });

  it('should trigger noteOff', () => {
    synth.noteOn(60, 100);
    expect(() => synth.noteOff(60)).not.toThrow();
  });

  it('should set parameters', () => {
    expect(() => synth.setParam('volume', 0.5)).not.toThrow();
    expect(() => synth.setParam('filterFrequency', 2000)).not.toThrow();
  });

  it('should get parameters', () => {
    synth.setParam('volume', 0.5);
    expect(synth.getParam('volume')).toBe(0.5);
  });

  it('should handle allNotesOff', () => {
    synth.noteOn(60, 100);
    synth.noteOn(64, 100);
    synth.noteOn(67, 100);
    expect(() => synth.allNotesOff()).not.toThrow();
  });

  it('should dispose cleanly', () => {
    synth.noteOn(60, 100);
    expect(() => synth.dispose()).not.toThrow();
  });
});
