import { clampToLid, LAMP_REST, type Point } from './lightMath'
import { clamp } from './vector'

/*
 * A tilted phone moves the lamp. However the phone is being held when the
 * first reading arrives is "level": the lamp rests there, and moves as the
 * phone leans away from it.
 */

/** What a deviceorientation event reports. Both are null where there is no sensor. */
export interface Reading {
  /** Front to back, in degrees. */
  readonly beta: number | null
  /** Left to right, in degrees. */
  readonly gamma: number | null
}

/** A lean, in degrees, along the screen's own axes. */
interface Lean {
  readonly across: number
  readonly down: number
}

export interface TiltState {
  /** How the phone was being held at the first reading. Null until there is one. */
  readonly baseline: Lean | null
}

export interface Tilted {
  readonly state: TiltState
  /** Where the lamp should go, or null when the reading says nothing. */
  readonly lamp: Point | null
  /** How far the phone leans across from the baseline, in degrees, clockwise, up to the range. */
  readonly lean: number
}

export const TILT_START: TiltState = Object.freeze({ baseline: null })

/** Leaning this far from the baseline, or further, puts the lamp as far as it goes. */
export const TILT_RANGE_DEG = 28
/** How far the lamp goes at the full lean, as a share of the lid. */
const TILT_REACH = 0.5
/** The lamp moves in steps of a two-hundredth of the lid, so a trembling hand lets it settle. */
const STEPS = 200

const QUARTER_TURN = 90
const HALF_TURN = 180
const THREE_QUARTER_TURN = 270

/** Reads the phone's axes as the screen's, whichever way up the screen is. */
function along(beta: number, gamma: number, screenAngle: number): Lean {
  switch (screenAngle) {
    case QUARTER_TURN:
      return { across: beta, down: -gamma }
    case HALF_TURN:
      return { across: -gamma, down: -beta }
    case THREE_QUARTER_TURN:
    case -QUARTER_TURN:
      return { across: -beta, down: gamma }
    default:
      return { across: gamma, down: beta }
  }
}

function steady(value: number): number {
  return Math.round(value * STEPS) / STEPS
}

function reach(degrees: number): number {
  return clamp(degrees / TILT_RANGE_DEG, -1, 1) * TILT_REACH
}

/**
 * Takes a reading. The first becomes the baseline and leaves the lamp at
 * rest. Each one after moves the lamp by how far the phone has leaned from
 * the baseline, clamped to the range and kept on the lid.
 */
export function tilt(state: TiltState, { beta, gamma }: Reading, screenAngle = 0): Tilted {
  if (beta === null || gamma === null) {
    return { state, lamp: null, lean: 0 }
  }
  const lean = along(beta, gamma, screenAngle)
  if (state.baseline === null) {
    return { state: { baseline: lean }, lamp: LAMP_REST, lean: 0 }
  }
  const across = lean.across - state.baseline.across
  const lamp = clampToLid({
    x: LAMP_REST.x + reach(across),
    y: LAMP_REST.y + reach(lean.down - state.baseline.down),
  })
  return {
    state,
    lamp: { x: steady(lamp.x), y: steady(lamp.y) },
    lean: clamp(across, -TILT_RANGE_DEG, TILT_RANGE_DEG),
  }
}

/**
 * The tab has been hidden or shown. A phone is rarely held the same way when
 * its owner comes back to it, so the next reading is a new baseline.
 */
export function seen(state: TiltState, visibility: DocumentVisibilityState): TiltState {
  return visibility === 'visible' ? TILT_START : state
}
