export class SampleGenerator {
  static generateKick(context: AudioContext, duration = 0.5): AudioBuffer {
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 20);
      const freq = 150 * Math.exp(-t * 80);
      const phase = 2 * Math.PI * freq * t;
      data[i] = Math.sin(phase) * env * 0.8;
    }

    return buffer;
  }

  static generateSnare(context: AudioContext, duration = 0.2): AudioBuffer {
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 30);
      const noise = Math.random() * 2 - 1;
      const tone = Math.sin(2 * Math.PI * 200 * t);
      data[i] = (noise * 0.5 + tone * 0.3) * env * 0.6;
    }

    return buffer;
  }

  static generateHiHat(context: AudioContext, duration = 0.1, open = false): AudioBuffer {
    const actualDuration = open ? duration * 4 : duration;
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * actualDuration);
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const decay = open ? 10 : 40;
      const env = Math.exp(-t * decay);
      const noise = Math.random() * 2 - 1;
      const highpass = noise * (1 - Math.exp(-t * 100));
      data[i] = highpass * env * 0.4;
    }

    return buffer;
  }

  static generateClap(context: AudioContext, duration = 0.15): AudioBuffer {
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 35);
      const noise = Math.random() * 2 - 1;
      const bandpass = noise * Math.sin(2 * Math.PI * 1000 * t);
      data[i] = bandpass * env * 0.5;
    }

    return buffer;
  }

  static generateTom(context: AudioContext, pitch = 80, duration = 0.4): AudioBuffer {
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 15);
      const freq = pitch * Math.exp(-t * 40);
      const phase = 2 * Math.PI * freq * t;
      const tone = Math.sin(phase);
      const noise = (Math.random() * 2 - 1) * 0.1;
      data[i] = (tone + noise) * env * 0.7;
    }

    return buffer;
  }
}
