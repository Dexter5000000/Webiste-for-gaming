import { BaseEffect, EffectParameter } from './BaseEffect';
import type { AudioContextLike } from '../AudioEngine';

export class DelayEffect extends BaseEffect {
  private delayNode: DelayNode;
  private feedback: GainNode;
  private filter: BiquadFilterNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;

  constructor(audioContext: AudioContextLike, id: string) {
    super(audioContext, id);
    // Cast to AudioContext for node creation since we need to real methods
    const ctx = audioContext as AudioContext;
    this.delayNode = ctx.createDelay(2.0);
    this.feedback = ctx.createGain();
    this.filter = ctx.createBiquadFilter();
    this.lfo = ctx.createOscillator();
    this.lfoGain = ctx.createGain();
    this.initializeParameters();
    this.setupEffectChain();
    this.startLFO();
  }

  public get type(): string {
    return 'delay';
  }

  public get name(): string {
    return 'Delay';
  }

  protected setupEffectChain(): void {
    this.delayNode = this.audioContext.createDelay(2.0);
    this.feedback = this.audioContext.createGain();
    this.filter = this.audioContext.createBiquadFilter();
    this.lfo = this.audioContext.createOscillator();
    this.lfoGain = this.audioContext.createGain();
    
    // Configure LFO for modulation
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0;
    this.lfoGain.gain.value = 0;
    
    // Configure filter
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 10000;
    this.filter.Q.value = 1;
    
    // Connect LFO to delay time for chorus/flanger effects
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);
    
    // Main delay routing
    this.delayNode.connect(this.feedback);
    this.feedback.connect(this.filter);
    this.filter.connect(this.delayNode);
    
    // Initial delay time
    this.delayNode.delayTime.value = 0.25;
    this.feedback.gain.value = 0.4;
  }

  protected getEffectInput(): AudioNode {
    return this.delayNode;
  }

  protected getEffectOutput(): AudioNode {
    return this.delayNode;
  }

  private initializeParameters(): void {
    const params: EffectParameter[] = [
      {
        id: 'wetLevel',
        name: 'Wet Level',
        min: 0,
        max: 1,
        default: 0.3,
        value: 0.3,
        type: 'linear',
        unit: '%',
      },
      {
        id: 'dryLevel',
        name: 'Dry Level',
        min: 0,
        max: 1,
        default: 0.7,
        value: 0.7,
        type: 'linear',
        unit: '%',
      },
      {
        id: 'delayTime',
        name: 'Delay Time',
        min: 0.001,
        max: 2.0,
        default: 0.25,
        value: 0.25,
        type: 'logarithmic',
        unit: 's',
      },
      {
        id: 'feedback',
        name: 'Feedback',
        min: 0,
        max: 0.95,
        default: 0.4,
        value: 0.4,
        type: 'linear',
        unit: '%',
      },
      {
        id: 'filterFreq',
        name: 'Filter Freq',
        min: 100,
        max: 20000,
        default: 10000,
        value: 10000,
        type: 'logarithmic',
        unit: 'Hz',
      },
      {
        id: 'modRate',
        name: 'Mod Rate',
        min: 0,
        max: 10,
        default: 0,
        value: 0,
        type: 'logarithmic',
        unit: 'Hz',
      },
      {
        id: 'modDepth',
        name: 'Mod Depth',
        min: 0,
        max: 0.05,
        default: 0,
        value: 0,
        type: 'linear',
        unit: 's',
      },
    ];

    params.forEach(param => this.parameters.set(param.id, param));
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'wetLevel':
        this.setMix(value, this.getParameter('dryLevel')?.value ?? 0.7);
        break;
      case 'dryLevel':
        this.setMix(this.getParameter('wetLevel')?.value ?? 0.3, value);
        break;
      case 'delayTime':
        if (this.delayNode) {
          const baseTime = value;
          const modDepth = this.getParameter('modDepth')?.value ?? 0;
          this.delayNode.delayTime.value = baseTime;
          this.lfoGain.gain.value = modDepth;
        }
        break;
      case 'feedback':
        if (this.feedback) {
          this.feedback.gain.value = value;
        }
        break;
      case 'filterFreq':
        if (this.filter) {
          this.filter.frequency.value = value;
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
    }
  }

  private startLFO(): void {
    this.lfo.start();
  }

  protected disposeEffectNodes(): void {
    this.delayNode.disconnect();
    this.feedback.disconnect();
    this.filter.disconnect();
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
  }
}