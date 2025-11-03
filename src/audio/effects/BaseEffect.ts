import type { AudioContextLike } from '../AudioEngine';

export interface EffectParameter {
  id: string;
  name: string;
  min: number;
  max: number;
  default: number;
  value: number;
  type: 'linear' | 'logarithmic';
  unit?: string;
}

export interface EffectState {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, number>;
}

export abstract class BaseEffect {
  protected audioContext: AudioContextLike;
  protected inputNode: AudioNode;
  protected outputNode: AudioNode;
  protected wetGain: GainNode;
  protected dryGain: GainNode;
  protected enabled: boolean = true;
  protected parameters: Map<string, EffectParameter>;

  constructor(audioContext: AudioContextLike, public readonly id: string) {
    this.audioContext = audioContext;
    // Cast to AudioContext for node creation since we need the real methods
    const ctx = audioContext as AudioContext;
    this.wetGain = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.parameters = new Map();
    
    // Create input/output nodes - to be overridden by subclasses
    const ctx = audioContext as AudioContext;
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    
    // Default routing
    this.inputNode.connect(this.dryGain);
    this.setupEffectChain();
  }

  protected abstract setupEffectChain(): void;

  public abstract get type(): string;
  public abstract get name(): string;

  public get input(): AudioNode {
    return this.inputNode;
  }

  public get output(): AudioNode {
    return this.outputNode;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.updateRouting();
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setMix(wetLevel: number, dryLevel: number): void {
    this.wetGain.gain.value = wetLevel;
    this.dryGain.gain.value = dryLevel;
  }

  public getParameter(id: string): EffectParameter | undefined {
    return this.parameters.get(id);
  }

  public setParameter(id: string, value: number): void {
    const param = this.parameters.get(id);
    if (param) {
      const clampedValue = Math.max(param.min, Math.min(param.max, value));
      param.value = clampedValue;
      this.applyParameter(id, clampedValue);
    }
  }

  protected abstract applyParameter(id: string, value: number): void;

  public getAllParameters(): EffectParameter[] {
    return Array.from(this.parameters.values());
  }

  public getState(): EffectState {
    const parameters: Record<string, number> = {};
    this.parameters.forEach((param, id) => {
      parameters[id] = param.value;
    });

    return {
      id: this.id,
      type: this.type,
      name: this.name,
      enabled: this.enabled,
      parameters,
    };
  }

  public setState(state: Omit<EffectState, 'id' | 'type' | 'name'>): void {
    this.setEnabled(state.enabled);
    Object.entries(state.parameters).forEach(([id, value]) => {
      this.setParameter(id, value);
    });
  }

  protected updateRouting(): void {
    // Disconnect all connections first
    this.inputNode.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();

    if (this.enabled) {
      // Route through effect
      this.inputNode.connect(this.dryGain);
      this.inputNode.connect(this.getEffectInput());
      this.getEffectOutput().connect(this.wetGain);
    } else {
      // Bypass effect - dry signal only
      this.inputNode.connect(this.dryGain);
    }

    // Mix wet and dry signals
    this.dryGain.connect(this.outputNode);
    this.wetGain.connect(this.outputNode);
  }

  protected abstract getEffectInput(): AudioNode;
  protected abstract getEffectOutput(): AudioNode;

  public dispose(): void {
    this.inputNode.disconnect();
    this.outputNode.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.disposeEffectNodes();
  }

  protected abstract disposeEffectNodes(): void;
}