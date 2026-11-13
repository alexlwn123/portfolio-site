import { add, mix, type Point, subtract, turn } from '../../lid/enhance/vector'
import { type Body, still } from './body'
import { FLAT } from './depth'
import type { Hang } from './hang'
import { endsOf, type Sim } from './sim'
import { slung } from './strap'

/*
 * How the badge arrives when the page loads. If nothing has been painted yet
 * it drops in from above the lid on its lanyard. If the page has already
 * shown it hanging, it cannot vanish and fall: it is given a toss from where
 * it is, comes down on its straps and settles. Either way it ends exactly
 * where the page draws it.
 */

const HALF = 0.5

const DROP = {
  /** It comes down a little askew, and turning, so that it swings as it lands. */
  angle: 0.16,
  spin: -1.4,
} as const

const TOSS = {
  /** Up, in units a second: enough to slacken the straps and no more. */
  speed: { x: 60, y: -1500 },
  spin: 1.1,
} as const

/** The badge somewhere other than at rest, awake, with its straps hung from wherever it is. */
function loose(hang: Hang, body: Body): Sim {
  const ends = endsOf(hang, body)
  return {
    body,
    straps: [
      slung(hang.lays[0].anchor, ends[0], hang.lays[0].length),
      slung(hang.lays[1].anchor, ends[1], hang.lays[1].length),
    ],
    depth: FLAT,
    owed: 0,
    quiet: 0,
    asleep: false,
    snap: 0,
  }
}

/** The badge a height above where it hangs, about to fall. */
export function dropped(hang: Hang, height: number): Sim {
  const at = subtract(hang.home, { x: 0, y: height })
  return loose(hang, { ...still(at), angle: DROP.angle, spin: DROP.spin })
}

/**
 * The badge where the stylesheet's sway has it, on its way up. The sway turns
 * the whole hang about the point midway between where the straps are fixed.
 */
export function tossed(hang: Hang, sway: number): Sim {
  const top: Point = mix(hang.lays[0].anchor, hang.lays[1].anchor, HALF)
  const at = add(top, turn(subtract(hang.home, top), sway))
  return loose(hang, { at, angle: sway, velocity: TOSS.speed, spin: TOSS.spin })
}
