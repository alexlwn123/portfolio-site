import type { Frames, Timers } from '../features/lid/enhance/ticker'

/*
 * Stand-ins for the browser's clock, for tests: frames and timers that run
 * only when a test says so.
 */

type FrameCallback = (timeMs: number) => void

export interface FakeFrames extends Frames {
  /** Runs the frame that is waiting, at the given time. */
  readonly step: (timeMs: number) => void
  /** Runs up to this many frames, sixty to the second. Returns how many ran. */
  readonly flush: (limit: number) => number
  /** How many frames are waiting to run: none or one. */
  readonly pending: () => number
  /** How many frames have been asked for since the start. */
  readonly requested: () => number
  readonly now: () => number
}

const FRAME_MS = 1000 / 60

export function fakeFrames(): FakeFrames {
  let waiting: ReadonlyMap<number, FrameCallback> = new Map()
  let handles = 0
  let clock = 0

  const step = (timeMs: number): void => {
    const due = waiting
    waiting = new Map()
    clock = timeMs
    for (const callback of due.values()) {
      callback(timeMs)
    }
  }

  return {
    request: (callback) => {
      handles += 1
      waiting = new Map([...waiting, [handles, callback]])
      return handles
    },
    cancel: (handle) => {
      waiting = new Map([...waiting].filter(([key]) => key !== handle))
    },
    step,
    flush: (limit) => {
      let ran = 0
      while (ran < limit && waiting.size > 0) {
        step(clock + FRAME_MS)
        ran += 1
      }
      return ran
    },
    pending: () => waiting.size,
    requested: () => handles,
    now: () => clock,
  }
}

export interface FakeTimers extends Timers {
  /** Fires every timer that is waiting. Returns how many fired. */
  readonly fire: () => number
  readonly pending: () => number
  /** The delays asked for, in order. */
  readonly delays: () => readonly number[]
}

export function fakeTimers(): FakeTimers {
  let waiting: ReadonlyMap<number, () => void> = new Map()
  let asked: readonly number[] = []
  let handles = 0

  return {
    set: (callback, delayMs) => {
      handles += 1
      waiting = new Map([...waiting, [handles, callback]])
      asked = [...asked, delayMs]
      return handles
    },
    clear: (handle) => {
      waiting = new Map([...waiting].filter(([key]) => key !== handle))
    },
    fire: () => {
      const due = waiting
      waiting = new Map()
      for (const callback of due.values()) {
        callback()
      }
      return due.size
    },
    pending: () => waiting.size,
    delays: () => asked,
  }
}
