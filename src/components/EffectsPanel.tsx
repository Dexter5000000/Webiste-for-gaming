import React, { useState, useCallback } from 'react';
import type { BaseEffect } from '../audio/effects';
import type { AudioEngine } from '../audio/AudioEngine';
import EffectChain from './EffectChain';
import './EffectsPanel.css';

interface EffectsPanelProps {
  audioEngine: AudioEngine;
  selectedTrackId?: string;
}

const EffectsPanel: React.FC<EffectsPanelProps> = ({ audioEngine, selectedTrackId }) => {
  const [activeTab, setActiveTab] = useState<'master' | 'track'>('master');
  const [trackEffects, setTrackEffects] = useState<BaseEffect[]>([]);
  const [masterEffects, setMasterEffects] = useState<BaseEffect[]>([]);

  // Update effects when selected track changes
  React.useEffect(() => {
    if (selectedTrackId) {
      const chain = audioEngine.getTrackEffects(selectedTrackId);
      setTrackEffects(chain ? chain.getAllEffects() : []);
      setActiveTab('track');
    } else {
      setTrackEffects([]);
      setActiveTab('master');
    }
  }, [selectedTrackId, audioEngine]);

  // Update master effects
  React.useEffect(() => {
    const chain = audioEngine.getMasterEffects();
    setMasterEffects(chain.getAllEffects());
  }, [audioEngine]);

  const handleAddEffect = useCallback((effectType: string) => {
    if (activeTab === 'master') {
      audioEngine.addEffectToMaster(effectType);
      // Refresh master effects
      const chain = audioEngine.getMasterEffects();
      setMasterEffects(chain.getAllEffects());
    } else if (selectedTrackId) {
      audioEngine.addEffectToTrack(selectedTrackId, effectType);
      // Refresh track effects
      const chain = audioEngine.getTrackEffects(selectedTrackId);
      setTrackEffects(chain ? chain.getAllEffects() : []);
    }
  }, [activeTab, selectedTrackId, audioEngine]);

  const handleRemoveEffect = useCallback((effectId: string) => {
    if (activeTab === 'master') {
      audioEngine.removeEffectFromMaster(effectId);
      setMasterEffects(prev => prev.filter(effect => effect.id !== effectId));
    } else if (selectedTrackId) {
      audioEngine.removeEffectFromTrack(selectedTrackId, effectId);
      setTrackEffects(prev => prev.filter(effect => effect.id !== effectId));
    }
  }, [activeTab, selectedTrackId, audioEngine]);

  const handleToggleBypass = useCallback((effectId: string, bypassed: boolean) => {
    if (activeTab === 'master') {
      audioEngine.effectsManager.bypassEffectInMaster(effectId, bypassed);
    } else if (selectedTrackId) {
      audioEngine.effectsManager.bypassEffectInTrack(selectedTrackId, effectId, bypassed);
    }
  }, [activeTab, selectedTrackId, audioEngine]);

  const handleParameterChange = useCallback((effectId: string, paramId: string, value: number) => {
    const effects = activeTab === 'master' ? masterEffects : trackEffects;
    const effect = effects.find(e => e.id === effectId);
    if (effect) {
      effect.setParameter(paramId, value);
    }
  }, [activeTab, masterEffects, trackEffects]);

  const handleMoveEffect = useCallback((effectId: string, newIndex: number) => {
    if (activeTab === 'master') {
      audioEngine.effectsManager.moveEffectInMaster(effectId, newIndex);
      // Refresh master effects
      const chain = audioEngine.getMasterEffects();
      setMasterEffects(chain.getAllEffects());
    } else if (selectedTrackId) {
      audioEngine.effectsManager.moveEffectInTrack(selectedTrackId, effectId, newIndex);
      // Refresh track effects
      const chain = audioEngine.getTrackEffects(selectedTrackId);
      setTrackEffects(chain ? chain.getAllEffects() : []);
    }
  }, [activeTab, selectedTrackId, audioEngine]);

  const handleSetChainLevel = useCallback((level: number) => {
    if (activeTab === 'master') {
      audioEngine.getMasterEffects().setChainLevel(level);
    } else if (selectedTrackId) {
      const chain = audioEngine.getTrackEffects(selectedTrackId);
      if (chain) {
        chain.setChainLevel(level);
      }
    }
  }, [activeTab, selectedTrackId, audioEngine]);

  const getChainLevel = useCallback(() => {
    if (activeTab === 'master') {
      return audioEngine.getMasterEffects().getChainLevel();
    } else if (selectedTrackId) {
      const chain = audioEngine.getTrackEffects(selectedTrackId);
      return chain ? chain.getChainLevel() : 1;
    }
    return 1;
  }, [activeTab, selectedTrackId, audioEngine]);

  const currentEffects = activeTab === 'master' ? masterEffects : trackEffects;

  return (
    <div className="effects-panel">
      <div className="effects-tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === 'master' ? 'active' : ''}`}
          onClick={() => setActiveTab('master')}
        >
          Master
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => setActiveTab('track')}
          disabled={!selectedTrackId}
        >
          Track {selectedTrackId && `- ${selectedTrackId}`}
        </button>
      </div>

      <div className="effects-content">
        <EffectChain
          effects={currentEffects}
          isMaster={activeTab === 'master'}
          trackId={selectedTrackId}
          onAddEffect={handleAddEffect}
          onRemoveEffect={handleRemoveEffect}
          onToggleBypass={handleToggleBypass}
          onParameterChange={handleParameterChange}
          onMoveEffect={handleMoveEffect}
          onSetChainLevel={handleSetChainLevel}
          chainLevel={getChainLevel()}
        />
      </div>
    </div>
  );
};

export default EffectsPanel;