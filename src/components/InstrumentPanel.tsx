import { memo, useEffect, useMemo, useState } from 'react';
import { InstrumentFactory } from '../audio/instruments/InstrumentFactory';
import { PresetLoader } from '../audio/instruments/PresetLoader';
import type { InstrumentPreset, InstrumentType } from '../audio/instruments/types';

export interface TrackInstrumentState {
  type: InstrumentType;
  presetId?: string;
  params: Record<string, number>;
}

interface InstrumentPanelProps {
  trackId?: string;
  instrumentState?: TrackInstrumentState;
  onInstrumentTypeChange?: (type: InstrumentType) => void;
  onPresetSelect?: (preset: InstrumentPreset) => void;
  onParamChange?: (param: string, value: number) => void;
  onPreview?: () => void;
  onSavePreset?: (name: string) => void;
}

interface ParamDefinition {
  param: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  format?: (value: number) => string;
}

const PARAM_CONTROLS: Record<InstrumentType, ParamDefinition[]> = {
  subtractive: [
    { param: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
    { param: 'filterFrequency', label: 'Filter Frequency (Hz)', min: 50, max: 8000, step: 10, defaultValue: 2000 },
    { param: 'filterQ', label: 'Filter Q', min: 0.1, max: 10, step: 0.1, defaultValue: 1 },
    { param: 'attack', label: 'Attack (s)', min: 0.001, max: 2, step: 0.001, defaultValue: 0.01 },
    { param: 'decay', label: 'Decay (s)', min: 0.01, max: 2, step: 0.01, defaultValue: 0.1 },
    { param: 'sustain', label: 'Sustain', min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
    { param: 'release', label: 'Release (s)', min: 0.01, max: 4, step: 0.01, defaultValue: 0.3 },
    { param: 'lfoRate', label: 'LFO Rate (Hz)', min: 0.1, max: 12, step: 0.1, defaultValue: 5 },
    { param: 'lfoAmount', label: 'LFO Amount', min: 0, max: 1200, step: 1, defaultValue: 0 },
  ],
  fm: [
    { param: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, defaultValue: 0.6 },
    { param: 'modulationIndex', label: 'Modulation Index', min: 0, max: 1000, step: 1, defaultValue: 150 },
    { param: 'carrierRatio', label: 'Carrier Ratio', min: 0.25, max: 8, step: 0.25, defaultValue: 1 },
    { param: 'modulatorRatio', label: 'Modulator Ratio', min: 0.25, max: 8, step: 0.25, defaultValue: 2 },
    { param: 'attack', label: 'Attack (s)', min: 0.001, max: 1, step: 0.001, defaultValue: 0.01 },
    { param: 'decay', label: 'Decay (s)', min: 0.01, max: 2, step: 0.01, defaultValue: 0.2 },
    { param: 'sustain', label: 'Sustain', min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
    { param: 'release', label: 'Release (s)', min: 0.01, max: 3, step: 0.01, defaultValue: 0.4 },
  ],
  sampler: [
    { param: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
    { param: 'filterFrequency', label: 'Filter Frequency (Hz)', min: 100, max: 20000, step: 100, defaultValue: 20000 },
    { param: 'filterQ', label: 'Filter Q', min: 0.1, max: 10, step: 0.1, defaultValue: 1 },
    { param: 'attack', label: 'Attack (s)', min: 0.001, max: 1, step: 0.001, defaultValue: 0.001 },
    { param: 'decay', label: 'Decay (s)', min: 0.01, max: 1, step: 0.01, defaultValue: 0.1 },
    { param: 'sustain', label: 'Sustain', min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
    { param: 'release', label: 'Release (s)', min: 0.01, max: 2, step: 0.01, defaultValue: 0.2 },
    { param: 'playbackRate', label: 'Playback Rate', min: 0.5, max: 2, step: 0.01, defaultValue: 1 },
  ],
  drums: [
    { param: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, defaultValue: 0.8 },
    { param: 'swing', label: 'Swing', min: 0, max: 0.75, step: 0.01, defaultValue: 0 },
  ],
};

const instrumentOptions = InstrumentFactory.getAvailableInstruments();

const InstrumentPanel = memo(function InstrumentPanel({
  trackId,
  instrumentState,
  onInstrumentTypeChange,
  onPresetSelect,
  onParamChange,
  onPreview,
  onSavePreset,
}: InstrumentPanelProps) {
  const instrumentType = instrumentState?.type ?? 'subtractive';
  const [presets, setPresets] = useState<InstrumentPreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [presetName, setPresetName] = useState('Custom Preset');

  useEffect(() => {
    let cancelled = false;
    setLoadingPresets(true);
    (async () => {
      try {
        const builtIn = await PresetLoader.loadPresets(instrumentType);
        const custom = PresetLoader.loadCustomPresets(instrumentType);
        if (!cancelled) {
          setPresets([...builtIn, ...custom]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPresets(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [instrumentType]);

  const activePreset = useMemo(() => {
    if (!instrumentState?.presetId) return undefined;
    return presets.find((preset) => preset.id === instrumentState.presetId);
  }, [instrumentState?.presetId, presets]);

  const paramDefinitions = PARAM_CONTROLS[instrumentType];
  const isInstrumentTrack = Boolean(trackId && instrumentState);

  const handlePresetSelect = (preset: InstrumentPreset) => {
    onPresetSelect?.(preset);
  };

  const handleParamChange = (definition: ParamDefinition, value: number) => {
    onParamChange?.(definition.param, value);
  };

  const formatValue = (definition: ParamDefinition, value: number): string => {
    if (definition.format) {
      return definition.format(value);
    }
    if (definition.unit === '%') {
      return `${Math.round(value * 100)}%`;
    }
    if (value >= 1000) {
      return `${Math.round(value)}`;
    }
    if (value >= 100) {
      return value.toFixed(1);
    }
    return value.toFixed(2);
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h3 className="text-sm">Virtual Instrument</h3>
      </div>
      <div className="panel-body">
        {!trackId ? (
          <p className="text-xs text-muted">Select a track to configure its instrument.</p>
        ) : !isInstrumentTrack ? (
          <p className="text-xs text-muted">
            The selected track does not use a virtual instrument. Choose a MIDI or instrument track to edit its sound.
          </p>
        ) : (
          <div className="flex-col flex-gap-md">
            <div className="card">
              <label htmlFor="instrument-select" className="text-xs text-muted">
                Instrument Type
              </label>
              <select
                id="instrument-select"
                className="input"
                value={instrumentType}
                onChange={(event) => onInstrumentTypeChange?.(event.target.value as InstrumentType)}
                aria-label="Select instrument type"
              >
                {instrumentOptions.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
                {instrumentOptions.find((option) => option.type === instrumentType)?.description}
              </p>
            </div>

            <div className="card">
              <div className="flex flex-gap-sm flex-align-center" style={{ marginBottom: 'var(--space-sm)' }}>
                <h4 className="text-xs text-muted" style={{ flex: 1 }}>
                  Presets
                </h4>
                <button
                  type="button"
                  className="button button-secondary button-xs"
                  onClick={() => {
                    if (activePreset) {
                      handlePresetSelect(activePreset);
                    }
                  }}
                  disabled={!activePreset}
                  aria-label="Reload preset"
                >
                  Reload
                </button>
              </div>
              {loadingPresets ? (
                <p className="text-xs text-muted">Loading presets…</p>
              ) : presets.length === 0 ? (
                <p className="text-xs text-muted">No presets available.</p>
              ) : (
                <div className="preset-list" style={{ marginTop: 'var(--space-sm)' }}>
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={`button ${
                        instrumentState?.presetId === preset.id ? 'button-primary' : 'button-secondary'
                      } text-xs`}
                      style={{ width: '100%', marginBottom: 'var(--space-xs)' }}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h4 className="text-xs text-muted">Controls</h4>
              <div className="flex-col flex-gap-sm" style={{ marginTop: 'var(--space-sm)' }}>
                {paramDefinitions.map((definition) => {
                  const value = instrumentState?.params[definition.param] ?? definition.defaultValue;
                  return (
                    <ParamSlider
                      key={definition.param}
                      label={definition.label}
                      value={value}
                      min={definition.min}
                      max={definition.max}
                      step={definition.step}
                      formatValue={(next) => formatValue(definition, next)}
                      onChange={(next) => handleParamChange(definition, next)}
                    />
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h4 className="text-xs text-muted">Utilities</h4>
              <div className="flex-col flex-gap-sm" style={{ marginTop: 'var(--space-sm)' }}>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => onPreview?.()}
                >
                  Preview Instrument
                </button>

                <div className="flex flex-gap-sm flex-align-center">
                  <input
                    type="text"
                    className="input"
                    value={presetName}
                    onChange={(event) => setPresetName(event.target.value)}
                    placeholder="Preset name"
                    aria-label="Preset name"
                  />
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      if (presetName.trim()) {
                        onSavePreset?.(presetName.trim());
                      }
                    }}
                  >
                    Save Preset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
}

const ParamSlider = memo(function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  formatValue,
  onChange,
}: ParamSliderProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="text-xs">{label}</label>
        <span className="text-xs text-mono">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        aria-label={label}
        style={{ width: '100%' }}
      />
    </div>
  );
});

export default InstrumentPanel;
