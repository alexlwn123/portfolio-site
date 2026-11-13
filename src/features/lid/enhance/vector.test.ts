import { describe, expect, it } from 'vitest'

import { cross, dot, rotate, turn } from './vector'

describe('the arithmetic of points', () => {
  it('turns a point clockwise on a screen, where y runs down', () => {
    const turned = turn({ x: 1, y: 0 }, Math.PI / 2)

    expect(turned.x).toBeCloseTo(0, 12)
    expect(turned.y).toBeCloseTo(1, 12)
    expect(rotate({ x: 1, y: 0 }, 90).y).toBeCloseTo(1, 12)
  })

  it('measures how far one arrow lies along another, and how far it turns it', () => {
    expect(dot({ x: 3, y: 4 }, { x: 2, y: -1 })).toBe(2)
    expect(cross({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(1)
    expect(cross({ x: 0, y: 1 }, { x: 1, y: 0 })).toBe(-1)
  })
})
