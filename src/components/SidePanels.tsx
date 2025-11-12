import { memo, useState } from 'react';
import type { CSSProperties } from 'react';
import InstrumentPanel, { type TrackInstrumentState } from './InstrumentPanel';
import type { InstrumentPreset } from '../audio/instruments/types';
import { ImportExportPanel } from './ImportExportPanel';
import EffectsPanel from './EffectsPanel';
import EffectEditorPanel from './EffectEditorPanel';
import AIMusicPanel from './AIMusicPanel';
import AutoMixPanel from './AutoMixPanel';
import type { AudioEngine } from '../audio/AudioEngine';
import './ImportExportPanel.css';

interface SidePanelsProps {
  collapsed: boolean;
  width: number;
  selectedTrackId?: string;
  instrumentState?: TrackInstrumentState;
  audioEngine?: AudioEngine;
  onInstrumentTypeChange?: (type: TrackInstrumentState['type']) => void;
  onPresetSelect?: (preset: InstrumentPreset) => void;
  onParamChange?: (param: string, value: number) => void;
  onPreviewInstrument?: () => void;
  onSavePreset?: (name: string) => void;
  onImportAudio?: (files: File[]) => void;
  onImportProject?: (file: File) => Promise<void> | void;
  onImportMidi?: (file: File) => Promise<void> | void;
  onExportProject?: () => Promise<void> | void;
  onExportAudio?: (format: 'wav' | 'mp3' | 'ogg') => Promise<void> | void;
  onExportStems?: (format: 'wav' | 'mp3' | 'ogg') => Promise<void> | void;
  isProcessing?: boolean;
  progress?: number;
  statusMessage?: string;
  errorMessage?: string;
  onExportMidi?: () => Promise<void> | void;
  onAiMusicGenerated?: (audioBuffer: AudioBuffer, name: string, blob?: Blob) => void;
  activeTab?: PanelTab;
  onTabChange?: (tab: PanelTab) => void;
}

type PanelTab = 'inspector' | 'instrument' | 'effects' | 'effect-editor' | 'import-export' | 'ai-music' | 'auto-mix';

