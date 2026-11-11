import { add, length, mix, type Point, scale, subtract, ZERO } from '../../lid/enhance/vector'

/*
 * A strap is simulated as a few straight pieces and drawn as a smooth band.
 * This rounds its corners, and finds places along the rounded line: the stars
 * between the strap's words ride it by their share of its length.
 */

/**
 * The curve through four points (Catmull and Rom's), from the second to the
 * third, is the Bézier curve whose handles lie a sixth of the way between the
 * points either side of each end.
 */
const HANDLE_DIVISOR = 6

/** The point a share of the way from the second of four points to the third, on the curve through all four. */
function through(
  [before, from, to, after]: readonly [Point, Point, Point, Point],
  share: number,
): Point {
  const out = add(from, scale(subtract(to, before), 1 / HANDLE_DIVISOR))
  const into = subtract(to, scale(subtract(after, from), 1 / HANDLE_DIVISOR))
  const [one, two, three] = [mix(from, out, share), mix(out, into, share), mix(into, to, share)]
  return mix(mix(one, two, share), mix(two, three, share), share)
}

/** Rounds the corners of a line: each piece becomes `per` shorter ones along a curve through its points. */
export function smooth(line: readonly Point[], per: number): readonly Point[] {
  const last = line.at(-1)
  if (line.length < 2 || !last) {
    return line
  }
  const pieces = line.slice(0, -1).flatMap((from, index) => {
    const to = line[index + 1] ?? from
    const four = [line[index - 1] ?? from, from, to, line[index + 2] ?? to] as const
    return Array.from({ length: per }, (_, step) => (step === 0 ? from : through(four, step / per)))
  })
  return [...pieces, last]
}

/** How far along a line each of its points is. */
export function reaches(line: readonly Point[]): readonly number[] {
  return line.reduce<readonly number[]>(
    (far, point, index) =>
      index === 0
        ? [0]
        : [...far, (far.at(-1) ?? 0) + length(subtract(point, line[index - 1] ?? point))],
    [],
  )
}

/** The point a share of the way along a line, given how far along each of its points is. */
export function pointAt(line: readonly Point[], far: readonly number[], share: number): Point {
  const wanted = Math.min(Math.max(share, 0), 1) * (far.at(-1) ?? 0)
  const next = far.findIndex((reached) => reached >= wanted)
  if (next <= 0) {
    return line[0] ?? ZERO
  }
  const [before, after] = [far[next - 1] ?? 0, far[next] ?? 0]
  const [from, to] = [line[next - 1] ?? ZERO, line[next] ?? ZERO]
  return after === before ? to : mix(from, to, (wanted - before) / (after - before))
}
