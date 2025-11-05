import { AudioStateStore, type TrackState } from './AudioState';
import {
  DEFAULT_TIME_SIGNATURE,
  TimeSignature,
  beatsToSeconds,
  secondsToBeats,
} from './utils/tempo';
import { EffectsManager } from './effects';
import { Instrument, InstrumentType } from './instruments';
import { MidiPlaybackScheduler } from './MidiPlaybackScheduler';

export type TrackType = 'audio' | 'instrument' | 'midi';

type EventHandler<T> = (payload: T) => void;

type Unsubscribe = () => void;

interface AudioParamLike {
  value: number;
  setValueAtTime?(value: number, time: number): void;
  linearRampToValueAtTime?(value: number, time: number): void;
}

export interface AudioNodeLike {
  connect(destination: AudioNodeLike | AudioParamLike, output?: number, input?: number): AudioNodeLike;
  disconnect(destination?: AudioNodeLike | AudioParamLike): void;
}

export interface GainNodeLike extends AudioNodeLike {
  gain: AudioParamLike;
}

export interface StereoPannerNodeLike extends AudioNodeLike {
  pan: AudioParamLike;
}

export interface AudioBufferLike {
  readonly sampleRate: number;
  readonly length: number;
  readonly duration: number;
  readonly numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}

export interface AudioBufferSourceNodeLike extends AudioNodeLike {
  buffer: AudioBufferLike | null;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  playbackRate: AudioParamLike;
  onended: (() => void) | null;
  start(when?: number, offset?: number, duration?: number): void;
  stop(when?: number): void;
}

export interface AudioContextLike {
  currentTime: number;
  sampleRate: number;
  destination: AudioNodeLike;
  createGain(): GainNodeLike;
  createStereoPanner?(): StereoPannerNodeLike;
  createBufferSource(): AudioBufferSourceNodeLike;
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBufferLike;
  decodeAudioData(audioData: ArrayBuffer): Promise<AudioBufferLike>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close?(): Promise<void>;
  audioWorklet?: {
    addModule(module: string | URL): Promise<void>;
  };
}

interface ScheduledEvent<TPayload> {
  id: number;
  time: number;
  payload: TPayload | undefined;
  callback: (time: number, payload: TPayload | undefined) => void;
}

class TypedEventEmitter<TEvents extends Record<string, unknown>> {
  private listeners = new Map<keyof TEvents, Set<EventHandler<TEvents[keyof TEvents]>>>();

  on<TKey extends keyof TEvents>(event: TKey, handler: EventHandler<TEvents[TKey]>): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event)!;
    handlers.add(handler as EventHandler<TEvents[keyof TEvents]>);
    return () => {
      handlers.delete(handler as EventHandler<TEvents[keyof TEvents]>);
    };
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.forEach((handler) => {
      (handler as EventHandler<TEvents[TKey]>)(payload);
    });
  }
}

class LookaheadScheduler<TPayload = unknown> {
  private readonly lookahead: number;
  private readonly intervalMs: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  private events: ScheduledEvent<TPayload>[] = [];
  private nextId = 1;
  private readonly onProcessWindow?: (from: number, to: number) => void;

  constructor(
    private readonly context: AudioContextLike,
    options: {
      lookaheadSeconds?: number;
      intervalMs?: number;
      onProcessWindow?: (from: number, to: number) => void;
    } = {}
  ) {
    this.lookahead = options.lookaheadSeconds ?? 0.1;
    this.intervalMs = options.intervalMs ?? 25;
    this.onProcessWindow = options.onProcessWindow;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  schedule(
    time: number,
    callback: (time: number, payload: TPayload | undefined) => void,
    payload?: TPayload
  ): number {
    const id = this.nextId++;
    const event: ScheduledEvent<TPayload> = {
      id,
      time,
      payload,
      callback,
    };
    this.events.push(event);
    this.events.sort((a, b) => a.time - b.time);
    return id;
  }

  cancel(id: number): void {
    this.events = this.events.filter((event) => event.id !== id);
  }

  clear(): void {
    this.events = [];
  }

  flush(): void {
    const now = this.context.currentTime;
    const horizon = now + this.lookahead;
    if (this.onProcessWindow) {
      this.onProcessWindow(now, horizon);
    }
    this.processEvents(horizon);
  }

  drainAll(): void {
    this.processEvents(Number.POSITIVE_INFINITY);
  }

  private tick(): void {
    const now = this.context.currentTime;
    const horizon = now + this.lookahead;
    if (this.onProcessWindow) {
      this.onProcessWindow(now, horizon);
    }
    this.processEvents(horizon);
  }

  private processEvents(horizon: number): void {
    while (this.events.length > 0) {
      const event = this.events[0];
      if (event.time > horizon) break;
      this.events.shift();
      event.callback(event.time, event.payload);
    }
  }
}

class AudioBufferCache {
  private readonly buffers = new Map<string, AudioBufferLike>();
  private readonly inFlight = new Map<string, Promise<AudioBufferLike>>();

