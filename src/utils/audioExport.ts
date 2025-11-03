import lamejs from 'lamejs';
import { createOggEncoder } from 'wasm-media-encoders';

export interface ExportOptions {
  format: 'wav' | 'mp3' | 'ogg';
  bitrate?: number;
  quality?: number;
  sampleRate?: number;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  size: number;
}

export async function exportAudioBuffer(
  audioBuffer: AudioBuffer,
  filename: string,
  options: ExportOptions
): Promise<ExportResult> {
  const { format, onProgress } = options;

  try {
    onProgress?.(0.1);

    let blob: Blob;
    let extension: string;

    switch (format) {
      case 'wav':
        blob = await encodeWAV(audioBuffer, options);
        extension = 'wav';
        break;
      case 'mp3':
        blob = await encodeMP3(audioBuffer, options);
        extension = 'mp3';
        break;
      case 'ogg':
        blob = await encodeOGG(audioBuffer, options);
        extension = 'ogg';
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    onProgress?.(1.0);

    const finalFilename = filename.replace(/\.[^.]*$/, '') + '.' + extension;

    return {
      blob,
      filename: finalFilename,
      size: blob.size,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Failed to export audio');
    options.onError?.(err);
    throw err;
  }
}

async function encodeWAV(audioBuffer: AudioBuffer, options: ExportOptions): Promise<Blob> {
  const { onProgress } = options;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numberOfChannels * 2;

  onProgress?.(0.2);

  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  onProgress?.(0.4);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    if (i % 10000 === 0) {
      onProgress?.(0.4 + (i / audioBuffer.length) * 0.5);
    }
  }

  onProgress?.(0.9);

  return new Blob([buffer], { type: 'audio/wav' });
}

async function encodeMP3(audioBuffer: AudioBuffer, options: ExportOptions): Promise<Blob> {
  const { bitrate = 192, onProgress } = options;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const mp3encoder = new lamejs.Mp3Encoder(numberOfChannels, sampleRate, bitrate);

  onProgress?.(0.2);

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;

  const sampleBlockSize = 1152;
  const mp3Data: ArrayBuffer[] = [];

  for (let i = 0; i < audioBuffer.length; i += sampleBlockSize) {
    const leftChunk = convertFloat32ToInt16(leftChannel.subarray(i, i + sampleBlockSize));
    const rightChunk = convertFloat32ToInt16(rightChannel.subarray(i, i + sampleBlockSize));

    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) {
      const arrayBuffer = mp3buf.buffer as ArrayBuffer;
      mp3Data.push(arrayBuffer.slice(mp3buf.byteOffset, mp3buf.byteOffset + mp3buf.byteLength));
    }

    if (i % 10000 === 0) {
      onProgress?.(0.2 + (i / audioBuffer.length) * 0.6);
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    const arrayBuffer = mp3buf.buffer as ArrayBuffer;
    mp3Data.push(arrayBuffer.slice(mp3buf.byteOffset, mp3buf.byteOffset + mp3buf.byteLength));
  }

  onProgress?.(0.9);

  return new Blob(mp3Data, { type: 'audio/mpeg' });
}

async function encodeOGG(audioBuffer: AudioBuffer, options: ExportOptions): Promise<Blob> {
  const { quality = 0.9, onProgress } = options;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;

  onProgress?.(0.2);

  const encoder = await createOggEncoder();
  const channelCount = Math.min(Math.max(numberOfChannels, 1), 2) as 1 | 2;

  encoder.configure({
    channels: channelCount,
    sampleRate,
    vbrQuality: Math.max(0, Math.min(10, quality * 10)),
  });

  onProgress?.(0.3);

  const channels: Float32Array[] = [];
  for (let i = 0; i < channelCount; i++) {
    channels.push(audioBuffer.getChannelData(Math.min(i, numberOfChannels - 1)));
  }

  const chunkSize = 4096;
  const oggData: ArrayBuffer[] = [];

  for (let i = 0; i < audioBuffer.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, audioBuffer.length);
    const chunkedChannels: Float32Array[] = channels.map((ch) => ch.slice(i, end));

    const encoded = encoder.encode(chunkedChannels);
    if (encoded && encoded.length > 0) {
      const uint8 = new Uint8Array(encoded);
      oggData.push(uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength));
    }

    if (i % 10000 === 0) {
      onProgress?.(0.3 + (i / audioBuffer.length) * 0.5);
    }
  }

  const finalEncoded = encoder.finalize();
  if (finalEncoded && finalEncoded.length > 0) {
    const uint8 = new Uint8Array(finalEncoded);
    oggData.push(uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength));
  }

  onProgress?.(0.9);

  return new Blob(oggData, { type: 'audio/ogg' });
}

