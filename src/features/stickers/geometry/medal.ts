import type { RingArc } from './ring'

/*
 * The medal, in the units of its 200-unit drawing: a white die-cut edge, a
 * coloured face, lettering round the rim and a rank in the middle. It is the
 * round seal's smaller sibling, drawn to stay legible at half the seal's
 * width, so nothing on it is set smaller than `rimSize`.
 */
export const MEDAL = Object.freeze({
  centre: 100,
  /** Radius of the white edge, and of the coloured face inside it. */
  edge: 96,
  face: 89,
  /** Radius of the circle the rim lettering stands on. */
  rim: 71,
  rimSize: 18,
  /** Radius of the stitched ring that parts the rim from the middle. */
  stitch: 62,
  /** The gap left on the rim for each star. */
  starGap: 30,
  /** How far down from the top of the drawing a star sits before it is turned into place. */
  star: 22.5,
  /** The rank's baseline and size. */
  rank: Object.freeze({ y: 101, size: 48 }),
  /** The first line under the rank, and the distance from one line to the next. */
  lines: Object.freeze({ y: 123, pitch: 19, size: 18 }),
})

const FULL_TURN = 360
const HALF_TURN = 180
const CIRCUMFERENCE = 2 * Math.PI * MEDAL.rim
const DECIMALS = 1

function fixed(value: number): number {
  return Number(value.toFixed(DECIMALS))
}

function lap(): string {
  const diameter = String(MEDAL.rim * 2)
  const radius = String(MEDAL.rim)
  return `a${radius},${radius} 0 1,1 0,-${diameter} a${radius},${radius} 0 1,1 0,${diameter}`
}

/**
 * The rim: a circle from six o'clock, clockwise, drawn twice over. The second
 * phrase is centred on six o'clock, where the circle starts and ends, and
 * lettering cannot run past the end of its path. The second lap lets it.
 */
export const MEDAL_RIM_PATH = `M${String(MEDAL.centre)},${String(MEDAL.centre + MEDAL.rim)} ${lap()} ${lap()}`

export interface MedalRim {
  /** Where each phrase starts on the path, and the length it is set to. */
  readonly arcs: readonly [RingArc, RingArc]
  /** Each star's angle in degrees, clockwise from twelve o'clock. */
  readonly starAngles: readonly [number, number]
}

/** The angle, clockwise from twelve o'clock, of a point this far along the rim. */
function angleAt(distance: number): number {
  return fixed((HALF_TURN + (distance / CIRCUMFERENCE) * FULL_TURN) % FULL_TURN)
}

/**
 * Lays two phrases round the rim: the first centred on twelve o'clock, the
 * second on six, each given a share of the rim in proportion to its length,
 * with a star in the gap on either side.
 */
export function medalRim(top: string, bottom: string): MedalRim {
  const letters = top.length + bottom.length
  const room = CIRCUMFERENCE - 2 * MEDAL.starGap
  const topLength = letters === 0 ? 0 : (room * top.length) / letters
  const bottomLength = letters === 0 ? 0 : room - topLength
  const topStart = CIRCUMFERENCE / 2 - topLength / 2
  const bottomStart = CIRCUMFERENCE - bottomLength / 2

  return {
    arcs: [
      { start: fixed(topStart), length: fixed(topLength) },
      { start: fixed(bottomStart), length: fixed(bottomLength) },
    ],
    starAngles: [
      angleAt(topStart + topLength + MEDAL.starGap / 2),
      angleAt(topStart - MEDAL.starGap / 2),
    ],
  }
}

/** Turns a star, drawn at twelve o'clock on the rim, round to its angle. */
export function medalStarTransform(angle: number): string {
  const centre = String(MEDAL.centre)
  return `rotate(${String(angle)} ${centre} ${centre}) translate(${centre} ${String(MEDAL.star)})`
}
