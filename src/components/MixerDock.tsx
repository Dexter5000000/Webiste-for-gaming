import { memo } from 'react';
import type { CSSProperties } from 'react';

export interface MixerChannel {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  color: string;
}

interface MixerDockProps {
  channels: MixerChannel[];
  collapsed: boolean;
  height: number;
  onToggleCollapse: () => void;
}

const MixerDock = memo(function MixerDock({
  channels,
  collapsed,
  height,
  onToggleCollapse,
}: MixerDockProps) {
  const mixerStyle = {
    '--mixer-height': collapsed ? '48px' : `${height}px`,
  } as CSSProperties;

  return (
    <section
      className={`mixer-dock ${collapsed ? 'collapsed' : ''}`}
      aria-label="Mixer"
      aria-hidden={collapsed}
      style={mixerStyle}
    >
      <header className="mixer-header">
        <h3>Mixer</h3>
        <button
          type="button"
          className="button button-ghost"
          onClick={onToggleCollapse}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
      </header>

      {!collapsed && (
        <div className="mixer-body">
          {channels.map((channel) => (
            <article
              key={channel.id}
              className="channel-strip"
              aria-label={`${channel.name} channel`}
            >
              <div
                className="channel-indicator"
                style={{ backgroundColor: channel.color }}
                aria-hidden="true"
              />
              <div className="channel-fader" role="presentation">
                <div
                  className="channel-fader-track"
                  style={{ height: `${channel.volume * 100}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="channel-controls">
                <button
                  type="button"
                  className={`track-control-btn ${channel.muted ? 'active' : ''}`}
                >
                  M
                </button>
                <button
                  type="button"
                  className={`track-control-btn ${channel.soloed ? 'active' : ''}`}
                >
                  S
                </button>
              </div>
              <span className="channel-name">{channel.name}</span>
              <span className="channel-pan text-xs text-muted">
                Pan {channel.pan >= 0 ? 'R' : 'L'}
                {Math.abs(channel.pan)}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
});

export default MixerDock;
