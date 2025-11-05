import { BaseEffect, EffectParameter } from './BaseEffect';
import type { AudioContextLike } from '../AudioEngine';

export class CompressorEffect extends BaseEffect {
  private compressor: DynamicsCompressorNode;
  private makeupGain: GainNode;
  private analyzer: AnalyserNode;
  private gainReduction: number = 0;

  constructor(audioContext: AudioContextLike, id: string) {
    super(audioContext, id);
    // Cast to AudioContext for node creation since we need the real methods
    const ctx = audioContext as unknown as AudioContext;
    this.compressor = ctx.createDynamicsCompressor();
    this.makeupGain = ctx.createGain();
    this.analyzer = ctx.createAnalyser();
    this.initializeParameters();
    this.startGainReductionAnalysis();
  }

  public get type(): string {
    return 'compressor';
  }

  public get name(): string {
    return 'Compressor';
  }

  protected setupEffectChain(): void {
    // Nodes are already created in constructor, just configure them
    
    // Configure analyzer for gain reduction measurement
    this.analyzer.fftSize = 2048;
    this.analyzer.smoothingTimeConstant = 0.8;
    
    // Set default compressor settings
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    
    // Connect makeup gain
    this.compressor.connect(this.makeupGain);
    this.makeupGain.connect(this.analyzer);
  }

  protected getEffectInput(): AudioNode {
    return this.compressor;
  }

  protected getEffectOutput(): AudioNode {
    return this.makeupGain;
  }

  private initializeParameters(): void {
    const params: EffectParameter[] = [
      {
        id: 'wetLevel',
        name: 'Wet Level',
        min: 0,
        max: 1,
        default: 1,
        value: 1,
        type: 'linear',
        unit: '%',
      },
      {
        id: 'dryLevel',
        name: 'Dry Level',
        min: 0,
        max: 1,
        default: 0,
        value: 0,
        type: 'linear',
        unit: '%',
      },
      {
        id: 'threshold',
        name: 'Threshold',
        min: -60,
        max: 0,
        default: -24,
        value: -24,
        type: 'linear',
        unit: 'dB',
      },
      {
        id: 'knee',
        name: 'Knee',
        min: 0,
        max: 40,
        default: 30,
        value: 30,
        type: 'linear',
        unit: 'dB',
      },
      {
        id: 'ratio',
        name: 'Ratio',
        min: 1,
        max: 20,
        default: 12,
        value: 12,
        type: 'logarithmic',
        unit: ':1',
      },
      {
        id: 'attack',
        name: 'Attack',
        min: 0.001,
        max: 1,
        default: 0.003,
        value: 0.003,
        type: 'logarithmic',
        unit: 's',
      },
      {
        id: 'release',
        name: 'Release',
        min: 0.01,
        max: 2,
        default: 0.25,
        value: 0.25,
        type: 'logarithmic',
        unit: 's',
      },
      {
        id: 'makeupGain',
        name: 'Makeup Gain',
        min: 0,
        max: 24,
        default: 0,
        value: 0,
        type: 'linear',
        unit: 'dB',
      },
    ];

    params.forEach(param => this.parameters.set(param.id, param));
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'wetLevel':
        this.setMix(value, this.getParameter('dryLevel')?.value ?? 0);
        break;
      case 'dryLevel':
        this.setMix(this.getParameter('wetLevel')?.value ?? 1, value);
        break;
      case 'threshold':
        if (this.compressor) {
          this.compressor.threshold.value = value;
        }
        break;
      case 'knee':
        if (this.compressor) {
          this.compressor.knee.value = value;
        }
        break;
      case 'ratio':
        if (this.compressor) {
          this.compressor.ratio.value = value;
        }
        break;
      case 'attack':
        if (this.compressor) {
          this.compressor.attack.value = value;
        }
        break;
      case 'release':
        if (this.compressor) {
          this.compressor.release.value = value;
        }
        break;
      case 'makeupGain':
        if (this.makeupGain) {
          // Convert dB to linear gain
          this.makeupGain.gain.value = Math.pow(10, value / 20);
        }
        break;
    }
  }

  private startGainReductionAnalysis(): void {
    const bufferLength = this.analyzer.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    
    const analyze = () => {
      if (!this.enabled) {
        this.gainReduction = 0;
        return;
      }
      
      this.analyzer.getFloatTimeDomainData(dataArray);
      
      // Calculate RMS level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const rmsDb = 20 * Math.log10(rms);
      
      // Calculate gain reduction based on threshold and ratio
      const threshold = this.compressor.threshold.value;
      const ratio = this.compressor.ratio.value;
      
      if (rmsDb > threshold) {
        this.gainReduction = (rmsDb - threshold) * (1 - 1 / ratio);
      } else {
        this.gainReduction = 0;
      }
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  public getGainReduction(): number {
    return this.gainReduction;
  }

  public getCompressorInfo(): {
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
    makeupGain: number;
    gainReduction: number;
  } {
    return {
      threshold: this.compressor.threshold.value,
      knee: this.compressor.knee.value,
      ratio: this.compressor.ratio.value,
      attack: this.compressor.attack.value,
      release: this.compressor.release.value,
      makeupGain: 20 * Math.log10(this.makeupGain.gain.value),
      gainReduction: this.gainReduction,
    };
  }

  protected disposeEffectNodes(): void {
    this.compressor.disconnect();
    this.makeupGain.disconnect();
    this.analyzer.disconnect();
  }
}