  constructor(private readonly context: AudioContextLike) {}

  has(id: string): boolean {
    return this.buffers.has(id);
  }

  get(id: string): AudioBufferLike | undefined {
    return this.buffers.get(id);
  }

  set(id: string, buffer: AudioBufferLike): void {
    this.buffers.set(id, buffer);
  }

  delete(id: string): void {
    this.buffers.delete(id);
  }

  async load(
    id: string,
    loader: () => Promise<ArrayBuffer>
  ): Promise<AudioBufferLike> {
    if (this.buffers.has(id)) {
      return this.buffers.get(id)!;
    }

    if (this.inFlight.has(id)) {
      return this.inFlight.get(id)!;
    }

    const task = (async () => {
      const arrayBuffer = await loader();
      const buffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(id, buffer);
      this.inFlight.delete(id);
      return buffer;
    })();

    this.inFlight.set(id, task);
    return task;
  }
}

interface TrackSends {
  [sendId: string]: GainNodeLike;
}

class TrackGraph {
  readonly id: string;
  readonly type: TrackType;
  readonly gainNode: GainNodeLike;
  readonly panNode: StereoPannerNodeLike | null;
  readonly outputNode: AudioNodeLike;
  private readonly sends: TrackSends = {};
  private readonly cueSend: GainNodeLike;
  private readonly activeSources = new Set<AudioBufferSourceNodeLike>();
  private baseVolume: number;
  private muted = false;
  private solo = false;

  constructor(
    private readonly context: AudioContextLike,
    private readonly masterBus: GainNodeLike,
    private readonly cueBus: GainNodeLike,
    private readonly emitter: TypedEventEmitter<AudioEngineEvents>,
    private readonly effectsManager: EffectsManager,
    options: TrackConfig
  ) {
    this.id = options.id;
    this.type = options.type;
    this.baseVolume = options.volume ?? 1;
    this.gainNode = context.createGain();
    this.gainNode.gain.value = this.baseVolume;
    this.muted = options.muted ?? false;
    this.solo = options.solo ?? false;

    this.panNode = context.createStereoPanner ? context.createStereoPanner() : null;

    if (this.panNode) {
      this.panNode.pan.value = options.pan ?? 0;
      this.panNode.connect(this.gainNode);
      this.outputNode = this.gainNode;
    } else {
      this.outputNode = this.gainNode;
    }

    this.cueSend = context.createGain();
    this.cueSend.gain.value = options.cueLevel ?? 0;

    // Get or create track effects chain
    const trackEffects = this.effectsManager.getTrackChain(this.id) || 
                       this.effectsManager.createTrackChain(this.id);

    // Route through effects chain
    if (this.panNode) {
      this.panNode.pan.value = options.pan ?? 0;
      this.panNode.connect(this.gainNode);
      this.gainNode.connect(trackEffects.input);
      trackEffects.output.connect(this.masterBus);
      this.outputNode = this.gainNode;
    } else {
      this.gainNode.connect(trackEffects.input);
      trackEffects.output.connect(this.masterBus);
      this.outputNode = this.gainNode;
    }

    this.outputNode.connect(this.cueSend);
    this.cueSend.connect(this.cueBus);
    
    this.updateGain();
  }

  get volume(): number {
    return this.baseVolume;
  }

  set volume(value: number) {
    this.baseVolume = value;
    this.updateGain();
  }

  get pan(): number {
    if (!this.panNode) return 0;
    return this.panNode.pan.value;
  }

  set pan(value: number) {
    if (this.panNode) {
      this.panNode.pan.value = value;
    }
  }

