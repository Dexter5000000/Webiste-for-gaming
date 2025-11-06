interface WaveformRequest {
  type: 'process';
  channelData: Float32Array[];
  sampleRate: number;
  targetWidth: number;
}

interface WaveformResponse {
  type: 'result';
  peaks: {
    min: Float32Array;
    max: Float32Array;
  };
}

function computePeaks(
  channelData: Float32Array[],
  targetWidth: number
): { min: Float32Array; max: Float32Array } {
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

self.onmessage = (e: MessageEvent<WaveformRequest>) => {
  const { type, channelData, targetWidth } = e.data;
  
  if (type === 'process') {
    const peaks = computePeaks(channelData, targetWidth);
    
    const response: WaveformResponse = {
      type: 'result',
      peaks,
    };
    
    self.postMessage(response, { transfer: [peaks.min.buffer, peaks.max.buffer] });
  }
};

export {};
