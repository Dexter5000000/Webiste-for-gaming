import { useState, useCallback, useRef } from 'react';
import {
  importMultipleAudioFiles,
  ImportedAudioData,
} from '../utils/audioImport';
import {
  exportAudioBuffer,
  saveFileWithSystemAccess,
  ExportOptions,
} from '../utils/audioExport';
import {
  exportProjectArchive,
  importProjectArchive,
} from '../utils/projectArchive';
import { Project } from '../state/models';

export interface AudioImportResult {
  success: boolean;
  importedData?: ImportedAudioData[];
  error?: Error;
}

export interface AudioExportResult {
  success: boolean;
  filename?: string;
  error?: Error;
}

export function useAudioImportExport() {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const importAudio = useCallback(
    async (files: File[]): Promise<AudioImportResult> => {
      setIsImporting(true);
      setProgress(0);
      setStatusMessage(`Importing ${files.length} file(s)...`);

      try {
        const audioContext = getAudioContext();
        const importedData = await importMultipleAudioFiles(
          files,
          audioContext,
          {
            onProgress: (p) => setProgress(p),
            onError: (error) => console.error('Import error:', error),
          }
        );

        setStatusMessage(
          `Successfully imported ${importedData.length} file(s)`
        );
        setErrorMessage('');
        setTimeout(() => setStatusMessage(''), 3000);

        return { success: true, importedData };
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Failed to import audio files');
        setStatusMessage('Import failed');
        setErrorMessage(err.message);
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: false, error: err };
      } finally {
        setIsImporting(false);
        setProgress(0);
      }
    },
    [getAudioContext]
  );

  const exportMixdown = useCallback(
    async (
      audioBuffer: AudioBuffer,
      filename: string,
      format: 'wav' | 'mp3' | 'ogg',
      options: Partial<ExportOptions> = {}
    ): Promise<AudioExportResult> => {
      setIsExporting(true);
      setProgress(0);
      setStatusMessage(`Exporting ${format.toUpperCase()} mixdown...`);

      try {
        const result = await exportAudioBuffer(audioBuffer, filename, {
          format,
          bitrate: options.bitrate || 192,
          quality: options.quality || 0.9,
          onProgress: (p) => setProgress(p),
          onError: (error) => console.error('Export error:', error),
        });

        await saveFileWithSystemAccess(
          result.blob,
          result.filename,
          result.blob.type
        );

        setStatusMessage('Export complete');
        setTimeout(() => setStatusMessage(''), 3000);

        return { success: true, filename: result.filename };
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Failed to export audio');
        setStatusMessage('Export failed');
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: false, error: err };
      } finally {
        setIsExporting(false);
        setProgress(0);
      }
    },
    []
  );

  const exportStems = useCallback(
    async (
      stems: Array<{ name: string; buffer: AudioBuffer }> ,
      format: 'wav' | 'mp3' | 'ogg'
    ): Promise<AudioExportResult> => {
      setIsExporting(true);
      setProgress(0);
      setStatusMessage('Exporting stems...');

      try {
        const totalStems = stems.length;
        let processed = 0;

        for (const stem of stems) {
          const result = await exportAudioBuffer(stem.buffer, stem.name, {
            format,
            bitrate: 192,
            quality: 0.9,
            onProgress: (p) => {
              const overall = totalStems === 0 ? 1 : (processed + p) / totalStems;
              setProgress(overall);
            },
          });

          await saveFileWithSystemAccess(
            result.blob,
            `${stem.name}.${format}`,
            result.blob.type
          );

          processed++;
        }

        setStatusMessage('Stems exported successfully');
        setTimeout(() => setStatusMessage(''), 3000);

        return { success: true };
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Failed to export stems');
        setStatusMessage('Export failed');
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: false, error: err };
      } finally {
        setIsExporting(false);
        setProgress(0);
      }
    },
    []
  );

  const exportProject = useCallback(
    async (
      project: Partial<Project>,
      audioFiles: Map<string, Blob | ArrayBuffer>,
      includeAssets = true
    ): Promise<AudioExportResult> => {
      setIsExporting(true);
      setProgress(0);
      setStatusMessage('Exporting project archive...');

      try {
        const archiveBlob = await exportProjectArchive(project, audioFiles, {
          includeAssets,
          onProgress: (p) => setProgress(p),
          onError: (error) => console.error('Export error:', error),
        });

        const filename = `${(project.name ?? 'project').replace(/[^a-z0-9]/gi, '_')}.zdaw`;
        await saveFileWithSystemAccess(
          archiveBlob,
          filename,
          'application/zip'
        );

        setStatusMessage('Project exported successfully');
        setTimeout(() => setStatusMessage(''), 3000);

        return { success: true, filename };
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Failed to export project');
        setStatusMessage('Export failed');
        setTimeout(() => setStatusMessage(''), 3000);
        return { success: false, error: err };
      } finally {
        setIsExporting(false);
        setProgress(0);
      }
    },
    []
  );

  const importProject = useCallback(async (archiveFile: File) => {
    setIsImporting(true);
    setProgress(0);
    setStatusMessage('Importing project...');

    try {
      const archiveData = await importProjectArchive(archiveFile, {
        onProgress: (p) => setProgress(p),
        onError: (error) => console.error('Import error:', error),
      });

      setStatusMessage('Project imported successfully');
      setTimeout(() => setStatusMessage(''), 3000);

      return { success: true, project: archiveData.project, audioFiles: archiveData.audioFiles };
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Failed to import project');
      setStatusMessage('Import failed');
      setTimeout(() => setStatusMessage(''), 3000);
      return { success: false, error: err };
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  }, []);

  return {
    isImporting,
    isExporting,
    progress,
    statusMessage,
    errorMessage,
    importAudio,
    exportMixdown,
    exportStems,
    exportProject,
    importProject,
  };
}