  setCueLevel(level: number): void {
    this.cueSend.gain.value = level;
  }

  getCueLevel(): number {
    return this.cueSend.gain.value;
  }

  setSendLevel(sendId: string, sendGain: GainNodeLike, amount: number): void {
    if (!this.sends[sendId]) {
      const gain = this.context.createGain();
      gain.gain.value = amount;
      this.outputNode.connect(gain);
      gain.connect(sendGain);
      this.sends[sendId] = gain;
    } else {
      this.sends[sendId].gain.value = amount;
    }
  }

  stopAll(): void {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
      } catch (error) {
        this.emitter.emit('engine:error', error as Error);
      }
    });
    this.activeSources.clear();
  }

  scheduleClip(
    buffer: AudioBufferLike,
    contextTime: number,
    options: Omit<ClipSchedule, 'trackId' | 'buffer'>
  ): void {
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = Boolean(options.loop);
    source.loopStart = options.loop ? options.offset ?? 0 : 0;
    source.loopEnd = options.loop && options.duration ? (options.offset ?? 0) + options.duration : 0;
    source.onended = () => {
      this.activeSources.delete(source);
    };
    if (options.playbackRate !== undefined) {
      source.playbackRate.value = options.playbackRate;
    }
    const target = this.panNode ?? this.gainNode;
    source.connect(target);
    source.start(
      contextTime,
      options.offset ?? 0,
      options.duration
    );
    this.activeSources.add(source);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateGain();
  }

  setSolo(solo: boolean): void {
    this.solo = solo;
    this.updateGain();
  }

  isMuted(): boolean {
    return this.muted;
  }

  isSolo(): boolean {
    return this.solo;
  }

  private updateGain(): void {
    this.gainNode.gain.value = this.muted ? 0 : this.baseVolume;
  }
}

class WorkletClock {
  private readonly intervalSeconds: number;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly context: AudioContextLike, intervalSeconds = 0.025) {
    this.intervalSeconds = intervalSeconds;
  }

  async start(onTick: (time: number) => void): Promise<void> {
    if (this.timer) return;
    try {
      if (this.context.audioWorklet) {
        await this.context.audioWorklet.addModule(new URL('./worklet/clock.worklet.js', import.meta.url));
      }
    } catch (error) {
      // Ignore worklet registration errors and fall back to timer-based clock.
    }
    this.timer = setInterval(() => {
      onTick(this.context.currentTime);
    }, this.intervalSeconds * 1000);
  }

  stop(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}

interface MetronomeOptions {
  gain: GainNodeLike;
  scheduler: LookaheadScheduler;
  context: AudioContextLike;
  emitter: TypedEventEmitter<AudioEngineEvents>;
}

class Metronome {
  private enabled = false;
  private nextBeatTime = 0;
  private nextBeatNumber = 0;
  private clickBuffer: AudioBufferLike | null = null;

  constructor(private readonly options: MetronomeOptions) {}

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.nextBeatNumber = 0;
      this.nextBeatTime = 0;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  reset(startContextTime: number, startPositionSeconds: number, secondsPerBeat: number): void {
    if (!this.enabled) return;
    const beats = secondsToBeats(startPositionSeconds, (60 / secondsPerBeat));
    const beatFloor = Math.floor(beats);
    const fractional = beats - beatFloor;
    this.nextBeatNumber = fractional === 0 ? beatFloor : beatFloor + 1;
    const timeUntilNext = fractional === 0 ? 0 : secondsPerBeat * (1 - fractional);
    this.nextBeatTime = startContextTime + timeUntilNext;
  }

  scheduleBeats(windowStart: number, windowEnd: number, secondsPerBeat: number): void {
    if (!this.enabled || secondsPerBeat <= 0) return;
    if (!this.clickBuffer) {
      this.clickBuffer = this.createClickBuffer();
    }

    if (this.nextBeatTime === 0) {
      this.nextBeatTime = windowStart;
    }

    let beatTime = Math.max(this.nextBeatTime, windowStart);
    while (beatTime <= windowEnd + 1e-6) {
      const beatNumber = this.nextBeatNumber;
      const scheduledTime = beatTime;
      this.options.scheduler.schedule(scheduledTime, () => this.trigger(scheduledTime, beatNumber));
      this.nextBeatNumber += 1;
      beatTime += secondsPerBeat;
    }
    this.nextBeatTime = beatTime;
  }

