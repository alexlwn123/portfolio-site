import { add, clamp, length, type Point, scale, subtract, ZERO } from '../../lid/enhance/vector'

/*
 * The little the badge does in depth. It turns a few degrees with its motion,
 * about its upright axis as it is carried sideways and about its top edge as
 * it rises and falls, and springs back flat. And it lifts off the lid while
 * it is in the hand or in flight, which the page shows in its shadow.
 */

export interface Depth {
  /** Degrees: x is the turn about the upright axis, y the turn about the top edge. */
  readonly turn: Point
  /** Degrees a second. */
  readonly rate: Point
  /** How far off the lid, from 0 (hanging against it) to 1 (in the hand). */
  readonly raise: number
}

export const FLAT: Depth = Object.freeze({ turn: ZERO, rate: ZERO, raise: 0 })

const SPRING_STEPS_PER_SECOND = 120

const TURN = {
  /** Degrees of turn for each unit a second the badge moves. */
  perSpeed: 0.0045,
  most: 8,
  stiffness: 170,
  damping: 15,
  /** The spring is stepped no more coarsely than this, in seconds. */
  step: 1 / SPRING_STEPS_PER_SECOND,
} as const

const RAISE = {
  /** How long it takes to cover most of the way up, and down, in seconds. */
  up: 0.09,
  down: 0.22,
  /** A badge flying at this speed is as far off the lid as flight takes it. */
  fullSpeed: 2400,
  inFlight: 0.6,
} as const

/** Flatter and steadier than this, the badge is flat. */
const SETTLED = { turn: 0.05, rate: 1, raise: 0.01 } as const

export function isFlat({ turn, rate, raise }: Depth): boolean {
  return length(turn) < SETTLED.turn && length(rate) < SETTLED.rate && raise < SETTLED.raise
}

function wanted({ x, y }: Point): Point {
  return {
    x: clamp(x * TURN.perSpeed, -TURN.most, TURN.most),
    y: clamp(y * TURN.perSpeed, -TURN.most, TURN.most),
  }
}

/** The spring that turns the badge towards an angle, taken in steps short enough to be steady. */
function spring(depth: Depth, towards: Point, seconds: number): Pick<Depth, 'turn' | 'rate'> {
  const short = Math.min(seconds, TURN.step)
  const pull = subtract(
    scale(subtract(towards, depth.turn), TURN.stiffness),
    scale(depth.rate, TURN.damping),
  )
  const rate = add(depth.rate, scale(pull, short))
  const sprung = { turn: add(depth.turn, scale(rate, short)), rate }
  return seconds > short ? spring({ ...depth, ...sprung }, towards, seconds - short) : sprung
}

/**
 * One frame. `velocity` is how the badge is moving, `held` whether it is in
 * the hand. A calm badge stays flat: it lifts, and does not turn.
 */
export function stepDepth(
  depth: Depth,
  velocity: Point,
  held: boolean,
  calm: boolean,
  seconds: number,
): Depth {
  if (seconds <= 0) {
    return depth
  }
  const flight = clamp(length(velocity) / RAISE.fullSpeed, 0, 1) * RAISE.inFlight
  const target = held ? 1 : calm ? 0 : flight
  const within = target > depth.raise ? RAISE.up : RAISE.down
  const raise = depth.raise + (target - depth.raise) * (1 - Math.exp(-seconds / within))
  const turned = calm ? { turn: ZERO, rate: ZERO } : spring(depth, wanted(velocity), seconds)
  const next = { ...turned, raise }
  return !held && isFlat(next) ? FLAT : next
}
