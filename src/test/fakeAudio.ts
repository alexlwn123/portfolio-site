/*
 * A stand-in for the Web Audio API, for tests: it makes no sound and keeps a
 * record of what it was asked to play.
 */

export interface StartedSound {
  readonly kind: 'oscillator' | 'noise'
  /** The pitch an oscillator started at. A burst of noise has none. */
  readonly frequency: number | null
  /** From its start to its stop, in seconds. */
  readonly duration: number
}

export interface FakeAudio {
  /** The object to hand over wherever an AudioContext is wanted. */
  readonly context: AudioContext
  readonly started: () => readonly StartedSound[]
  /** The loudest value any gain was set or ramped to. */
  readonly peakGain: () => number
  /** Every value a stereo panner was set to, in order. */
  readonly pans: () => readonly number[]
  /** Every frequency a filter was set to, in order. */
  readonly filters: () => readonly number[]
  /** How many buffers of samples were made. */
  readonly buffers: () => number
  readonly resumed: () => number
  /** Moves the context's clock on. */
  readonly advance: (seconds: number) => void
  /** Makes every node the context is asked for from now on throw. */
  readonly breakNodes: () => void
}

interface Options {
  /** False for a browser without StereoPannerNode. */
  readonly panner?: boolean
}

/** An AudioParam that tells the recorder every value it is given. */
function param(record: (value: number) => void, initial = 0) {
  let current = initial
  const take = (value: number): void => {
    current = value
    record(value)
  }
  return {
    get value(): number {
      return current
    },
    set value(next: number) {
      take(next)
    },
    setValueAtTime: take,
    linearRampToValueAtTime: take,
    exponentialRampToValueAtTime: take,
  }
}

const ignore = (): void => undefined

/** A node that can be wired to another, and hands that one back as the real thing does. */
function node<Extra extends object>(extra: Extra) {
  return { connect: <Next>(next: Next): Next => next, disconnect: ignore, ...extra }
}

/** A source records itself once it has been both started and stopped. */
function source(
  kind: StartedSound['kind'],
  frequency: () => number | null,
  report: (sound: StartedSound) => void,
) {
  let from = 0
  return {
    start: (when = 0): void => {
      from = when
    },
    stop: (when = 0): void => {
      report({ kind, frequency: frequency(), duration: when - from })
    },
  }
}

interface Log {
  readonly started: readonly StartedSound[]
  readonly gains: readonly number[]
  readonly pans: readonly number[]
  readonly filters: readonly number[]
  readonly buffers: number
  readonly resumed: number
  readonly clock: number
  readonly state: string
  readonly broken: boolean
}

interface Book {
  readonly read: () => Log
  readonly write: (change: (log: Log) => Partial<Log>) => void
}

function book(state: string): Book {
  let log: Log = {
    started: [],
    gains: [],
    pans: [],
    filters: [],
    buffers: 0,
    resumed: 0,
    clock: 0,
    state,
    broken: false,
  }
  return {
    read: () => log,
    write: (change) => {
      log = { ...log, ...change(log) }
    },
  }
}

const SAMPLE_RATE = 48_000

type Series = 'gains' | 'pans' | 'filters'

/** An AudioParam whose every value is added to one of the book's lists. */
function recorded({ write }: Book, series: Series, initial = 0) {
  return param((value) => {
    write((log) => ({ [series]: [...log[series], value] }))
  }, initial)
}

/** An oscillator. It remembers the first pitch it is given. */
function oscillator(report: (sound: StartedSound) => void) {
  let first: number | null = null
  const frequency = param((value) => {
    first ??= value
  })
  return node({ type: 'sine', frequency, ...source('oscillator', () => first, report) })
}

/** The nodes a context makes. Each tells the book what it was asked to do. */
function nodes(kept: Book, panner: boolean) {
  const { read, write } = kept
  const make = <Made>(create: () => Made): Made => {
    if (read().broken) {
      throw new Error('The audio graph is broken')
    }
    return create()
  }
  const report = (sound: StartedSound): void => {
    write(({ started }) => ({ started: [...started, sound] }))
  }
  const filter = () =>
    node({ type: 'lowpass', frequency: recorded(kept, 'filters'), Q: param(ignore) })
  const buffer = (length: number) => {
    write(({ buffers }) => ({ buffers: buffers + 1 }))
    const samples = new Float32Array(length)
    return { duration: length / SAMPLE_RATE, getChannelData: () => samples }
  }

  return {
    createGain: () => make(() => node({ gain: recorded(kept, 'gains', 1) })),
    createBiquadFilter: () => make(filter),
    createOscillator: () => make(() => oscillator(report)),
    createBuffer: (_channels: number, length: number) => make(() => buffer(length)),
    createBufferSource: () =>
      make(() => node({ buffer: null, ...source('noise', () => null, report) })),
    ...(panner
      ? { createStereoPanner: () => make(() => node({ pan: recorded(kept, 'pans') })) }
      : {}),
  }
}

export function fakeAudio(
  initialState: 'running' | 'suspended' = 'running',
  { panner = true }: Options = {},
): FakeAudio {
  const kept = book(initialState)
  const { read, write } = kept
  const context = {
    sampleRate: SAMPLE_RATE,
    destination: node({}),
    get currentTime(): number {
      return read().clock
    },
    get state(): string {
      return read().state
    },
    resume: (): Promise<void> => {
      write(({ resumed }) => ({ resumed: resumed + 1, state: 'running' }))
      return Promise.resolve()
    },
    ...nodes(kept, panner),
  }

  return {
    context: context as unknown as AudioContext,
    started: () => read().started,
    peakGain: () => Math.max(0, ...read().gains),
    pans: () => read().pans,
    filters: () => read().filters,
    buffers: () => read().buffers,
    resumed: () => read().resumed,
    advance: (seconds) => {
      write(({ clock }) => ({ clock: clock + seconds }))
    },
    breakNodes: () => {
      write(() => ({ broken: true }))
    },
  }
}
