import { memo, useState } from 'react';
import type { CSSProperties } from 'react';

interface SidePanelsProps {
  collapsed: boolean;
  width: number;
}

type PanelTab = 'inspector' | 'instrument';

const SidePanels = memo(function SidePanels({
  collapsed,
  width,
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
            <section className="panel">
              <div className="panel-header">
                <h3 className="text-sm">Virtual Instrument</h3>
              </div>
              <div className="panel-body">
                <div className="flex-col flex-gap-md">
                  <div className="card">
                    <label
                      htmlFor="instrument-select"
                      className="text-xs text-muted"
                    >
                      Instrument Type
                    </label>
                    <select
                      id="instrument-select"
                      className="input"
                      aria-label="Select instrument"
                    >
                      <option value="synth">Synthesizer</option>
                      <option value="sampler">Sampler</option>
                      <option value="drum">Drum Machine</option>
                    </select>
                  </div>

                  <div className="card">
                    <h4 className="text-xs text-muted">Presets</h4>
                    <div
                      className="preset-list"
                      style={{ marginTop: 'var(--space-sm)' }}
                    >
                      {['Bass', 'Lead', 'Pad', 'Pluck', 'Strings'].map(
                        (preset) => (
                          <button
                            key={preset}
                            type="button"
                            className="button button-secondary text-xs"
                            style={{
                              width: '100%',
                              marginBottom: 'var(--space-xs)',
                            }}
                          >
                            {preset}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h4 className="text-xs text-muted">Controls</h4>
                    <div
                      className="flex-col flex-gap-sm"
                      style={{ marginTop: 'var(--space-sm)' }}
                    >
                      <label className="text-xs">Attack</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        defaultValue={30}
                        aria-label="Attack"
                      />
                      <label className="text-xs">Decay</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        defaultValue={40}
                        aria-label="Decay"
                      />
                      <label className="text-xs">Sustain</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        defaultValue={60}
                        aria-label="Sustain"
                      />
                      <label className="text-xs">Release</label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        defaultValue={50}
                        aria-label="Release"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </aside>
  );
});

export default SidePanels;
