/**
 * Procedural horror ambience, built from Web Audio nodes so there is no track to ship.
 * A detuned low drone breathing through a slow filter, a thin wind, and a distant
 * bell every few seconds in A phrygian (the flat second does the unsettling).
 */

const BELLS = [440, 466.16, 523.25, 587.33, 659.25, 698.46, 880];
const LEVEL = 1.1;

export type Ambience = {
  play: () => void;
  pause: () => void;
  readonly playing: boolean;
  readonly running: boolean;
};

// One engine per page load, shared by every toggle. It lives on globalThis so a toggle
// remounting (page navigation, hot reload) finds the engine that is already sounding.
const shared = globalThis as { __scareAmbience?: Ambience };

export const currentAmbience = () => shared.__scareAmbience;
export const getAmbience = () => (shared.__scareAmbience ??= createAmbience());

// Browsers only let audio start inside a click, tap or key press, and disagree on which
// event of a gesture counts (Chrome: pointerdown, older Safari: click or touchend). So the
// engine is built inside the gesture, every stage tries, and the listeners stay until
// audio is actually running.
const GESTURES = ["pointerdown", "mousedown", "touchend", "pointerup", "click", "keydown"] as const;
let wanted = false;
let armed = false;
// Turned off by the visitor: holds across in-app navigation until a full reload.
let muted = false;

export const ambienceMuted = () => muted;

const onGesture = () => {
  if (!wanted) return disarm();
  const engine = getAmbience();
  if (engine.running) return disarm();
  engine.play();
};
const arm = () => {
  armed = true;
  GESTURES.forEach((ev) => window.addEventListener(ev, onGesture, true));
};
const disarm = () => {
  armed = false;
  GESTURES.forEach((ev) => window.removeEventListener(ev, onGesture, true));
};

/** Plays now if the page has already been interacted with, otherwise on the first gesture. */
export function playAmbienceWhenAllowed() {
  if (muted) return;
  wanted = true;
  if (navigator.userActivation?.hasBeenActive) getAmbience().play();
  if (armed || currentAmbience()?.running) return;
  arm();
}

export function playAmbience() {
  muted = false;
  wanted = true;
  getAmbience().play();
  if (!armed) arm();
}

/**
 * Quiet for pages that aren't the landing page (login, the platform). Unlike pauseAmbience
 * it doesn't count as the visitor turning sound off, so the landing page picks it back up.
 */
export function silenceAmbience() {
  wanted = false;
  disarm();
  currentAmbience()?.pause();
}

export function pauseAmbience() {
  muted = true;
  wanted = false;
  disarm();
  currentAmbience()?.pause();
}

function createAmbience(): Ambience {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  // A soft limiter so a bell landing on a drone swell never spikes.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.ratio.value = 8;
  master.connect(limiter).connect(ctx.destination);

  // Drone: saws a hair apart beat slowly against each other, fifths above for body.
  // Most of it sits above 200Hz so laptop speakers carry it; the sine sub is for headphones.
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 1100;
  droneFilter.Q.value = 1;
  droneFilter.connect(master);
  for (const [freq, type, level] of [
    [55, "sine", 0.03],
    [110, "sawtooth", 0.05],
    [110.6, "sawtooth", 0.05],
    [164.81, "triangle", 0.05],
    [220.4, "sawtooth", 0.035],
    [329.63, "triangle", 0.04],
  ] as const) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = level;
    osc.connect(gain).connect(droneFilter);
    osc.start();
  }
  lfo(ctx, 0.04, 450, droneFilter.frequency);

  // Wind: looped noise through a wandering band-pass.
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx, 4);
  noise.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 800;
  windFilter.Q.value = 0.9;
  const windGain = ctx.createGain();
  windGain.gain.value = 0.12;
  noise.connect(windFilter).connect(windGain).connect(master);
  noise.start();
  lfo(ctx, 0.07, 450, windFilter.frequency);
  lfo(ctx, 0.11, 0.07, windGain.gain);

  // Bells ring into a dark feedback delay so each one trails off like it's down a hall.
  const echo = ctx.createDelay(2);
  echo.delayTime.value = 0.42;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.38;
  const echoTone = ctx.createBiquadFilter();
  echoTone.type = "lowpass";
  echoTone.frequency.value = 1800;
  echo.connect(echoTone).connect(feedback).connect(echo);
  echoTone.connect(master);

  let timer: ReturnType<typeof setTimeout> | undefined;
  let sleep: ReturnType<typeof setTimeout> | undefined;
  let playing = false;

  const bell = () => {
    timer = setTimeout(bell, 5000 + Math.random() * 7000);
    // While the browser holds audio back, the clock is frozen; queued bells would all land at once.
    if (ctx.state !== "running") return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = BELLS[Math.floor(Math.random() * BELLS.length)]!;
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.2, t + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);
    osc.connect(env);
    env.connect(master);
    env.connect(echo);
    osc.start(t);
    osc.stop(t + 3.6);
  };

  return {
    get playing() {
      return playing;
    },
    get running() {
      return playing && ctx.state === "running";
    },
    play() {
      playing = true;
      clearTimeout(sleep);
      void ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(LEVEL, ctx.currentTime, 1.2);
      clearTimeout(timer);
      timer = setTimeout(bell, 2500);
    },
    pause() {
      playing = false;
      clearTimeout(timer);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      // Once the fade has landed, stop the clock entirely: off means silent, not just quiet.
      sleep = setTimeout(() => void ctx.suspend(), 1500);
    },
  };
}

function lfo(ctx: AudioContext, rate: number, depth: number, target: AudioParam) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = rate;
  gain.gain.value = depth;
  osc.connect(gain).connect(target);
  osc.start();
}

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}