  private trigger(time: number, beatNumber: number): void {
    if (!this.clickBuffer) return;
    const source = this.options.context.createBufferSource();
    source.buffer = this.clickBuffer;
    source.connect(this.options.gain);
    source.start(time);
    const beatsPerBar = DEFAULT_TIME_SIGNATURE.beatsPerBar;
    const bar = Math.floor(beatNumber / beatsPerBar) + 1;
    const beat = (beatNumber % beatsPerBar) + 1;
    this.options.emitter.emit('metronome:tick', {
      bar,
      beat,
      time,
    });
  }

  private createClickBuffer(): AudioBufferLike {
    const sampleRate = this.options.context.sampleRate;
    const durationSeconds = 0.02;
    const frameCount = Math.floor(sampleRate * durationSeconds);
    const buffer = this.options.context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
      const envelope = Math.exp(-i / (frameCount / 3));
      data[i] = envelope;
    }
    return buffer;
  }
}

interface TransportInternalState {
  isPlaying: boolean;
  position: number;
  tempo: number;
  isLooping: boolean;
  loopStart: number;
  loopEnd: number;
  startTime: number;
}

interface TransportOptions {
  context: AudioContextLike;
  emitter: TypedEventEmitter<AudioEngineEvents>;
  positionUpdateInterval?: number;
  timeSignature: TimeSignature;
  tempo: number;
}

class TransportController {
  private readonly context: AudioContextLike;
  private readonly emitter: TypedEventEmitter<AudioEngineEvents>;
  private readonly timeSignature: TimeSignature;
  private readonly positionUpdateInterval: number;
  private state: TransportInternalState;
  private positionInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: TransportOptions) {
    this.context = options.context;
    this.emitter = options.emitter;
    this.timeSignature = options.timeSignature;
    this.positionUpdateInterval = options.positionUpdateInterval ?? 0.05;
    this.state = {
      isPlaying: false,
      position: 0,
      tempo: options.tempo,
      isLooping: false,
      loopStart: 0,
      loopEnd: beatsToSeconds(4 * this.timeSignature.beatsPerBar, options.tempo),
      startTime: this.context.currentTime,
    };
  }

  async play(): Promise<void> {
    if (this.state.isPlaying) return;
    await this.context.resume();
    this.state.isPlaying = true;
    this.state.startTime = this.context.currentTime - this.state.position;
    this.startPositionTimer();
    this.emitState();
  }

  async pause(): Promise<void> {
    if (!this.state.isPlaying) return;
    await this.context.suspend();
    this.state.position = this.getPosition();
    this.state.isPlaying = false;
    this.stopPositionTimer();
    this.emitState();
  }

  stop(): void {
    this.state.position = 0;
    this.state.isPlaying = false;
    this.state.startTime = this.context.currentTime;
    this.stopPositionTimer();
    this.emitState();
  }

  setTempo(tempo: number): void {
    this.state.tempo = tempo;
    this.emitState();
  }

  getTempo(): number {
    return this.state.tempo;
  }

  setLoop(loop: boolean, start?: number, end?: number): void {
    this.state.isLooping = loop;
    if (start !== undefined) this.state.loopStart = start;
    if (end !== undefined) this.state.loopEnd = end;
    this.emitState();
  }

  seek(position: number): void {
    this.state.position = Math.max(0, position);
    this.state.startTime = this.context.currentTime - this.state.position;
    this.emitState();
  }

  getSecondsPerBeat(): number {
    return 60 / this.state.tempo;
  }

  getPosition(): number {
    if (!this.state.isPlaying) {
      return this.state.position;
    }
    const rawPosition = this.context.currentTime - this.state.startTime;
    const position = this.applyLoop(rawPosition);
    this.state.position = position;
    return position;
  }

  getStartContextTime(): number {
    return this.state.startTime;
  }

  getLoopRange(): { start: number; end: number; enabled: boolean } {
    return {
      start: this.state.loopStart,
      end: this.state.loopEnd,
      enabled: this.state.isLooping,
    };
  }

  snapshot(): TransportSnapshot {
    const position = this.getPosition();
    const beats = secondsToBeats(position, this.state.tempo);
    const bar = Math.floor(beats / this.timeSignature.beatsPerBar) + 1;
    const beat = Math.floor(beats % this.timeSignature.beatsPerBar) + 1;
    return {
      isPlaying: this.state.isPlaying,
      position,
      tempo: this.state.tempo,
      loop: this.state.isLooping,
      loopStart: this.state.loopStart,
      loopEnd: this.state.loopEnd,
      bar,
      beat,
    };
  }

  dispose(): void {
    this.stopPositionTimer();
  }

  private applyLoop(rawPosition: number): number {
    if (!this.state.isLooping) return rawPosition;
    if (this.state.loopEnd <= this.state.loopStart) return rawPosition;
    if (rawPosition < this.state.loopEnd) return rawPosition;
    const loopLength = this.state.loopEnd - this.state.loopStart;
    if (loopLength <= 0) return this.state.loopStart;
    const loopsCompleted = Math.floor((rawPosition - this.state.loopStart) / loopLength);
    if (loopsCompleted > 0) {
      this.state.startTime += loopLength * loopsCompleted;
    }
    const remainder = (rawPosition - this.state.loopStart) % loopLength;
    return this.state.loopStart + remainder;
  }

  private startPositionTimer(): void {
    if (this.positionInterval) return;
    this.positionInterval = setInterval(() => {
      const position = this.getPosition();
      const beats = secondsToBeats(position, this.state.tempo);
      const bar = Math.floor(beats / this.timeSignature.beatsPerBar) + 1;
      const beat = Math.floor(beats % this.timeSignature.beatsPerBar) + 1;
      this.emitter.emit('transport:position', {
        time: this.context.currentTime,
        position,
        bar,
        beat,
        tempo: this.state.tempo,
      });
    }, this.positionUpdateInterval * 1000);
  }

  private stopPositionTimer(): void {
    if (!this.positionInterval) return;
    clearInterval(this.positionInterval);
    this.positionInterval = null;
  }

  private emitState(): void {
    this.emitter.emit('transport:state', this.snapshot());
  }
}

