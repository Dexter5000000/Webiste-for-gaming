import { useState, useCallback, useRef, DragEvent } from 'react';
import {
  openFileWithSystemAccess,
  isAudioFileSupported,
} from '../utils/audioImport';
import { importMidiFile, exportMidiFile } from '../utils/midiUtils';

export interface ImportExportPanelProps {
  onImportAudio?: (files: File[]) => Promise<void> | void;
  onImportProject?: (file: File) => Promise<void> | void;
  onImportMidi?: (file: File) => Promise<void> | void;
  onExportProject?: () => Promise<void> | void;
  onExportAudio?: (format: 'wav' | 'mp3' | 'ogg') => Promise<void> | void;
  onExportStems?: (format: 'wav' | 'mp3' | 'ogg') => Promise<void> | void;
  onExportMidi?: () => Promise<void> | void;
  isProcessing?: boolean;
  progress?: number;
  statusMessage?: string;
  errorMessage?: string;
}

export function ImportExportPanel({
  onImportAudio,
  onImportProject,
  onImportMidi,
  onExportProject,
  onExportAudio,
  onExportStems,
  onExportMidi,
  isProcessing = false,
  progress = 0,
  statusMessage = '',
  errorMessage = '',
}: ImportExportPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter((file) => isAudioFileSupported(file));

      if (audioFiles.length > 0) {
        try {
          await onImportAudio?.(audioFiles);
        } catch (error) {
          setLocalError(
            error instanceof Error ? error.message : 'Failed to import files'
          );
          setTimeout(() => setLocalError(''), 3000);
        }
      }
    },
    [onImportAudio]
  );

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      const audioFiles = files.filter((file) => isAudioFileSupported(file));

      if (audioFiles.length > 0) {
        try {
          await onImportAudio?.(audioFiles);
        } catch (error) {
          setLocalError(
            error instanceof Error ? error.message : 'Failed to import files'
          );
          setTimeout(() => setLocalError(''), 3000);
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onImportAudio]
  );

  const handleMidiFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      const midiFiles = files.filter((file) => file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi'));

      if (midiFiles.length > 0) {
        try {
          await onImportMidi?.(midiFiles[0]);
        } catch (error) {
          setLocalError(
            error instanceof Error ? error.message : 'Failed to import MIDI file'
          );
          setTimeout(() => setLocalError(''), 3000);
        }
      }

      // Clear the input
      if (e.target) {
        e.target.value = '';
      }
    },
    [onImportMidi]
  );

  const handleImportMidi = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.mid,.midi';
    input.multiple = false;
    input.onchange = handleMidiFileChange;
    input.click();
  }, [handleMidiFileChange]);

  const handleExportMidi = useCallback(async () => {
    try {
      await onExportMidi?.();
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'Failed to export MIDI file'
      );
      setTimeout(() => setLocalError(''), 3000);
    }
  }, [onExportMidi]);

  const handleImportAudio = useCallback(async () => {
    try {
      const files = await openFileWithSystemAccess({ multiple: true });

      if (files.length > 0) {
        await onImportAudio?.(files);
      }
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'Failed to import files'
      );
      setTimeout(() => setLocalError(''), 3000);
    }
  }, [onImportAudio]);

  const handleExportMixdown = useCallback(
    async (format: 'wav' | 'mp3' | 'ogg') => {
      try {
        await onExportAudio?.(format);
      } catch (error) {
        setLocalError(
          error instanceof Error ? error.message : 'Failed to export audio'
        );
        setTimeout(() => setLocalError(''), 3000);
      }
    },
    [onExportAudio]
  );

  const handleExportProject = useCallback(async () => {
    try {
      await onExportProject?.();
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : 'Failed to export project'
      );
      setTimeout(() => setLocalError(''), 3000);
    }
  }, [onExportProject]);

  const handleExportStems = useCallback(
    async (format: 'wav' | 'mp3' | 'ogg') => {
      try {
        await onExportStems?.(format);
      } catch (error) {
        setLocalError(
          error instanceof Error ? error.message : 'Failed to export stems'
        );
        setTimeout(() => setLocalError(''), 3000);
      }
    },
    [onExportStems]
  );

  return (
    <div className="import-export-panel">
      <div className="panel-section">
        <h3>Import Audio</h3>
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p>Drag and drop audio files here</p>
          <p className="formats">Supported: WAV, MP3, OGG, FLAC</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="import-button"
        >
          Browse Files
        </button>
        <button
          onClick={handleImportAudio}
          disabled={isProcessing}
          className="import-button"
        >
          Import Audio (System Picker)
        </button>
      </div>

      <div className="panel-section">
        <h3>Import MIDI</h3>
        <div className="drop-zone" onDrop={handleDrop}>
          <p>Drag and drop MIDI files here</p>
          <p className="formats">Supported: MID, MIDI</p>
        </div>
        <button
          onClick={handleImportMidi}
          disabled={isProcessing}
          className="import-button"
        >
          Import MIDI File
        </button>
      </div>

      <div className="panel-section">
        <h3>Export MIDI</h3>
        <button
          onClick={handleExportMidi}
          disabled={isProcessing}
          className="export-button"
        >
          Export MIDI File
        </button>
      </div>

      <div className="panel-section">
        <h3>Export Audio</h3>
        <div className="export-buttons">
          <button
            onClick={() => handleExportMixdown('wav')}
            disabled={isProcessing}
            className="export-button"
          >
            Export Mix WAV
          </button>
          <button
            onClick={() => handleExportMixdown('mp3')}
            disabled={isProcessing}
            className="export-button"
          >
            Export Mix MP3
          </button>
          <button
            onClick={() => handleExportMixdown('ogg')}
            disabled={isProcessing}
            className="export-button"
          >
            Export Mix OGG
          </button>
        </div>
        <div className="export-buttons">
          <button
            onClick={() => handleExportStems('wav')}
            disabled={isProcessing}
            className="export-button"
          >
            Export Stems WAV
          </button>
          <button
            onClick={() => handleExportStems('mp3')}
            disabled={isProcessing}
            className="export-button"
          >
            Export Stems MP3
          </button>
          <button
            onClick={() => handleExportStems('ogg')}
            disabled={isProcessing}
            className="export-button"
          >
            Export Stems OGG
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>Project</h3>
        <input
          ref={projectInputRef}
          type="file"
          accept=".zdaw,.zip,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                await onImportProject?.(file);
              } catch (error) {
                setLocalError(
                  error instanceof Error ? error.message : 'Failed to import project'
                );
                setTimeout(() => setLocalError(''), 3000);
              }
            }
            if (projectInputRef.current) {
              projectInputRef.current.value = '';
            }
          }}
          style={{ display: 'none' }}
        />
        <div className="export-buttons">
          <button
            onClick={() => projectInputRef.current?.click()}
            disabled={isProcessing}
            className="export-button"
          >
            Import Project
          </button>
          <button
            onClick={handleExportProject}
            disabled={isProcessing}
            className="export-button"
          >
            Export Project Archive
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="status-message success">{statusMessage}</div>
      )}

      {(errorMessage || localError) && (
        <div className="status-message error">{errorMessage || localError}</div>
      )}
    </div>
  );
}
