import { ChangeEvent, memo } from 'react';

interface TransportBarProps {
  isPlaying: boolean;
  isRecording: boolean;
  isLoopEnabled: boolean;
  tempo: number;
  timeSignature: string;
  playheadPosition: string;
  metronomeEnabled: boolean;
  zoomLevel: number;
  onTogglePlay: () => void;
  onStop: () => void;
  onToggleRecord: () => void;
  onToggleLoop: () => void;
  onTempoChange: (tempo: number) => void;
  onMetronomeToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleTracks: () => void;
  onToggleInspector: () => void;
  onToggleMixer: () => void;
}

const TransportBar = memo(function TransportBar({
  isPlaying,
  isRecording,
  isLoopEnabled,
  tempo,
  timeSignature,
  playheadPosition,
  metronomeEnabled,
  zoomLevel,
  onTogglePlay,
  onStop,
  onToggleRecord,
  onToggleLoop,
  onTempoChange,
  onMetronomeToggle,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onToggleTracks,
  onToggleInspector,
  onToggleMixer,
}: TransportBarProps) {
  const handleTempoInput = (event: ChangeEvent<HTMLInputElement>) => {
    onTempoChange(Number(event.target.value));
  };

  const handleTempoStep = (direction: 1 | -1) => {
    onTempoChange(Math.round(tempo + direction));
  };

  const transportButtonClass = (base: string, active?: boolean) =>
    ['transport-button', base, active ? 'active' : '']
      .filter(Boolean)
      .join(' ');

  return (
    <header
      className="transport-bar"
      role="banner"
      aria-label="Transport controls"
    >
      <div className="transport-brand" aria-hidden="true">
        <span className="brand-mark" />
        <div>
          <p className="transport-label">Zenith Studio</p>
          <strong className="transport-title">Untitled Session</strong>
        </div>
      </div>

      <div
        className="transport-controls"
        role="group"
        aria-label="Playback controls"
      >
        <button
          type="button"
          className={transportButtonClass('record', isRecording)}
          onClick={onToggleRecord}
          aria-label={isRecording ? 'Disarm recording' : 'Arm recording'}
          aria-pressed={isRecording}
        >
          ●
        </button>
        <button
          type="button"
          className={transportButtonClass('play', isPlaying)}
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
          aria-pressed={isPlaying}
        >
          {isPlaying ? '❚❚' : '►'}
        </button>
        <button
          type="button"
          className="transport-button stop"
          onClick={onStop}
          aria-label="Stop playback"
        >
          ■
        </button>
        <button
          type="button"
          className={transportButtonClass('loop', isLoopEnabled)}
          onClick={onToggleLoop}
          aria-label={
            isLoopEnabled ? 'Disable loop playback' : 'Enable loop playback'
          }
          aria-pressed={isLoopEnabled}
        >
          ⟲
        </button>
      </div>

      <div className="transport-info" aria-label="Timing information">
        <div className="playhead-position">
          <label htmlFor="playhead-display">Playhead</label>
          <span id="playhead-display" className="playhead-value text-mono">
            {playheadPosition}
          </span>
        </div>
        <div className="tempo-display">
          <label htmlFor="tempo-slider">Tempo (BPM)</label>
          <div className="tempo-controls">
            <button
              type="button"
              className="transport-button tempo-step"
              onClick={() => handleTempoStep(-1)}
              aria-label="Decrease tempo"
            >
              −
            </button>
            <span className="tempo-value text-mono" aria-live="polite">
              {tempo}
            </span>
            <button
              type="button"
              className="transport-button tempo-step"
              onClick={() => handleTempoStep(1)}
              aria-label="Increase tempo"
            >
              ＋
            </button>
          </div>
          <input
            id="tempo-slider"
            type="range"
            min={40}
            max={220}
            value={tempo}
            onChange={handleTempoInput}
            aria-label="Tempo"
          />
        </div>
        <div className="time-signature">
          <label htmlFor="time-signature-display">Time</label>
          <span
            id="time-signature-display"
            className="time-signature-value text-mono"
          >
            {timeSignature}
          </span>
        </div>
      </div>

      <div
        className="transport-controls"
        role="group"
        aria-label="Workspace toggles"
      >
        <button
          type="button"
          className={transportButtonClass('metronome', metronomeEnabled)}
          onClick={onMetronomeToggle}
          aria-label={
            metronomeEnabled ? 'Disable metronome' : 'Enable metronome'
          }
          aria-pressed={metronomeEnabled}
        >
          𝅘𝅥
        </button>
        <button
          type="button"
          className="transport-button tracks"
          onClick={onToggleTracks}
          aria-label="Toggle track list"
        >
          Tracks
        </button>
        <button
          type="button"
          className="transport-button inspector"
          onClick={onToggleInspector}
          aria-label="Toggle inspector panel"
        >
          Inspect
        </button>
        <button
          type="button"
          className="transport-button mixer"
          onClick={onToggleMixer}
          aria-label="Toggle mixer"
        >
          Mixer
        </button>
      </div>

      <div
        className="transport-controls"
        role="group"
        aria-label="Timeline zoom controls"
      >
        <button
          type="button"
          className="transport-button zoom-out"
          onClick={onZoomOut}
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="zoom-indicator" aria-live="polite">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          type="button"
          className="transport-button zoom-in"
          onClick={onZoomIn}
          aria-label="Zoom in"
        >
          ＋
        </button>
        <button
          type="button"
          className="transport-button zoom-reset"
          onClick={onZoomReset}
          aria-label="Reset zoom"
        >
          Reset
        </button>
      </div>
    </header>
  );
});

export default TransportBar;
