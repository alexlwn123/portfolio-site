import { add, length, type Point, subtract, turn } from '../../lid/enhance/vector'
import {
  type Body,
  brake,
  carried,
  fly,
  type Grab,
  hold,
  reach,
  snapOf,
  still,
  tether,
} from './body'
import { type Depth, FLAT, isFlat, stepDepth } from './depth'
import type { Hang } from './hang'
import { hasteOf, stepStrap, type Strap, taut } from './strap'
import { GRAVITY, MAX_STEPS, REST, STEP } from './tuning'

/*
 * The badge on its lanyard, moved through time. Nothing here touches the
 * page, and nothing here changes what it is given: advance() takes a state
 * and returns the next. enhance/badgeDom.ts feeds it frames and the hand,
 * and draws what it says.
 */

export interface Sim {
  readonly body: Body
  readonly straps: readonly [Strap, Strap]
  readonly depth: Depth
  /** Time handed over and not yet stepped through, in seconds. */
  readonly owed: number
  /** How long everything has been all but still, in seconds. */
  readonly quiet: number
  /** True when nothing will move until something moves it. An asleep badge asks for no frames. */
  readonly asleep: boolean
  /** How hard a strap snapped taut during the last frame, from 0 to 1. */
  readonly snap: number
}

/** What is done to the badge from outside. */
export interface Push {
  readonly grab: Grab | null
  /** How far gravity leans from straight down, clockwise: a tilted phone. */
  readonly lean: number
  /** True when nothing should swing: reduced motion. */
  readonly calm: boolean
}

export const AT_EASE: Push = Object.freeze({ grab: null, lean: 0, calm: false })

/** Where each strap ends: at the clip, turned with the badge. */
export function endsOf({ arm, lays }: Hang, body: Body): readonly [Point, Point] {
  const pivot = reach(body, arm)
  return [
    add(pivot, turn(lays[0].offset, body.angle)),
    add(pivot, turn(lays[1].offset, body.angle)),
  ]
}

/** The badge hanging still, exactly as the page draws it. */
export function resting(hang: Hang): Sim {
  const body = still(hang.home)
  const ends = endsOf(hang, body)
  return {
    body,
    straps: [taut(hang.lays[0].anchor, ends[0]), taut(hang.lays[1].anchor, ends[1])],
    depth: FLAT,
    owed: 0,
    quiet: 0,
    asleep: true,
    snap: 0,
  }
}

export function wake(sim: Sim): Sim {
  return sim.asleep ? { ...sim, asleep: false, quiet: 0, owed: 0 } : sim
}

function isStill({ body, straps }: Sim, { arm }: Hang): boolean {
  const moving = length(body.velocity) + Math.abs(body.spin) * length(arm)
  return moving < REST.speed && Math.max(...straps.map(hasteOf)) < REST.strapSpeed
}

/** One step: the badge falls, the hand and the straps hold it, and the straps follow. */
function step(hang: Hang, sim: Sim, { grab, lean, calm }: Push): Sim {
  const gravity = turn({ x: 0, y: GRAVITY }, -lean)
  const flown = fly(sim.body, hang, gravity, calm)
  const moved = carried(tether(grab ? hold(flown, hang, grab) : flown, hang), sim.body)
  const body = brake(moved, hang, grab)
  const ends = endsOf(hang, body)
  const strap = (index: 0 | 1): Strap =>
    stepStrap(
      sim.straps[index],
      hang.lays[index].anchor,
      ends[index],
      hang.lays[index].length,
      gravity,
    )
  const next = { ...sim, body, straps: [strap(0), strap(1)] as const }
  return {
    ...next,
    quiet: grab === null && isStill(next, hang) ? sim.quiet + STEP : 0,
    snap: Math.max(sim.snap, snapOf(sim.body, flown, moved, hang)),
  }
}

/** True when the badge is as good as where it hangs: close enough to be put exactly there. */
function isHome({ body }: Sim, { home }: Hang): boolean {
  return length(subtract(body.at, home)) < REST.within && Math.abs(body.angle) < REST.angle
}

/**
 * Moves the simulation on by a length of time, in fixed steps. Time that does
 * not fill a step is owed to the next call, and a long stall is cut short.
 * Once everything has been still for a moment the badge sleeps: exactly where
 * the page draws it when gravity is straight, and where it lies otherwise.
 */
export function advance(hang: Hang, sim: Sim, push: Push, seconds: number): Sim {
  if (sim.asleep) {
    return sim
  }
  const owed = Math.min(sim.owed + Math.max(seconds, 0), MAX_STEPS * STEP)
  const steps = Math.floor(owed / STEP)
  const stepped = Array.from({ length: steps }).reduce<Sim>((now) => step(hang, now, push), {
    ...sim,
    owed: owed - steps * STEP,
    snap: 0,
  })
  const held = push.grab !== null
  const depth = stepDepth(sim.depth, stepped.body.velocity, held, push.calm, steps * STEP)
  if (stepped.quiet < REST.after || !isFlat(depth)) {
    return { ...stepped, depth }
  }
  return push.lean === 0 && isHome(stepped, hang)
    ? resting(hang)
    : { ...stepped, depth: FLAT, asleep: true }
}
