class ClockProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frame = 0;
    this.tickInterval = 128;
  }

  process(inputs, outputs, parameters) {
    this.frame += 128;
    if (this.frame >= this.tickInterval) {
      this.port.postMessage({ time: currentTime });
      this.frame = 0;
    }
    return true;
  }
}

registerProcessor('clock-processor', ClockProcessor);
