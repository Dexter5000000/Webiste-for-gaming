export interface TimeSignature {
  beatsPerBar: number;
  beatValue: number;
}

export const DEFAULT_TIME_SIGNATURE: TimeSignature = {
  beatsPerBar: 4,
  beatValue: 4,
};

export function beatsToSeconds(beats: number, tempo: number): number {
  return (60 / tempo) * beats;
}

export function secondsToBeats(seconds: number, tempo: number): number {
  return (tempo / 60) * seconds;
}

export function barsToBeats(bars: number, timeSignature: TimeSignature = DEFAULT_TIME_SIGNATURE): number {
  return bars * timeSignature.beatsPerBar;
}

export function barsToSeconds(bars: number, tempo: number, timeSignature: TimeSignature = DEFAULT_TIME_SIGNATURE): number {
  return beatsToSeconds(barsToBeats(bars, timeSignature), tempo);
}

export function beatsToBars(beats: number, timeSignature: TimeSignature = DEFAULT_TIME_SIGNATURE): number {
  return beats / timeSignature.beatsPerBar;
}
