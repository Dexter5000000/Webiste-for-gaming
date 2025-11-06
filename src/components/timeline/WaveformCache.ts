export interface WaveformData {
  peaks: {
    min: Float32Array;
    max: Float32Array;
  };
  width: number;
}

export class WaveformCache {
  private cache = new Map<string, WaveformData>();
  private worker: Worker | null = null;

  async getWaveform(
    bufferId: string,
    channelData: Float32Array[],
    targetWidth: number
  ): Promise<WaveformData> {
    const cacheKey = `${bufferId}-${targetWidth}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const peaks = await this.computePeaksInWorker(channelData, targetWidth);
    
    const waveformData: WaveformData = {
      peaks,
      width: targetWidth,
    };

    this.cache.set(cacheKey, waveformData);
    return waveformData;
  }

  private async computePeaksInWorker(
    channelData: Float32Array[],
    targetWidth: number
  ): Promise<{ min: Float32Array; max: Float32Array }> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        try {
          this.worker = new Worker(
            new URL('../../audio/workers/waveform-processor.worker.ts', import.meta.url),
            { type: 'module' }
          );
        } catch (error) {
          return this.computePeaksFallback(channelData, targetWidth).then(resolve).catch(reject);
        }
      }

      const handleMessage = (e: MessageEvent) => {
        this.worker?.removeEventListener('message', handleMessage);
        resolve(e.data.peaks);
      };

      const handleError = (_error: ErrorEvent) => {
        this.worker?.removeEventListener('error', handleError);
        this.computePeaksFallback(channelData, targetWidth).then(resolve).catch(reject);
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.addEventListener('error', handleError);

      const clonedChannelData = channelData.map((channel) => channel.slice());
      this.worker.postMessage(
        {
          type: 'process',
          channelData: clonedChannelData,
          sampleRate: 44100,
          targetWidth,
        },
        clonedChannelData.map((channel) => channel.buffer)
      );
    });
  }

  private async computePeaksFallback(
    channelData: Float32Array[],
    targetWidth: number
  ): Promise<{ min: Float32Array; max: Float32Array }> {
    const length = channelData[0].length;
    const samplesPerPixel = Math.floor(length / targetWidth);
    
    const minPeaks = new Float32Array(targetWidth);
    const maxPeaks = new Float32Array(targetWidth);
    
    for (let pixel = 0; pixel < targetWidth; pixel++) {
      const startSample = pixel * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, length);
      
      let min = 1;
      let max = -1;
      
      for (let channel = 0; channel < channelData.length; channel++) {
        for (let i = startSample; i < endSample; i++) {
          const sample = channelData[channel][i];
          if (sample < min) min = sample;
          if (sample > max) max = sample;
        }
      }
      
      minPeaks[pixel] = min;
      maxPeaks[pixel] = max;
    }
    
    return { min: minPeaks, max: maxPeaks };
  }

  clear(): void {
    this.cache.clear();
  }

  dispose(): void {
    this.cache.clear();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
