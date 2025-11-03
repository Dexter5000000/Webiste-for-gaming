function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}

export function generatePlaceholderWaveform(
  clipId: string,
  duration: number,
  offsetSeconds = 0,
  sampleRate: number = 44100
): Float32Array[] {
  const seed = simpleHash(clipId);
  const rng = new SeededRandom(seed);
  
  const numSamples = Math.max(1, Math.floor(duration * sampleRate));
  const leftChannel = new Float32Array(numSamples);
  const rightChannel = new Float32Array(numSamples);
  
  const frequency = 220 + rng.next() * 440;
  const noiseAmount = 0.1 + rng.next() * 0.2;
  const phaseOffset = offsetSeconds * frequency * 2 * Math.PI;
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const phase = 2 * Math.PI * frequency * t + phaseOffset;
    const sine = Math.sin(phase) * 0.5;
    const noise = (rng.next() - 0.5) * noiseAmount;
    const attack = Math.min(1, t * 4);
    const release = Math.min(1, (duration - t) * 4);
    const envelope = Math.max(0.05, attack * release);
    
    leftChannel[i] = (sine + noise) * envelope;
    rightChannel[i] = (Math.sin(phase * 1.05) * 0.4 + noise * 1.1) * envelope;
  }
  
  return [leftChannel, rightChannel];
}

export function computeWaveformPeaks(
  channelData: Float32Array[],
  targetWidth: number
): number[] {
  const length = channelData[0].length;
  const samplesPerPixel = Math.max(1, Math.floor(length / targetWidth));
  
  const peaks: number[] = [];
  
  for (let pixel = 0; pixel < targetWidth; pixel++) {
    const startSample = pixel * samplesPerPixel;
    const endSample = Math.min(startSample + samplesPerPixel, length);
    
    let min = 1;
    let max = -1;
    
    for (let channel = 0; channel < channelData.length; channel++) {
      for (let i = startSample; i < endSample; i++) {
        const sample = channelData[channel][i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
    }
    
    peaks.push(min);
    peaks.push(max);
  }
  
  return peaks;
}