function convertFloat32ToInt16(buffer: Float32Array): Int16Array {
  const l = buffer.length;
  const buf = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    buf[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return buf;
}

export interface MixdownTrack {
  id: string;
  volume: number;
  pan: number;
  muted?: boolean;
}

export interface MixdownClip {
  id: string;
  trackId: string;
  start: number; // in beats
  length: number; // in beats
  offset?: number; // in seconds
  audioBuffer: AudioBuffer;
}

export async function renderMixdown(
  tempo: number,
  tracks: MixdownTrack[],
  clips: MixdownClip[],
  sampleRate: number,
  options: Partial<ExportOptions> = {}
): Promise<AudioBuffer> {
  const audibleClips = clips.filter((clip) => {
    const track = tracks.find((t) => t.id === clip.trackId);
    return track && !track.muted;
  });

  if (audibleClips.length === 0) {
    const emptyContext = new OfflineAudioContext(2, 1, sampleRate);
    return emptyContext.createBuffer(2, 1, sampleRate);
  }

  const maxBeat = audibleClips.reduce((max, clip) => {
    return Math.max(max, clip.start + clip.length);
  }, 0);

  const durationSeconds = (maxBeat / tempo) * 60;
  const totalFrames = Math.max(1, Math.ceil(durationSeconds * sampleRate));
  const offlineContext = new OfflineAudioContext(2, totalFrames, sampleRate);

  options.onProgress?.(0.1);

  const trackNodes = new Map<string, { gain: GainNode; panner: StereoPannerNode | GainNode }>();

  for (const track of tracks) {
    const gainNode = offlineContext.createGain();
    gainNode.gain.value = track.volume ?? 1;

    const panner = offlineContext.createStereoPanner?.() ?? offlineContext.createGain();
    if ('pan' in panner && panner.pan) {
      panner.pan.value = track.pan ?? 0;
    }

    gainNode.connect(panner);
    panner.connect(offlineContext.destination);
    trackNodes.set(track.id, { gain: gainNode, panner });
  }

  options.onProgress?.(0.3);

  for (const clip of audibleClips) {
    const trackNode = trackNodes.get(clip.trackId);
    if (!trackNode) continue;

    const source = offlineContext.createBufferSource();
    source.buffer = clip.audioBuffer;

    source.connect(trackNode.gain);

    const startTime = (clip.start / tempo) * 60;
    const duration = (clip.length / tempo) * 60;
    const offset = clip.offset ?? 0;

    const playDuration = Math.min(duration, clip.audioBuffer.duration - offset);
    if (playDuration <= 0) {
      continue;
    }

    source.start(startTime, offset, playDuration);
  }

  options.onProgress?.(0.8);

  const renderedBuffer = await offlineContext.startRendering();

  options.onProgress?.(1.0);

  return renderedBuffer;
}

export async function saveFileWithSystemAccess(
  blob: Blob,
  filename: string,
  mimeType: string
): Promise<void> {
  if ('showSaveFilePicker' in window) {
    try {
      const extension = filename.split('.').pop() || '';
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'Audio File',
            accept: { [mimeType]: ['.' + extension] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      if ((error as any).name === 'AbortError') {
        return;
      }
      console.error('Failed to save with File System Access API:', error);
    }
  }

  saveFileWithFallback(blob, filename);
}

function saveFileWithFallback(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