const SidePanels = memo(function SidePanels({
  collapsed,
  width,
  selectedTrackId,
  instrumentState,
  audioEngine,
  onInstrumentTypeChange,
  onPresetSelect,
  onParamChange,
  onPreviewInstrument,
  onSavePreset,
  onImportAudio,
  onImportProject,
  onImportMidi,
  onExportProject,
  onExportAudio,
  onExportStems,
  isProcessing,
  progress,
  statusMessage,
  errorMessage,
  onExportMidi,
  onAiMusicGenerated,
  activeTab,
  onTabChange: _onTabChange,
}: SidePanelsProps) {
  const [internalTab, setInternalTab] = useState<PanelTab>('inspector');
  const currentTab = activeTab ?? internalTab;

  const handleTabChange = (tab: PanelTab) => {
    setInternalTab(tab);
    _onTabChange?.(tab);
  };

  const panelStyle = {
    '--side-panel-width': collapsed ? '0px' : `${width}px`,
  } as CSSProperties;

  return (
    <aside
      className={`side-panels ${collapsed ? 'collapsed' : ''}`}
      aria-label="Side panels"
      aria-hidden={collapsed}
      style={panelStyle}
    >
      {!collapsed && (
        <>
          <header className="side-panel-header">
            <h2>Properties</h2>
          </header>
          <nav
            className="side-panel-tabs"
            role="tablist"
            aria-label="Panel tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'inspector'}
              aria-controls="inspector-panel"
              id="inspector-tab"
              className={`side-panel-tab ${currentTab === 'inspector' ? 'active' : ''}`}
              onClick={() => handleTabChange('inspector')}
            >
              Inspector
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'instrument'}
              aria-controls="instrument-panel"
              id="instrument-tab"
              className={`side-panel-tab ${currentTab === 'instrument' ? 'active' : ''}`}
              onClick={() => handleTabChange('instrument')}
            >
              Instrument
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'effects'}
              aria-controls="effects-panel"
              id="effects-tab"
              className={`side-panel-tab ${currentTab === 'effects' ? 'active' : ''}`}
              onClick={() => handleTabChange('effects')}
            >
              Effects
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'effect-editor'}
              aria-controls="effect-editor-panel"
              id="effect-editor-tab"
              className={`side-panel-tab ${currentTab === 'effect-editor' ? 'active' : ''}`}
              onClick={() => handleTabChange('effect-editor')}
            >
              Edit Effects
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'import-export'}
              aria-controls="import-export-panel"
              id="import-export-tab"
              className={`side-panel-tab ${currentTab === 'import-export' ? 'active' : ''}`}
              onClick={() => handleTabChange('import-export')}
            >
              Import/Export
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'ai-music'}
              aria-controls="ai-music-panel"
              id="ai-music-tab"
              className={`side-panel-tab ${currentTab === 'ai-music' ? 'active' : ''}`}
              onClick={() => handleTabChange('ai-music')}
            >
              AI Music
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={currentTab === 'auto-mix'}
              aria-controls="auto-mix-panel"
              id="auto-mix-tab"
              className={`side-panel-tab ${currentTab === 'auto-mix' ? 'active' : ''}`}
              onClick={() => handleTabChange('auto-mix')}
            >
              Auto-Mix
            </button>
          </nav>

          <div
            id="inspector-panel"
            role="tabpanel"
            aria-labelledby="inspector-tab"
            className="side-panel-content"
            hidden={currentTab !== 'inspector'}
          >
            <section className="panel">
              <div className="panel-header">
                <h3 className="text-sm">Track Inspector</h3>
              </div>
              <div className="panel-body">
                <div className="flex-col flex-gap-md">
                  <div className="card">
                    <label
                      htmlFor="track-name-input"
                      className="text-xs text-muted"
                    >
                      Track Name
                    </label>
                    <input
                      id="track-name-input"
                      type="text"
                      className="input"
                      defaultValue="Audio 1"
                      aria-label="Track name"
                    />
                  </div>

                  <div className="card">
                    <label
                      htmlFor="track-volume"
                      className="text-xs text-muted"
                    >
                      Volume
                    </label>
                    <input
                      id="track-volume"
                      type="range"
                      min={0}
                      max={100}
                      defaultValue={75}
                      aria-label="Track volume"
                    />
                    <span className="text-xs text-mono">-6 dB</span>
                  </div>

                  <div className="card">
                    <label htmlFor="track-pan" className="text-xs text-muted">
                      Pan
                    </label>
                    <input
                      id="track-pan"
                      type="range"
                      min={-100}
                      max={100}
                      defaultValue={0}
                      aria-label="Track pan"
                    />
                    <span className="text-xs text-mono">Center</span>
                  </div>

                  <div className="card">
                    <h4 className="text-xs text-muted">Track Color</h4>
                    <div
                      className="flex flex-gap-xs"
                      style={{ marginTop: 'var(--space-sm)' }}
                    >
                      {[
                        '#66d6b6',
                        '#f2aa4c',
                        '#f87272',
                        '#667eea',
                        '#45b797',
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="color-swatch"
                          style={{ background: color }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div
            id="instrument-panel"
            role="tabpanel"
            aria-labelledby="instrument-tab"
            className="side-panel-content"
            hidden={currentTab !== 'instrument'}
          >
            <InstrumentPanel
              trackId={selectedTrackId}
              instrumentState={instrumentState}
              onInstrumentTypeChange={onInstrumentTypeChange}
              onPresetSelect={onPresetSelect}
              onParamChange={onParamChange}
              onPreview={onPreviewInstrument}
              onSavePreset={onSavePreset}
            />
          </div>

          <div
            id="effects-panel"
            role="tabpanel"
            aria-labelledby="effects-tab"
            className="side-panel-content"
            hidden={currentTab !== 'effects'}
          >
            {audioEngine && (
              <EffectsPanel
                audioEngine={audioEngine}
                selectedTrackId={selectedTrackId}
              />
            )}
          </div>

          <div
            id="effect-editor-panel"
            role="tabpanel"
            aria-labelledby="effect-editor-tab"
            className="side-panel-content"
            hidden={currentTab !== 'effect-editor'}
          >
            {audioEngine && (
              <EffectEditorPanel
                audioEngine={audioEngine}
                selectedTrackId={selectedTrackId}
              />
            )}
          </div>

          <div
            id="import-export-panel"
            role="tabpanel"
            aria-labelledby="import-export-tab"
            className="side-panel-content"
            hidden={currentTab !== 'import-export'}
          >
            <ImportExportPanel
              onImportAudio={onImportAudio}
              onImportProject={onImportProject}
              onImportMidi={onImportMidi}
              onExportProject={onExportProject}
              onExportAudio={onExportAudio}
              onExportStems={onExportStems}
              isProcessing={isProcessing}
              progress={progress}
              statusMessage={statusMessage}
              errorMessage={errorMessage}
              onExportMidi={onExportMidi}
            />
          </div>

          <div
            id="ai-music-panel"
            role="tabpanel"
            aria-labelledby="ai-music-tab"
            className="side-panel-content"
            hidden={currentTab !== 'ai-music'}
          >
            <AIMusicPanel onAudioGenerated={onAiMusicGenerated} />
          </div>

          <div
            id="auto-mix-panel"
            role="tabpanel"
            aria-labelledby="auto-mix-tab"
            className="side-panel-content"
            hidden={currentTab !== 'auto-mix'}
          >
            <AutoMixPanel />
          </div>
        </>
      )}
    </aside>
  );
});

export default SidePanels;
