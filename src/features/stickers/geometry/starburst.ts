/* The shape of a starburst seal, in the units of its 200-unit drawing. */

export interface StarburstShape {
  /** The centre, on both axes. */
  readonly centre: number
  readonly spikes: number
  /** Radius to the tips and to the notches between them. */
  readonly outer: number
  readonly inner: number
}

/** The wins seal of the approved mockup: eighteen spikes. */
export const WINS_SEAL: StarburstShape = Object.freeze({
  centre: 100,
  spikes: 18,
  outer: 92,
  inner: 78,
})

const QUARTER_TURN = Math.PI / 2

/** The polygon's points, clockwise from the top tip, to one decimal place. */
export function starburstPoints({ centre, spikes, outer, inner }: StarburstShape): string {
  return Array.from({ length: spikes * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner
    const angle = (index * Math.PI) / spikes - QUARTER_TURN
    const x = centre + radius * Math.cos(angle)
    const y = centre + radius * Math.sin(angle)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}
