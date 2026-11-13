import { describe, expect, it } from 'vitest'

import { createLightLoop, DRIFT_INTERVAL_MS } from './lightLoop'
import { LAMP_REST, type Point } from './lightMath'
import { fakeFrames, fakeTimers } from '../../../test/fakeClock'
import { createTicker } from './ticker'

function setUp() {
  const frames = fakeFrames()
  const timers = fakeTimers()
  let written: readonly Point[] = []
  const loop = createLightLoop({
    ticker: createTicker(frames),
    timers,
    write: (lamp) => {
      written = [...written, lamp]
    },
  })
  return { frames, timers, loop, written: () => written }
}

describe('the light loop', () => {
  it('does nothing while the lid is off screen', () => {
    const { frames, timers, loop, written } = setUp()

    loop.follow({ x: 1, y: 1 })
    loop.drift()

    expect(frames.pending()).toBe(0)
    expect(timers.pending()).toBe(0)
    expect(written()).toEqual([])
    expect(loop.running()).toBe(false)
  })

  it('follows a target, writes the lamp as it goes, then settles and stops', () => {
    const { frames, timers, loop, written } = setUp()
    const target = { x: 0.8, y: 0.6 }

    loop.show(true)
    loop.follow(target)
    expect(loop.running()).toBe(true)
    const ran = frames.flush(600)

    expect(ran).toBeLessThan(120)
    expect(written().at(-1)).toEqual(target)
    expect(written().length).toBeGreaterThan(5)
    expect(loop.lamp()).toEqual(target)
    expect(frames.pending()).toBe(0)
    expect(timers.pending()).toBe(0)
    expect(loop.running()).toBe(false)
  })

  it('eases in real time: slow frames mean fewer of them, not a slower lamp', () => {
    const { frames, loop } = setUp()

    loop.show(true)
    loop.follow({ x: 0.9, y: 0.9 })
    let ran = 0
    while (frames.pending() > 0 && ran < 100) {
      frames.step(frames.now() + 250)
      ran += 1
    }

    // Two thirds of the way every 110ms: it is there in under a second and a half.
    expect(ran).toBeLessThanOrEqual(5)
    expect(loop.lamp()).toEqual({ x: 0.9, y: 0.9 })
  })

  it('does not count the time it spent settled as time to catch up on', () => {
    const { frames, loop, written } = setUp()

    loop.show(true)
    loop.follow({ x: 0.9, y: 0.9 })
    frames.flush(600)
    frames.step(frames.now() + 60_000)
    const before = written().length
    loop.follow({ x: 0.1, y: 0.1 })
    frames.flush(1)

    expect(written()).toHaveLength(before + 1)
    expect(written().at(-1)?.x).toBeGreaterThan(0.7)
  })

  it('asks for no more frames once it has settled, until the target moves', () => {
    const { frames, loop } = setUp()

    loop.show(true)
    loop.follow({ x: 0.8, y: 0.6 })
    frames.flush(600)
    const asked = frames.requested()
    loop.follow({ x: 0.8, y: 0.6 })

    expect(frames.requested()).toBe(asked)
    loop.follow({ x: 0.2, y: 0.6 })
    expect(frames.pending()).toBe(1)
  })

  it('writes only when the lamp has moved by something that shows', () => {
    const { frames, loop, written } = setUp()

    loop.show(true)
    loop.follow({ x: LAMP_REST.x + 0.0001, y: LAMP_REST.y })
    frames.flush(600)

    expect(written()).toEqual([])
  })

  it('stops when the lid leaves the screen and picks up when it comes back', () => {
    const { frames, loop, written } = setUp()

    loop.show(true)
    loop.follow({ x: 1, y: 1 })
    frames.flush(3)
    loop.show(false)
    const before = written().length
    frames.flush(50)

    expect(frames.pending()).toBe(0)
    expect(written()).toHaveLength(before)

    loop.show(true)
    frames.flush(600)
    expect(written().at(-1)).toEqual({ x: 1, y: 1 })
  })

  it('drifts on a slow timer when there is no pointer: a frame, then a rest', () => {
    const { frames, timers, loop, written } = setUp()

    loop.show(true)
    loop.drift()
    frames.flush(600)

    expect(frames.pending()).toBe(0)
    expect(timers.pending()).toBe(1)
    expect(timers.delays().at(-1)).toBe(DRIFT_INTERVAL_MS)

    const before = frames.requested()
    timers.fire()
    frames.step(frames.now() + DRIFT_INTERVAL_MS)

    expect(frames.requested()).toBe(before + 1)
    expect(frames.pending()).toBe(0)
    expect(timers.pending()).toBe(1)
    expect(written().length).toBeLessThan(600)
  })

  it('catches the drift up and rests, where easing after it would trail it for ever', () => {
    const { frames, timers, loop } = setUp()
    const FRAME_MS = 1000 / 60

    // A moment after the page opens the drift is at its fastest, and already ahead of the lamp.
    frames.step(1500)
    loop.show(true)
    loop.drift()
    let ran = 0
    while (frames.pending() > 0 && ran < 600) {
      frames.step(frames.now() + FRAME_MS)
      ran += 1
    }

    expect(ran).toBeLessThan(90)
    expect(timers.pending()).toBe(1)

    // From then on, each rest ends with one frame and the lamp is on the drift again.
    for (let rest = 0; rest < 20; rest += 1) {
      const asked = frames.requested()
      timers.fire()
      frames.step(frames.now() + DRIFT_INTERVAL_MS)
      expect(frames.requested()).toBe(asked + 1)
      expect(frames.pending()).toBe(0)
    }
  })

  it('moves a long way over many rests, and stays on the lid', () => {
    const { frames, timers, loop } = setUp()

    loop.show(true)
    loop.drift()
    frames.flush(600)
    const start = loop.lamp()
    for (let rest = 0; rest < 100; rest += 1) {
      timers.fire()
      frames.step(frames.now() + DRIFT_INTERVAL_MS)
    }
    const later = loop.lamp()

    expect(Math.hypot(later.x - start.x, later.y - start.y)).toBeGreaterThan(0.02)
    expect(later.x).toBeGreaterThanOrEqual(0)
    expect(later.x).toBeLessThanOrEqual(1)
  })

  it('wakes from a rest at once when a pointer arrives, and drops the timer', () => {
    const { frames, timers, loop } = setUp()

    loop.show(true)
    loop.drift()
    frames.flush(600)
    loop.follow({ x: 0.9, y: 0.9 })

    expect(timers.pending()).toBe(0)
    expect(frames.pending()).toBe(1)
    frames.flush(600)
    expect(loop.lamp()).toEqual({ x: 0.9, y: 0.9 })
    expect(timers.pending()).toBe(0)
  })

  it('drops its timer when the lid leaves the screen', () => {
    const { frames, timers, loop } = setUp()

    loop.show(true)
    loop.drift()
    frames.flush(600)
    loop.show(false)

    expect(timers.pending()).toBe(0)
    expect(frames.pending()).toBe(0)
  })
})
