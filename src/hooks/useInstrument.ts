import { useEffect, useRef, useState } from 'react';
import { InstrumentFactory } from '../audio/instruments/InstrumentFactory';
import type { Instrument, InstrumentType, InstrumentPreset } from '../audio/instruments/types';

interface UseInstrumentOptions {
  trackId: string;
  instrumentType: InstrumentType;
  audioContext?: AudioContext;
  destination?: AudioNode;
}

export function useInstrument({
  trackId,
  instrumentType,
  audioContext,
  destination,
}: UseInstrumentOptions) {
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioContext) {
      contextRef.current = new AudioContext();
    } else {
      contextRef.current = audioContext;
    }

    const newInstrument = InstrumentFactory.create(
      instrumentType,
      contextRef.current
    );

    if (destination) {
      newInstrument.connect(destination);
    } else if (contextRef.current.destination) {
      newInstrument.connect(contextRef.current.destination);
    }

    setInstrument(newInstrument);

    return () => {
      newInstrument.dispose();
      if (!audioContext && contextRef.current) {
        contextRef.current.close();
      }
    };
  }, [trackId, instrumentType, audioContext, destination]);

  const loadPreset = (preset: InstrumentPreset) => {
    if (instrument) {
      instrument.loadPreset(preset);
    }
  };

  const setParam = (param: string, value: number | string | boolean, time?: number) => {
    if (instrument) {
      instrument.setParam(param, value, time);
    }
  };

  const noteOn = (note: number, velocity: number, time?: number) => {
    if (instrument) {
      instrument.noteOn(note, velocity, time);
    }
  };

  const noteOff = (note: number, time?: number) => {
    if (instrument) {
      instrument.noteOff(note, time);
    }
  };

  return {
    instrument,
    loadPreset,
    setParam,
    noteOn,
    noteOff,
  };
}
