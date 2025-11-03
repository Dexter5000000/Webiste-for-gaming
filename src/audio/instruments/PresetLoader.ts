import type { InstrumentPreset, InstrumentType } from './types';

class PresetLoaderClass {
  private cache: Map<InstrumentType, InstrumentPreset[]> = new Map();
  private loading: Map<InstrumentType, Promise<InstrumentPreset[]>> = new Map();

  async loadPresets(type: InstrumentType): Promise<InstrumentPreset[]> {
    if (this.cache.has(type)) {
      return this.cache.get(type)!;
    }

    if (this.loading.has(type)) {
      return this.loading.get(type)!;
    }

    const loadPromise = this.fetchPresets(type);
    this.loading.set(type, loadPromise);

    try {
      const presets = await loadPromise;
      this.cache.set(type, presets);
      return presets;
    } finally {
      this.loading.delete(type);
    }
  }

  async loadAllPresets(): Promise<Map<InstrumentType, InstrumentPreset[]>> {
    const types: InstrumentType[] = ['subtractive', 'fm', 'sampler', 'drums'];
    await Promise.all(types.map((type) => this.loadPresets(type)));
    return this.cache;
  }

  getPreset(type: InstrumentType, id: string): InstrumentPreset | undefined {
    const presets = this.cache.get(type);
    return presets?.find((p) => p.id === id);
  }

  getAllPresetsForType(type: InstrumentType): InstrumentPreset[] {
    return this.cache.get(type) ?? [];
  }

  clearCache(): void {
    this.cache.clear();
  }

  private async fetchPresets(type: InstrumentType): Promise<InstrumentPreset[]> {
    const url = `/assets/presets/${type}-presets.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to load presets for ${type}: ${response.statusText}`);
        return [];
      }
      const presets = await response.json();
      return Array.isArray(presets) ? presets : [];
    } catch (error) {
      console.error(`Error loading presets for ${type}:`, error);
      return [];
    }
  }

  saveCustomPreset(preset: InstrumentPreset): void {
    const key = `custom-preset-${preset.instrumentType}`;
    const stored = localStorage.getItem(key);
    const customPresets: InstrumentPreset[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = customPresets.findIndex((p) => p.id === preset.id);
    if (existingIndex >= 0) {
      customPresets[existingIndex] = preset;
    } else {
      customPresets.push(preset);
    }
    
    localStorage.setItem(key, JSON.stringify(customPresets));
    
    const cached = this.cache.get(preset.instrumentType) ?? [];
    const cacheIndex = cached.findIndex((p) => p.id === preset.id);
    if (cacheIndex >= 0) {
      cached[cacheIndex] = preset;
    } else {
      cached.push(preset);
    }
    this.cache.set(preset.instrumentType, cached);
  }

  loadCustomPresets(type: InstrumentType): InstrumentPreset[] {
    const key = `custom-preset-${type}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  deleteCustomPreset(type: InstrumentType, id: string): void {
    const key = `custom-preset-${type}`;
    const stored = localStorage.getItem(key);
    if (!stored) return;
    
    const customPresets: InstrumentPreset[] = JSON.parse(stored);
    const filtered = customPresets.filter((p) => p.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
    
    const cached = this.cache.get(type);
    if (cached) {
      this.cache.set(
        type,
        cached.filter((p) => p.id !== id)
      );
    }
  }
}

export const PresetLoader = new PresetLoaderClass();
