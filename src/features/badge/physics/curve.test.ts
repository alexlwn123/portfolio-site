import { describe, expect, it } from 'vitest'

import { cross, subtract } from '../../lid/enhance/vector'
import { pointAt, reaches, smooth } from './curve'

const BENT = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 20, y: 10 },
]

describe('rounding the corners of a strap', () => {
  it('passes through every point it was given, with the same ends', () => {
    const curve = smooth(BENT, 4)

    expect(curve).toHaveLength(13)
    expect(curve[0]).toEqual(BENT[0])
    expect(curve[4]).toEqual(BENT[1])
    expect(curve[8]).toEqual(BENT[2])
    expect(curve.at(-1)).toEqual(BENT[3])
  })

  it('turns a corner in several small steps', () => {
    const curve = smooth(BENT, 4)
    const between = curve.slice(5, 8)

    // The curve swings a little wide of the corner on its way round, as a bent strap does.
    for (const point of between) {
      expect(point.y).toBeGreaterThan(0)
      expect(point.y).toBeLessThan(10)
      expect(Math.abs(point.x - 10)).toBeLessThan(1)
    }
  })

  it('leaves a straight line straight', () => {
    const line = [0, 3, 7, 12].map((along) => ({ x: along * 3, y: along * 4 }))

    for (const point of smooth(line, 3)) {
      expect(cross(subtract(point, { x: 0, y: 0 }), { x: 3, y: 4 })).toBeCloseTo(0, 9)
    }
  })

  it('gives back a line too short to bend as it was', () => {
    expect(smooth([{ x: 1, y: 2 }], 4)).toEqual([{ x: 1, y: 2 }])
    expect(smooth([], 4)).toEqual([])
  })
})

describe('finding a place along a line', () => {
  it('measures how far along the line each point is', () => {
    expect(reaches(BENT)).toEqual([0, 10, 20, 30])
    expect(reaches([])).toEqual([])
  })

  it('finds the point a share of the way along', () => {
    const far = reaches(BENT)

    expect(pointAt(BENT, far, 0)).toEqual({ x: 0, y: 0 })
    expect(pointAt(BENT, far, 0.5)).toEqual({ x: 10, y: 5 })
    expect(pointAt(BENT, far, 0.25)).toEqual({ x: 7.5, y: 0 })
    expect(pointAt(BENT, far, 1)).toEqual({ x: 20, y: 10 })
  })

  it('stops at the ends of the line', () => {
    const far = reaches(BENT)

    expect(pointAt(BENT, far, -1)).toEqual({ x: 0, y: 0 })
    expect(pointAt(BENT, far, 3)).toEqual({ x: 20, y: 10 })
    expect(pointAt([], [], 0.5)).toEqual({ x: 0, y: 0 })
  })
})
