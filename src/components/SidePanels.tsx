import { memo, useState } from 'react';
import type { CSSProperties } from 'react';
import InstrumentPanel, { type TrackInstrumentState } from './InstrumentPanel';
import type { InstrumentPreset } from '../audio/instruments/types';
import { ImportExportPanel } from './ImportExportPanel';
import EffectsPanel from './EffectsPanel';
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
  onExportProject?: () => Promise<void> | void;
  onExportAudio?: (format: 'wav' | 'mp3' | 'ogg') => Promise<void> | void;
  onExportStems?: (format: 'wav' | 'mp3' | 'ogg') => Promise<void> | void;
}

type PanelTab = 'inspector' | 'instrument' | 'effects' | 'import-export';

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
  onExportProject,
  onExportAudio,
  onExportStems,
}: SidePanelsProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('inspector');

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
          <nav
            className="side-panel-tabs"
            role="tablist"
            aria-label="Panel tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inspector'}
              aria-controls="inspector-panel"
              id="inspector-tab"
              className={`side-panel-tab ${activeTab === 'inspector' ? 'active' : ''}`}
              onClick={() => setActiveTab('inspector')}
            >
              Inspector
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'instrument'}
              aria-controls="instrument-panel"
              id="instrument-tab"
              className={`side-panel-tab ${activeTab === 'instrument' ? 'active' : ''}`}
              onClick={() => setActiveTab('instrument')}
            >
              Instrument
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'effects'}
              aria-controls="effects-panel"
              id="effects-tab"
              className={`side-panel-tab ${activeTab === 'effects' ? 'active' : ''}`}
              onClick={() => setActiveTab('effects')}
            >
              Effects
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'import-export'}
              aria-controls="import-export-panel"
              id="import-export-tab"
              className={`side-panel-tab ${activeTab === 'import-export' ? 'active' : ''}`}
              onClick={() => setActiveTab('import-export')}
            >
              Import/Export
            </button>
          </nav>

          <div
            id="inspector-panel"
            role="tabpanel"
            aria-labelledby="inspector-tab"
            className="side-panel-content"
            hidden={activeTab !== 'inspector'}
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
            hidden={activeTab !== 'instrument'}
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
            hidden={activeTab !== 'effects'}
          >
            {audioEngine && (
              <EffectsPanel
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
            hidden={activeTab !== 'import-export'}
          >
            <ImportExportPanel
              onImportAudio={onImportAudio}
              onImportProject={onImportProject}
              onExportProject={onExportProject}
              onExportAudio={onExportAudio}
              onExportStems={onExportStems}
            />
          </div>
        </>
      )}
    </aside>
  );
});

export default SidePanels;
