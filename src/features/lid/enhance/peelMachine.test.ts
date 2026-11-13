import { describe, expect, it } from 'vitest'

import { deepFreeze } from '../../../lib/deepFreeze'
import {
  close,
  grab,
  isMoving,
  key,
  letGo,
  PEEL_START,
  type PeelState,
  progressOf,
  pull,
  settle,
  step,
  toggle,
} from './peelMachine'

const FRAME_MS = 1000 / 60

/** Lets the springs run until nothing moves. */
function rest(start: PeelState): PeelState {
  let state = start
  for (let frame = 0; frame < 600 && isMoving(state); frame += 1) {
    state = step(state, FRAME_MS)
  }
  return state
}

/** Pulls a sticker's corner to a share of the way across, then lets it go. */
function pullAndLetGo(id: string, progress: number, from: PeelState = PEEL_START): PeelState {
  return letGo(pull(grab(from, id), id, progress), id)
}

describe('peeling a sticker', () => {
  it('starts with every sticker stuck down and nothing to do', () => {
    expect(PEEL_START.open).toBeNull()
    expect(isMoving(PEEL_START)).toBe(false)
    expect(progressOf(PEEL_START, 'pleb-fm')).toBe(0)
    expect(step(PEEL_START, FRAME_MS)).toBe(PEEL_START)
  })

  it('follows the corner while it is held, and no further than it goes', () => {
    const held = pull(grab(PEEL_START, 'pleb-fm'), 'pleb-fm', 0.3)

    expect(progressOf(held, 'pleb-fm')).toBe(0.3)
    expect(isMoving(held)).toBe(false)
    expect(step(held, FRAME_MS)).toBe(held)
    expect(progressOf(pull(held, 'pleb-fm', 7), 'pleb-fm')).toBe(1)
    expect(progressOf(pull(held, 'pleb-fm', -2), 'pleb-fm')).toBe(0)
    expect(pull(PEEL_START, 'pleb-fm', 0.5)).toBe(PEEL_START)
  })

  it('opens past halfway, springs back before', () => {
    const past = pullAndLetGo('pleb-fm', 0.51)
    const before = pullAndLetGo('pleb-fm', 0.49)

    expect(past.open).toBe('pleb-fm')
    expect(isMoving(past)).toBe(true)
    expect(progressOf(rest(past), 'pleb-fm')).toBe(1)
    expect(rest(past).open).toBe('pleb-fm')

    expect(before.open).toBeNull()
    expect(isMoving(before)).toBe(true)
    expect(progressOf(step(before, FRAME_MS), 'pleb-fm')).toBeLessThan(0.49)
    expect(rest(before)).toEqual(PEEL_START)
  })

  it('opens at exactly halfway', () => {
    expect(pullAndLetGo('pleb-fm', 0.5).open).toBe('pleb-fm')
  })

  it('comes to rest: the spring stops asking for frames', () => {
    const opened = rest(toggle(PEEL_START, 'pleb-fm'))

    expect(isMoving(opened)).toBe(false)
    expect(step(opened, FRAME_MS)).toBe(opened)
  })

  it('opens in the same time at ten frames a second as at sixty', () => {
    const framesToOpen = (frameMs: number): number => {
      let state = toggle(PEEL_START, 'pleb-fm')
      let frames = 0
      while (isMoving(state) && frames < 600) {
        state = step(state, frameMs)
        frames += 1
      }
      return frames
    }
    const [smoothMs, slowMs] = [framesToOpen(FRAME_MS) * FRAME_MS, framesToOpen(100) * 100]

    expect(smoothMs).toBeLessThan(900)
    expect(Math.abs(slowMs - smoothMs)).toBeLessThanOrEqual(120)
  })

  it('toggles: open, then stuck down again', () => {
    const opened = rest(toggle(PEEL_START, 'ncr-win'))
    const closed = toggle(opened, 'ncr-win')

    expect(opened.open).toBe('ncr-win')
    expect(closed.open).toBeNull()
    expect(rest(closed)).toEqual(PEEL_START)
  })

  it('only one open', () => {
    const first = rest(toggle(PEEL_START, 'pleb-fm'))
    const second = toggle(first, 'ncr-win')

    expect(second.open).toBe('ncr-win')
    expect(isMoving(second)).toBe(true)
    expect(progressOf(rest(second), 'pleb-fm')).toBe(0)
    expect(progressOf(rest(second), 'ncr-win')).toBe(1)
    expect(Object.keys(rest(second).peels)).toEqual(['ncr-win'])
  })

  it('closes the open one when another is pulled open, and not before', () => {
    const first = rest(toggle(PEEL_START, 'pleb-fm'))
    const pulling = pull(grab(first, 'ncr-win'), 'ncr-win', 0.8)

    expect(pulling.open).toBe('pleb-fm')
    expect(letGo(pulling, 'ncr-win').open).toBe('ncr-win')
    expect(progressOf(rest(letGo(pulling, 'ncr-win')), 'pleb-fm')).toBe(0)
  })

  it('leaves nothing behind when a sticker is closed before it has begun to open', () => {
    const opening = toggle(PEEL_START, 'pleb-fm')

    expect(close(opening)).toEqual(PEEL_START)
    expect(isMoving(close(opening))).toBe(false)
    expect(key(opening, 'Escape', null)).toEqual(PEEL_START)
    expect(toggle(opening, 'pleb-fm')).toEqual(PEEL_START)
    expect(letGo(grab(PEEL_START, 'pleb-fm'), 'pleb-fm')).toEqual(PEEL_START)
    expect(toggle(opening, 'ncr-win').peels).toEqual({
      'ncr-win': { progress: 0, speed: 0, held: false },
    })
  })

  it('escape closes', () => {
    const opened = rest(toggle(PEEL_START, 'pleb-fm'))
    const escaped = key(opened, 'Escape', null)

    expect(escaped.open).toBeNull()
    expect(rest(escaped)).toEqual(PEEL_START)
    expect(key(PEEL_START, 'Escape', null)).toBe(PEEL_START)
    expect(rest(close(opened))).toEqual(PEEL_START)
  })

  it('peels and re-sticks with the arrow keys, from the corner that has focus', () => {
    const up = key(PEEL_START, 'ArrowUp', 'pleb-fm')
    const left = key(PEEL_START, 'ArrowLeft', 'pleb-fm')

    expect(up.open).toBe('pleb-fm')
    expect(left.open).toBe('pleb-fm')
    expect(key(up, 'ArrowUp', 'pleb-fm')).toBe(up)
    expect(key(up, 'ArrowDown', 'pleb-fm').open).toBeNull()
    expect(key(up, 'ArrowRight', 'pleb-fm').open).toBeNull()
    expect(key(up, 'ArrowDown', 'ncr-win')).toBe(up)
    expect(key(PEEL_START, 'ArrowUp', null)).toBe(PEEL_START)
    expect(key(up, 'a', 'pleb-fm')).toBe(up)
  })

  it('toggles at once when nothing should move by itself', () => {
    const opened = settle(toggle(PEEL_START, 'pleb-fm'))
    const swapped = settle(toggle(opened, 'ncr-win'))

    expect(progressOf(opened, 'pleb-fm')).toBe(1)
    expect(isMoving(opened)).toBe(false)
    expect(swapped.peels).toEqual({ 'ncr-win': { progress: 1, speed: 0, held: false } })
    expect(settle(close(swapped))).toEqual(PEEL_START)
  })

  it('reports how fast a corner is moving, for the sound of it', () => {
    const moving = step(toggle(PEEL_START, 'pleb-fm'), FRAME_MS)

    expect(moving.peels['pleb-fm']?.speed).toBeGreaterThan(0)
    expect(rest(moving).peels['pleb-fm']?.speed).toBe(0)
  })

  it('takes a corner that is still springing back into the hand', () => {
    const closing = step(toggle(rest(toggle(PEEL_START, 'pleb-fm')), 'pleb-fm'), FRAME_MS)
    const caught = grab(closing, 'pleb-fm')

    expect(caught.peels['pleb-fm']?.held).toBe(true)
    expect(isMoving(caught)).toBe(false)
    expect(letGo(PEEL_START, 'pleb-fm')).toBe(PEEL_START)
  })

  it('never mutates state', () => {
    const held: PeelState = deepFreeze(pull(grab(PEEL_START, 'pleb-fm'), 'pleb-fm', 0.7))
    const released: PeelState = deepFreeze(letGo(held, 'pleb-fm'))

    expect(() => step(released, FRAME_MS)).not.toThrow()
    expect(() => toggle(released, 'ncr-win')).not.toThrow()
    expect(() => close(released)).not.toThrow()
    expect(() => settle(released)).not.toThrow()
    expect(progressOf(held, 'pleb-fm')).toBe(0.7)
    expect(Object.isFrozen(PEEL_START)).toBe(true)
  })
})
