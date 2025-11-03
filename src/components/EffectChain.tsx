import React, { useCallback } from 'react';
import type { BaseEffect } from '../audio/effects';
import { AVAILABLE_EFFECTS, type EffectType } from '../audio/effects';
import EffectSlot from './EffectSlot';
import './EffectChain.css';

interface EffectChainProps {
  effects: BaseEffect[];
  isMaster?: boolean;
  trackId?: string;
  onAddEffect: (effectType: EffectType) => void;
  onRemoveEffect: (effectId: string) => void;
  onToggleBypass: (effectId: string, bypassed: boolean) => void;
  onParameterChange: (effectId: string, paramId: string, value: number) => void;
  onMoveEffect: (effectId: string, newIndex: number) => void;
  onSetChainLevel?: (level: number) => void;
  chainLevel?: number;
}

const EffectChain: React.FC<EffectChainProps> = ({
  effects,
  isMaster = false,
  trackId,
  onAddEffect,
  onRemoveEffect,
  onToggleBypass,
  onParameterChange,
  onMoveEffect,
  onSetChainLevel,
  chainLevel = 1,
}) => {
  const [isAddingEffect, setIsAddingEffect] = React.useState(false);
  const [draggedEffect, setDraggedEffect] = React.useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragStart = useCallback((effectId: string) => {
    setDraggedEffect(effectId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedEffect(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedEffect) return;
    
    const draggedIndex = effects.findIndex(effect => effect.id === draggedEffect);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;
    
    onMoveEffect(draggedEffect, dropIndex);
    setDragOverIndex(null);
  }, [draggedEffect, effects, onMoveEffect]);

  const handleAddEffect = useCallback((effectType: EffectType) => {
    onAddEffect(effectType);
    setIsAddingEffect(false);
  }, [onAddEffect]);

  return (
    <div className={`effect-chain ${isMaster ? 'master-chain' : 'track-chain'}`}>
      <div className="chain-header">
        <h3 className="chain-title">
          {isMaster ? 'Master Effects' : `Track Effects${trackId ? ` - ${trackId}` : ''}`}
        </h3>
        <div className="chain-controls">
          {onSetChainLevel && (
            <div className="chain-level-control">
              <label className="chain-level-label">
                Level
                <span className="chain-level-value">
                  {Math.round(chainLevel * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={chainLevel}
                onChange={(e) => onSetChainLevel(parseFloat(e.target.value))}
                className="chain-level-slider"
              />
            </div>
          )}
          <button
            type="button"
            className="button button-primary button-sm"
            onClick={() => setIsAddingEffect(true)}
          >
            + Add Effect
          </button>
        </div>
      </div>

      {isAddingEffect && (
        <div className="effect-selector-overlay">
          <div className="effect-selector">
            <div className="effect-selector-header">
              <h4>Add Effect</h4>
              <button
                type="button"
                className="button button-ghost button-icon-sm"
                onClick={() => setIsAddingEffect(false)}
              >
                ×
              </button>
            </div>
            <div className="effect-list">
              {AVAILABLE_EFFECTS.map((effect) => (
                <button
                  key={effect.type}
                  type="button"
                  className="effect-item"
                  onClick={() => handleAddEffect(effect.type)}
                >
                  <div className="effect-item-info">
                    <span className="effect-item-name">{effect.name}</span>
                    <span className="effect-item-description">{effect.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="effects-list">
        {effects.length === 0 ? (
          <div className="no-effects">
            <p>No effects added yet</p>
            <p className="text-muted">Click "Add Effect" to get started</p>
          </div>
        ) : (
          effects.map((effect, index) => (
            <div
              key={effect.id}
              className={`effect-slot-wrapper ${
                draggedEffect === effect.id ? 'dragging' : ''
              } ${
                dragOverIndex === index && draggedEffect !== effect.id ? 'drag-over-before' : ''
              } ${
                dragOverIndex === index + 1 && draggedEffect !== effect.id ? 'drag-over-after' : ''
              }`}
              draggable
              onDragStart={() => handleDragStart(effect.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              <EffectSlot
                effect={effect}
                isBypassed={!effect.isEnabled()}
                onToggleBypass={() => onToggleBypass(effect.id, !effect.isEnabled())}
                onRemove={() => onRemoveEffect(effect.id)}
                onParameterChange={(paramId, value) => onParameterChange(effect.id, paramId, value)}
                onMoveUp={index > 0 ? () => onMoveEffect(effect.id, index - 1) : undefined}
                onMoveDown={index < effects.length - 1 ? () => onMoveEffect(effect.id, index + 1) : undefined}
                canMoveUp={index > 0}
                canMoveDown={index < effects.length - 1}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EffectChain;