export interface ClipSchedule {
  trackId: string;
  buffer: AudioBufferLike;
  startBeat: number;
  offset?: number;
  duration?: number;
  loop?: boolean;
  playbackRate?: number;
}

export interface TrackConfig {
  id: string;
  name?: string;
  type: TrackType;
  volume?: number;
  pan?: number;
  muted?: boolean;
  solo?: boolean;
  sends?: Record<string, number>;
  cueLevel?: number;
}

export interface AudioEngineConfig {
  context?: AudioContextLike;
  initialTempo?: number;
  lookaheadSeconds?: number;
  schedulerIntervalMs?: number;
  timeSignature?: TimeSignature;
  metronomeEnabled?: boolean;
  metronomeLevel?: number;
  positionUpdateInterval?: number;
}

export interface TrackSnapshot {
  id: string;
  type: TrackType;
  volume: number;
  pan: number;
  cueLevel: number;
  muted: boolean;
  solo: boolean;
}

export interface TransportSnapshot {
  isPlaying: boolean;
  position: number;
  tempo: number;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  bar: number;
  beat: number;
}

export interface TransportPositionPayload {
  time: number;
  position: number;
  bar: number;
  beat: number;
  tempo: number;
}

interface AudioEngineEvents {
  'transport:state': TransportSnapshot;
  'transport:position': TransportPositionPayload;
  'track:updated': TrackSnapshot;
  'metronome:tick': { bar: number; beat: number; time: number };
  'engine:error': Error;
}

export class AudioEngine {
  private readonly context: AudioContextLike;
  private readonly emitter = new TypedEventEmitter<AudioEngineEvents>();
  private readonly scheduler: LookaheadScheduler;
  private readonly transport: TransportController;
  private readonly masterGain: GainNodeLike;
  private readonly metronomeGain: GainNodeLike;
  private readonly cueGain: GainNodeLike;
  private readonly bufferCache: AudioBufferCache;
  private readonly tracks = new Map<string, TrackGraph>();
  private readonly sends = new Map<string, GainNodeLike>();
  private readonly metronome: Metronome;
  private readonly workletClock: WorkletClock;
  public readonly effectsManager: EffectsManager;
  private storeSubscription: Unsubscribe | null = null;
  private stateStore: AudioStateStore | null = null;
  private readonly timeSignature: TimeSignature;
  private readonly instruments = new Map<string, Instrument>();
  private readonly midiScheduler: MidiPlaybackScheduler;

