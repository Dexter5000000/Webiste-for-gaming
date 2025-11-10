import { BaseEffect, EffectState } from './BaseEffect';
import { ReverbEffect } from './ReverbEffect';
import { DelayEffect } from './DelayEffect';
import { EQEffect } from './EQEffect';
import { CompressorEffect } from './CompressorEffect';
import { DistortionEffect } from './DistortionEffect';
import { FilterEffect } from './FilterEffect';
import type { AudioContextLike } from '../AudioEngine';

export class EffectChain {
  private effects: BaseEffect[] = [];
  private inputNode: GainNode;
  private outputNode: GainNode;
  private audioContext: AudioContextLike;
  private nextEffectId: number = 1;

  constructor(audioContext: AudioContextLike, public readonly id: string) {
    this.audioContext = audioContext;
    // Cast to AudioContext for node creation since we need the real methods
    const ctx = audioContext as unknown as AudioContext;
    this.inputNode = ctx.createGain();
    this.outputNode = ctx.createGain();
    this.inputNode.gain.value = 1;
    this.outputNode.gain.value = 1;
    
    // Initialize routing - connect input directly to output when no effects
    this.inputNode.connect(this.outputNode);
  }

  public get input(): AudioNode {
    return this.inputNode;
  }

  public get output(): AudioNode {
    return this.outputNode;
  }

  public createEffect(type: string): BaseEffect {
    const effectId = `${this.id}-effect-${this.nextEffectId++}`;
    
    let effect: BaseEffect;
    
    switch (type) {
      case 'reverb':
        effect = new ReverbEffect(this.audioContext, effectId);
        break;
      case 'delay':
        effect = new DelayEffect(this.audioContext, effectId);
        break;
      case 'eq':
        effect = new EQEffect(this.audioContext, effectId);
        break;
      case 'compressor':
        effect = new CompressorEffect(this.audioContext, effectId);
        break;
      case 'distortion':
        effect = new DistortionEffect(this.audioContext, effectId);
        break;
      case 'filter':
        effect = new FilterEffect(this.audioContext, effectId);
        break;
      default:
        throw new Error(`Unknown effect type: ${type}`);
    }
    
    this.addEffect(effect);
    return effect;
  }

  public addEffect(effect: BaseEffect, index?: number): void {
    if (index !== undefined && index >= 0 && index <= this.effects.length) {
      this.effects.splice(index, 0, effect);
    } else {
      this.effects.push(effect);
    }
    this.updateRouting();
  }

  public removeEffect(effectId: string): void {
    const effectIndex = this.effects.findIndex(e => e.id === effectId);
    if (effectIndex !== -1) {
      const effect = this.effects[effectIndex];
      effect.dispose();
      this.effects.splice(effectIndex, 1);
      this.updateRouting();
    }
  }

  public moveEffect(effectId: string, newIndex: number): void {
    const effectIndex = this.effects.findIndex(e => e.id === effectId);
    if (effectIndex !== -1 && newIndex >= 0 && newIndex < this.effects.length) {
      const [effect] = this.effects.splice(effectIndex, 1);
      this.effects.splice(newIndex, 0, effect);
      this.updateRouting();
    }
  }

  public getEffect(effectId: string): BaseEffect | undefined {
    return this.effects.find(e => e.id === effectId);
  }

  public getAllEffects(): BaseEffect[] {
    return [...this.effects];
  }

  public getEffectIndex(effectId: string): number {
    return this.effects.findIndex(e => e.id === effectId);
  }

  public bypassEffect(effectId: string, bypassed: boolean): void {
    const effect = this.getEffect(effectId);
    if (effect) {
      effect.setEnabled(!bypassed);
    }
  }

  public isEffectBypassed(effectId: string): boolean {
    const effect = this.getEffect(effectId);
    return effect ? !effect.isEnabled() : true;
  }

  private updateRouting(): void {
    // Disconnect all existing connections EXCEPT outputNode's external connections
    this.inputNode.disconnect();
    this.effects.forEach(effect => {
      effect.input.disconnect();
      effect.output.disconnect();
    });
    // NOTE: We do NOT disconnect outputNode here because it may be connected
    // to external nodes (like master bus). We only reconnect internally.

    if (this.effects.length === 0) {
      // Direct connection if no effects
      this.inputNode.connect(this.outputNode);
    } else {
      // Chain effects together
      let currentNode: AudioNode = this.inputNode;
      
      this.effects.forEach(effect => {
        currentNode.connect(effect.input);
        currentNode = effect.output;
      });
      
      currentNode.connect(this.outputNode);
    }
  }

  public setChainLevel(level: number): void {
    this.outputNode.gain.value = level;
  }

  public getChainLevel(): number {
    return this.outputNode.gain.value;
  }

  public getState(): EffectChainState {
    return {
      id: this.id,
      effects: this.effects.map(effect => effect.getState()),
      level: this.getChainLevel(),
    };
  }

  public setState(state: EffectChainState): void {
    // Clear existing effects
    this.effects.forEach(effect => effect.dispose());
    this.effects = [];
    this.nextEffectId = 1;

    // Recreate effects from state
    state.effects.forEach(effectState => {
      const effect = this.createEffect(effectState.type);
      effect.setState({
        enabled: effectState.enabled,
        parameters: effectState.parameters,
      });
    });

    // Set chain level
    this.setChainLevel(state.level);
  }

  public dispose(): void {
    this.effects.forEach(effect => effect.dispose());
    this.effects = [];
    this.inputNode.disconnect();
    this.outputNode.disconnect();
  }
}

export interface EffectChainState {
  id: string;
  effects: EffectState[];
  level: number;
}

export type EffectType = 'reverb' | 'delay' | 'eq' | 'compressor' | 'distortion' | 'filter';

export const AVAILABLE_EFFECTS: { type: EffectType; name: string; description: string }[] = [
  {
    type: 'reverb',
    name: 'Reverb',
    description: 'Spatial ambience using convolution reverb'
  },
  {
    type: 'delay',
    name: 'Delay',
    description: 'Echo and delay effects with modulation'
  },
  {
    type: 'eq',
    name: 'Multi-Band EQ',
    description: '4-band parametric equalizer'
  },
  {
    type: 'compressor',
    name: 'Compressor',
    description: 'Dynamic range compression with gain reduction'
  },
  {
    type: 'distortion',
    name: 'Distortion',
    description: 'Various distortion and saturation effects'
  },
  {
    type: 'filter',
    name: 'Filter',
    description: 'Multi-mode filter with LFO and envelope'
  },
];