/*
 * The rim of the round seal: two phrases set around a circle, with a drawn
 * star in each gap. The mockup typed the stars into one run of text; here
 * each phrase is given its own arc, measured from the mockup, so the stars
 * can be shapes and still land where the typed ones did.
 */

/** The text circle: radius 70 about the centre of the 200-unit drawing. */
export const RING_PATH = 'M30,100 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0'

export interface RingArc {
  /** Distance along the path, from nine o'clock going clockwise, where the phrase starts. */
  readonly start: number
  /** The length the phrase is set to. */
  readonly length: number
}

export const RING_ARCS: readonly [RingArc, RingArc] = Object.freeze([
  Object.freeze({ start: 0, length: 199.7 }),
  Object.freeze({ start: 228.3, length: 183.3 }),
])

/** Each star's angle in degrees, clockwise from twelve o'clock. */
export const RING_STAR_ANGLES: readonly number[] = Object.freeze([85.6, 259.2])

/** A star's centre before it is turned into place: on the rim, at twelve o'clock. */
export const RING_STAR_AT = Object.freeze({ x: 100, y: 24.6 })
export const RING_CENTRE = 100

export function ringStarTransform(angle: number): string {
  const centre = String(RING_CENTRE)
  return `rotate(${String(angle)} ${centre} ${centre}) translate(${String(RING_STAR_AT.x)} ${String(RING_STAR_AT.y)})`
}