  constructor(private readonly config: AudioEngineConfig = {}) {
    const globalScope = typeof window !== 'undefined' ? (window as Window & {
      webkitAudioContext?: typeof AudioContext;
    }) : undefined;
    const NativeAudioContext = globalScope?.AudioContext ?? globalScope?.webkitAudioContext;

    if (config.context) {
      this.context = config.context;
    } else {
      if (!NativeAudioContext) {
        throw new Error('AudioContext is not available in this environment');
      }
      this.context = new NativeAudioContext() as unknown as AudioContextLike;
    }

    this.timeSignature = config.timeSignature ?? DEFAULT_TIME_SIGNATURE;

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 1;
    // Note: masterGain will be connected to master effects chain input later

    this.cueGain = this.context.createGain();
    this.cueGain.gain.value = 0;
    this.cueGain.connect(this.context.destination);

    this.metronomeGain = this.context.createGain();
    this.metronomeGain.gain.value = config.metronomeLevel ?? 0.4;
    this.metronomeGain.connect(this.masterGain);

    this.bufferCache = new AudioBufferCache(this.context);

    this.effectsManager = new EffectsManager(this.context as AudioContext);
    
    // Route master gain to master effects chain, then to destination
    this.masterGain.connect(this.effectsManager.getMasterChain().input);
    this.effectsManager.getMasterChain().output.connect(this.context.destination);

    this.scheduler = new LookaheadScheduler(this.context, {
      lookaheadSeconds: config.lookaheadSeconds,
      intervalMs: config.schedulerIntervalMs,
      onProcessWindow: (from, to) => this.processWindow(from, to),
    });

    this.transport = new TransportController({
      context: this.context,
      emitter: this.emitter,
      tempo: config.initialTempo ?? 120,
      positionUpdateInterval: config.positionUpdateInterval,
      timeSignature: this.timeSignature,
    });

    this.metronome = new Metronome({
      gain: this.metronomeGain,
      scheduler: this.scheduler,
      context: this.context,
      emitter: this.emitter,
    });
    this.metronome.setEnabled(Boolean(config.metronomeEnabled));

    this.workletClock = new WorkletClock(this.context);
    
    // Initialize MIDI scheduler
    this.midiScheduler = new MidiPlaybackScheduler(this);
  }

  get audioContext(): AudioContextLike {
    return this.context;
  }

  get transportState(): TransportSnapshot {
    return this.transport.snapshot();
  }

  get buffers(): AudioBufferCache {
    return this.bufferCache;
  }

  on<TKey extends keyof AudioEngineEvents>(event: TKey, handler: EventHandler<AudioEngineEvents[TKey]>): Unsubscribe {
    return this.emitter.on(event, handler);
  }

  async play(): Promise<void> {
    await this.transport.play();
    this.scheduler.start();
    this.metronome.reset(
      this.transport.getStartContextTime(),
      this.transport.getPosition(),
      this.transport.getSecondsPerBeat()
    );
    await this.workletClock.start(() => {
      // Force scheduler tick to align with clock updates.
      this.scheduler.flush();
    });
  }

  async pause(): Promise<void> {
    await this.transport.pause();
    this.scheduler.stop();
    this.workletClock.stop();
  }

  stop(): void {
    this.transport.stop();
    this.scheduler.stop();
    this.workletClock.stop();
    this.tracks.forEach((track) => track.stopAll());
  }

  setTempo(tempo: number): void {
    this.transport.setTempo(tempo);
    this.metronome.reset(
      this.transport.getStartContextTime(),
      this.transport.getPosition(),
      this.transport.getSecondsPerBeat()
    );
    if (this.stateStore) {
      this.stateStore.updateTransport({ tempo });
    }
  }

  setLoop(loop: boolean, start?: number, end?: number): void {
    this.transport.setLoop(loop, start, end);
    if (this.stateStore) {
      this.stateStore.updateTransport({
        loop,
        loopStart: start ?? this.transport.snapshot().loopStart,
        loopEnd: end ?? this.transport.snapshot().loopEnd,
      });
    }
  }

  seek(position: number): void {
    this.transport.seek(position);
  }

