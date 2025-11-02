import { memo, KeyboardEvent } from 'react';

export interface Track {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'instrument';
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  selected: boolean;
}

interface TrackLaneProps {
  track: Track;
  onSelect: (trackId: string) => void;
  onToggleMute: (trackId: string) => void;
  onToggleSolo: (trackId: string) => void;
  onToggleArm: (trackId: string) => void;
}

const TrackLane = memo(function TrackLane({
  track,
  onSelect,
  onToggleMute,
  onToggleSolo,
  onToggleArm,
}: TrackLaneProps) {
  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(track.id);
    }
  };

  return (
    <div
      className={`track-lane ${track.selected ? 'selected' : ''}`}
      onClick={() => onSelect(track.id)}
      onKeyDown={handleKeyPress}
      role="button"
      tabIndex={0}
      aria-label={`${track.name} track`}
      aria-selected={track.selected}
    >
      <div
        className="track-color"
        style={{ backgroundColor: track.color }}
        aria-hidden="true"
      />
      <div className="track-info">
        <div className="track-name">{track.name}</div>
        <div className="track-type text-muted">{track.type}</div>
      </div>
      <div
        className="track-controls"
        role="group"
        aria-label={`${track.name} controls`}
      >
        <button
          type="button"
          className={`track-control-btn ${track.armed ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleArm(track.id);
          }}
          aria-label={track.armed ? 'Disarm track' : 'Arm track for recording'}
          aria-pressed={track.armed}
          title="Arm (R)"
        >
          R
        </button>
        <button
          type="button"
          className={`track-control-btn ${track.muted ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute(track.id);
          }}
          aria-label={track.muted ? 'Unmute track' : 'Mute track'}
          aria-pressed={track.muted}
          title="Mute (M)"
        >
          M
        </button>
        <button
          type="button"
          className={`track-control-btn ${track.soloed ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSolo(track.id);
          }}
          aria-label={track.soloed ? 'Unsolo track' : 'Solo track'}
          aria-pressed={track.soloed}
          title="Solo (S)"
        >
          S
        </button>
      </div>
    </div>
  );
});

export default TrackLane;
