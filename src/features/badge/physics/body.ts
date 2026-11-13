import {
  add,
  cross,
  dot,
  length,
  type Point,
  scale,
  subtract,
  turn,
  ZERO,
} from '../../lid/enhance/vector'
import type { Hang, Rope } from './hang'
import { AIR, HAND, ROPE, STEP } from './tuning'

/*
 * The badge as a rigid card, and the three things that move it: its own
 * weight, a hand, and the straps. Each takes a body and returns a new one.
 * The hand and the straps are limits on where a point of the card may be,
 * settled a step at a time by moving and turning the card as little as its
 * mass and its inertia allow.
 */

export interface Body {
  /** Its centre of mass. */
  readonly at: Point
  /** How far it has turned from the way it hangs, clockwise. */
  readonly angle: number
  readonly velocity: Point
  /** Radians a second. */
  readonly spin: number
}

/** The hand: a point of the badge, measured from its centre of mass as it hangs, and where it is wanted. */
export interface Grab {
  readonly at: Point
  readonly to: Point
  /** How fast the hand itself is moving. */
  readonly speed: Point
}

export function still(at: Point): Body {
  return { at, angle: 0, velocity: ZERO, spin: 0 }
}

/** Where a point of the badge is now. */
export function reach(body: Body, local: Point): Point {
  return add(body.at, turn(local, body.angle))
}

/** How fast a point of the badge is moving, given where it is from the centre of mass. */
export function speedAt(body: Body, lever: Point): Point {
  return add(body.velocity, scale({ x: -lever.y, y: lever.x }, body.spin))
}

/** How easily a push along a line moves a point of the badge: it shifts the card and turns it. */
export function give(lever: Point, along: Point, turning: number): number {
  return 1 + turning * cross(lever, along) ** 2
}

/** Moves the badge by a push at a point of it, along a line. */
function nudge(body: Body, lever: Point, along: Point, push: number, turning: number): Body {
  return {
    ...body,
    at: add(body.at, scale(along, push)),
    angle: body.angle + turning * cross(lever, along) * push,
  }
}

/** One step of falling. A slow badge and a calm one lose their movement faster. */
export function fly(body: Body, { arm }: Pick<Hang, 'arm'>, gravity: Point, calm: boolean): Body {
  const slow = length(body.velocity) + Math.abs(body.spin) * length(arm) < AIR.slowBelow
  const extra = calm ? AIR.calm : slow ? AIR.settling : 0
  const velocity = scale(
    add(body.velocity, scale(gravity, STEP)),
    Math.exp(-(AIR.drift + extra) * STEP),
  )
  const spin = body.spin * Math.exp(-(AIR.spin + extra) * STEP)
  return {
    at: add(body.at, scale(velocity, STEP)),
    angle: body.angle + spin * STEP,
    velocity,
    spin,
  }
}

/** The hand pulls its point of the badge towards where it is wanted, firmly and not rigidly. */
export function hold(body: Body, { turning }: Hang, grab: Grab): Body {
  const lever = turn(grab.at, body.angle)
  const gap = subtract(grab.to, add(body.at, lever))
  const far = length(gap)
  if (far === 0) {
    return body
  }
  const along = scale(gap, 1 / far)
  const eased = give(lever, along, turning)
  return nudge(body, lever, along, far / (eased + HAND.softness), turning)
}

/**
 * How much of a strap's stretch is left after a step. A strap gives easily at
 * first and stiffens towards its limit, which it never reaches: this is the
 * step of a spring whose stiffness grows without bound there, solved exactly
 * so that no pull, however hard, takes the strap past it.
 */
export function kept(stretch: number, eased: number, limit: number): number {
  const soft = ROPE.softness
  const sum = soft * (1 + stretch / limit) + eased
  return (2 * soft * stretch) / (sum + Math.sqrt(sum * sum - ((2 * soft) ** 2 * stretch) / limit))
}

