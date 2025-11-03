import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Track, TimelineClip, MixerChannel } from './types';
import TransportBar from './components/TransportBar';
import TrackLane from './components/TrackLane';
import TimelineViewport from './components/TimelineViewport';
import SidePanels from './components/SidePanels';
import MixerDock from './components/MixerDock';
import { AudioEngine } from './audio/AudioEngine';

const INITIAL_TEMPO = 120;
const INITIAL_ZOOM = 1.0;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;
const LOOP_LENGTH_BEATS = 64;

const trackColors = ['#66d6b6', '#f2aa4c', '#f87272', '#667eea', '#45b797'];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const createMockTracks = (): Track[] => [
  {
    id: 'track-1',
    name: 'Kick',
    type: 'audio',
    color: trackColors[0],
    volume: 0.82,
    pan: 0,
    muted: false,
    soloed: false,
    armed: false,
    selected: true,
  },
  {
    id: 'track-2',
    name: 'Snare',
    type: 'audio',
    color: trackColors[1],
    volume: 0.74,
    pan: 0,
    muted: false,
    soloed: false,
    armed: false,
    selected: false,
  },
  {
    id: 'track-3',
    name: 'Hi-Hat',
    type: 'midi',
    color: trackColors[2],
    volume: 0.66,
    pan: 8,
    muted: false,
    soloed: false,
    armed: false,
    selected: false,
  },
  {
    id: 'track-4',
    name: 'Bass',
    type: 'instrument',
    color: trackColors[3],
    volume: 0.77,
    pan: -6,
    muted: false,
    soloed: false,
    armed: false,
    selected: false,
  },
  {
    id: 'track-5',
    name: 'Synth Lead',
    type: 'instrument',
    color: trackColors[4],
    volume: 0.68,
    pan: 0,
    muted: false,
    soloed: false,
    armed: false,
    selected: false,
  },
];

