import { describe, expect, it } from 'vitest'

import { FOIL_REST } from '../../stickers/geometry/foil'
import {
  clampToLid,
  DRIFT_CAUGHT_WITHIN,
  driftAt,
  LAMP_REST,
  lampUnder,
  lampValue,
  stepLamp,
} from './lightMath'

const FRAME_MS = 1000 / 60
const LID = { left: 100, top: 50, width: 1000, height: 1800 }

/** Steps the lamp until it says it has settled, and counts the frames it took. */
function settle(from: { x: number; y: number }, target: { x: number; y: number }) {
  let at = from
  for (let frames = 1; frames <= 600; frames += 1) {
    const next = stepLamp(at, target, FRAME_MS)
    if (next.settled) {
      return { at: next.at, frames }
    }
    at = next.at
  }
  throw new Error('The lamp never settled')
}

describe('the lamp', () => {
  it('rests where the foil rests', () => {
    expect(LAMP_REST).toEqual(FOIL_REST)
  })

  it('settles and stops', () => {
    const target = { x: 0.9, y: 0.1 }
    const { at, frames } = settle(LAMP_REST, target)

    expect(at).toEqual(target)
    expect(frames).toBeGreaterThan(5)
    expect(frames).toBeLessThan(120)
    expect(stepLamp(at, target, FRAME_MS)).toEqual({ at: target, settled: true })
  })

  it('is settled at once when it is already there', () => {
    expect(stepLamp(LAMP_REST, LAMP_REST, FRAME_MS)).toEqual({ at: LAMP_REST, settled: true })
  })

  it('eases: each frame covers part of what is left, and never overshoots', () => {
    const target = { x: 1, y: 1 }
    const one = stepLamp({ x: 0, y: 0 }, target, FRAME_MS)
    const two = stepLamp(one.at, target, FRAME_MS)

    expect(one.settled).toBe(false)
    expect(one.at.x).toBeGreaterThan(0)
    expect(one.at.x).toBeLessThan(0.5)
    expect(two.at.x - one.at.x).toBeLessThan(one.at.x)
    expect(two.at.x).toBeLessThan(1)
  })

  it('covers the same ground in one long frame as in several short ones', () => {
    const target = { x: 1, y: 0 }
    const long = stepLamp({ x: 0, y: 0 }, target, FRAME_MS * 4).at.x
    const short = [1, 2, 3, 4].reduce((at) => stepLamp(at, target, FRAME_MS).at, { x: 0, y: 0 }).x

    expect(long).toBeCloseTo(short, 6)
  })

  it('is put on a moving target once it is close enough to it', () => {
    const target = { x: 0.36, y: 0.3 }

    expect(stepLamp(LAMP_REST, target, FRAME_MS)).toMatchObject({ settled: false })
    expect(stepLamp(LAMP_REST, target, FRAME_MS, DRIFT_CAUGHT_WITHIN)).toEqual({
      at: target,
      settled: true,
    })
    expect(DRIFT_CAUGHT_WITHIN).toBeLessThan(0.02)
  })

  it('does not move when no time has passed', () => {
    expect(stepLamp(LAMP_REST, { x: 1, y: 1 }, 0)).toEqual({ at: LAMP_REST, settled: false })
  })

  it('clamps to the lid', () => {
    expect(clampToLid({ x: -0.4, y: 1.7 })).toEqual({ x: 0, y: 1 })
    expect(clampToLid({ x: 0.25, y: 0.75 })).toEqual({ x: 0.25, y: 0.75 })
    expect(lampUnder({ x: 100, y: 50 }, LID)).toEqual({ x: 0, y: 0 })
    expect(lampUnder({ x: 600, y: 950 }, LID)).toEqual({ x: 0.5, y: 0.5 })
    expect(lampUnder({ x: 5000, y: -300 }, LID)).toEqual({ x: 1, y: 0 })
  })

  it('stays at rest over a lid with no size', () => {
    expect(lampUnder({ x: 10, y: 10 }, { left: 0, top: 0, width: 0, height: 0 })).toEqual(LAMP_REST)
  })

  it('drifts very slowly, round its resting place and always on the lid', () => {
    const SECOND = 1000
    for (let time = 0; time < 300 * SECOND; time += 7 * SECOND) {
      const here = driftAt(time)
      const soon = driftAt(time + SECOND)

      expect(clampToLid(here)).toEqual(here)
      expect(Math.abs(here.x - LAMP_REST.x)).toBeLessThanOrEqual(0.2)
      expect(Math.abs(here.y - LAMP_REST.y)).toBeLessThanOrEqual(0.2)
      expect(Math.hypot(soon.x - here.x, soon.y - here.y)).toBeLessThan(0.03)
    }
    expect(driftAt(20_000)).not.toEqual(driftAt(0))
  })

  it('is written to three places, which is finer than a pixel of shadow', () => {
    expect(lampValue(0.35)).toBe('0.35')
    expect(lampValue(1 / 3)).toBe('0.333')
    expect(lampValue(0)).toBe('0')
  })
})