/** How far a strap is pulled past its length, and the line along it to where it is fixed. */
function pullOf(pivot: Point, { anchor, rest }: Rope): { stretch: number; along: Point } {
  const span = subtract(anchor, pivot)
  const far = length(span)
  return { stretch: far - rest, along: far === 0 ? ZERO : scale(span, 1 / far) }
}

/** The straps pull the clip back towards where they are fixed, each as far as it is stretched. */
function drawIn(body: Body, { arm, ropes, turning }: Hang): Body {
  const lever = turn(arm, body.angle)
  const pivot = add(body.at, lever)
  return ropes.reduce((pulled, rope) => {
    const { stretch, along } = pullOf(pivot, rope)
    if (stretch <= 0) {
      return pulled
    }
    const eased = give(lever, along, turning)
    const push = (stretch - kept(stretch, eased, rope.give)) / eased
    return nudge(pulled, lever, along, push, turning)
  }, body)
}

/**
 * The hard stop. Both straps are drawn in from the same place, so that
 * hanging still is undone exactly, and a card that is turning can leave one
 * of them a hair past its limit. The whole badge is then moved straight back
 * along that strap: one strap after the other, which leaves both within.
 */
export function tether(body: Body, hang: Hang): Body {
  return hang.ropes.reduce(
    (stopped, rope) => {
      const { stretch, along } = pullOf(reach(stopped, hang.arm), rope)
      const over = stretch - rope.give + ROPE.shortOfLimit
      return over > 0 ? { ...stopped, at: add(stopped.at, scale(along, over)) } : stopped
    },
    drawIn(body, hang),
  )
}

/** The speeds a step has left the badge with: how far it moved and turned, over the step. */
export function carried(body: Body, before: Body): Body {
  return {
    ...body,
    velocity: scale(subtract(body.at, before.at), 1 / STEP),
    spin: (body.angle - before.angle) / STEP,
  }
}

/** Takes away a share of the speed of one point of the badge, along the line it is moving on. */
function slow(body: Body, lever: Point, speed: Point, share: number, turning: number): Body {
  const fast = length(speed)
  if (fast === 0) {
    return body
  }
  const along = scale(speed, 1 / fast)
  const push = (-share * fast) / give(lever, along, turning)
  return {
    ...body,
    velocity: add(body.velocity, scale(along, push)),
    spin: body.spin + turning * cross(lever, along) * push,
  }
}

/**
 * What takes the spring out of the badge. A taut strap is webbing, not
 * elastic: it takes away some of the clip's speed along it, and most of it
 * while it shortens. And the hand does
 * not let what it holds bounce about it.
 */
export function brake(body: Body, { arm, ropes, turning }: Hang, grab: Grab | null): Body {
  const lever = turn(arm, body.angle)
  const pivot = add(body.at, lever)
  const strapped = ropes.reduce((slowed, rope) => {
    const { stretch, along } = pullOf(pivot, rope)
    const inwards = dot(speedAt(slowed, lever), along)
    const share = inwards > 0 ? ROPE.recoil : ROPE.damping
    return stretch > 0 ? slow(slowed, lever, scale(along, inwards), share, turning) : slowed
  }, body)
  if (grab === null) {
    return strapped
  }
  const held = turn(grab.at, strapped.angle)
  return slow(strapped, held, subtract(speedAt(strapped, held), grab.speed), HAND.damping, turning)
}

/**
 * How hard the straps have just snapped taut, from 0 to 1: the fastest the
 * clip was running out along a strap that was slack before the step and is
 * stretched after it.
 */
export function snapOf(before: Body, flown: Body, after: Body, { arm, ropes }: Hang): number {
  const [was, now] = [reach(before, arm), reach(after, arm)]
  const leaving = speedAt(flown, turn(arm, flown.angle))
  return ropes.reduce((hardest, rope) => {
    const taut = pullOf(now, rope)
    const snapped = pullOf(was, rope).stretch <= 0 && taut.stretch > 0
    const speed = snapped ? -dot(leaving, taut.along) / ROPE.snapSpeed : 0
    return Math.min(Math.max(hardest, speed), 1)
  }, 0)
}
