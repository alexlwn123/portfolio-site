import { createStore } from './store'
import { clamp } from './vector'

/*
 * The lid's three sounds, made with the Web Audio API: there are no audio
 * files. All of them are short and quiet. Nothing here makes an audio context
 * until sound has been asked for and a user gesture has allowed it, and every
 * call is safe where there is no Web Audio at all.
 */

export interface Sound {
  /** Remembers whether sound is wanted, without touching the audio context. */
  readonly want: (on: boolean) => void
  /** Turns sound on or off. Call it from a user gesture: turning it on unlocks the audio. */
  readonly enable: (on: boolean) => void
  /** Makes or resumes the audio context, if sound is wanted. Call it from a user gesture. */
  readonly unlock: () => void
  readonly enabled: () => boolean
  /** A papery crackle. Its pitch follows the speed of the peel, from 0 to 1. */
  readonly crackle: (speed: number) => void
  /** A soft slap. Louder for a faster drop (0 to 1), panned from left (-1) to right (1). */
  readonly slap: (speed: number, pan: number) => void
  /** A quiet tick. */
  readonly tick: () => void
}

/** A gain is never ramped to nothing: an exponential ramp cannot reach zero. */
const SILENCE = 0.0001
const ATTACK_S = 0.003
const NOISE_S = 0.4

const TICK = { hertz: 2200, gain: 0.03, seconds: 0.03 } as const

const CRACKLE = {
  /** The band the grain is cut from, at a standstill and at full speed. */
  hertz: 1300,
  hertzSpan: 3400,
  q: 2.4,
  gain: 0.03,
  gainSpan: 0.035,
  seconds: 0.04,
  /** Grains closer together than this would blur into a buzz. */
  gapSeconds: 0.045,
} as const

const SLAP = {
  /** The paper: a burst of low noise. */
  noiseHertz: 650,
  noiseHertzSpan: 900,
  noiseGain: 0.03,
  noiseGainSpan: 0.1,
  noiseSeconds: 0.09,
  /** The lid underneath: a low note that drops. */
  thumpHertz: 150,
  thumpEndHertz: 62,
  thumpGain: 0.04,
  thumpGainSpan: 0.12,
  thumpSeconds: 0.11,
} as const

interface Voice {
  /** Where the sound goes: the speakers, or a panner on the way to them. */
  readonly into: AudioNode
  readonly gain: number
  readonly seconds: number
}

/** A gain that rises quickly to its peak and dies away, wired into the voice's output. */
function envelope(context: AudioContext, { into, gain, seconds }: Voice): GainNode {
  const now = context.currentTime
  const shaped = context.createGain()
  shaped.gain.setValueAtTime(SILENCE, now)
  shaped.gain.linearRampToValueAtTime(gain, now + ATTACK_S)
  shaped.gain.exponentialRampToValueAtTime(SILENCE, now + seconds)
  shaped.connect(into)
  return shaped
}

/** A note from an oscillator, sliding from one pitch to another. */
function note(
  context: AudioContext,
  voice: Voice,
  type: OscillatorType,
  hertz: readonly [number, number],
): void {
  const now = context.currentTime
  const oscillator = context.createOscillator()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(hertz[0], now)
  oscillator.frequency.exponentialRampToValueAtTime(hertz[1], now + voice.seconds)
  oscillator.connect(envelope(context, voice))
  oscillator.start(now)
  oscillator.stop(now + voice.seconds)
}

/** Half a second of white noise, to cut grains and bursts from. */
function makeNoise(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * NOISE_S),
    context.sampleRate,
  )
  buffer
    .getChannelData(0)
    .set(
      Float32Array.from({ length: buffer.getChannelData(0).length }, () => Math.random() * 2 - 1),
    )
  return buffer
}

interface Cut {
  readonly type: BiquadFilterType
  readonly hertz: number
  readonly q: number
}

/** A piece of the noise, through a filter. */
function burst(context: AudioContext, noise: AudioBuffer, voice: Voice, cut: Cut): void {
  const now = context.currentTime
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  source.buffer = noise
  filter.type = cut.type
  filter.frequency.setValueAtTime(cut.hertz, now)
  filter.Q.setValueAtTime(cut.q, now)
  source.connect(filter).connect(envelope(context, voice))
  source.start(now, Math.random() * (NOISE_S - voice.seconds))
  source.stop(now + voice.seconds)
}