const createMockClips = (): TimelineClip[] => [
  {
    id: 'clip-1',
    trackId: 'track-1',
    name: 'Kick Pattern',
    start: 0,
    length: 16,
    color: trackColors[0],
  },
  {
    id: 'clip-2',
    trackId: 'track-2',
    name: 'Snare Loop',
    start: 4,
    length: 12,
    color: trackColors[1],
  },
  {
    id: 'clip-3',
    trackId: 'track-3',
    name: 'Hat Rhythm',
    start: 8,
    length: 24,
    color: trackColors[2],
  },
  {
    id: 'clip-4',
    trackId: 'track-4',
    name: 'Bass Line',
    start: 0,
    length: 32,
    color: trackColors[3],
  },
  {
    id: 'clip-5',
    trackId: 'track-5',
    name: 'Lead Melody',
    start: 16,
    length: 16,
    color: trackColors[4],
  },
];

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [tempo, setTempo] = useState(INITIAL_TEMPO);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(INITIAL_ZOOM);
  const [tracks, setTracks] = useState<Track[]>(createMockTracks);
  const [clips] = useState<TimelineClip[]>(createMockClips);
  const [tracksCollapsed, setTracksCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [mixerCollapsed, setMixerCollapsed] = useState(false);
  const [trackColumnWidth, setTrackColumnWidth] = useState(260);
  const [sidePanelWidth, setSidePanelWidth] = useState(320);
  const [mixerHeight, setMixerHeight] = useState(200);

  // Initialize AudioEngine
  const [audioEngine] = useState(() => new AudioEngine());

  const loopGuardRef = useRef(false);

  const timeSignature = '4/4';

  const formatPlayhead = (position: number): string => {
    const bar = Math.floor(position / 4) + 1;
    const beat = Math.floor(position % 4) + 1;
    const tick = Math.floor((position % 1) * 960);
    return `${bar.toString().padStart(2, '0')}.${beat}.${tick.toString().padStart(3, '0')}`;
  };

  useEffect(() => {
    if (!isPlaying) {
      loopGuardRef.current = false;
      return undefined;
    }

    let animationFrameId = 0;
    let lastTime = performance.now();
    const beatsPerSecond = tempo / 60;

    const step = (time: number) => {
      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;

      setPlayheadPosition((prev) => {
        const next = prev + deltaSeconds * beatsPerSecond;

        if (isLoopEnabled) {
          return next % LOOP_LENGTH_BEATS;
        }

        if (next >= LOOP_LENGTH_BEATS) {
          loopGuardRef.current = true;
          return 0;
        }

        return next;
      });

      if (loopGuardRef.current) {
        setIsPlaying(false);
        loopGuardRef.current = false;
        return;
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, tempo, isLoopEnabled]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setPlayheadPosition(0);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => clamp(prev * 1.25, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => clamp(prev / 1.25, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(INITIAL_ZOOM);
  }, []);

  const handleTempoChange = useCallback((nextTempo: number) => {
    setTempo(clamp(Math.round(nextTempo), 40, 220));
  }, []);

  const handleSelectTrack = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        selected: track.id === trackId,
      }))
    );
  }, []);

  const handleToggleMute = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId ? { ...track, muted: !track.muted } : track
      )
    );
  }, []);

  const handleToggleSolo = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId ? { ...track, soloed: !track.soloed } : track
      )
    );
  }, []);

  const handleToggleArm = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((track) =>
        track.id === trackId ? { ...track, armed: !track.armed } : track
      )
    );
  }, []);

  const toggleTracksPanel = useCallback(() => {
    setTracksCollapsed((prev) => !prev);
  }, []);

  const toggleInspectorPanel = useCallback(() => {
    setInspectorCollapsed((prev) => !prev);
  }, []);

  const toggleMixerPanel = useCallback(() => {
    setMixerCollapsed((prev) => !prev);
  }, []);

  const handleTrackResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = trackColumnWidth;
      const pointerId = event.pointerId;
      const target = event.currentTarget;

      target.setPointerCapture?.(pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = clamp(startWidth + delta, 160, 420);
        setTrackColumnWidth(nextWidth);
      };

      const onEnd = () => {
        target.releasePointerCapture?.(pointerId);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
    },
    [trackColumnWidth]
  );

  const handleInspectorResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = sidePanelWidth;
      const pointerId = event.pointerId;
      const target = event.currentTarget;

      target.setPointerCapture?.(pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMove = (moveEvent: PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        const nextWidth = clamp(startWidth - delta, 220, 480);
        setSidePanelWidth(nextWidth);
      };

      const onEnd = () => {
        target.releasePointerCapture?.(pointerId);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
    },
    [sidePanelWidth]
  );

  const handleMixerResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = mixerHeight;
      const pointerId = event.pointerId;
      const target = event.currentTarget;

      target.setPointerCapture?.(pointerId);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';

      const onMove = (moveEvent: PointerEvent) => {
        const delta = startY - moveEvent.clientY;
        const nextHeight = clamp(startHeight + delta, 140, 360);
        setMixerHeight(nextHeight);
      };

      const onEnd = () => {
        target.releasePointerCapture?.(pointerId);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onEnd);
        window.removeEventListener('pointercancel', onEnd);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onEnd);
      window.addEventListener('pointercancel', onEnd);
    },
    [mixerHeight]
  );

  const mixerChannels: MixerChannel[] = tracks.map((track) => ({
    id: track.id,
    name: track.name,
    volume: track.volume,
    pan: track.pan,
    muted: track.muted,
    soloed: track.soloed,
    color: track.color,
  }));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        handleTogglePlay();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        handleStop();
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === '=' || event.key === '+')
      ) {
        event.preventDefault();
        handleZoomIn();
        return;
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === '-' || event.key === '_')
      ) {
        event.preventDefault();
        handleZoomOut();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault();
        handleZoomReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    handleTogglePlay,
    handleStop,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  ]);

  const trackListStyle = {
    '--track-list-width': `${trackColumnWidth}px`,
  } as CSSProperties;

  return (
    <div className="daw-shell">
      <TransportBar
        isPlaying={isPlaying}
        isRecording={isRecording}
        isLoopEnabled={isLoopEnabled}
        tempo={tempo}
        timeSignature={timeSignature}
        playheadPosition={formatPlayhead(playheadPosition)}
        metronomeEnabled={metronomeEnabled}
        zoomLevel={zoomLevel}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        onToggleRecord={() => setIsRecording((prev) => !prev)}
        onToggleLoop={() => setIsLoopEnabled((prev) => !prev)}
        onTempoChange={handleTempoChange}
        onMetronomeToggle={() => setMetronomeEnabled((prev) => !prev)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onToggleTracks={toggleTracksPanel}
        onToggleInspector={toggleInspectorPanel}
        onToggleMixer={toggleMixerPanel}
      />

      <main className="main-workspace">
        <div className="track-area">
          <header className="timeline-header">
            <div className="timeline-controls">
              <button
                type="button"
                className="button button-ghost button-icon-sm"
                aria-label="Add track"
              >
                ＋
              </button>
              <span className="text-xs text-muted">Add Track</span>
            </div>
            <div className="flex-1" />
            <div className="zoom-control">
              <button
                type="button"
                className="button button-ghost button-icon-sm"
                onClick={handleZoomOut}
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="text-xs text-muted">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                className="button button-ghost button-icon-sm"
                onClick={handleZoomIn}
                aria-label="Zoom in"
              >
                ＋
              </button>
            </div>
          </header>

          <div className="timeline-body">
            {!tracksCollapsed && (
              <>
                <aside
                  className="track-list"
                  aria-label="Track list"
                  style={trackListStyle}
                >
                  <header className="track-list-header">
                    <h2 className="text-sm text-muted">Tracks</h2>
                  </header>
                  <div className="track-list-body">
                    {tracks.map((track) => (
                      <TrackLane
                        key={track.id}
                        track={track}
                        onSelect={handleSelectTrack}
                        onToggleMute={handleToggleMute}
                        onToggleSolo={handleToggleSolo}
                        onToggleArm={handleToggleArm}
                      />
                    ))}
                  </div>
                </aside>

                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize track list"
                  className="resizer resizer-vertical"
                  onPointerDown={handleTrackResizeStart}
                />
              </>
            )}

            <TimelineViewport
              playheadPosition={playheadPosition}
              zoomLevel={zoomLevel}
              tracks={tracks}
              clips={clips}
            />
          </div>
        </div>

        {!inspectorCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize inspector panel"
            className="resizer resizer-vertical inspector-resizer"
            onPointerDown={handleInspectorResizeStart}
          />
        )}

        <SidePanels 
          collapsed={inspectorCollapsed} 
          width={sidePanelWidth}
          selectedTrackId={tracks.find(t => t.selected)?.id}
          audioEngine={audioEngine}
        />
      </main>

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize mixer"
        className="resizer resizer-horizontal mixer-resizer"
        onPointerDown={handleMixerResizeStart}
      />

      <MixerDock
        channels={mixerChannels}
        collapsed={mixerCollapsed}
        height={mixerHeight}
        onToggleCollapse={toggleMixerPanel}
      />
    </div>
  );
}

export default App;
