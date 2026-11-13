import { FOIL_REST } from '../../stickers/geometry/foil'
import { add, clamp, length, type Point, type Rect, scale, subtract } from './vector'

export type { Point }

/*
 * The lamp: one light for the whole lid, as a point from 0 to 1 across and
 * down it. Everything here is arithmetic. lightLoop.ts decides when to run it
 * and lightDom.ts writes the result into the page.
 */

/** Where the lamp sits when nothing moves it: where the mockup started its foil. */
export const LAMP_REST: Point = FOIL_REST

export interface Lamp {
  readonly at: Point
  /** True once the lamp is where it was going. A settled lamp needs no more frames. */
  readonly settled: boolean
}

/** How long the lamp takes to cover about two thirds of what is left, in ms. */
const EASE_MS = 110
/** Closer than this to its target, the lamp is there: less than a pixel of shadow. */
const SETTLED_WITHIN = 0.0015

/**
 * A lamp easing after a target that keeps moving never reaches it: it trails
 * behind by a little, and would ask for a frame for ever. So a drifting lamp
 * that is this close to its drift is put on it. The step is too small to see:
 * under half a pixel of shadow.
 */
export const DRIFT_CAUGHT_WITHIN = 0.012

/** The idle lamp wanders this far either side of its resting place. */
const DRIFT_REACH = 0.15
/** How long one sweep across and one sweep down take. They never line up. */
const DRIFT_PERIODS_MS = { across: 47_000, down: 61_000 } as const

const LAMP_DECIMALS = 3

/** Keeps a lamp position on the lid. */
export function clampToLid({ x, y }: Point): Point {
  return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) }
}

/** Where on the lid a pointer is. The lamp rests while the lid has no size. */
export function lampUnder(pointer: Point, lid: Rect): Point {
  if (lid.width <= 0 || lid.height <= 0) {
    return LAMP_REST
  }
  return clampToLid({
    x: (pointer.x - lid.left) / lid.width,
    y: (pointer.y - lid.top) / lid.height,
  })
}

/**
 * One frame of the lamp easing towards its target. The same time covers the
 * same ground however it is cut into frames, and the lamp never overshoots.
 * Once it is within `within` of the target it is put on it, and has settled.
 */
export function stepLamp(at: Point, target: Point, dtMs: number, within = SETTLED_WITHIN): Lamp {
  const share = 1 - Math.exp(-Math.max(dtMs, 0) / EASE_MS)
  const next = add(at, scale(subtract(target, at), share))
  return length(subtract(target, next)) <= within
    ? { at: target, settled: true }
    : { at: next, settled: false }
}

/** Where the idle lamp is at a given time: a slow loop round its resting place. */
export function driftAt(timeMs: number): Point {
  const turn = (periodMs: number): number => Math.sin((2 * Math.PI * timeMs) / periodMs)
  return clampToLid({
    x: LAMP_REST.x + DRIFT_REACH * turn(DRIFT_PERIODS_MS.across),
    y: LAMP_REST.y + DRIFT_REACH * turn(DRIFT_PERIODS_MS.down),
  })
}

/** A lamp coordinate as it is written into the page. */
export function lampValue(value: number): string {
  return String(Number(value.toFixed(LAMP_DECIMALS)))
}
