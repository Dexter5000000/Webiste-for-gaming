import { EffectChain, EffectChainState, AVAILABLE_EFFECTS, EffectType } from './EffectChain';
import { BaseEffect, EffectState } from './BaseEffect';
import type { AudioContextLike } from '../AudioEngine';

export interface EffectsManagerState {
  tracks: Record<string, EffectChainState>;
  master: EffectChainState;
}

export class EffectsManager {
  private audioContext: AudioContextLike;
  private trackChains: Map<string, EffectChain> = new Map();
  private masterChain: EffectChain;
  private nextChainId: number = 1;

  constructor(audioContext: AudioContextLike) {
    this.audioContext = audioContext;
    this.masterChain = new EffectChain(audioContext, 'master');
  }

  public getMasterChain(): EffectChain {
    return this.masterChain;
  }

  public createTrackChain(trackId: string): EffectChain {
    if (this.trackChains.has(trackId)) {
      return this.trackChains.get(trackId)!;
    }

    const chainId = `track-${trackId}`;
    const chain = new EffectChain(this.audioContext, chainId);
    this.trackChains.set(trackId, chain);
    return chain;
  }

  public getTrackChain(trackId: string): EffectChain | undefined {
    return this.trackChains.get(trackId);
  }

  public removeTrackChain(trackId: string): void {
    const chain = this.trackChains.get(trackId);
    if (chain) {
      chain.dispose();
      this.trackChains.delete(trackId);
    }
  }

  public getAllTrackChains(): Map<string, EffectChain> {
    return new Map(this.trackChains);
  }

  public addEffectToTrack(trackId: string, effectType: EffectType): BaseEffect | null {
    const chain = this.getTrackChain(trackId) || this.createTrackChain(trackId);
    return chain.createEffect(effectType);
  }

  public addEffectToMaster(effectType: EffectType): BaseEffect {
    return this.masterChain.createEffect(effectType);
  }

  public removeEffectFromTrack(trackId: string, effectId: string): void {
    const chain = this.getTrackChain(trackId);
    if (chain) {
      chain.removeEffect(effectId);
      
      // Remove chain if it's empty
      if (chain.getAllEffects().length === 0) {
        this.removeTrackChain(trackId);
      }
    }
  }

  public removeEffectFromMaster(effectId: string): void {
    this.masterChain.removeEffect(effectId);
  }

  public moveEffectInTrack(trackId: string, effectId: string, newIndex: number): void {
    const chain = this.getTrackChain(trackId);
    if (chain) {
      chain.moveEffect(effectId, newIndex);
    }
  }

  public moveEffectInMaster(effectId: string, newIndex: number): void {
    this.masterChain.moveEffect(effectId, newIndex);
  }

  public bypassEffectInTrack(trackId: string, effectId: string, bypassed: boolean): void {
    const chain = this.getTrackChain(trackId);
    if (chain) {
      chain.bypassEffect(effectId, bypassed);
    }
  }

  public bypassEffectInMaster(effectId: string, bypassed: boolean): void {
    this.masterChain.bypassEffect(effectId, bypassed);
  }

  public getAvailableEffects(): typeof AVAILABLE_EFFECTS {
    return AVAILABLE_EFFECTS;
  }

  public getState(): EffectsManagerState {
    const tracks: Record<string, EffectChainState> = {};
    
    this.trackChains.forEach((chain, trackId) => {
      tracks[trackId] = chain.getState();
    });

    return {
      tracks,
      master: this.masterChain.getState(),
    };
  }

  public setState(state: EffectsManagerState): void {
    // Clear existing chains
    this.trackChains.forEach(chain => chain.dispose());
    this.trackChains.clear();
    this.masterChain.setState(state.master);

    // Restore track chains
    Object.entries(state.tracks).forEach(([trackId, chainState]) => {
      const chain = this.createTrackChain(trackId);
      chain.setState(chainState);
    });
  }

  public serializeState(): string {
    return JSON.stringify(this.getState());
  }

  public deserializeState(serializedState: string): void {
    try {
      const state = JSON.parse(serializedState) as EffectsManagerState;
      this.setState(state);
    } catch (error) {
      console.error('Failed to deserialize effects state:', error);
      throw new Error('Invalid effects state data');
    }
  }

  public getEffectInfo(trackId?: string): {
    trackId?: string;
    effects: EffectState[];
    chainLevel: number;
  }[] {
    const result: {
      trackId?: string;
      effects: EffectState[];
      chainLevel: number;
    }[] = [];

    // Add master chain info
    result.push({
      effects: this.masterChain.getAllEffects().map(effect => effect.getState()),
      chainLevel: this.masterChain.getChainLevel(),
    });

    // Add track chain info
    this.trackChains.forEach((chain, trackId) => {
      result.push({
        trackId,
        effects: chain.getAllEffects().map(effect => effect.getState()),
        chainLevel: chain.getChainLevel(),
      });
    });

    return result;
  }

  public dispose(): void {
    this.trackChains.forEach(chain => chain.dispose());
    this.trackChains.clear();
    this.masterChain.dispose();
  }
}