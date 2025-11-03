import { BaseEffect, EffectParameter } from './BaseEffect';
import type { AudioContextLike } from '../AudioEngine';

export class FilterEffect extends BaseEffect {
  private filter: BiquadFilterNode;
  private resonance: GainNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private envelopeFollower: GainNode;
  private envelopeDetector: AnalyserNode;

    constructor(audioContext: AudioContextLike, id: string) {
    super(audioContext, id);
    // Cast to AudioContext for node creation since we need to real methods
    const ctx = audioContext as AudioContext;
    this.filter = ctx.createBiquadFilter();
    this.resonance = ctx.createGain();
    this.lfo = ctx.createOscillator();
    this.lfoGain = ctx.createGain();
    this.envelopeFollower = ctx.createGain();
    this.envelopeDetector = ctx.createAnalyser();
    this.initializeParameters();
    this.setupEffectChain();
    this.startLFO();
    this.startEnvelopeFollower();
  }

  public get type(): string {
    return 'filter';
  }

  public get name(): string {
    return 'Filter';
  }

  protected setupEffectChain(): void {
    this.filter = this.audioContext.createBiquadFilter();
    this.resonance = this.audioContext.createGain();
    this.lfo = this.audioContext.createOscillator();
    this.lfoGain = this.audioContext.createGain();
    this.envelopeFollower = this.audioContext.createGain();
    this.envelopeDetector = this.audioContext.createAnalyser();
    
    // Configure filter
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 1000;
    this.filter.Q.value = 1;
    
    // Configure LFO
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0;
    this.lfoGain.gain.value = 0;
    
    // Configure envelope follower
    this.envelopeFollower.gain.value = 0;
    
    // Configure analyzer
    this.envelopeDetector.fftSize = 256;
    this.envelopeDetector.smoothingTimeConstant = 0.8;
    
    // Connect LFO to filter frequency for modulation
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.filter.frequency);
    
    // Connect envelope follower to filter Q
    this.envelopeFollower.connect(this.filter.Q);
    
    // Connect filter to envelope detector
    this.filter.connect(this.envelopeDetector);
  }

  protected getEffectInput(): AudioNode {
    return this.filter;
  }

  protected getEffectOutput(): AudioNode {
    return this.filter;
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
        id: 'filterType',
        name: 'Filter Type',
        min: 0,
        max: 7,
        default: 0,
        value: 0,
        type: 'linear',
        unit: '',
      },
      {
        id: 'frequency',
        name: 'Frequency',
        min: 20,
        max: 20000,
        default: 1000,
        value: 1000,
        type: 'logarithmic',
        unit: 'Hz',
      },
      {
        id: 'resonance',
        name: 'Resonance',
        min: 0.1,
        max: 30,
        default: 1,
        value: 1,
        type: 'logarithmic',
        unit: '',
      },
      {
        id: 'modRate',
        name: 'Mod Rate',
        min: 0,
        max: 20,
        default: 0,
        value: 0,
        type: 'logarithmic',
        unit: 'Hz',
      },
      {
        id: 'modDepth',
        name: 'Mod Depth',
        min: 0,
        max: 5000,
        default: 0,
        value: 0,
        type: 'linear',
        unit: 'Hz',
      },
      {
        id: 'envAmount',
        name: 'Env Amount',
        min: 0,
        max: 20,
        default: 0,
        value: 0,
        type: 'linear',
        unit: '',
      },
      {
        id: 'drive',
        name: 'Drive',
        min: 1,
        max: 10,
        default: 1,
        value: 1,
        type: 'linear',
        unit: '',
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
      case 'filterType':
        if (this.filter) {
          const filterTypes: BiquadFilterType[] = [
            'lowpass', 'highpass', 'bandpass', 'lowshelf',
            'highshelf', 'peaking', 'notch', 'allpass'
          ];
          const typeIndex = Math.floor(value);
          if (typeIndex >= 0 && typeIndex < filterTypes.length) {
            this.filter.type = filterTypes[typeIndex];
          }
        }
        break;
      case 'frequency':
        if (this.filter) {
          const baseFreq = value;
          const modDepth = this.getParameter('modDepth')?.value ?? 0;
          this.filter.frequency.value = baseFreq;
          this.lfoGain.gain.value = modDepth;
        }
        break;
      case 'resonance':
        if (this.filter) {
          this.filter.Q.value = value;
        }
        break;
      case 'modRate':
        if (this.lfo) {
          this.lfo.frequency.value = value;
        }
        break;
      case 'modDepth':
        if (this.lfoGain) {
          this.lfoGain.gain.value = value;
        }
        break;
      case 'envAmount':
        if (this.envelopeFollower) {
          this.envelopeFollower.gain.value = value;
        }
        break;
      case 'drive':
        // Drive is handled by input gain in the routing
        break;
    }
  }

  private startLFO(): void {
    this.lfo.start();
  }

  private startEnvelopeFollower(): void {
    const bufferLength = this.envelopeDetector.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    
    const analyze = () => {
      if (!this.enabled) return;
      
      this.envelopeDetector.getFloatTimeDomainData(dataArray);
      
      // Calculate envelope (RMS)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += Math.abs(dataArray[i]);
      }
      const envelope = sum / bufferLength;
      const envAmount = this.getParameter('envAmount')?.value ?? 0;
      
      // Apply envelope to resonance
      if (this.filter) {
        const baseQ = this.getParameter('resonance')?.value ?? 1;
        this.filter.Q.value = baseQ + (envelope * envAmount);
      }
      
      requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  public getFilterResponse(): { frequency: number; magnitude: number }[] {
    const frequencies: number[] = [];
    const magnitudes: number[] = [];
    
    // Generate frequency response curve
    for (let freq = 20; freq <= 20000; freq *= 1.05) {
      frequencies.push(freq);
      
      // Calculate magnitude response (simplified)
      let magnitude = 1;
      const filterFreq = this.filter.frequency.value;
      const q = this.filter.Q.value;
      
      switch (this.filter.type) {
        case 'lowpass':
          magnitude = 1 / Math.sqrt(1 + Math.pow(q * (freq / filterFreq - filterFreq / freq), 2));
          break;
        case 'highpass':
          magnitude = 1 / Math.sqrt(1 + Math.pow(q * (filterFreq / freq - freq / filterFreq), 2));
          break;
        case 'bandpass':
          const normalizedFreq = freq / filterFreq;
          magnitude = 1 / Math.sqrt(1 + Math.pow(q * (normalizedFreq - 1/normalizedFreq), 2));
          break;
        default:
          magnitude = 1;
      }
      
      magnitudes.push(magnitude);
    }
    
    return frequencies.map((freq, i) => ({
      frequency: freq,
      magnitude: magnitudes[i]
    }));
  }

  public getFilterInfo(): {
    type: BiquadFilterType;
    frequency: number;
    resonance: number;
    modRate: number;
    modDepth: number;
    envAmount: number;
  } {
    return {
      type: this.filter.type,
      frequency: this.filter.frequency.value,
      resonance: this.filter.Q.value,
      modRate: this.lfo.frequency.value,
      modDepth: this.lfoGain.gain.value,
      envAmount: this.envelopeFollower.gain.value,
    };
  }

  protected disposeEffectNodes(): void {
    this.filter.disconnect();
    this.resonance.disconnect();
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.envelopeFollower.disconnect();
    this.envelopeDetector.disconnect();
  }
}