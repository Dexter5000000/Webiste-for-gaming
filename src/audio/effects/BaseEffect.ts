import type { AudioContextLike, AudioNodeLike, GainNodeLike } from '../AudioEngine';

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
  protected inputNode: AudioNodeLike;
  protected outputNode: AudioNodeLike;
  protected wetGain: GainNodeLike;
  protected dryGain: GainNodeLike;
  protected enabled: boolean = true;
  protected parameters: Map<string, EffectParameter>;

  constructor(audioContext: AudioContextLike, public readonly id: string) {
    this.audioContext = audioContext;
    // Cast to unknown first for compatibility
    const ctx = audioContext as unknown as AudioContext;
    this.wetGain = ctx.createGain() as unknown as GainNodeLike;
    this.dryGain = ctx.createGain() as unknown as GainNodeLike;
    this.parameters = new Map();
    
    // Create input/output nodes - to be overridden by subclasses
    this.inputNode = ctx.createGain() as unknown as AudioNodeLike;
    this.outputNode = ctx.createGain() as unknown as AudioNodeLike;
    
    // Default routing
    this.inputNode.connect(this.dryGain);
    this.setupEffectChain();
  }

  protected abstract setupEffectChain(): void;

  public abstract get type(): string;
  public abstract get name(): string;

  public get input(): AudioNode {
    return this.inputNode as unknown as AudioNode;
  }

  public get output(): AudioNode {
    return this.outputNode as unknown as AudioNode;
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
      this.inputNode.connect(this.getEffectInput() as unknown as AudioNodeLike);
      (this.getEffectOutput() as unknown as AudioNodeLike).connect(this.wetGain);
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