  enableMetronome(enabled: boolean): void {
    this.metronome.setEnabled(enabled);
    if (this.stateStore) {
      this.stateStore.setState({
        ...this.stateStore.getState(),
        metronomeEnabled: enabled,
      });
    }
  }

  setMetronomeLevel(level: number): void {
    this.metronomeGain.gain.value = level;
  }

  // Effects management methods
  addEffectToTrack(trackId: string, effectType: string) {
    return this.effectsManager.addEffectToTrack(trackId, effectType as any);
  }

  addEffectToMaster(effectType: string) {
    return this.effectsManager.addEffectToMaster(effectType as any);
  }

  removeEffectFromTrack(trackId: string, effectId: string): void {
    this.effectsManager.removeEffectFromTrack(trackId, effectId);
  }

  removeEffectFromMaster(effectId: string): void {
    this.effectsManager.removeEffectFromMaster(effectId);
  }

  getTrackEffects(trackId: string) {
    return this.effectsManager.getTrackChain(trackId);
  }

  getMasterEffects() {
    return this.effectsManager.getMasterChain();
  }

  createTrack(config: TrackConfig): TrackGraph {
    if (this.tracks.has(config.id)) {
      return this.tracks.get(config.id)!;
    }
    const track = new TrackGraph(this.context, this.masterGain, this.cueGain, this.emitter, this.effectsManager, config);
    this.tracks.set(config.id, track);
    if (config.sends) {
      Object.entries(config.sends).forEach(([sendId, amount]) => {
        const send = this.getOrCreateSend(sendId);
        track.setSendLevel(sendId, send, amount);
      });
    }
    this.emitter.emit('track:updated', {
      id: config.id,
      type: config.type,
      volume: track.volume,
      pan: track.pan,
      cueLevel: track.getCueLevel(),
      muted: track.isMuted(),
      solo: track.isSolo(),
    });
    return track;
  }

  removeTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    track.stopAll();
    this.tracks.delete(trackId);
  }

  updateTrack(trackId: string, updates: Partial<TrackConfig>): void {
    const track = this.tracks.get(trackId);
    if (!track) return;
    if (updates.volume !== undefined) {
      track.volume = updates.volume;
    }
    if (updates.pan !== undefined) {
      track.pan = updates.pan;
    }
    if (updates.cueLevel !== undefined) {
      track.setCueLevel(updates.cueLevel);
    }
    if (updates.muted !== undefined) {
      track.setMuted(updates.muted);
    }
    if (updates.solo !== undefined) {
      track.setSolo(updates.solo);
    }
    if (updates.sends) {
      Object.entries(updates.sends).forEach(([sendId, amount]) => {
        if (sendId === 'cue') {
          track.setCueLevel(amount);
          return;
        }
        const send = this.getOrCreateSend(sendId);
        track.setSendLevel(sendId, send, amount);
      });
    }
    this.emitter.emit('track:updated', {
      id: trackId,
      type: track.type,
      volume: track.volume,
      pan: track.pan,
      cueLevel: track.getCueLevel(),
      muted: track.isMuted(),
      solo: track.isSolo(),
    });
  }

  scheduleClip(clip: ClipSchedule): void {
    const track = this.tracks.get(clip.trackId);
    if (!track) {
      throw new Error(`Track with id ${clip.trackId} not found`);
    }
    
    // Calculate when the clip should play relative to current position
    const currentPosition = this.transport.getPosition();
    const clipStartTime = beatsToSeconds(clip.startBeat, this.transport.getTempo());
    const timeUntilClipStart = clipStartTime - currentPosition;
    
    // Schedule at current time + time until clip (never in the past)
    const scheduledTime = Math.max(
      this.context.currentTime + 0.001, // Add small buffer to avoid timing issues
      this.context.currentTime + timeUntilClipStart
    );
    
    this.scheduler.schedule(scheduledTime, () => {
      track.scheduleClip(clip.buffer, scheduledTime, {
        startBeat: clip.startBeat,
        offset: clip.offset,
        duration: clip.duration,
        loop: clip.loop,
        playbackRate: clip.playbackRate,
      });
    }, clip);
  }

  attachStore(store: AudioStateStore): void {
    this.detachStore();
    this.stateStore = store;
    this.storeSubscription = store.subscribe((state) => {
      this.applyStoreState(state);
    });
  }

  detachStore(): void {
    if (this.storeSubscription) {
      this.storeSubscription();
      this.storeSubscription = null;
    }
    this.stateStore = null;
  }

  dispose(): void {
    this.scheduler.stop();
    this.transport.dispose();
    this.workletClock.stop();
    this.tracks.forEach((track) => track.stopAll());
    this.tracks.clear();
    
    // Clean up instruments
    this.instruments.forEach((instrument) => instrument.dispose());
    this.instruments.clear();
    
    this.detachStore();
    if (this.context.close) {
      void this.context.close();
    }
  }

  private applyStoreState(state: ReturnType<AudioStateStore['getState']>): void {
    const transport = state.transport;
    if (transport.tempo !== this.transport.getTempo()) {
      this.setTempo(transport.tempo);
    }
    this.transport.setLoop(transport.loop, transport.loopStart, transport.loopEnd);

    const remaining = new Set(this.tracks.keys());
    state.tracks.forEach((trackState: TrackState) => {
      remaining.delete(trackState.id);
      let track = this.tracks.get(trackState.id);
      if (!track) {
        track = this.createTrack({
          id: trackState.id,
          name: trackState.name,
          type: trackState.type,
          volume: trackState.gain,
          pan: trackState.pan,
          muted: trackState.muted,
          solo: trackState.solo,
          cueLevel: trackState.sends.get('cue') ?? 0,
        });
      } else {
        track.volume = trackState.gain;
        track.pan = trackState.pan;
        track.setMuted(trackState.muted);
        track.setSolo(trackState.solo);
        track.setCueLevel(trackState.sends.get('cue') ?? track.getCueLevel());
      }

      trackState.sends.forEach((amount, sendId) => {
        if (sendId === 'cue') {
          track!.setCueLevel(amount);
          return;
        }
        const sendGain = this.getOrCreateSend(sendId);
        track!.setSendLevel(sendId, sendGain, amount);
      });
    });

    remaining.forEach((id) => this.removeTrack(id));
  }

  private processWindow(windowStart: number, windowEnd: number): void {
    const secondsPerBeat = this.transport.getSecondsPerBeat();
    this.metronome.scheduleBeats(windowStart, windowEnd, secondsPerBeat);
  }

  private getOrCreateSend(sendId: string): GainNodeLike {
    if (this.sends.has(sendId)) {
      return this.sends.get(sendId)!;
    }
    const gain = this.context.createGain();
    gain.gain.value = 0;
    gain.connect(this.masterGain);
    this.sends.set(sendId, gain);
    return gain;
  }

  // Instrument management methods
  createInstrument(trackId: string, instrumentType: InstrumentType): void {
    // Import the instrument factory dynamically to avoid circular dependencies
    import('./instruments').then(({ InstrumentFactory }) => {
      const instrument = InstrumentFactory.create(instrumentType, this.context);
      instrument.connect(this.masterGain);
      this.instruments.set(trackId, instrument);
    }).catch(error => {
      console.error(`Failed to create instrument: ${error instanceof Error ? error.message : 'Unknown error'}`);
    });
  }

  getInstrument(trackId: string): Instrument | undefined {
    return this.instruments.get(trackId);
  }

  getAllInstruments(): Instrument[] {
    return Array.from(this.instruments.values());
  }

  removeInstrument(trackId: string): void {
    const instrument = this.instruments.get(trackId);
    if (instrument) {
      instrument.dispose();
      this.instruments.delete(trackId);
    }
  }

  // MIDI scheduling methods
  scheduleMidiClip(trackId: string, clipData: any, project: any, playbackStartTime: number): void {
    this.midiScheduler.scheduleClip(clipData, project, playbackStartTime, playbackStartTime);
  }

  processMidiSchedule(currentTime: number, trackId: string): void {
    this.midiScheduler.processSchedule(currentTime, trackId);
  }

  unscheduleMidiClip(clipId: string): void {
    this.midiScheduler.unscheduleClip(clipId);
  }

  clearAllMidiSchedule(): void {
    this.midiScheduler.clearAll();
  }

  previewMidiNote(trackId: string, pitch: number, velocity?: number): void {
    this.midiScheduler.previewNote(trackId, pitch, velocity);
  }

  getCurrentTime(): number {
    return this.context.currentTime;
  }
}
