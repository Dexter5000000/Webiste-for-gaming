import { describe, it, expect, beforeEach } from 'vitest';
import {
  serializeProject,
  rehydrateProject,
  serializeAppState,
  rehydrateAppState,
  validateSerializedProject,
  createProjectBackup,
  SERIALIZATION_VERSION,
  createEmptyProject,
} from '../state';
import { TrackType, ClipType, EffectType, AppState } from '../state/models';

describe('Serialization', () => {
  let testProject: any;

  beforeEach(() => {
    // Create a test project with various data
    testProject = {
      id: 'test-project-id',
      name: 'Test Project',
      tempo: 140,
      timeSignature: {
        numerator: 6,
        denominator: 8,
      },
      sampleRate: 48000,
      bitDepth: 32,
      buffer: 512,
      tracks: [
        {
          id: 'track-1',
          name: 'Audio Track',
          type: TrackType.AUDIO,
          color: '#ff0000',
          muted: false,
          solo: false,
          armed: true,
          volume: 0.8,
          pan: -0.3,
          height: 80,
          visible: true,
          locked: false,
          effectChainId: 'effect-chain-1',
          inputDevice: 'audio-input-1',
          outputDevice: 'audio-output-1',
          monitoring: true,
          inputGain: 1.2,
          recordEnabled: true,
        },
        {
          id: 'track-2',
          name: 'MIDI Track',
          type: TrackType.MIDI,
          color: '#00ff00',
          muted: false,
          solo: false,
          armed: false,
          volume: 1.0,
          pan: 0.0,
          height: 60,
          visible: true,
          locked: false,
          effectChainId: 'effect-chain-2',
          instrument: {
            type: 'vsti',
            pluginId: 'synth-plugin-1',
            midiChannel: 2,
          },
          midiThru: false,
        },
      ],
      clips: [
        {
          id: 'clip-1',
          name: 'Audio Clip 1',
          type: ClipType.AUDIO,
          trackId: 'track-1',
          startTime: 0,
          duration: 4,
          color: '#ffaa00',
          muted: false,
          solo: false,
          gain: 0.9,
          pan: 0.1,
          audioFileId: 'audio-file-1',
          sampleRate: 44100,
          bitDepth: 24,
          channels: 2,
          offset: 100,
          fadeIn: 0.5,
          fadeOut: 0.25,
          warping: {
            enabled: true,
            algorithm: 'complexpro',
          },
        },
        {
          id: 'clip-2',
          name: 'MIDI Clip 1',
          type: ClipType.MIDI,
          trackId: 'track-2',
          startTime: 2,
          duration: 2,
          color: '#00aaff',
          muted: false,
          solo: false,
          gain: 1.0,
          pan: 0.0,
          notes: [
            {
              id: 'note-1',
              pitch: 60,
              velocity: 100,
              startTime: 0,
              duration: 0.5,
            },
            {
              id: 'note-2',
              pitch: 64,
              velocity: 80,
              startTime: 0.5,
              duration: 0.25,
            },
          ],
          velocity: 100,
          quantize: 8,
          length: 2,
        },
      ],
      effectChains: [
        {
          id: 'effect-chain-1',
          trackId: 'track-1',
          effects: [
            {
              id: 'effect-1',
              name: 'Reverb',
              type: EffectType.REVERB,
              enabled: true,
              bypassed: false,
              parameters: {
                roomSize: 0.7,
                damping: 0.3,
                wetLevel: 0.5,
                dryLevel: 0.3,
              },
              position: 0,
            },
            {
              id: 'effect-2',
              name: 'Compressor',
              type: EffectType.COMPRESSOR,
              enabled: true,
              bypassed: false,
              parameters: {
                threshold: -12,
                ratio: 4,
                attack: 0.003,
                release: 0.1,
                makeupGain: 2,
              },
              position: 1,
            },
          ],
        },
        {
          id: 'effect-chain-2',
          trackId: 'track-2',
          effects: [],
        },
      ],
      audioFiles: [
        {
          id: 'audio-file-1',
          name: 'drums.wav',
          path: '/path/to/drums.wav',
          size: 2048000,
          duration: 15.5,
          sampleRate: 44100,
          bitDepth: 24,
          channels: 2,
          format: 'wav',
          metadata: {
            artist: 'Test Artist',
            title: 'Drum Loop',
            album: 'Test Album',
            genre: 'Electronic',
            year: 2023,
          },
        },
      ],
      metadata: {
        createdAt: new Date('2023-01-01T00:00:00Z'),
        modifiedAt: new Date('2023-12-01T12:00:00Z'),
        version: '1.0.0',
        author: 'Test Author',
        description: 'A test project for serialization',
        tags: ['test', 'demo', 'electronic'],
      },
    };
  });

  describe('Project Serialization', () => {
    it('should serialize a project to JSON', () => {
      const serialized = serializeProject(testProject);

      expect(() => JSON.parse(serialized)).not.toThrow();

      const parsed = JSON.parse(serialized);
      expect(parsed.version).toBe(SERIALIZATION_VERSION);
      expect(parsed.project.name).toBe(testProject.name);
      expect(parsed.project.tempo).toBe(testProject.tempo);
      expect(parsed.project.tracks).toHaveLength(2);
      expect(parsed.project.clips).toHaveLength(2);
      expect(parsed.project.effectChains).toHaveLength(2);
      expect(parsed.project.audioFiles).toHaveLength(1);
    });

    it('should not save transport state in project serialization', () => {
      const serialized = serializeProject(testProject);
      const parsed = JSON.parse(serialized);

      expect(parsed.transport.isPlaying).toBe(false);
      expect(parsed.transport.isRecording).toBe(false);
      expect(parsed.transport.currentTime).toBe(0);
    });

    it('should not save selection state in project serialization', () => {
      const serialized = serializeProject(testProject);
      const parsed = JSON.parse(serialized);

      expect(parsed.selection.selectedTrackIds).toHaveLength(0);
      expect(parsed.selection.selectedClipIds).toHaveLength(0);
    });

    it('should reset grid settings in project serialization', () => {
      const serialized = serializeProject(testProject);
      const parsed = JSON.parse(serialized);

      expect(parsed.grid.snapEnabled).toBe(true);
      expect(parsed.grid.zoomHorizontal).toBe(20);
      expect(parsed.grid.zoomVertical).toBe(60);
      expect(parsed.grid.scrollPosition.x).toBe(0);
      expect(parsed.grid.scrollPosition.y).toBe(0);
    });
  });

  describe('Project Rehydration', () => {
    it('should rehydrate a project from JSON', () => {
      const serialized = serializeProject(testProject);
      const rehydrated = rehydrateProject(serialized);

      expect(rehydrated.id).toBe(testProject.id);
      expect(rehydrated.name).toBe(testProject.name);
      expect(rehydrated.tempo).toBe(testProject.tempo);
      expect(rehydrated.timeSignature.numerator).toBe(
        testProject.timeSignature.numerator
      );
      expect(rehydrated.timeSignature.denominator).toBe(
        testProject.timeSignature.denominator
      );
      expect(rehydrated.tracks).toHaveLength(2);
      expect(rehydrated.clips).toHaveLength(2);
      expect(rehydrated.effectChains).toHaveLength(2);
      expect(rehydrated.audioFiles).toHaveLength(1);
    });

    it('should properly convert date strings to Date objects', () => {
      const serialized = serializeProject(testProject);
      const rehydrated = rehydrateProject(serialized);

      expect(rehydrated.metadata.createdAt).toBeInstanceOf(Date);
      expect(rehydrated.metadata.modifiedAt).toBeInstanceOf(Date);
      expect(rehydrated.metadata.createdAt.getTime()).toBe(
        testProject.metadata.createdAt.getTime()
      );
      expect(rehydrated.metadata.modifiedAt.getTime()).toBe(
        testProject.metadata.modifiedAt.getTime()
      );
    });

    it('should preserve track types and properties', () => {
      const serialized = serializeProject(testProject);
      const rehydrated = rehydrateProject(serialized);

      const audioTrack = rehydrated.tracks.find(
        (t) => t.type === TrackType.AUDIO
      );
      expect(audioTrack).toBeDefined();
      expect((audioTrack as any).monitoring).toBe(true);
      expect((audioTrack as any).inputGain).toBe(1.2);

      const midiTrack = rehydrated.tracks.find(
        (t) => t.type === TrackType.MIDI
      );
      expect(midiTrack).toBeDefined();
      expect((midiTrack as any).instrument.pluginId).toBe('synth-plugin-1');
      expect((midiTrack as any).instrument.midiChannel).toBe(2);
    });

    it('should preserve clip types and properties', () => {
      const serialized = serializeProject(testProject);
      const rehydrated = rehydrateProject(serialized);

      const audioClip = rehydrated.clips.find((c) => c.type === ClipType.AUDIO);
      expect(audioClip).toBeDefined();
      expect((audioClip as any).audioFileId).toBe('audio-file-1');
      expect((audioClip as any).warping.enabled).toBe(true);

      const midiClip = rehydrated.clips.find((c) => c.type === ClipType.MIDI);
      expect(midiClip).toBeDefined();
      expect((midiClip as any).notes).toHaveLength(2);
      expect((midiClip as any).quantize).toBe(8);
    });

    it('should preserve effect chains and effects', () => {
      const serialized = serializeProject(testProject);
      const rehydrated = rehydrateProject(serialized);

      const effectChain = rehydrated.effectChains.find(
        (ec) => ec.trackId === 'track-1'
      );
      expect(effectChain).toBeDefined();
      expect(effectChain!.effects).toHaveLength(2);

      const reverb = effectChain!.effects.find(
        (e) => e.type === EffectType.REVERB
      );
      expect(reverb).toBeDefined();
      expect(reverb!.parameters.roomSize).toBe(0.7);
      expect(reverb!.parameters.wetLevel).toBe(0.5);
    });

    it('should preserve audio file metadata', () => {
      const serialized = serializeProject(testProject);
      const rehydrated = rehydrateProject(serialized);

      const audioFile = rehydrated.audioFiles[0];
      expect(audioFile.name).toBe('drums.wav');
      expect(audioFile.metadata?.artist).toBe('Test Artist');
      expect(audioFile.metadata?.year).toBe(2023);
    });

    it('should handle corrupted or invalid data gracefully', () => {
      const invalidJson = '{ invalid json }';

      expect(() => rehydrateProject(invalidJson)).toThrow(
        'Project rehydration failed'
      );
    });

    it('should fix invalid track data during rehydration', () => {
      const projectWithInvalidData = {
        ...testProject,
        tracks: [
          {
            id: 'invalid-track',
            type: 'invalid-type',
            volume: 5, // Above max
            pan: 2, // Above max
            height: 300, // Above max
          },
        ],
      };

      const serialized = serializeProject(projectWithInvalidData);
      const rehydrated = rehydrateProject(serialized);

      const track = rehydrated.tracks[0];
      expect(track.type).toBe(TrackType.AUDIO); // Should default to AUDIO
      expect(track.volume).toBe(2); // Should be clamped to max
      expect(track.pan).toBe(1); // Should be clamped to max
      expect(track.height).toBe(200); // Should be clamped to max
    });

    it('should fix invalid clip data during rehydration', () => {
      const projectWithInvalidClip = {
        ...testProject,
        clips: [
          {
            id: 'invalid-clip',
            type: 'invalid-type',
            startTime: -5, // Negative
            duration: 0, // Zero duration
            gain: 5, // Above max
            pan: -3, // Below min
          },
        ],
      };

      const serialized = serializeProject(projectWithInvalidClip);
      const rehydrated = rehydrateProject(serialized);

      const clip = rehydrated.clips[0];
      expect(clip.type).toBe(ClipType.AUDIO); // Should default to AUDIO
      expect(clip.startTime).toBe(0); // Should be clamped to min
      expect(clip.duration).toBe(0.01); // Should have minimum duration
      expect(clip.gain).toBe(2); // Should be clamped to max
      expect(clip.pan).toBe(-1); // Should be clamped to min
    });
  });

  describe('App State Serialization', () => {
    it('should serialize complete app state', () => {
      const appState: AppState = {
        project: testProject,
        transport: {
          isPlaying: true,
          isRecording: false,
          isLooping: true,
          isMetronomeEnabled: false,
          currentTime: 12.5,
          loopStart: 4,
          loopEnd: 20,
          punchIn: 6,
          punchOut: 18,
          countIn: 4,
          playbackSpeed: 1.25,
        },
        selection: {
          selectedTrackIds: ['track-1'],
          selectedClipIds: ['clip-1'],
          selectedEffectIds: ['effect-1'],
          selectionStartTime: 2,
          selectionEndTime: 8,
          selectionTrackStart: 0,
          selectionTrackEnd: 2,
        },
        grid: {
          snapEnabled: false,
          snapDivision: 8,
          gridDivision: 16,
          showGrid: false,
          showTimeRuler: false,
          showTrackNumbers: false,
          zoomHorizontal: 40,
          zoomVertical: 120,
          scrollPosition: { x: 500, y: 200 },
        },
        history: {
          past: [],
          present: testProject,
          future: [],
          maxSize: 50,
        },
        ui: {
          showMixer: false,
          showBrowser: false,
          showInspector: true,
          showAutomation: false,
          focusedPanel: 'timeline',
        },
      };

      const serialized = serializeAppState(appState);
      const parsed = JSON.parse(serialized);

      expect(parsed.transport.isPlaying).toBe(true);
      expect(parsed.transport.currentTime).toBe(12.5);
      expect(parsed.selection.selectedTrackIds).toHaveLength(1);
      expect(parsed.grid.snapEnabled).toBe(false);
      expect(parsed.grid.zoomHorizontal).toBe(40);
    });

    it('should rehydrate complete app state', () => {
      const appState: AppState = {
        project: testProject,
        transport: {
          isPlaying: true,
          isRecording: false,
          isLooping: true,
          isMetronomeEnabled: false,
          currentTime: 12.5,
          loopStart: 4,
          loopEnd: 20,
          punchIn: 6,
          punchOut: 18,
          countIn: 4,
          playbackSpeed: 1.25,
        },
        selection: {
          selectedTrackIds: ['track-1'],
          selectedClipIds: ['clip-1'],
          selectedEffectIds: ['effect-1'],
          selectionStartTime: 2,
          selectionEndTime: 8,
        },
        grid: {
          snapEnabled: false,
          snapDivision: 8,
          gridDivision: 16,
          showGrid: false,
          showTimeRuler: false,
          showTrackNumbers: false,
          zoomHorizontal: 40,
          zoomVertical: 120,
          scrollPosition: { x: 500, y: 200 },
        },
        history: {
          past: [],
          present: testProject,
          future: [],
          maxSize: 50,
        },
        ui: {
          showMixer: false,
          showBrowser: false,
          showInspector: true,
          showAutomation: false,
          focusedPanel: 'timeline',
        },
      };

      const serialized = serializeAppState(appState);
      const rehydrated = rehydrateAppState(serialized);

      expect(rehydrated.project.name).toBe(testProject.name);
      expect(rehydrated.transport.isPlaying).toBe(true);
      expect(rehydrated.transport.currentTime).toBe(12.5);
      expect(rehydrated.selection.selectedTrackIds).toHaveLength(1);
      expect(rehydrated.grid.snapEnabled).toBe(false);
      expect(rehydrated.ui.showMixer).toBe(false); // Should be reset to default
      expect(rehydrated.ui.showBrowser).toBe(true); // Should be reset to default
    });
  });

  describe('Validation', () => {
    it('should validate correctly formatted serialized project', () => {
      const serialized = serializeProject(testProject);
      expect(validateSerializedProject(serialized)).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(validateSerializedProject('invalid json')).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        version: SERIALIZATION_VERSION,
        // missing project field
      };
      expect(validateSerializedProject(JSON.stringify(invalidData))).toBe(
        false
      );
    });

    it('should reject missing project properties', () => {
      const invalidData = {
        version: SERIALIZATION_VERSION,
        project: {
          // missing required properties like id, name, tempo
        },
      };
      expect(validateSerializedProject(JSON.stringify(invalidData))).toBe(
        false
      );
    });

    it('should reject invalid arrays', () => {
      const invalidData = {
        version: SERIALIZATION_VERSION,
        project: {
          ...testProject,
          tracks: 'not an array',
          clips: null,
        },
      };
      expect(validateSerializedProject(JSON.stringify(invalidData))).toBe(
        false
      );
    });
  });

  describe('Backup Creation', () => {
    it('should create project backup', async () => {
      const fileName = await createProjectBackup(testProject);
      expect(fileName).toContain('Test_Project');
      expect(fileName).toMatch(/\.json$/);
    });

    it('should handle backup creation errors', async () => {
      const invalidProject = null as any;
      await expect(createProjectBackup(invalidProject)).rejects.toThrow(
        'Project backup failed'
      );
    });
  });

  describe('Round-trip Tests', () => {
    it('should maintain data integrity through serialize/rehydrate cycle', () => {
      const serialized = serializeProject(testProject);
      const rehydrated = rehydrateProject(serialized);

      // Compare core properties
      expect(rehydrated.id).toBe(testProject.id);
      expect(rehydrated.name).toBe(testProject.name);
      expect(rehydrated.tempo).toBe(testProject.tempo);
      expect(rehydrated.timeSignature.numerator).toBe(
        testProject.timeSignature.numerator
      );
      expect(rehydrated.timeSignature.denominator).toBe(
        testProject.timeSignature.denominator
      );
      expect(rehydrated.sampleRate).toBe(testProject.sampleRate);
      expect(rehydrated.bitDepth).toBe(testProject.bitDepth);

      // Compare tracks
      expect(rehydrated.tracks).toHaveLength(testProject.tracks.length);
      testProject.tracks.forEach((originalTrack: any, index: number) => {
        const rehydratedTrack = rehydrated.tracks[index];
        expect(rehydratedTrack.id).toBe(originalTrack.id);
        expect(rehydratedTrack.name).toBe(originalTrack.name);
        expect(rehydratedTrack.type).toBe(originalTrack.type);
        expect(rehydratedTrack.volume).toBe(originalTrack.volume);
        expect(rehydratedTrack.pan).toBe(originalTrack.pan);
      });

      // Compare clips
      expect(rehydrated.clips).toHaveLength(testProject.clips.length);
      testProject.clips.forEach((originalClip: any, index: number) => {
        const rehydratedClip = rehydrated.clips[index];
        expect(rehydratedClip.id).toBe(originalClip.id);
        expect(rehydratedClip.name).toBe(originalClip.name);
        expect(rehydratedClip.type).toBe(originalClip.type);
        expect(rehydratedClip.startTime).toBe(originalClip.startTime);
        expect(rehydratedClip.duration).toBe(originalClip.duration);
      });

      // Compare effect chains
      expect(rehydrated.effectChains).toHaveLength(
        testProject.effectChains.length
      );
      testProject.effectChains.forEach((originalChain: any, index: number) => {
        const rehydratedChain = rehydrated.effectChains[index];
        expect(rehydratedChain.id).toBe(originalChain.id);
        expect(rehydratedChain.trackId).toBe(originalChain.trackId);
        expect(rehydratedChain.effects).toHaveLength(
          originalChain.effects.length
        );
      });

      // Compare audio files
      expect(rehydrated.audioFiles).toHaveLength(testProject.audioFiles.length);
      testProject.audioFiles.forEach((originalFile: any, index: number) => {
        const rehydratedFile = rehydrated.audioFiles[index];
        expect(rehydratedFile.id).toBe(originalFile.id);
        expect(rehydratedFile.name).toBe(originalFile.name);
        expect(rehydratedFile.duration).toBe(originalFile.duration);
        expect(rehydratedFile.sampleRate).toBe(originalFile.sampleRate);
      });
    });

    it('should handle multiple serialize/rehydrate cycles', () => {
      let currentProject = testProject;

      // Perform multiple cycles
      for (let i = 0; i < 5; i++) {
        const serialized = serializeProject(currentProject);
        currentProject = rehydrateProject(serialized);
      }

      // Should still have all data
      expect(currentProject.name).toBe(testProject.name);
      expect(currentProject.tracks).toHaveLength(2);
      expect(currentProject.clips).toHaveLength(2);
      expect(currentProject.effectChains).toHaveLength(2);
      expect(currentProject.audioFiles).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty project', () => {
      const emptyProject = createEmptyProject();

      const serialized = serializeProject(emptyProject);
      const rehydrated = rehydrateProject(serialized);

      expect(rehydrated.name).toBe('Untitled Project');
      expect(rehydrated.tracks).toHaveLength(0);
      expect(rehydrated.clips).toHaveLength(0);
      expect(rehydrated.effectChains).toHaveLength(0);
      expect(rehydrated.audioFiles).toHaveLength(0);
    });

    it('should handle project with maximum values', () => {
      const maxProject = {
        ...testProject,
        tempo: 300,
        tracks: Array.from({ length: 100 }, (_, i) => ({
          id: `track-${i}`,
          name: `Track ${i}`,
          type: TrackType.AUDIO,
          color: '#ff0000',
          muted: false,
          solo: false,
          armed: false,
          volume: 2,
          pan: 1,
          height: 200,
          visible: true,
          locked: false,
          effectChainId: `chain-${i}`,
          monitoring: false,
          inputGain: 2,
          recordEnabled: false,
        })),
      };

      const serialized = serializeProject(maxProject);
      const rehydrated = rehydrateProject(serialized);

      expect(rehydrated.tempo).toBe(300);
      expect(rehydrated.tracks).toHaveLength(100);
    });

    it('should handle project with special characters', () => {
      const specialProject = {
        ...testProject,
        name: 'Project with "quotes" and \n newlines \t tabs',
        tracks: [
          {
            ...testProject.tracks[0],
            name: 'Track with émojis 🎵 and unicode ñáí',
          },
        ],
      };

      const serialized = serializeProject(specialProject);
      const rehydrated = rehydrateProject(serialized);

      expect(rehydrated.name).toContain('quotes');
      expect(rehydrated.tracks[0].name).toContain('🎵');
    });
  });
});
