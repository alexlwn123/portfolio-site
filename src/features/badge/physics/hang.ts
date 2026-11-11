import {
  add,
  cross,
  length,
  mix,
  type Point,
  scale,
  type Size,
  subtract,
} from '../../lid/enhance/vector'
import { fly, give, still } from './body'
import { GRAVITY, ROPE } from './tuning'

/*
 * The lanyard and the badge as the physics is handed them, and what it makes
 * of them. The page is measured once (see enhance/badgeMeasure.ts) into a
 * Rig. A Hang is the model built from it: a rigid badge that turns about the
 * clip, on two straps that are tied to fixed points above the lid.
 */

/** What the page draws when everything hangs still. All in one unit. */
export interface Rig {
  /** Where each strap is fixed, above the lid: the left one, then the right. */
  readonly anchors: readonly [Point, Point]
  /** Where each strap ends, at the clip. */
  readonly ends: readonly [Point, Point]
  /** The middle of the badge, and its size. */
  readonly centre: Point
  readonly size: Size
}

/** What holds the clip: a strap as a limit on how far the clip may be from where it is fixed. */
export interface Rope {
  readonly anchor: Point
  /** Its length with nothing hanging on it. */
  readonly rest: number
  /** How much further it can be pulled, and no more. */
  readonly give: number
}

/** A strap as it is drawn. */
export interface Lay {
  readonly anchor: Point
  /** Where it ends, measured from the clip. */
  readonly offset: Point
  /** Its length hanging still, which is as short as it is ever drawn taut. */
  readonly length: number
}

export interface Hang {
  /** Where the badge's centre of mass is when it hangs still. */
  readonly home: Point
  /** The clip, measured from the centre of mass, with the badge hanging still. */
  readonly arm: Point
  /** How easily the badge turns: one over its moment of inertia. */
  readonly turning: number
  readonly ropes: readonly [Rope, Rope]
  readonly lays: readonly [Lay, Lay]
}

const HALF = 0.5
/** A rectangle's moment of inertia about its middle is its mass times (w² + h²) / 12. */
const RECTANGLE = 12

/**
 * How hard each strap pulls when the badge hangs still: the two pulls that,
 * along the straps, add up to the push that undoes one step of falling.
 * Null when one strap would have to push, which a strap cannot.
 */
function pulls(along: readonly [Point, Point], back: Point): readonly [number, number] | null {
  const spread = cross(along[0], along[1])
  if (spread === 0) {
    return null
  }
  const [left, right] = [cross(back, along[1]) / spread, cross(along[0], back) / spread]
  return left > 0 && right > 0 ? [left, right] : null
}

/**
 * The length a strap has with nothing on it, worked back from the length it
 * hangs at: after one step of falling the strap must pull the badge back to
 * exactly where it was. That makes hanging still an exact resting place of
 * the simulation, so the badge the physics leaves is the badge the page drew.
 */
function ropeOf(anchor: Point, hung: number, fallen: number, pull: number, eased: number): Rope {
  const limit = hung * ROPE.stretch
  const back = pull * eased
  const kept = (ROPE.softness * back) / (eased + (ROPE.softness * back) / limit)
  return { anchor, rest: fallen - kept - back, give: limit }
}

/** Builds the model, or null when what was measured cannot hang as it is drawn. */
export function createHang({ anchors, ends, centre, size }: Rig): Hang | null {
  const pivot = mix(ends[0], ends[1], HALF)
  const home = { x: pivot.x, y: centre.y }
  const arm = subtract(pivot, home)
  const spread = size.width ** 2 + size.height ** 2
  if (arm.y >= 0 || spread <= 0) {
    return null
  }
  const turning = RECTANGLE / spread
  // One step of falling from rest: the straps must undo exactly this.
  const fallen = fly(still(home), { arm }, { x: 0, y: GRAVITY }, false)
  const spans = [
    subtract(anchors[0], add(fallen.at, arm)),
    subtract(anchors[1], add(fallen.at, arm)),
  ] as const
  const along = [
    scale(spans[0], 1 / length(spans[0])),
    scale(spans[1], 1 / length(spans[1])),
  ] as const
  const held = pulls(along, subtract(home, fallen.at))
  if (held === null) {
    return null
  }
  const rope = (index: 0 | 1): Rope =>
    ropeOf(
      anchors[index],
      length(subtract(anchors[index], pivot)),
      length(spans[index]),
      held[index],
      give(arm, along[index], turning),
    )
  const lay = (index: 0 | 1): Lay => ({
    anchor: anchors[index],
    offset: subtract(ends[index], pivot),
    length: length(subtract(ends[index], anchors[index])),
  })

  return { home, arm, turning, ropes: [rope(0), rope(1)], lays: [lay(0), lay(1)] }
}
