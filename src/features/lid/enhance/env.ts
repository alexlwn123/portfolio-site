import { PHONE_MAX_WIDTH_PX } from '../placement/artboards'
import type { Frames, Timers } from './ticker'
import type { Reading } from './tilt'

/*
 * Everything the lid's script asks of the browser, in one place. Each thing
 * is looked for before it is used, and what is missing is null: the parts of
 * the script that need it then leave the lid as it was. Tests hand the script
 * an Env of their own.
 */

/** The phone's sense of which way up it is. */
export interface Orientation {
  /**
   * Asks for readings. Where the platform wants to be asked from a user
   * gesture (iOS), this is the asking. False means refused.
   */
  readonly ask: () => Promise<boolean>
  /** Starts readings. Returns the way to stop them. */
  readonly listen: (onReading: (reading: Reading) => void) => () => void
  /** How far the screen is turned from the way the phone is built, in degrees. */
  readonly screenAngle: () => number
}

/** Watches elements come on and go off screen. */
export interface ScreenWatch {
  readonly watch: (element: Element) => void
}

export type ScreenReport = (element: Element, onScreen: boolean) => void

export interface Env {
  /** True when the visitor has asked for less motion. Read once, when the page loads. */
  readonly reducedMotion: boolean
  /** True on a device whose main pointer is a finger. */
  readonly touch: boolean
  readonly frames: Frames
  readonly timers: Timers
  /** localStorage, or null where it is closed. Only reading and writing a key is asked of it. */
  readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null
  /** Makes an audio context, or null where there is no Web Audio. */
  readonly createAudio: () => AudioContext | null
  /** Null where there is no IntersectionObserver. */
  readonly onScreen: ((report: ScreenReport) => ScreenWatch) | null
  /** Null where the device reports no orientation. */
  readonly orientation: Orientation | null
  /** Calls back when the lid changes between its two arrangements. */
  readonly onRearrange: (callback: () => void) => void
}

/** How far outside the screen a sticker is still counted as on it. */
const SCREEN_MARGIN = '80px'

/** iOS asks before it gives readings, through a function no other platform has. */
interface OrientationPermission {
  readonly requestPermission?: () => Promise<string>
}

type Win = Window & typeof globalThis

function storageOf(win: Win): Storage | null {
  try {
    return win.localStorage
  } catch {
    // Reading the property itself throws when storage is blocked.
    return null
  }
}

function audioOf(win: Win): () => AudioContext | null {
  return () => ('AudioContext' in win ? new win.AudioContext() : null)
}

function screenWatchOf(win: Win): Env['onScreen'] {
  if (!('IntersectionObserver' in win)) {
    return null
  }
  return (report) => {
    const observer = new win.IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          report(entry.target, entry.isIntersecting)
        }
      },
      { rootMargin: SCREEN_MARGIN },
    )
    return {
      watch: (element) => {
        observer.observe(element)
      },
    }
  }
}

function orientationOf(win: Win): Orientation | null {
  if (typeof win.DeviceOrientationEvent !== 'function') {
    return null
  }
  const permission = win.DeviceOrientationEvent as OrientationPermission
  return {
    ask: async () =>
      permission.requestPermission === undefined ||
      (await permission.requestPermission()) === 'granted',
    listen: (onReading) => {
      const listener = ({ beta, gamma }: DeviceOrientationEvent): void => {
        onReading({ beta, gamma })
      }
      win.addEventListener('deviceorientation', listener, { passive: true })
      return () => {
        win.removeEventListener('deviceorientation', listener)
      }
    },
    screenAngle: () => ('orientation' in win.screen ? win.screen.orientation.angle : 0),
  }
}

/** What this browser can do. */
export function browserEnv(win: Win): Env {
  const matches = (query: string): boolean => win.matchMedia(query).matches

  return {
    reducedMotion: matches('(prefers-reduced-motion: reduce)'),
    touch: matches('(hover: none) and (pointer: coarse)'),
    frames: {
      request: (callback) => win.requestAnimationFrame(callback),
      cancel: (handle) => {
        win.cancelAnimationFrame(handle)
      },
    },
    timers: {
      set: (callback, delayMs) => win.setTimeout(callback, delayMs),
      clear: (handle) => {
        win.clearTimeout(handle)
      },
    },
    storage: storageOf(win),
    createAudio: audioOf(win),
    onScreen: screenWatchOf(win),
    orientation: orientationOf(win),
    onRearrange: (callback) => {
      win
        .matchMedia(`(max-width: ${String(PHONE_MAX_WIDTH_PX)}px)`)
        .addEventListener('change', callback)
    },
  }
}
