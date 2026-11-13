import { describe, expect, it } from 'vitest'

import { LAMP_REST } from './lightMath'
import { seen, tilt, TILT_RANGE_DEG, TILT_START } from './tilt'

describe('tilt', () => {
  it('uses the first reading as baseline', () => {
    const first = tilt(TILT_START, { beta: 42, gamma: -7 })

    expect(first.lamp).toEqual(LAMP_REST)
    expect(first.state.baseline).toEqual({ across: -7, down: 42 })
    expect(tilt(first.state, { beta: 42, gamma: -7 }).lamp).toEqual(LAMP_REST)
  })

  it('moves the lamp across with gamma and down with beta, from wherever the phone was held', () => {
    const { state } = tilt(TILT_START, { beta: 60, gamma: 10 })
    const right = tilt(state, { beta: 60, gamma: 10 + TILT_RANGE_DEG / 2 }).lamp
    const up = tilt(state, { beta: 60 - TILT_RANGE_DEG / 2, gamma: 10 }).lamp

    expect(right?.x).toBeGreaterThan(LAMP_REST.x)
    expect(right?.y).toBe(LAMP_REST.y)
    expect(up?.y).toBeLessThan(LAMP_REST.y)
    expect(up?.x).toBe(LAMP_REST.x)
  })

  it('clamps', () => {
    const { state } = tilt(TILT_START, { beta: 0, gamma: 0 })
    const far = tilt(state, { beta: 170, gamma: 85 }).lamp
    const edge = tilt(state, { beta: TILT_RANGE_DEG, gamma: TILT_RANGE_DEG }).lamp
    const back = tilt(state, { beta: -170, gamma: -85 }).lamp

    expect(far).toEqual(edge)
    expect(far?.x).toBeLessThanOrEqual(1)
    expect(far?.y).toBeLessThanOrEqual(1)
    expect(back?.x).toBeGreaterThanOrEqual(0)
    expect(back?.y).toBeGreaterThanOrEqual(0)
    expect(back?.x).toBeLessThan(LAMP_REST.x)
  })

  it('says how far the phone leans across from where it was held, in degrees, up to the range', () => {
    const { state } = tilt(TILT_START, { beta: 50, gamma: 10 })

    expect(tilt(TILT_START, { beta: 50, gamma: 10 }).lean).toBe(0)
    expect(tilt(state, { beta: 50, gamma: 22 }).lean).toBe(12)
    expect(tilt(state, { beta: 50, gamma: -80 }).lean).toBe(-TILT_RANGE_DEG)
    expect(tilt(state, { beta: null, gamma: 4 }).lean).toBe(0)
  })

  it('re-baselines on visibility', () => {
    const { state } = tilt(TILT_START, { beta: 10, gamma: 10 })

    expect(seen(state, 'hidden')).toBe(state)
    expect(seen(state, 'visible')).toEqual(TILT_START)

    const again = tilt(seen(state, 'visible'), { beta: 80, gamma: -40 })
    expect(again.lamp).toEqual(LAMP_REST)
    expect(again.state.baseline).toEqual({ across: -40, down: 80 })
  })

  it('ignores a reading from a device with no sensor', () => {
    expect(tilt(TILT_START, { beta: null, gamma: null })).toEqual({
      state: TILT_START,
      lamp: null,
      lean: 0,
    })
    expect(tilt(TILT_START, { beta: 3, gamma: null }).lamp).toBeNull()
  })

  it('steadies the lamp against a trembling hand', () => {
    const { state } = tilt(TILT_START, { beta: 0, gamma: 0 })

    expect(tilt(state, { beta: 0.04, gamma: -0.05 }).lamp).toEqual(LAMP_REST)
    expect(tilt(state, { beta: 10, gamma: 10 }).lamp).toEqual(
      tilt(state, { beta: 10.03, gamma: 9.98 }).lamp,
    )
  })

  it('reads the axes the way the screen is turned', () => {
    const lean = { beta: 0, gamma: 12 }
    const upright = tilt(tilt(TILT_START, { beta: 0, gamma: 0 }, 0).state, lean, 0).lamp
    const turned = tilt(tilt(TILT_START, { beta: 0, gamma: 0 }, 90).state, lean, 90).lamp
    const over = tilt(tilt(TILT_START, { beta: 0, gamma: 0 }, 180).state, lean, 180).lamp
    const other = tilt(tilt(TILT_START, { beta: 0, gamma: 0 }, 270).state, lean, 270).lamp

    expect(upright?.x).toBeGreaterThan(LAMP_REST.x)
    expect(turned?.x).toBe(LAMP_REST.x)
    expect(turned?.y).toBeLessThan(LAMP_REST.y)
    expect(over?.x).toBeLessThan(LAMP_REST.x)
    expect(other?.y).toBeGreaterThan(LAMP_REST.y)
  })

  it('never changes the state it is given', () => {
    const state = Object.freeze({ baseline: Object.freeze({ across: 1, down: 2 }) })

    expect(() => tilt(state, { beta: 30, gamma: 30 })).not.toThrow()
    expect(tilt(state, { beta: 30, gamma: 30 }).state).toBe(state)
  })
})
