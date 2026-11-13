import type { Rig } from '../features/badge/physics/hang'
import type { Sim } from '../features/badge/physics/sim'
import { length, type Point, subtract } from '../features/lid/enhance/vector'

/*
 * The lanyard and badge of the lid as the physics is handed them, for its
 * tests: the straps of geometry/lanyard.ts and a badge the size the page
 * draws, in the lanyard's own units.
 */
export const RIG: Rig = Object.freeze({
  anchors: [
    { x: -96, y: -300 },
    { x: 356, y: -300 },
  ] as const,
  ends: [
    { x: 124, y: 268 },
    { x: 136, y: 268 },
  ] as const,
  centre: { x: 120, y: 531 },
  size: { width: 236, height: 470 },
})

/** A lanyard hung off-centre, as another arrangement of the lid might hang it. */
export const LOPSIDED: Rig = Object.freeze({
  ...RIG,
  anchors: [
    { x: -160, y: -340 },
    { x: 300, y: -220 },
  ] as const,
})

export const FRAME_S = 1 / 60

export function distance(one: Point, other: Point): number {
  return length(subtract(one, other))
}

/** Every number in a simulation's state, to check that none has run away. */
export function numbersOf({ body, straps, depth }: Sim): readonly number[] {
  const points = [
    body.at,
    body.velocity,
    depth.turn,
    depth.rate,
    ...straps.flatMap(({ nodes, speeds }) => [...nodes, ...speeds]),
  ]
  return [body.angle, body.spin, depth.raise, ...points.flatMap(({ x, y }) => [x, y])]
}
