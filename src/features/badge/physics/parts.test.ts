import { describe, expect, it } from 'vitest'

import { distance } from '../../../test/hangRig'
import { ZERO } from '../../lid/enhance/vector'
import { type Depth, FLAT, isFlat, stepDepth } from './depth'
import { hasteOf, lengthOf, lineOf, slung, stepStrap, type Strap, taut } from './strap'
import { GRAVITY } from './tuning'

const FROM = { x: 0, y: 0 }
const DOWN = { x: 0, y: GRAVITY }

describe('a strap between two ends', () => {
  it('hangs straight when it is pulled to its length, in ten even pieces', () => {
    const line = lineOf(taut(FROM, { x: 300, y: 400 }), FROM, { x: 300, y: 400 })

    expect(line).toHaveLength(11)
    expect(line[5]).toEqual({ x: 150, y: 200 })
    expect(lengthOf(line)).toBeCloseTo(500, 9)
  })

  it('starts as a V of its own length when its ends are closer than it is long', () => {
    const to = { x: 300, y: 0 }
    const line = lineOf(slung(FROM, to, 500), FROM, to)

    expect(lengthOf(line)).toBeCloseTo(500, 9)
    expect(line[5]?.x).toBeCloseTo(150, 9)
    expect(line[5]?.y).toBeCloseTo(200, 9)
  })

  it('always points its V down, whichever way its ends lie', () => {
    const leftwards = slung({ x: 300, y: 0 }, FROM, 500)
    const upright = slung(FROM, { x: 0, y: 300 }, 500)
    const together = slung(FROM, FROM, 500)

    expect(leftwards.nodes[4]?.y).toBeGreaterThan(100)
    expect(Math.abs(upright.nodes[4]?.x ?? 0)).toBeGreaterThan(100)
    expect(together.nodes[4]?.y).toBeCloseTo(250, 9)
  })

  it('is pulled straight when it is slung between ends as far apart as it is long', () => {
    const to = { x: 0, y: 500 }

    expect(slung(FROM, to, 500)).toEqual(taut(FROM, to))
    expect(slung(FROM, to, 300)).toEqual(taut(FROM, to))
  })

  it('settles into a bow under its own weight, and stays its own length', () => {
    const to = { x: 400, y: 0 }
    const hung = Array.from({ length: 2400 }).reduce<Strap>(
      (strap) => stepStrap(strap, FROM, to, 500, DOWN),
      slung(FROM, to, 500),
    )
    const line = lineOf(hung, FROM, to)
    const depths = line.map(({ y }) => y)

    expect(lengthOf(line)).toBeLessThanOrEqual(500 + 1e-9)
    expect(lengthOf(line)).toBeGreaterThan(490)
    expect(Math.max(...depths)).toBeCloseTo(depths[5] ?? 0, 0)
    expect(depths[2]).toBeLessThan(depths[4] ?? 0)
    expect(hasteOf(hung)).toBeLessThan(1)
  })

  it('follows its ends: carried along, its points move with them', () => {
    const carried = stepStrap(
      taut(FROM, { x: 0, y: 500 }),
      { x: 5, y: 0 },
      { x: 5, y: 500 },
      500,
      DOWN,
    )

    expect(carried.nodes[4]).toEqual({ x: 5, y: 250 })
    expect(hasteOf(carried)).toBeCloseTo(5 * 480, 6)
    expect(hasteOf(taut(FROM, FROM))).toBe(0)
  })

  it('is flattened to fit when a jolt leaves it longer than it is', () => {
    const jolted = {
      nodes: Array.from({ length: 9 }, (_, index) => ({ x: index % 2 === 0 ? 900 : -900, y: 0 })),
      speeds: Array.from({ length: 9 }, () => ZERO),
    }
    const to = { x: 0, y: 480 }

    expect(lengthOf(lineOf(stepStrap(jolted, FROM, to, 500, DOWN), FROM, to))).toBeLessThanOrEqual(
      500,
    )
  })

  it('is pulled straight when it is so tangled that flattening it cannot make it fit', () => {
    const tangled = {
      nodes: Array.from({ length: 9 }, (_, index) => ({ x: 0, y: index % 2 === 0 ? 3000 : -3000 })),
      speeds: Array.from({ length: 9 }, () => ZERO),
    }
    const to = { x: 0, y: 480 }
    const line = lineOf(stepStrap(tangled, FROM, to, 500, DOWN), FROM, to)

    expect(lengthOf(line)).toBeCloseTo(480, 9)
    expect(distance(line[5] ?? ZERO, { x: 0, y: 240 })).toBeLessThan(1e-9)
  })
})

describe('the badge in depth', () => {
  const frames = (from = FLAT, velocity = ZERO, held = false, calm = false, count = 30): Depth =>
    Array.from({ length: count }).reduce<Depth>(
      (depth) => stepDepth(depth, velocity, held, calm, 1 / 60),
      from,
    )

  it('turns with its motion: sideways about its upright axis, up and down about its top edge', () => {
    const sideways = frames(FLAT, { x: 900, y: 0 }, true)
    const falling = frames(FLAT, { x: 0, y: 900 }, true)

    expect(sideways.turn.x).toBeGreaterThan(2)
    expect(Math.abs(sideways.turn.y)).toBeLessThan(0.01)
    expect(falling.turn.y).toBeGreaterThan(2)
    expect(frames(FLAT, { x: -900, y: 0 }, true).turn.x).toBeLessThan(-2)
  })

  it('turns no more than a few degrees, however fast it goes', () => {
    const flung = frames(FLAT, { x: 50_000, y: -50_000 }, true, false, 120)

    expect(Math.abs(flung.turn.x)).toBeLessThanOrEqual(9)
    expect(Math.abs(flung.turn.y)).toBeLessThanOrEqual(9)
  })

  it('springs back flat once it is still and let go', () => {
    const turned = frames(FLAT, { x: 1500, y: 600 }, true)
    const back = frames(turned, ZERO, false, false, 120)

    expect(isFlat(turned)).toBe(false)
    expect(back).toBe(FLAT)
  })

  it('lifts off the lid in the hand, quickly, and less in flight', () => {
    expect(frames(FLAT, ZERO, true, false, 20).raise).toBeGreaterThan(0.9)
    expect(frames(FLAT, { x: 4000, y: 0 }, false, false, 20).raise).toBeCloseTo(0.6, 1)
    expect(frames(FLAT, { x: 4000, y: 0 }, false, false, 20).raise).toBeLessThanOrEqual(0.6)
  })

  it('does not turn when calm is asked for: it only lifts', () => {
    const calm = frames(FLAT, { x: 1500, y: 600 }, true, true)

    expect(calm.turn).toEqual(ZERO)
    expect(calm.raise).toBeGreaterThan(0.9)
    expect(frames(calm, { x: 1500, y: 0 }, false, true, 90)).toBe(FLAT)
  })

  it('takes a long frame in short steps, and no time at all in none', () => {
    const stalled = stepDepth(FLAT, { x: 1500, y: 0 }, true, false, 0.5)

    expect(Number.isFinite(stalled.turn.x)).toBe(true)
    expect(Math.abs(stalled.turn.x)).toBeLessThanOrEqual(9)
    expect(stepDepth(stalled, ZERO, true, false, 0)).toBe(stalled)
  })
})
