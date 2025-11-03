import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Track, MixerChannel } from './types';
import TransportBar from './components/TransportBar';
import TrackLane from './components/TrackLane';
import TimelineViewport from './components/TimelineViewport';
import SidePanels from './components/SidePanels';
import MixerDock from './components/MixerDock';
import { AudioEngine } from './audio/AudioEngine';
import { useAppStore } from './state/store';
import { TrackType } from './state/models';

const LOOP_LENGTH_BEATS = 64;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function App() {
  // Zustand store state
  const {
    project,
    transport,
    selection,
    grid,
    // Transport actions
    stop,
    togglePlayback,
    toggleRecording,
    toggleLoop,
    toggleMetronome,
    setCurrentTime,
    setTempo,
    // Track actions
    addTrack,
    setTrackMute,
    setTrackSolo,
    setTrackArm,
    // Clip actions
    moveClip,
    resizeClip,
    selectClip,
    // Selection actions
    selectTrack,
    // Grid actions
    setZoomHorizontal,
    // UI actions
    toggleMixer,
  } = useAppStore();

  // Local UI state
  const [tracksCollapsed, setTracksCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const [mixerCollapsed, setMixerCollapsed] = useState(false);
  const [trackColumnWidth, setTrackColumnWidth] = useState(260);
  const [sidePanelWidth, setSidePanelWidth] = useState(320);
  const [mixerHeight, setMixerHeight] = useState(200);

  // Initialize AudioEngine
  const [audioEngine] = useState(() => new AudioEngine());

  const loopGuardRef = useRef(false);

  const timeSignature = `${project.timeSignature.numerator}/${project.timeSignature.denominator}`;

  const formatPlayhead = (position: number): string => {
    const beatsPerBar = project.timeSignature.numerator;
    const bar = Math.floor(position / beatsPerBar) + 1;
    const beat = Math.floor(position % beatsPerBar) + 1;
    const tick = Math.floor((position % 1) * 960);
    return `${bar.toString().padStart(2, '0')}.${beat}.${tick.toString().padStart(3, '0')}`;
  };

  useEffect(() => {
    if (!transport.isPlaying) {
      loopGuardRef.current = false;
      return undefined;
    }

    let animationFrameId = 0;
    let lastTime = performance.now();
    const beatsPerSecond = project.tempo / 60;

    const step = (time: number) => {
      const deltaSeconds = (time - lastTime) / 1000;
      lastTime = time;

      setCurrentTime((prev) => {
        const next = prev + deltaSeconds * beatsPerSecond;

        if (transport.isLooping) {
          return next % LOOP_LENGTH_BEATS;
        }

        if (next >= LOOP_LENGTH_BEATS) {
          loopGuardRef.current = true;
          return 0;
        }

        return next;
      });

      if (loopGuardRef.current) {
        stop();
        loopGuardRef.current = false;
        return;
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [transport.isPlaying, project.tempo, transport.isLooping, setCurrentTime, stop]);

  const handleTogglePlay = useCallback(() => {
    togglePlayback();
  }, [togglePlayback]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleZoomIn = useCallback(() => {
    setZoomHorizontal(grid.zoomHorizontal * 1.25);
  }, [grid.zoomHorizontal, setZoomHorizontal]);

  const handleZoomOut = useCallback(() => {
    setZoomHorizontal(grid.zoomHorizontal / 1.25);
  }, [grid.zoomHorizontal, setZoomHorizontal]);

  const handleZoomReset = useCallback(() => {
    setZoomHorizontal(20); // Reset to default
  }, [setZoomHorizontal]);

  const handleTempoChange = useCallback((nextTempo: number) => {
    setTempo(clamp(Math.round(nextTempo), 40, 220));
  }, [setTempo]);

  const handleSelectTrack = useCallback((trackId: string) => {
    selectTrack(trackId);
  }, [selectTrack]);

  const handleToggleMute = useCallback((trackId: string) => {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      setTrackMute(trackId, !track.muted);
    }
  }, [project.tracks, setTrackMute]);

  const handleToggleSolo = useCallback((trackId: string) => {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      setTrackSolo(trackId, !track.solo);
    }
  }, [project.tracks, setTrackSolo]);

  const handleToggleArm = useCallback((trackId: string) => {
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      setTrackArm(trackId, !track.armed);
    }
  }, [project.tracks, setTrackArm]);

  const handleAddTrack = useCallback(() => {
    addTrack(TrackType.AUDIO);
  }, [addTrack]);

  const handleAddTestClip = useCallback(() => {
    if (project.tracks.length === 0) {
      // Add a track first if none exist
      addTrack(TrackType.AUDIO);
      setTimeout(() => {
        // Add clip after track is created
        const tracks = useAppStore.getState().project.tracks;
        if (tracks.length > 0) {
          const store = useAppStore.getState();
          store.addClip({
            name: 'Test Clip',
            type: 'audio' as any,
            trackId: tracks[0].id,
            startTime: 0,
            duration: 4,
            color: '#4a6a9a',
            muted: false,
            solo: false,
            gain: 1,
            pan: 0,
            audioFileId: 'test-file',
            sampleRate: 44100,
            bitDepth: 24,
            channels: 2,
            offset: 0,
            fadeIn: 0,
            fadeOut: 0,
            warping: {
              enabled: false,
              algorithm: 'beats',
            },
          });
        }
      }, 100);
    } else {
      // Add clip to first track
      const store = useAppStore.getState();
      store.addClip({
        name: 'Test Clip',
        type: 'audio' as any,
        trackId: project.tracks[0].id,
        startTime: Math.random() * 8, // Random position
        duration: 2 + Math.random() * 4, // Random duration 2-6 beats
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        muted: false,
        solo: false,
        gain: 1,
        pan: 0,
        audioFileId: 'test-file',
        sampleRate: 44100,
        bitDepth: 24,
        channels: 2,
        offset: 0,
        fadeIn: 0,
        fadeOut: 0,
        warping: {
          enabled: false,
          algorithm: 'beats',
        },
      });
    }
  }, [addTrack, project.tracks]);

  // Clip handlers
  const handleClipMove = useCallback((clipId: string, newTrackId: string, newStartTime: number) => {
    moveClip(clipId, newTrackId, newStartTime);
  }, [moveClip]);

  const handleClipResize = useCallback((clipId: string, newStartTime: number, newDuration: number) => {
    resizeClip(clipId, newStartTime, newDuration);
  }, [resizeClip]);

  const handleClipSelect = useCallback((clipId: string, multi?: boolean) => {
    selectClip(clipId, multi);
  }, [selectClip]);

  const toggleTracksPanel = useCallback(() => {
    setTracksCollapsed((prev) => !prev);
  }, []);

  const toggleInspectorPanel = useCallback(() => {
    setInspectorCollapsed((prev) => !prev);
  }, []);

  const toggleMixerPanel = useCallback(() => {
    setMixerCollapsed((prev) => !prev);
    toggleMixer(); // Also update store state
  }, [toggleMixer]);

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

  const mixerChannels: MixerChannel[] = project.tracks.map((track) => ({
    id: track.id,
    name: track.name,
    volume: track.volume,
    pan: track.pan,
    muted: track.muted,
    soloed: track.solo,
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
        isPlaying={transport.isPlaying}
        isRecording={transport.isRecording}
        isLoopEnabled={transport.isLooping}
        tempo={project.tempo}
        timeSignature={timeSignature}
        playheadPosition={formatPlayhead(transport.currentTime)}
        metronomeEnabled={transport.isMetronomeEnabled}
        zoomLevel={grid.zoomHorizontal / 20} // Convert to percentage
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        onToggleRecord={toggleRecording}
        onToggleLoop={toggleLoop}
        onTempoChange={handleTempoChange}
        onMetronomeToggle={toggleMetronome}
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
                onClick={handleAddTrack}
              >
                ＋
              </button>
              <span className="text-xs text-muted">Add Track</span>
              <button
                type="button"
                className="button button-ghost button-icon-sm"
                aria-label="Add test clip"
                onClick={handleAddTestClip}
                style={{ marginLeft: '8px' }}
              >
                🎵
              </button>
              <span className="text-xs text-muted">Add Clip</span>
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
                    {project.tracks.map((track) => {
                      // Convert store track to old Track type for compatibility
                      const compatibleTrack: Track = {
                        id: track.id,
                        name: track.name,
                        type: track.type === 'audio' ? 'audio' : track.type === 'midi' ? 'midi' : 'instrument',
                        color: track.color,
                        volume: track.volume,
                        pan: track.pan,
                        muted: track.muted,
                        soloed: track.solo,
                        armed: track.armed,
                        selected: selection.selectedTrackIds.includes(track.id),
                      };
                      return (
                        <TrackLane
                          key={track.id}
                          track={compatibleTrack}
                          onSelect={handleSelectTrack}
                          onToggleMute={handleToggleMute}
                          onToggleSolo={handleToggleSolo}
                          onToggleArm={handleToggleArm}
                        />
                      );
                    })}
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
              playheadPosition={transport.currentTime}
              zoomLevel={grid.zoomHorizontal / 20} // Convert to percentage
              tracks={project.tracks}
              clips={project.clips.map(clip => ({
                id: clip.id,
                trackId: clip.trackId,
                name: clip.name,
                start: clip.startTime,
                length: clip.duration,
                color: clip.color,
              }))}
              onClipMove={handleClipMove}
              onClipResize={handleClipResize}
              onClipSelect={handleClipSelect}
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
          selectedTrackId={selection.selectedTrackIds[0]}
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
