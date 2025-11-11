import { BaseEffect, EffectParameter } from './BaseEffect';
import type { AudioContextLike } from '../AudioEngine';

export class ReverbEffect extends BaseEffect {
  private readonly convolver: ConvolverNode;
  private readonly preDelay: DelayNode;
  private readonly filter: BiquadFilterNode;

  constructor(audioContext: AudioContextLike, id: string) {
    super(audioContext, id);
    // Cast to AudioContext for node creation since we need the real methods
    const ctx = audioContext as unknown as AudioContext;
    this.convolver = ctx.createConvolver();
    this.preDelay = ctx.createDelay(2.0);
    this.filter = ctx.createBiquadFilter();
    this.initializeParameters();
    this.setupEffectChain();
    this.createImpulseResponse();
  }

  public get type(): string {
    return 'reverb';
  }

  public get name(): string {
    return 'Reverb';
  }

  protected setupEffectChain(): void {
    // Set initial filter settings for high-frequency damping
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 10000;
    
    // Pre-delay routing
    this.preDelay.delayTime.value = 0.03;
    this.preDelay.connect(this.filter);
    this.filter.connect(this.convolver);
  }

  protected getEffectInput(): AudioNode {
    return this.preDelay;
  }

  protected getEffectOutput(): AudioNode {
    return this.convolver;
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
        id: 'preDelay',
        name: 'Pre-Delay',
        min: 0,
        max: 0.2,
        default: 0.03,
        value: 0.03,
        type: 'linear',
        unit: 's',
      },
      {
        id: 'damping',
        name: 'Damping',
        min: 100,
        max: 20000,
        default: 10000,
        value: 10000,
        type: 'logarithmic',
        unit: 'Hz',
      },
      {
        id: 'roomSize',
        name: 'Room Size',
        min: 0.5,
        max: 10,
        default: 3,
        value: 3,
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
      case 'preDelay':
        if (this.preDelay) {
          this.preDelay.delayTime.value = value;
        }
        break;
      case 'damping':
        if (this.filter) {
          this.filter.frequency.value = value;
        }
        break;
      case 'roomSize':
        this.createImpulseResponse(value);
        break;
    }
  }

  private createImpulseResponse(duration: number = 3, decay: number = 2): void {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    this.convolver.buffer = impulse as AudioBuffer;
  }

  protected disposeEffectNodes(): void {
    this.convolver.disconnect();
    this.preDelay.disconnect();
    this.filter.disconnect();
  }
}