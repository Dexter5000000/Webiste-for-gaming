import React, { useState } from 'react';
import type { BaseEffect, EffectParameter } from '../audio/effects';
import './EffectSlot.css';

interface EffectSlotProps {
  effect: BaseEffect;
  isBypassed: boolean;
  onToggleBypass: () => void;
  onRemove: () => void;
  onParameterChange: (paramId: string, value: number) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const EffectSlot: React.FC<EffectSlotProps> = ({
  effect,
  isBypassed,
  onToggleBypass,
  onRemove,
  onParameterChange,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatParameterValue = (param: EffectParameter): string => {
    const value = param.value;
    
    switch (param.unit) {
      case 'dB':
        return `${value.toFixed(1)}dB`;
      case 'Hz':
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}kHz`;
        }
        return `${Math.round(value)}Hz`;
      case 's':
        if (value < 0.001) {
          return `${(value * 1000000).toFixed(0)}μs`;
        } else if (value < 1) {
          return `${(value * 1000).toFixed(1)}ms`;
        }
        return `${value.toFixed(2)}s`;
      case '%':
        return `${Math.round(value * 100)}%`;
      case ':1':
        return `${value.toFixed(1)}:1`;
      default:
        return value.toFixed(2);
    }
  };

  const renderParameterControl = (param: EffectParameter) => {
    const isLogarithmic = param.type === 'logarithmic';
    
    return (
      <div key={param.id} className="parameter-control">
        <label className="parameter-label">
          {param.name}
          <span className="parameter-value">
            {formatParameterValue(param)}
          </span>
        </label>
        <input
          type="range"
          min={param.min}
          max={param.max}
          step={isLogarithmic ? 'any' : (param.max - param.min) / 100}
          value={param.value}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            onParameterChange(param.id, value);
          }}
          className="parameter-slider"
          disabled={isBypassed}
        />
      </div>
    );
  };

  const renderSpecialControls = () => {
    switch (effect.type) {
      case 'eq':
        return (
          <div className="special-controls">
            <div className="eq-curve-placeholder">
              <span>EQ Curve Visualization</span>
            </div>
          </div>
        );
      case 'compressor':
        return (
          <div className="special-controls">
            <div className="gain-reduction-meter">
              <div className="meter-label">Gain Reduction</div>
              <div className="meter-bar">
                <div 
                  className="meter-fill"
                  style={{ 
                    width: `${Math.min(Math.abs((effect as any).getGainReduction?.() || 0) * 10, 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        );
      case 'filter':
        return (
          <div className="special-controls">
            <div className="filter-response-placeholder">
              <span>Filter Response</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`effect-slot ${isBypassed ? 'bypassed' : ''}`}>
      <div className="effect-header">
        <div className="effect-info">
          <h4 className="effect-name">{effect.name}</h4>
          <span className="effect-type">{effect.type}</span>
        </div>
        <div className="effect-controls">
          <button
            type="button"
            className={`button button-ghost button-icon-sm ${isBypassed ? 'active' : ''}`}
            onClick={onToggleBypass}
            title={isBypassed ? 'Enable effect' : 'Bypass effect'}
          >
            {isBypassed ? '○' : '●'}
          </button>
          {onMoveUp && (
            <button
              type="button"
              className="button button-ghost button-icon-sm"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              title="Move up"
            >
              ↑
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              className="button button-ghost button-icon-sm"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              title="Move down"
            >
              ↓
            </button>
          )}
          <button
            type="button"
            className="button button-ghost button-icon-sm"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '−' : '+'}
          </button>
          <button
            type="button"
            className="button button-ghost button-icon-sm danger"
            onClick={onRemove}
            title="Remove effect"
          >
            ×
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="effect-body">
          <div className="parameters-grid">
            {effect.getAllParameters().map(renderParameterControl)}
          </div>
          {renderSpecialControls()}
        </div>
      )}
    </div>
  );
};

export default EffectSlot;