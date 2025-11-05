import { BaseEffect, EffectParameter } from './BaseEffect';
import type { AudioContextLike } from '../AudioEngine';

interface EQBand {
  frequency: BiquadFilterNode;
  gain: GainNode;
  type: BiquadFilterType;
}

export class EQEffect extends BaseEffect {
  private inputSplitter: ChannelSplitterNode;
  private outputMerger: ChannelMergerNode;
  private lowShelf: BiquadFilterNode;
  private highShelf: BiquadFilterNode;
  private bands: EQBand[] = [];
  private numberOfBands: number = 4;

  constructor(audioContext: AudioContextLike, id: string) {
    super(audioContext, id);
    // Cast to AudioContext for node creation since we need the real methods
    const ctx = audioContext as unknown as AudioContext;
    this.inputSplitter = ctx.createChannelSplitter(2);
    this.outputMerger = ctx.createChannelMerger(2);
    this.lowShelf = ctx.createBiquadFilter();
    this.highShelf = ctx.createBiquadFilter();
    
    // Create parametric bands
    const frequencies = [200, 800, 2400, 6000];
    for (let i = 0; i < this.numberOfBands; i++) {
      const frequency = ctx.createBiquadFilter();
      frequency.type = 'peaking';
      frequency.frequency.value = frequencies[i];
      frequency.Q.value = 1;
      frequency.gain.value = 0;
      
      const gain = ctx.createGain();
      gain.gain.value = 1;
      
      this.bands.push({
        frequency,
        gain,
        type: 'peaking'
      });
    }
    
    this.initializeParameters();
  }

  public get type(): string {
    return 'eq';
  }

  public get name(): string {
    return 'Multi-Band EQ';
  }

  protected setupEffectChain(): void {
    // Nodes are already created in constructor, just configure and connect them
    
    // Configure shelf filters
    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.value = 100;
    this.lowShelf.gain.value = 0;
    
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = 10000;
    this.highShelf.gain.value = 0;
  }

  protected getEffectInput(): AudioNode {
    return this.inputSplitter;
  }

  protected getEffectOutput(): AudioNode {
    return this.outputMerger;
  }

