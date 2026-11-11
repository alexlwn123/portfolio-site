import {
  DRIFT_CAUGHT_WITHIN,
  driftAt,
  LAMP_REST,
  lampValue,
  type Point,
  stepLamp,
} from './lightMath'
import { createStore, type Store } from './store'
import type { Task, Ticker, Timers } from './ticker'

/*
 * When the lamp moves. It follows a target (the pointer, or a tilted phone)
 * a frame at a time until it has settled, and then asks for no more frames.
 * With nothing to follow it drifts, so slowly that it needs a frame only a
 * few times a second: one frame, then a rest on a timer. Off screen it does
 * nothing at all. Under reduced motion this loop is never made.
 */

/** How long the drifting lamp rests between frames. */
export const DRIFT_INTERVAL_MS = 200

export interface LightLoopDeps {
  readonly ticker: Ticker
  readonly timers: Timers
  /** Puts the lamp into the page. Called only when it has moved by something that shows. */
  readonly write: (lamp: Point) => void
}

export interface LightLoop {
  /** Sends the lamp towards a point on the lid. */
  readonly follow: (target: Point) => void
  /** Lets the lamp wander: there is no pointer to follow. */
  readonly drift: () => void
  /** Says whether any of the lid is on screen. */
  readonly show: (visible: boolean) => void
  /** Where the lamp is now. */
  readonly lamp: () => Point
  /** True while the loop is asking for frames. */
  readonly running: () => boolean
}

interface Model {
  readonly lamp: Point
  readonly target: Point
  readonly drifting: boolean
  readonly visible: boolean
  readonly settled: boolean
  /** The timer a drifting lamp is resting on, if it is. */
  readonly nap: number | null
  /** The lamp as it was last put into the page. */
  readonly written: string
  /** When the lamp last moved, by the frame clock. Null when that says nothing. */
  readonly steppedAt: number | null
}

const AT_REST: Model = Object.freeze({
  lamp: LAMP_REST,
  target: LAMP_REST,
  drifting: false,
  visible: false,
  settled: true,
  nap: null,
  written: asWritten(LAMP_REST),
  steppedAt: null,
})

function asWritten({ x, y }: Point): string {
  return `${lampValue(x)} ${lampValue(y)}`
}

interface Context {
  readonly model: Store<Model>
  readonly ticker: Ticker
  readonly timers: Timers
  readonly task: Task
}

/**
 * One frame of the lamp. It covers the time since it last moved, by the clock
 * and not by the count of frames: a drifting lamp wakes from a rest with the
 * whole rest to cover, and slow frames mean fewer steps, not a slower lamp.
 */
function advance(model: Model, dtMs: number, nowMs: number): Model {
  const sinceMs = model.steppedAt === null ? dtMs : nowMs - model.steppedAt
  const { at, settled } = model.drifting
    ? stepLamp(model.lamp, driftAt(nowMs), sinceMs, DRIFT_CAUGHT_WITHIN)
    : stepLamp(model.lamp, model.target, sinceMs)
  return { ...model, lamp: at, settled, written: asWritten(at), steppedAt: nowMs }
}

/** Ends a rest, if the lamp is on one. */
function rouse({ model, timers }: Context): void {
  const { nap } = model.get()
  if (nap !== null) {
    timers.clear(nap)
    model.set({ ...model.get(), nap: null })
  }
}

/** Starts the frames, if there is a lid on screen to light. */
function wake(context: Context): void {
  const { model, ticker, task } = context
  rouse(context)
  if (model.get().visible) {
    model.set({ ...model.get(), settled: false })
    ticker.run(task)
  }
}

/** One frame: the lamp moves, is written if that shows, and rests if it has caught its drift. */
function frame(
  context: Context,
  write: LightLoopDeps['write'],
  dtMs: number,
  nowMs: number,
): boolean {
  const { model, timers } = context
  const before = model.get()
  const next = advance(before, dtMs, nowMs)
  const rests = next.settled && next.drifting
  const nap = rests
    ? timers.set(() => {
        wake(context)
      }, DRIFT_INTERVAL_MS)
    : null
  model.set({ ...next, nap })
  if (next.written !== before.written) {
    write(next.lamp)
  }
  return !next.settled
}

function follow(context: Context, target: Point): void {
  const { model } = context
  const { drifting, settled, target: was, steppedAt } = model.get()
  const moved = drifting || target.x !== was.x || target.y !== was.y
  // A lamp that was settled starts its clock again: the time it sat still is not time to cover.
  model.set({ ...model.get(), target, drifting: false, steppedAt: settled ? null : steppedAt })
  if (moved || !settled) {
    wake(context)
  }
}

function show(context: Context, visible: boolean): void {
  const { model, ticker, task } = context
  model.set({ ...model.get(), visible })
  if (visible) {
    wake(context)
    return
  }
  rouse(context)
  model.set({ ...model.get(), settled: true, steppedAt: null })
  ticker.drop(task)
}

export function createLightLoop({ ticker, timers, write }: LightLoopDeps): LightLoop {
  const model = createStore(AT_REST)
  const context: Context = {
    model,
    ticker,
    timers,
    task: { update: (dtMs, nowMs) => frame(context, write, dtMs, nowMs) },
  }

  return {
    follow: (target) => {
      follow(context, target)
    },
    drift: () => {
      model.set({ ...model.get(), drifting: true })
      wake(context)
    },
    show: (visible) => {
      show(context, visible)
    },
    lamp: () => model.get().lamp,
    running: () => !ticker.idle() && !model.get().settled,
  }
}
