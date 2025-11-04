import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Track, MixerChannel } from './types';
import TransportBar from './components/TransportBar';
import TrackLane from './components/TrackLane';
import TimelineViewport from './components/TimelineViewport';
import SidePanels from './components/SidePanels';
import MixerDock from './components/MixerDock';
import { AudioEngine } from './audio/AudioEngine';
import { beatsToSeconds, secondsToBeats } from './audio/utils/tempo';
import { useAudioImportExport } from './hooks/useAudioImportExport';
import { useAppStore, TrackType, ClipType } from './state';

const LOOP_LENGTH_BEATS = 64;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function App() {
  // Store state
  const {
    project,
    transport,
    selection,
    grid,
    stop,
    toggleRecording,
    toggleLoop,
    toggleMetronome,
    setCurrentTime,
    setTempo,
    setZoomHorizontal,
    addTrack,
    selectTrack,
    setTrackMute,
    setTrackSolo,
    setTrackArm,
    addClip,
    moveClip,
    resizeClip,
    selectClip,
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

  // Audio import/export hook
  const {
    isImporting,
    isExporting,
    progress,
    statusMessage,
    errorMessage,
    importAudio,
    exportProject,
    importProject,
  } = useAudioImportExport();

  // Store audio buffers and file data
  const audioBuffersRef = useRef(new Map<string, AudioBuffer>());
  const audioFilesRef = useRef(new Map<string, Blob | ArrayBuffer>());
  const nextAudioFileIdRef = useRef(1);
  const engineTracksRef = useRef<Set<string>>(new Set());
  const lastTransportBeatRef = useRef(0);

  const mapTrackType = useCallback((type: TrackType): 'audio' | 'midi' | 'instrument' => {
    switch (type) {
      case TrackType.AUDIO:
        return 'audio';
      case TrackType.MIDI:
        return 'midi';
      default:
        return 'instrument';
    }
  }, []);

  const timeSignature = `${project.timeSignature.numerator}/${project.timeSignature.denominator}`;

  const formatPlayhead = (position: number): string => {
    const beatsPerBar = project.timeSignature.numerator;
    const bar = Math.floor(position / beatsPerBar) + 1;
    const beat = Math.floor(position % beatsPerBar) + 1;
    const tick = Math.floor((position % 1) * 960);
    return `${bar.toString().padStart(2, '0')}.${beat}.${tick.toString().padStart(3, '0')}`;
  };

  // Sync tracks to audio engine
  useEffect(() => {
    const currentTrackIds = new Set(project.tracks.map(t => t.id));
    
    // Remove tracks that no longer exist
    engineTracksRef.current.forEach((trackId) => {
      if (!currentTrackIds.has(trackId)) {
        try {
          audioEngine.removeTrack(trackId);
        } catch (e) {
          console.warn('Failed to remove track from audio engine:', e);
        }
        engineTracksRef.current.delete(trackId);
      }
    });
    
    // Create or update tracks
    project.tracks.forEach((track) => {
      const engineTrackType = mapTrackType(track.type);
      
      if (!engineTracksRef.current.has(track.id)) {
        try {
          audioEngine.createTrack({
            id: track.id,
            name: track.name,
            type: engineTrackType,
            volume: track.volume,
            pan: track.pan,
            muted: track.muted,
            solo: track.solo,
          });
          engineTracksRef.current.add(track.id);
        } catch (e) {
          console.warn('Failed to create track in audio engine:', e);
        }
      } else {
        try {
          audioEngine.updateTrack(track.id, {
            volume: track.volume,
            pan: track.pan,
            muted: track.muted,
            solo: track.solo,
          });
        } catch (e) {
          console.warn('Failed to update track in audio engine:', e);
        }
      }
    });
  }, [project.tracks, audioEngine, mapTrackType]);

  // Sync transport parameters to audio engine
  useEffect(() => {
    audioEngine.setTempo(project.tempo);
  }, [project.tempo, audioEngine]);

  useEffect(() => {
    audioEngine.enableMetronome(transport.isMetronomeEnabled);
  }, [transport.isMetronomeEnabled, audioEngine]);

  useEffect(() => {
    const loopStartSeconds = beatsToSeconds(transport.loopStart, project.tempo);
    const loopEndSeconds = beatsToSeconds(transport.loopEnd, project.tempo);
    audioEngine.setLoop(transport.isLooping, loopStartSeconds, loopEndSeconds);
  }, [audioEngine, transport.isLooping, transport.loopStart, transport.loopEnd, project.tempo]);

  // Schedule clips for playback
  const scheduleClipsForPlayback = useCallback((startBeatOverride?: number) => {
    const tempo = project.tempo;
    const playbackStartBeat = startBeatOverride ?? transport.currentTime;
    const audioClips = project.clips.filter((clip): clip is AudioClip => clip.type === 'audio');

    audioClips.forEach((clip) => {
      if (!clip.audioFileId) {
        return;
      }
      const buffer = audioBuffersRef.current.get(clip.audioFileId);
      if (!buffer) {
        return;
      }

      const clipEndBeat = clip.startTime + clip.duration;
      if (clipEndBeat <= playbackStartBeat) {
        return;
      }

      const playbackStartWithinClip = Math.max(clip.startTime, playbackStartBeat);
      const offsetBeats = Math.max(0, playbackStartBeat - clip.startTime);
      const remainingBeats = clip.duration - offsetBeats;
      if (remainingBeats <= 0) {
        return;
      }

      const offsetSeconds = (clip.offset ?? 0) + beatsToSeconds(offsetBeats, tempo);
      if (offsetSeconds >= buffer.duration) {
        return;
      }

      const durationSeconds = beatsToSeconds(remainingBeats, tempo);
      const remainingBufferDuration = Math.max(0, buffer.duration - offsetSeconds);
      const playbackDuration = Math.min(durationSeconds, remainingBufferDuration);

      audioEngine.scheduleClip({
        trackId: clip.trackId,
        buffer,
        startBeat: playbackStartWithinClip,
        offset: offsetSeconds,
        duration: playbackDuration > 0 ? playbackDuration : undefined,
        loop: false,
      });
    });
  }, [project.clips, project.tempo, transport.currentTime, audioEngine]);

  // Listen to audio engine position updates
  useEffect(() => {
    const unsubscribe = audioEngine.on('transport:position', (payload) => {
      const beats = secondsToBeats(payload.position, project.tempo);
      setCurrentTime(beats);

      const lastBeat = lastTransportBeatRef.current;
      if (beats + 1e-3 < lastBeat) {
        scheduleClipsForPlayback(beats);
      }
      lastTransportBeatRef.current = beats;
    });
    return unsubscribe;
  }, [audioEngine, scheduleClipsForPlayback, setCurrentTime, project.tempo]);

  const handleTogglePlay = useCallback(async () => {
    if (transport.isPlaying) {
      audioEngine.stop();
      stop();
      lastTransportBeatRef.current = 0;
      return;
    }

    // Load audio buffers into engine cache if not already loaded
    audioBuffersRef.current.forEach((buffer, audioFileId) => {
      if (!audioEngine.buffers.has(audioFileId)) {
        audioEngine.buffers.set(audioFileId, buffer);
      }
    });

    // Seek audio engine to current position
    const currentTimeSeconds = beatsToSeconds(transport.currentTime, project.tempo);
    audioEngine.seek(currentTimeSeconds);

    // Prepare clip scheduling
    scheduleClipsForPlayback(transport.currentTime);
    lastTransportBeatRef.current = transport.currentTime;

    // Start playback
    await audioEngine.play();
    play();
  }, [transport.isPlaying, transport.currentTime, project.tempo, audioEngine, stop, play, scheduleClipsForPlayback]);

  const handleStop = useCallback(() => {
    audioEngine.stop();
    stop();
    lastTransportBeatRef.current = 0;
  }, [audioEngine, stop]);

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
        const store = useAppStore.getState();
        if (store.project.tracks.length > 0) {
          addClip({
            name: 'Test Clip',
            type: ClipType.AUDIO,
            trackId: store.project.tracks[0].id,
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
      addClip({
        name: 'Test Clip',
        type: ClipType.AUDIO,
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
  }, [addTrack, project.tracks, addClip]);

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

  const handleImportAudio = useCallback(async (files: File[]) => {
    const result = await importAudio(files);
    
    if (result.success && result.importedData) {
      const selectedTrack =
        project.tracks.find((t) => selection.selectedTrackIds.includes(t.id) && t.type === 'audio') ??
        project.tracks.find((t) => selection.selectedTrackIds.includes(t.id)) ??
        project.tracks.find((t) => t.type === 'audio') ??
        project.tracks[0];

      if (!selectedTrack) {
        console.warn('No track available for audio import');
        return;
      }

      let currentPosition = Math.max(0, transport.currentTime);

      for (const data of result.importedData) {
        const audioFileId = `audio-file-${nextAudioFileIdRef.current++}`;

        audioBuffersRef.current.set(audioFileId, data.audioBuffer);
        audioFilesRef.current.set(audioFileId, data.originalData);

        const durationInBeats = Math.max(
          (data.audioBuffer.duration * project.tempo) / 60,
          0.25
        );

        addClip({
          name: data.audioFile.name,
          type: ClipType.AUDIO,
          trackId: selectedTrack.id,
          startTime: currentPosition,
          duration: durationInBeats,
          color: selectedTrack.color,
          audioFileId,
          sampleRate: data.audioBuffer.sampleRate,
          bitDepth: 24,
          channels: data.audioBuffer.numberOfChannels,
          offset: 0,
          gain: 1,
          pan: 0,
          muted: false,
          solo: false,
          fadeIn: 0,
          fadeOut: 0,
          warping: {
            enabled: false,
            algorithm: 'beats',
          },
        });

        currentPosition += durationInBeats;
      }

      if (!selection.selectedTrackIds.includes(selectedTrack.id)) {
        selectTrack(selectedTrack.id);
      }
    }
  }, [importAudio, project.tracks, selection.selectedTrackIds, transport.currentTime, project.tempo, addClip, selectTrack]);

  const handleExportAudio = useCallback(async (format: 'wav' | 'mp3' | 'ogg') => {
    console.log(`Export mixdown as ${format} - Not fully implemented yet`);
  }, []);

  const handleExportStems = useCallback(async (format: 'wav' | 'mp3' | 'ogg') => {
    console.log(`Export stems as ${format} - Not fully implemented yet`);
  }, []);

  const handleExportProject = useCallback(async () => {
    const projectData = {
      name: project.name,
      tempo: project.tempo,
      tracks: project.tracks,
      clips: project.clips,
    };
    
    await exportProject(projectData, audioFilesRef.current, true);
  }, [exportProject, project]);

  const handleImportProject = useCallback(async (file: File) => {
    const result = await importProject(file);
    if (result.success && result.project) {
      console.log('Project imported successfully', result.project);
    }
  }, [importProject]);

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
                               {Math.round((grid.zoomHorizontal / 20) * 100)}%
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
          onImportAudio={handleImportAudio}
          onImportProject={handleImportProject}
          onExportProject={handleExportProject}
          onExportAudio={handleExportAudio}
          onExportStems={handleExportStems}
          isProcessing={isImporting || isExporting}
          progress={progress}
          statusMessage={statusMessage}
          errorMessage={errorMessage}
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
