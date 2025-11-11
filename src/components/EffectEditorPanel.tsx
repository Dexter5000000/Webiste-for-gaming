import React, { useState, useCallback, useEffect } from 'react';
import type { BaseEffect, EffectParameter } from '../audio/effects';
import type { AudioEngine } from '../audio/AudioEngine';
import './EffectEditorPanel.css';

export interface EffectPreset {
  id: string;
  name: string;
  type: string;
  description?: string;
  parameters: Record<string, number>;
}

interface EffectEditorPanelProps {
  audioEngine: AudioEngine;
  selectedTrackId?: string;
}

const EffectEditorPanel: React.FC<EffectEditorPanelProps> = ({ audioEngine, selectedTrackId }) => {
  const [activeTab, setActiveTab] = useState<'master' | 'track'>('master');
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);
  const [masterEffects, setMasterEffects] = useState<BaseEffect[]>([]);
  const [trackEffects, setTrackEffects] = useState<BaseEffect[]>([]);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [customPresets, setCustomPresets] = useState<EffectPreset[]>([]);

  // Load custom presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zenith_daw_effect_presets');
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load presets:', e);
      }
    }
  }, []);

  // Update effects when track changes
  useEffect(() => {
    if (selectedTrackId) {
      const chain = audioEngine.getTrackEffects(selectedTrackId);
      setTrackEffects(chain ? chain.getAllEffects() : []);
      setActiveTab('track');
    } else {
      setTrackEffects([]);
      setActiveTab('master');
    }
    setSelectedEffectId(null);
  }, [selectedTrackId, audioEngine]);

  // Update master effects
  useEffect(() => {
    const chain = audioEngine.getMasterEffects();
    setMasterEffects(chain.getAllEffects());
  }, [audioEngine]);

  const currentEffects = activeTab === 'master' ? masterEffects : trackEffects;
  const selectedEffect = selectedEffectId ? currentEffects.find(e => e.id === selectedEffectId) : null;

  const handleParameterChange = useCallback((paramId: string, value: number) => {
    if (selectedEffect) {
      selectedEffect.setParameter(paramId, value);
      // Update the parameter objects to reflect the change
      const updatedEffects = activeTab === 'master' ? [...masterEffects] : [...trackEffects];
      const effectIdx = updatedEffects.findIndex(e => e.id === selectedEffectId);
      if (effectIdx !== -1) {
        const param = updatedEffects[effectIdx].getParameter(paramId);
        if (param) {
          param.value = value;
        }
      }
      // Force re-render
      if (activeTab === 'master') {
        setMasterEffects(updatedEffects);
      } else {
        setTrackEffects(updatedEffects);
      }
    }
  }, [selectedEffect, activeTab, masterEffects, trackEffects, selectedEffectId]);

  const handleSavePreset = useCallback(() => {
    if (!selectedEffect || !presetName.trim()) return;

    const preset: EffectPreset = {
      id: `${selectedEffect.type}-${Date.now()}`,
      name: presetName,
      type: selectedEffect.type,
      description: `Custom ${selectedEffect.name} preset`,
      parameters: Object.fromEntries(
        selectedEffect.getAllParameters().map(p => [p.id, p.value])
      ),
    };

    const updated = [...customPresets, preset];
    setCustomPresets(updated);
    localStorage.setItem('zenith_daw_effect_presets', JSON.stringify(updated));
    setPresetName('');
    setShowPresetModal(false);
  }, [selectedEffect, presetName, customPresets]);

  const handleApplyPreset = useCallback((preset: EffectPreset) => {
    if (selectedEffect && selectedEffect.type === preset.type) {
      // Apply each parameter from the preset
      Object.entries(preset.parameters).forEach(([paramId, value]) => {
        const param = selectedEffect.getParameter(paramId);
        if (param) {
          selectedEffect.setParameter(paramId, value);
        }
      });
      // Force re-render with fresh parameter data
      const updatedEffects = activeTab === 'master' ? [...masterEffects] : [...trackEffects];
      if (activeTab === 'master') {
        setMasterEffects(updatedEffects);
      } else {
        setTrackEffects(updatedEffects);
      }
    }
  }, [selectedEffect, activeTab, masterEffects, trackEffects]);

  const handleDeletePreset = useCallback((presetId: string) => {
    const updated = customPresets.filter(p => p.id !== presetId);
    setCustomPresets(updated);
    localStorage.setItem('zenith_daw_effect_presets', JSON.stringify(updated));
  }, [customPresets]);

  const getBuiltInPresets = (effectType: string): EffectPreset[] => {
    const presetMap: Record<string, EffectPreset[]> = {
      'compressor': [
        {
          id: 'comp-vocal',
          name: 'Vocal Glue',
          type: 'compressor',
          description: 'Smooth compression for vocals',
          parameters: { threshold: -20, ratio: 4, attack: 0.005, release: 0.1, makeupGain: 5 },
        },
        {
          id: 'comp-drum',
          name: 'Drum Punch',
          type: 'compressor',
          description: 'Fast compression for drums',
          parameters: { threshold: -10, ratio: 8, attack: 0.001, release: 0.05, makeupGain: 8 },
        },
        {
          id: 'comp-bass',
          name: 'Bass Control',
          type: 'compressor',
          description: 'Tight bass compression',
          parameters: { threshold: -15, ratio: 6, attack: 0.003, release: 0.15, makeupGain: 6 },
        },
      ],
      'reverb': [
        {
          id: 'rev-small',
          name: 'Small Room',
          type: 'reverb',
          description: 'Intimate room reverb',
          parameters: { decay: 1.5, dry: 0.7, wet: 0.3 },
        },
        {
          id: 'rev-large',
          name: 'Large Hall',
          type: 'reverb',
          description: 'Grand hall reverb',
          parameters: { decay: 4, dry: 0.6, wet: 0.4 },
        },
        {
          id: 'rev-plate',
          name: 'Plate Reverb',
          type: 'reverb',
          description: 'Bright plate reverb',
          parameters: { decay: 2, dry: 0.65, wet: 0.35 },
        },
      ],
      'delay': [
        {
          id: 'del-slap',
          name: 'Slap Delay',
          type: 'delay',
          description: 'Fast single tap',
          parameters: { time: 0.25, feedback: 0.3, dry: 0.8, wet: 0.2 },
        },
        {
          id: 'del-quarter',
          name: 'Quarter Note',
          type: 'delay',
          description: '1/4 note delay',
          parameters: { time: 0.5, feedback: 0.4, dry: 0.8, wet: 0.2 },
        },
        {
          id: 'del-eighth',
          name: 'Eighth Note',
          type: 'delay',
          description: '1/8 note delay',
          parameters: { time: 0.25, feedback: 0.5, dry: 0.8, wet: 0.2 },
        },
      ],
      'filter': [
        {
          id: 'filt-bright',
          name: 'Brightener',
          type: 'filter',
          description: 'High-pass to brighten',
          parameters: { frequency: 200, resonance: 1 },
        },
        {
          id: 'filt-warm',
          name: 'Warmth',
          type: 'filter',
          description: 'Low-pass for warmth',
          parameters: { frequency: 8000, resonance: 1.2 },
        },
      ],
      'distortion': [
        {
          id: 'dist-subtle',
          name: 'Subtle Grit',
          type: 'distortion',
          description: 'Light saturation',
          parameters: { amount: 0.3, tone: 0.5 },
        },
        {
          id: 'dist-heavy',
          name: 'Heavy Drive',
          type: 'distortion',
          description: 'Aggressive distortion',
          parameters: { amount: 0.8, tone: 0.7 },
        },
      ],
      'eq': [
        {
          id: 'eq-bright',
          name: 'Bright & Present',
          type: 'eq',
          description: 'Boost presence and brightness',
          parameters: { low: 0, mid: 2, high: 4 },
        },
        {
          id: 'eq-warm',
          name: 'Warm & Dark',
          type: 'eq',
          description: 'Warm low end, smooth highs',
          parameters: { low: 3, mid: 0, high: -2 },
        },
      ],
    };
    return presetMap[effectType] || [];
  };

  const allPresets = [
    ...getBuiltInPresets(selectedEffect?.type || ''),
    ...customPresets.filter(p => p.type === selectedEffect?.type),
  ];

  const handleResetParameters = useCallback(() => {
    if (!selectedEffect) return;
    selectedEffect.getAllParameters().forEach(param => {
      selectedEffect.setParameter(param.id, param.default);
    });
    // Force re-render with fresh parameter data
    const updatedEffects = activeTab === 'master' ? [...masterEffects] : [...trackEffects];
    if (activeTab === 'master') {
      setMasterEffects(updatedEffects);
    } else {
      setTrackEffects(updatedEffects);
    }
  }, [selectedEffect, activeTab, masterEffects, trackEffects]);

  return (
    <div className="effect-editor-panel">
      <div className="editor-container">
        <div className="effects-list-section">
          <div className="section-header">
            <h3>Active Effects</h3>
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === 'master' ? 'active' : ''}`}
                onClick={() => setActiveTab('master')}
              >
                Master
              </button>
              {selectedTrackId && (
                <button
                  className={`tab-btn ${activeTab === 'track' ? 'active' : ''}`}
                  onClick={() => setActiveTab('track')}
                >
                  Track
                </button>
              )}
            </div>
          </div>

          <div className="effects-list">
            {currentEffects.length === 0 ? (
              <div className="empty-state">No effects added</div>
            ) : (
              currentEffects.map(effect => (
                <button
                  key={effect.id}
                  className={`effect-item ${selectedEffectId === effect.id ? 'selected' : ''}`}
                  onClick={() => setSelectedEffectId(effect.id)}
                >
                  <div className="effect-item-info">
                    <div className="effect-item-name">{effect.name}</div>
                    <div className="effect-item-type">{effect.type}</div>
                  </div>
                  <div className="effect-item-status">
                    {effect.isEnabled() ? '●' : '○'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="editor-section">
          {selectedEffect ? (
            <>
              <div className="editor-header">
                <div>
                  <h3>{selectedEffect.name}</h3>
                  <p className="effect-type-label">{selectedEffect.type}</p>
                </div>
                <button
                  className="reset-btn"
                  onClick={handleResetParameters}
                  title="Reset to defaults"
                >
                  Reset
                </button>
              </div>

              <div className="parameters-section">
                <h4>Parameters</h4>
                <div className="parameters-list">
                  {selectedEffect.getAllParameters().map(param => (
                    <ParameterEditor
                      key={param.id}
                      param={param}
                      onChange={(value) => handleParameterChange(param.id, value)}
                    />
                  ))}
                </div>
              </div>

              <div className="presets-section">
                <h4>Presets</h4>
                {allPresets.length > 0 ? (
                  <div className="presets-grid">
                    {allPresets.map(preset => (
                      <div key={preset.id} className="preset-item">
                        <button
                          className="preset-apply-btn"
                          onClick={() => handleApplyPreset(preset)}
                          title={preset.description}
                        >
                          {preset.name}
                        </button>
                        {customPresets.some(p => p.id === preset.id) && (
                          <button
                            className="preset-delete-btn"
                            onClick={() => handleDeletePreset(preset.id)}
                            title="Delete preset"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-small">No presets available</div>
                )}
              </div>

              <div className="save-preset-section">
                <button
                  className="save-preset-btn"
                  onClick={() => setShowPresetModal(true)}
                >
                  Save as Preset
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Select an effect to edit</p>
            </div>
          )}
        </div>
      </div>

      {showPresetModal && (
        <div className="modal-overlay" onClick={() => setShowPresetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Save as Preset</h3>
            <input
              type="text"
              placeholder="Enter preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="preset-name-input"
              autoFocus
            />
            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setShowPresetModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ParameterEditorProps {
  param: EffectParameter;
  onChange: (value: number) => void;
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({ param, onChange }) => {
  const [isNumericInput, setIsNumericInput] = useState(false);

  const formatValue = (value: number): string => {
    switch (param.unit) {
      case 'dB':
        return `${value.toFixed(1)}dB`;
      case 'Hz':
        if (value >= 1000) return `${(value / 1000).toFixed(1)}kHz`;
        return `${Math.round(value)}Hz`;
      case 's':
      case 'ms':
        if (value < 0.001) return `${(value * 1000000).toFixed(0)}μs`;
        if (value < 1) return `${(value * 1000).toFixed(1)}ms`;
        return `${value.toFixed(2)}s`;
      case '%':
        return `${Math.round(value * 100)}%`;
      case ':1':
        return `${value.toFixed(1)}:1`;
      default:
        return value.toFixed(2);
    }
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onChange(Math.max(param.min, Math.min(param.max, value)));
    }
  };

  return (
    <div className="parameter-editor">
      <div className="parameter-header">
        <label className="parameter-name">{param.name}</label>
        <div
          className="parameter-value-display"
          onClick={() => setIsNumericInput(!isNumericInput)}
          title="Click to edit numerically"
        >
          {formatValue(param.value)}
        </div>
      </div>

      <div className="parameter-input-group">
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={param.type === 'logarithmic' ? 'any' : (param.max - param.min) / 100}
          value={param.value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="parameter-slider"
        />
      </div>

      {isNumericInput && (
        <input
          type="number"
          min={param.min}
          max={param.max}
          step={0.01}
          value={param.value}
          onChange={handleNumericChange}
          onBlur={() => setIsNumericInput(false)}
          className="parameter-numeric-input"
          autoFocus
        />
      )}
    </div>
  );
};

export default EffectEditorPanel;