  protected updateRouting(): void {
    super.updateRouting();
    
    if (!this.enabled) return;
    
    // Disconnect existing connections
    this.inputSplitter.disconnect();
    this.outputMerger.disconnect();
    this.lowShelf.disconnect();
    this.highShelf.disconnect();
    this.bands.forEach(band => {
      band.frequency.disconnect();
      band.gain.disconnect();
    });
    
    // Route through EQ chain for each channel
    for (let channel = 0; channel < 2; channel++) {
      let currentNode: AudioNode = this.inputSplitter;
      
      // Low shelf
      currentNode.connect(this.lowShelf);
      currentNode = this.lowShelf;
      
      // Parametric bands
      this.bands.forEach(band => {
        currentNode.connect(band.frequency);
        band.frequency.connect(band.gain);
        currentNode = band.gain;
      });
      
      // High shelf
      currentNode.connect(this.highShelf);
      currentNode = this.highShelf;
      
      // Connect to output merger
      currentNode.connect(this.outputMerger, 0, channel);
    }
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
        id: 'lowShelfGain',
        name: 'Low Shelf',
        min: -20,
        max: 20,
        default: 0,
        value: 0,
        type: 'linear',
        unit: 'dB',
      },
      {
        id: 'lowShelfFreq',
        name: 'Low Shelf Freq',
        min: 20,
        max: 500,
        default: 100,
        value: 100,
        type: 'logarithmic',
        unit: 'Hz',
      },
      {
        id: 'highShelfGain',
        name: 'High Shelf',
        min: -20,
        max: 20,
        default: 0,
        value: 0,
        type: 'linear',
        unit: 'dB',
      },
      {
        id: 'highShelfFreq',
        name: 'High Shelf Freq',
        min: 2000,
        max: 20000,
        default: 10000,
        value: 10000,
        type: 'logarithmic',
        unit: 'Hz',
      },
    ];

    // Add parameters for each band
    for (let i = 0; i < this.numberOfBands; i++) {
      params.push(
        {
          id: `band${i}Gain`,
          name: `Band ${i + 1} Gain`,
          min: -20,
          max: 20,
          default: 0,
          value: 0,
          type: 'linear',
          unit: 'dB',
        },
        {
          id: `band${i}Freq`,
          name: `Band ${i + 1} Freq`,
          min: 20,
          max: 20000,
          default: [200, 800, 2400, 6000][i],
          value: [200, 800, 2400, 6000][i],
          type: 'logarithmic',
          unit: 'Hz',
        },
        {
          id: `band${i}Q`,
          name: `Band ${i + 1} Q`,
          min: 0.1,
          max: 30,
          default: 1,
          value: 1,
          type: 'logarithmic',
          unit: '',
        }
      );
    }

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
      case 'lowShelfGain':
        if (this.lowShelf) {
          this.lowShelf.gain.value = value;
        }
        break;
      case 'lowShelfFreq':
        if (this.lowShelf) {
          this.lowShelf.frequency.value = value;
        }
        break;
      case 'highShelfGain':
        if (this.highShelf) {
          this.highShelf.gain.value = value;
        }
        break;
      case 'highShelfFreq':
        if (this.highShelf) {
          this.highShelf.frequency.value = value;
        }
        break;
      default:
        // Handle band parameters
        const bandMatch = id.match(/^band(\d+)(Gain|Freq|Q)$/);
        if (bandMatch) {
          const bandIndex = parseInt(bandMatch[1]);
          const paramType = bandMatch[2];
          
          if (bandIndex < this.bands.length) {
            const band = this.bands[bandIndex];
            switch (paramType) {
              case 'Gain':
                band.frequency.gain.value = value;
                break;
              case 'Freq':
                band.frequency.frequency.value = value;
                break;
              case 'Q':
                band.frequency.Q.value = value;
                break;
            }
          }
        }
        break;
    }
  }

  public getEQCurve(): { frequency: number; magnitude: number }[] {
    const frequencies: number[] = [];
    const magnitudes: number[] = [];
    
    // Generate frequency points for visualization
    for (let freq = 20; freq <= 20000; freq *= 1.05) {
      frequencies.push(freq);
      
      // Calculate magnitude response (simplified)
      let magnitude = 0;
      
      // Low shelf contribution
      if (this.lowShelf) {
        const lowFreq = this.lowShelf.frequency.value;
        const lowGain = this.lowShelf.gain.value;
        magnitude += lowGain / (1 + Math.pow(freq / lowFreq, 2));
      }
      
      // Band contributions
      this.bands.forEach(band => {
        const bandFreq = band.frequency.frequency.value;
        const bandGain = band.frequency.gain.value;
        const bandQ = band.frequency.Q.value;
        const normalizedFreq = freq / bandFreq;
        const response = bandGain / Math.sqrt(1 + Math.pow(bandQ * (normalizedFreq - 1/normalizedFreq), 2));
        magnitude += response;
      });
      
      // High shelf contribution
      if (this.highShelf) {
        const highFreq = this.highShelf.frequency.value;
        const highGain = this.highShelf.gain.value;
        magnitude += highGain / (1 + Math.pow(highFreq / freq, 2));
      }
      
      magnitudes.push(magnitude);
    }
    
    return frequencies.map((freq, i) => ({
      frequency: freq,
      magnitude: magnitudes[i]
    }));
  }

  protected disposeEffectNodes(): void {
    this.inputSplitter.disconnect();
    this.outputMerger.disconnect();
    this.lowShelf.disconnect();
    this.highShelf.disconnect();
    this.bands.forEach(band => {
      band.frequency.disconnect();
      band.gain.disconnect();
    });
  }
}