/** The way to the speakers for a sound at a place from left (-1) to right (1). */
function panned(context: AudioContext, pan: number): AudioNode {
  // Older Safari has no stereo panner. There the slap plays in the middle.
  const { createStereoPanner } = context as Partial<Pick<AudioContext, 'createStereoPanner'>>
  if (createStereoPanner === undefined) {
    return context.destination
  }
  const panner = createStereoPanner.call(context)
  panner.pan.setValueAtTime(clamp(pan, -1, 1), context.currentTime)
  panner.connect(context.destination)
  return panner
}

function playTick(audio: AudioContext): void {
  const voice = { into: audio.destination, gain: TICK.gain, seconds: TICK.seconds }
  note(audio, voice, 'triangle', [TICK.hertz, TICK.hertz])
}

function playCrackle(audio: AudioContext, grains: AudioBuffer, speed: number): void {
  const fast = clamp(speed, 0, 1)
  burst(
    audio,
    grains,
    {
      into: audio.destination,
      gain: CRACKLE.gain + CRACKLE.gainSpan * fast,
      seconds: CRACKLE.seconds,
    },
    { type: 'bandpass', hertz: CRACKLE.hertz + CRACKLE.hertzSpan * fast, q: CRACKLE.q },
  )
}

function playSlap(audio: AudioContext, grains: AudioBuffer, speed: number, pan: number): void {
  const hard = clamp(speed, 0, 1)
  const into = panned(audio, pan)
  burst(
    audio,
    grains,
    { into, gain: SLAP.noiseGain + SLAP.noiseGainSpan * hard, seconds: SLAP.noiseSeconds },
    { type: 'lowpass', hertz: SLAP.noiseHertz + SLAP.noiseHertzSpan * hard, q: 1 },
  )
  note(
    audio,
    { into, gain: SLAP.thumpGain + SLAP.thumpGainSpan * hard, seconds: SLAP.thumpSeconds },
    'sine',
    [SLAP.thumpHertz, SLAP.thumpEndHertz],
  )
}

/** What the sound knows between one call and the next. */
interface Model {
  readonly wanted: boolean
  readonly context: AudioContext | null
  /** True once making a context has failed: it is not tried again. */
  readonly unavailable: boolean
  readonly noise: AudioBuffer | null
  /** When the last grain of crackle started, by the context's clock. */
  readonly crackledAt: number
}

const SILENT: Model = Object.freeze({
  wanted: false,
  context: null,
  unavailable: false,
  noise: null,
  crackledAt: -Infinity,
})

/** Makes or resumes the audio context. Where that fails, sound stays silent. */
function unlocked(model: Model, createContext: () => AudioContext | null): Model {
  if (!model.wanted || model.unavailable) {
    return model
  }
  try {
    const context = model.context ?? createContext()
    if (context?.state === 'suspended') {
      context.resume().catch(() => undefined)
    }
    return { ...model, context, unavailable: context === null }
  } catch {
    // No Web Audio, or the browser will not start it.
    return { ...model, unavailable: true }
  }
}

export function createSound(createContext: () => AudioContext | null): Sound {
  const model = createStore(SILENT)

  /** Runs a sound against the audio context, if there is one. Audio that fails is silence. */
  const play = (sound: (audio: AudioContext, grains: AudioBuffer) => void): void => {
    const { wanted, context, noise } = model.get()
    if (!wanted || context === null) {
      return
    }
    try {
      const grains = noise ?? makeNoise(context)
      model.set({ ...model.get(), noise: grains })
      sound(context, grains)
    } catch {
      // A browser that refuses a node or a ramp: the lid works the same without the sound.
    }
  }

  const unlock = (): void => {
    model.set(unlocked(model.get(), createContext))
  }

  return {
    want: (wanted) => {
      model.set({ ...model.get(), wanted })
    },
    enable: (wanted) => {
      model.set({ ...model.get(), wanted })
      unlock()
    },
    unlock,
    enabled: () => model.get().wanted,
    tick: () => {
      play(playTick)
    },
    crackle: (speed) => {
      play((audio, grains) => {
        if (audio.currentTime - model.get().crackledAt >= CRACKLE.gapSeconds) {
          model.set({ ...model.get(), crackledAt: audio.currentTime })
          playCrackle(audio, grains, speed)
        }
      })
    },
    slap: (speed, pan) => {
      play((audio, grains) => {
        playSlap(audio, grains, speed, pan)
      })
    },
  }
}
