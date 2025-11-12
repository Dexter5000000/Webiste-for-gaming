import { AudioFile } from '../state/models';

export interface ImportedAudioData {
  audioFile: Omit<AudioFile, 'id'>;
  audioBuffer: AudioBuffer;
  waveformData: Float32Array[];
  originalData: ArrayBuffer;
}

export interface ImportOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export async function importAudioFile(
  file: File,
  audioContext: AudioContext,
  options: ImportOptions = {}
): Promise<ImportedAudioData> {
  const { onProgress, onError } = options;

  try {
    onProgress?.(0.1);

    const arrayBuffer = await file.arrayBuffer();

    onProgress?.(0.3);

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    onProgress?.(0.6);

    const waveformData = generateWaveformData(audioBuffer);

    onProgress?.(0.9);

    const audioFile: Omit<AudioFile, 'id'> = {
      name: file.name.replace(/\.[^.]+$/, ''),
      path: file.name,
      size: file.size,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      bitDepth: 16,
      channels: audioBuffer.numberOfChannels,
      format: getFileFormat(file.name),
    };

    onProgress?.(1.0);

    return {
      audioFile,
      audioBuffer,
      waveformData,
      originalData: arrayBuffer,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to import audio file');
    onError?.(err);
    throw err;
  }
}

export function generateWaveformData(
  audioBuffer: AudioBuffer,
  samplesPerPixel = 512
): Float32Array[] {
  const waveformData: Float32Array[] = [];

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    const dataPoints = Math.ceil(channelData.length / samplesPerPixel);
    const waveform = new Float32Array(dataPoints);

    for (let i = 0; i < dataPoints; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, channelData.length);
      let max = 0;

      for (let j = start; j < end; j++) {
        const abs = Math.abs(channelData[j]);
        if (abs > max) {
          max = abs;
        }
      }

      waveform[i] = max;
    }

    waveformData.push(waveform);
  }

  return waveformData;
}

function getFileFormat(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension || 'unknown';
}

export function isAudioFileSupported(file: File): boolean {
  const supportedFormats = ['audio/wav', 'audio/wave', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/flac'];
  const supportedExtensions = ['.wav', '.mp3', '.ogg', '.flac'];

  if (supportedFormats.includes(file.type)) {
    return true;
  }

  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  return extension ? supportedExtensions.includes(extension) : false;
}

export async function importMultipleAudioFiles(
  files: File[],
  audioContext: AudioContext,
  options: ImportOptions = {}
): Promise<ImportedAudioData[]> {
  const results: ImportedAudioData[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    
    if (!isAudioFileSupported(file)) {
      options.onError?.(new Error(`Unsupported file format: ${file.name}`));
      continue;
    }

    try {
      const result = await importAudioFile(file, audioContext, {
        onProgress: (fileProgress) => {
          const overallProgress = (i + fileProgress) / totalFiles;
          options.onProgress?.(overallProgress);
        },
        onError: options.onError,
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to import ${file.name}:`, error);
    }
  }

  return results;
}

export interface FileSystemAccessOptions {
  multiple?: boolean;
  accept?: Record<string, string[]>;
}

export async function openFileWithSystemAccess(
  options: FileSystemAccessOptions = {}
): Promise<File[]> {
  if ('showOpenFilePicker' in window) {
    try {
      const fileHandles = await (window as unknown as { showOpenFilePicker: (options: object) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
        multiple: options.multiple ?? false,
        types: [
          {
            description: 'Audio Files',
            accept: options.accept ?? {
              'audio/wav': ['.wav'],
              'audio/mpeg': ['.mp3'],
              'audio/ogg': ['.ogg'],
              'audio/flac': ['.flac'],
            },
          },
        ],
      });

      const files: File[] = [];
      for (const handle of fileHandles) {
        const file = await handle.getFile();
        files.push(file);
      }

      return files;
    } catch (error) {
      if ((error as unknown as { name: string }).name === 'AbortError') {
        return [];
      }
      throw error;
    }
  } else {
    return openFileWithFallback(options);
  }
}

function openFileWithFallback(options: FileSystemAccessOptions = {}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = options.multiple ?? false;
    
    const acceptTypes = options.accept ?? {
      'audio/wav': ['.wav'],
      'audio/mpeg': ['.mp3'],
      'audio/ogg': ['.ogg'],
      'audio/flac': ['.flac'],
    };
    
    const acceptString = Object.entries(acceptTypes)
      .flatMap(([mime, exts]) => [mime, ...exts])
      .join(',');
    
    input.accept = acceptString;

    input.onchange = () => {
      const files = Array.from(input.files || []);
      resolve(files);
    };

    input.click();
  });
}
