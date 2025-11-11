import { BaseEffect, EffectParameter } from './BaseEffect';
import type { AudioContextLike } from '../AudioEngine';

export class DistortionEffect extends BaseEffect {
  private readonly waveshaper: WaveShaperNode;
  private readonly preGain: GainNode;
  private readonly postGain: GainNode;
  private readonly filter: BiquadFilterNode;
  private readonly tone: BiquadFilterNode;
  private readonly mixGain: GainNode;

  constructor(audioContext: AudioContextLike, id: string) {
    super(audioContext, id);
    // Cast to AudioContext for node creation since we need the real methods
    const ctx = audioContext as unknown as AudioContext;
    this.waveshaper = ctx.createWaveShaper();
    this.preGain = ctx.createGain();
    this.postGain = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.tone = ctx.createBiquadFilter();
    this.mixGain = ctx.createGain();
    this.initializeParameters();
    this.setupEffectChain();
    this.updateDistortionCurve();
  }

  public get type(): string {
    return 'distortion';
  }

  public get name(): string {
    return 'Distortion';
  }

  protected setupEffectChain(): void {
    // Configure filters
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 5000;
    this.filter.Q.value = 1;
    
    this.tone.type = 'lowpass';
    this.tone.frequency.value = 3000;
    this.tone.Q.value = 0.7;
    
    // Set initial gains
    this.preGain.gain.value = 1;
    this.postGain.gain.value = 0.5;
    this.mixGain.gain.value = 1;
    
    // Create initial distortion curve
    this.makeDistortionCurve(50);
    
    // Connect the chain
    this.preGain.connect(this.waveshaper);
    this.waveshaper.connect(this.filter);
    this.filter.connect(this.tone);
    this.tone.connect(this.postGain);
    this.postGain.connect(this.mixGain);
  }

  protected getEffectInput(): AudioNode {
    return this.preGain;
  }

  protected getEffectOutput(): AudioNode {
    return this.mixGain;
  }

  protected initializeParameters(): void {
    const params: EffectParameter[] = [
      {
        id: 'wetLevel',
        name: 'Wet Level',
        min: 0,
        max: 1,
        default: 0.5,
        value: 0.5,
        type: 'linear',
        unit: '%',
      },
      {
        id: 'dryLevel',
        name: 'Dry Level',
        min: 0,
        max: 1,
        default: 0.5,
        value: 0.5,
        type: 'linear',
        unit: '%',
      },
      {
        id: 'amount',
        name: 'Amount',
        min: 0,
        max: 100,
        default: 50,
        value: 50,
        type: 'linear',
        unit: '%',
      },
      {
        id: 'drive',
        name: 'Drive',
        min: 1,
        max: 50,
        default: 5,
        value: 5,
        type: 'logarithmic',
        unit: '',
      },
      {
        id: 'tone',
        name: 'Tone',
        min: 100,
        max: 10000,
        default: 3000,
        value: 3000,
        type: 'logarithmic',
        unit: 'Hz',
      },
      {
        id: 'level',
        name: 'Level',
        min: 0,
        max: 2,
        default: 0.5,
        value: 0.5,
        type: 'linear',
        unit: '',
      },
      {
        id: 'filterFreq',
        name: 'Filter Freq',
        min: 100,
        max: 20000,
        default: 5000,
        value: 5000,
        type: 'logarithmic',
        unit: 'Hz',
      },
      {
        id: 'filterQ',
        name: 'Filter Q',
        min: 0.1,
        max: 30,
        default: 1,
        value: 1,
        type: 'logarithmic',
        unit: '',
      },
    ];

    params.forEach(param => this.parameters.set(param.id, param));
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'wetLevel':
        this.setMix(value, this.getParameter('dryLevel')?.value ?? 0.5);
        break;
      case 'dryLevel':
        this.setMix(this.getParameter('wetLevel')?.value ?? 0.5, value);
        break;
      case 'amount':
        this.updateDistortionCurve();
        break;
      case 'drive':
        if (this.preGain) {
          this.preGain.gain.value = value;
        }
        break;
      case 'tone':
        if (this.tone) {
          this.tone.frequency.value = value;
        }
        break;
      case 'level':
        if (this.postGain) {
          this.postGain.gain.value = value;
        }
        break;
      case 'filterFreq':
        if (this.filter) {
          this.filter.frequency.value = value;
        }
        break;
      case 'filterQ':
        if (this.filter) {
          this.filter.Q.value = value;
        }
        break;
    }
  }

  private updateDistortionCurve(): void {
    const amount = this.getParameter('amount')?.value ?? 50;
    this.makeDistortionCurve(amount);
  }

  private makeDistortionCurve(amount: number): void {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const normalizedAmount = amount / 100;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      
      // Different distortion algorithms based on amount
      let y: number;
      
      if (normalizedAmount < 0.3) {
        // Soft clipping (tanh-like)
        y = Math.tanh(x * 2 * normalizedAmount * 5) / (normalizedAmount * 5 + 1);
      } else if (normalizedAmount < 0.7) {
        // Medium distortion (asymmetric)
        if (x < 0) {
          y = -Math.pow(-x, 1.2) * normalizedAmount;
        } else {
          y = Math.pow(x, 0.8) * normalizedAmount;
        }
      } else {
        // Hard clipping/fuzz
        const sign = x < 0 ? -1 : 1;
        const abs = Math.abs(x);
        y = sign * Math.min(abs, 1) * normalizedAmount;
        
        // Add some harmonics for fuzz
        y += Math.sin(x * 10) * normalizedAmount * 0.1;
      }
      
      // Ensure output is in valid range
      y = Math.max(-1, Math.min(1, y));
      curve[i] = y;
    }

    this.waveshaper.curve = curve;
  }

  protected disposeEffectNodes(): void {
    this.waveshaper.disconnect();
    this.preGain.disconnect();
    this.postGain.disconnect();
    this.filter.disconnect();
    this.tone.disconnect();
    this.mixGain.disconnect();
  }
}