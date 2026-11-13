import {
  add,
  clamp,
  cross,
  length,
  mix,
  type Point,
  scale,
  subtract,
  ZERO,
} from '../../lid/enhance/vector'
import { AIR, STEP, STRAP } from './tuning'

/*
 * A strap as a chain of points between where it is fixed and the clip. The
 * chain carries no load: what holds the badge is the limit on the clip (see
 * tether in body.ts). The chain is what the strap looks like: straight when
 * it is taut, and bowing under its own weight when it is slack.
 */

export interface Strap {
  /** The points between the two ends, from the fixed end to the clip. */
  readonly nodes: readonly Point[]
  readonly speeds: readonly Point[]
}

const HALF = 0.5
const INNER = Array.from({ length: STRAP.links - 1 }, (_, index) => (index + 1) / STRAP.links)

/** The whole line of a strap: its fixed end, its points and its end at the clip. */
export function lineOf({ nodes }: Strap, from: Point, to: Point): readonly Point[] {
  return [from, ...nodes, to]
}

export function lengthOf(line: readonly Point[]): number {
  return line.reduce(
    (sum, point, index) =>
      sum + (index === 0 ? 0 : length(subtract(point, line[index - 1] ?? point))),
    0,
  )
}

function lying(nodes: readonly Point[]): Strap {
  return { nodes, speeds: nodes.map(() => ZERO) }
}

/** A strap pulled straight between its ends. */
export function taut(from: Point, to: Point): Strap {
  return lying(INNER.map((share) => mix(from, to, share)))
}

/**
 * A strap of a given length hung between two ends, at rest. Too long for the
 * gap, it starts as a V with its point below the middle, and sags from there.
 */
export function slung(from: Point, to: Point, long: number): Strap {
  const gap = length(subtract(to, from))
  if (gap >= long) {
    return taut(from, to)
  }
  const side = scale(subtract(to, from), gap === 0 ? 0 : 1 / gap)
  const down = side.x >= 0 ? { x: -side.y, y: side.x } : { x: side.y, y: -side.x }
  const sag = Math.sqrt((long * HALF) ** 2 - (gap * HALF) ** 2)
  const point = add(mix(from, to, HALF), scale(gap === 0 ? { x: 0, y: 1 } : down, sag))
  return lying(
    INNER.map((share) =>
      share < HALF ? mix(from, point, share / HALF) : mix(point, to, (share - HALF) / HALF),
    ),
  )
}

/** One pass of pulling every link to its length. Each point moves by the mean of what its two links ask. */
function relax(line: readonly Point[], link: number): readonly Point[] {
  const last = line.length - 1
  const pullTo = (point: Point, neighbour: Point, pinned: boolean): Point => {
    const span = subtract(point, neighbour)
    const far = length(span)
    const share = pinned ? 1 : HALF
    return far === 0 ? ZERO : scale(span, ((link - far) / far) * share)
  }
  return line.map((point, index) => {
    if (index === 0 || index === last) {
      return point
    }
    const [before, after] = [line[index - 1] ?? point, line[index + 1] ?? point]
    const moved = add(pullTo(point, before, index === 1), pullTo(point, after, index === last - 1))
    return add(point, scale(moved, HALF))
  })
}

/**
 * A strap is never drawn longer than it is. One that is, is flattened towards
 * the straight line between its ends until it fits: a taut strap is exactly
 * straight, and one going slack bows out smoothly from that. How flat is one
 * step of Newton's method on the square of the bow, which always lands on the
 * short side of the length and, for the little a step adds, all but on it.
 */
function fit(line: readonly Point[], long: number): readonly Point[] {
  const [from, to] = [line[0] ?? ZERO, line.at(-1) ?? ZERO]
  const gap = length(subtract(to, from))
  const drawn = lengthOf(line)
  if (drawn <= long || gap === 0) {
    return line
  }
  const side = scale(subtract(to, from), 1 / gap)
  const out = line.map((point) => cross(side, subtract(point, from)))
  const steepness = line.reduce((sum, point, index) => {
    const far = index === 0 ? 0 : length(subtract(point, line[index - 1] ?? point))
    return far === 0 ? sum : sum + ((out[index] ?? 0) - (out[index - 1] ?? 0)) ** 2 / (2 * far)
  }, 0)
  if (steepness === 0) {
    return line
  }
  const bow = Math.sqrt(clamp(1 - (drawn - long) / steepness, 0, 1))
  const across = { x: -side.y, y: side.x }
  return line.map((point, index) => add(point, scale(across, (out[index] ?? 0) * (bow - 1))))
}

/** The speeds a step has left a strap's points with. */
function moved(nodes: readonly Point[], before: Strap): Strap {
  return {
    nodes,
    speeds: nodes.map((node, index) =>
      scale(subtract(node, before.nodes[index] ?? node), 1 / STEP),
    ),
  }
}

/**
 * One step of a strap between its two ends. Pulled to its length or past it,
 * a strap is the straight line between them. Shorter than that it is slack:
 * it feels its weight, more of it the slacker it is, and bows.
 */
export function stepStrap(
  strap: Strap,
  from: Point,
  to: Point,
  long: number,
  gravity: Point,
): Strap {
  const gap = length(subtract(to, from))
  if (gap >= long) {
    return moved(taut(from, to).nodes, strap)
  }
  const weight = clamp((1 - gap / long) / STRAP.slackForWeight, 0, 1)
  const keep = Math.exp(-AIR.strap * STEP)
  const flown = strap.nodes.map((node, index) => {
    const speed = scale(add(strap.speeds[index] ?? ZERO, scale(gravity, weight * STEP)), keep)
    return add(node, scale(speed, STEP))
  })
  const linked = Array.from({ length: STRAP.passes }).reduce<readonly Point[]>(
    (line) => relax(line, long / STRAP.links),
    [from, ...flown, to],
  )
  const fitted = fit(linked, long)
  // Flung about faster than its links can follow, a strap can still come out too long: it is pulled straight.
  return moved(lengthOf(fitted) > long ? taut(from, to).nodes : fitted.slice(1, -1), strap)
}

/** The fastest any point of a strap is moving. */
export function hasteOf({ speeds }: Strap): number {
  return Math.max(0, ...speeds.map(length))
}
