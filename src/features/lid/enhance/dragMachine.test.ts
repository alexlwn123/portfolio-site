import { describe, expect, it } from 'vitest'

import { deepFreeze } from '../../../lib/deepFreeze'
import {
  type Body,
  CLICK_SLOP_PX,
  type DragState,
  IDLE,
  isLoose,
  move,
  offsetOf,
  press,
  release,
  restingBody,
  step,
} from './dragMachine'

const LID = { width: 1000, height: 1800 }
const FRAME_MS = 1000 / 60
const MOUSE = { pointerType: 'mouse', button: 0 }

/** A sticker 200 by 100 in the middle of the lid. */
function body(overrides: Partial<Body> = {}): Body {
  return { ...restingBody({ x: 500, y: 900 }, { x: 100, y: 50 }), ...overrides }
}

function pressAt(x: number, y: number, on: Body = body()): DragState {
  return press(IDLE, { ...MOUSE, at: { x, y } }, on)
}

/** Picks the sticker up by its middle and carries it to a point, a frame at a time. */
function carryTo(x: number, y: number, frames = 30, from: DragState = pressAt(500, 900)) {
  let state = move(from, { x: 500 + CLICK_SLOP_PX, y: 900 })
  for (let frame = 1; frame <= frames; frame += 1) {
    const share = frame / frames
    state = move(state, { x: 500 + (x - 500) * share, y: 900 + (y - 900) * share })
    state = step(state, FRAME_MS, LID)
  }
  return state
}

function bodyOf(state: DragState): Body {
  if (state.phase === 'idle') {
    throw new Error('Expected a sticker in play')
  }
  return state.body
}

/** Steps a thrown sticker until it sticks, and reports the path it took. */
function untilStuck(start: DragState) {
  let state = start
  let path: readonly Body[] = []
  for (let frame = 0; frame < 600 && state.phase === 'thrown'; frame += 1) {
    state = step(state, FRAME_MS, LID)
    path = [...path, bodyOf(state)]
  }
  return { state, path }
}

describe('picking a sticker up', () => {
  it('ignores touch', () => {
    const touched = press(IDLE, { pointerType: 'touch', button: 0, at: { x: 500, y: 900 } }, body())

    expect(touched).toBe(IDLE)
    expect(isLoose(touched)).toBe(false)
  })

  it('ignores every button but the first', () => {
    expect(press(IDLE, { pointerType: 'mouse', button: 2, at: { x: 500, y: 900 } }, body())).toBe(
      IDLE,
    )
  })

  it('takes a pen as it takes a mouse', () => {
    const penned = press(IDLE, { pointerType: 'pen', button: 0, at: { x: 500, y: 900 } }, body())

    expect(penned.phase).toBe('pressed')
  })

  it('under 5px is a click', () => {
    const pressed = pressAt(480, 890)
    const nudged = move(pressed, { x: 483, y: 893 })

    expect(CLICK_SLOP_PX).toBe(5)
    expect(nudged).toBe(pressed)
    expect(nudged.phase).toBe('pressed')
    expect(isLoose(nudged)).toBe(false)
    expect(step(nudged, FRAME_MS, LID)).toBe(nudged)
    expect(release(nudged)).toBe(IDLE)
  })

  it('becomes a drag at 5px, in any direction', () => {
    const pressed = pressAt(480, 890)

    expect(move(pressed, { x: 480, y: 895 }).phase).toBe('held')
    expect(move(pressed, { x: 477, y: 886 }).phase).toBe('held')
    expect(isLoose(move(pressed, { x: 485, y: 890 }))).toBe(true)
  })

  it('follows the pointer, keeping the pinched point under it', () => {
    const state = carryTo(700, 600, 60)

    expect(state.phase).toBe('held')
    expect(bodyOf(state).at.x).toBeCloseTo(700, 0)
    expect(bodyOf(state).at.y).toBeCloseTo(600, 0)
    expect(offsetOf(bodyOf(state)).x).toBeCloseTo(200, 0)
    expect(offsetOf(bodyOf(state)).y).toBeCloseTo(-300, 0)
  })

  it('hangs from where it was pinched: the heavy side swings down', () => {
    const hold = (pinchX: number): number => {
      let state = move(pressAt(pinchX, 900), { x: pinchX, y: 900 - CLICK_SLOP_PX })
      for (let frame = 0; frame < 240; frame += 1) {
        state = step(state, FRAME_MS, LID)
      }
      return bodyOf(state).angle
    }

    expect(hold(500)).toBeCloseTo(0, 1)
    expect(hold(410)).toBeGreaterThan(3)
    expect(hold(590)).toBeLessThan(-3)
    expect(hold(410)).toBeCloseTo(-hold(590), 3)
    expect(Math.abs(hold(401))).toBeLessThan(25)
  })

  it('swings as it is carried, and the swing dies away', () => {
    let state = carryTo(800, 900, 12)
    const carried = Math.abs(bodyOf(state).angle)
    for (let frame = 0; frame < 300; frame += 1) {
      state = step(state, FRAME_MS, LID)
    }

    expect(carried).toBeGreaterThan(1)
    expect(Math.abs(bodyOf(state).angle)).toBeLessThan(0.05)
    expect(Math.abs(bodyOf(state).spin)).toBeLessThan(0.5)
  })

  it('clamps to the lid', () => {
    const right = bodyOf(carryTo(5000, 900))
    const topLeft = bodyOf(carryTo(-5000, -5000))
    const bottom = bodyOf(carryTo(500, 99_999))

    expect(right.at.x).toBe(LID.width - 100)
    expect(topLeft.at).toEqual({ x: 100, y: 50 })
    expect(bottom.at.y).toBe(LID.height - 50)
  })

  it('lets a sticker that hangs over the edge go home, and no further out', () => {
    const overhanging = restingBody({ x: 30, y: 900 }, { x: 100, y: 50 })
    const pressed = press(IDLE, { ...MOUSE, at: { x: 30, y: 900 } }, overhanging)
    let state = move(pressed, { x: 20, y: 900 })
    for (let frame = 0; frame < 30; frame += 1) {
      state = step(move(state, { x: -5000, y: 900 }), FRAME_MS, LID)
    }

    expect(bodyOf(state).at.x).toBe(30)
  })

  it('keeps velocity on release and decays', () => {
    const thrown = release(carryTo(700, 900, 10))
    const { state, path } = untilStuck(thrown)
    const speeds = path.map(({ velocity }) => Math.hypot(velocity.x, velocity.y))

    expect(thrown.phase).toBe('thrown')
    expect(bodyOf(thrown).velocity.x).toBeGreaterThan(100)
    expect(path.length).toBeGreaterThan(5)
    expect(path.at(3)?.at.x).toBeGreaterThan(bodyOf(thrown).at.x)
    expect(speeds.at(10) ?? 0).toBeLessThan(speeds.at(0) ?? 0)
    expect(state.phase).toBe('stuck')
    expect(bodyOf(state).velocity).toEqual({ x: 0, y: 0 })
    expect(path.length).toBeLessThan(180)
  })

  it('keeps only some of the velocity: a throw is slower than the hand', () => {
    const held = carryTo(700, 900, 10)
    const thrown = release(held)

    expect(bodyOf(thrown).velocity.x).toBeLessThan(bodyOf(held).velocity.x)
    expect(thrown.phase === 'thrown' ? thrown.drop : 0).toBeCloseTo(
      Math.hypot(bodyOf(thrown).velocity.x, bodyOf(thrown).velocity.y),
      6,
    )
  })

  it('bounces softly off the edge of the lid, and never crosses it', () => {
    const fast = body({ at: { x: 850, y: 900 }, velocity: { x: 2400, y: 0 } })
    const { state, path } = untilStuck({ phase: 'thrown', body: fast, drop: 2400 })
    const turned = path.find(({ velocity }) => velocity.x < 0)

    expect(Math.max(...path.map(({ at }) => at.x))).toBeLessThanOrEqual(LID.width - 100)
    expect(turned).toBeDefined()
    expect(Math.abs(turned?.velocity.x ?? 0)).toBeLessThan(1200)
    expect(state.phase).toBe('stuck')
    expect(bodyOf(state).at.x).toBeLessThan(LID.width - 100)
  })

  it('lands in the same place at ten frames a second as at sixty', () => {
    const thrown: DragState = {
      phase: 'thrown',
      body: body({ velocity: { x: 900, y: -500 }, angle: 10, spin: 40 }),
      drop: 1030,
    }
    const at = (frameMs: number): Body => {
      let state: DragState = thrown
      for (let frame = 0; frame < 600 && state.phase === 'thrown'; frame += 1) {
        state = step(state, frameMs, LID)
      }
      return bodyOf(state)
    }
    const [smooth, slow] = [at(FRAME_MS), at(100)]

    expect(slow.at.x).toBeCloseTo(smooth.at.x, -1)
    expect(slow.at.y).toBeCloseTo(smooth.at.y, -1)
    expect(slow.angle).toBe(0)
  })

  it('swings as steadily in the hand when the frames come slowly', () => {
    let state = move(pressAt(410, 900), { x: 410, y: 900 - CLICK_SLOP_PX })
    let widest = 0
    for (let frame = 0; frame < 60; frame += 1) {
      state = step(state, 100, LID)
      widest = Math.max(widest, Math.abs(bodyOf(state).angle))
    }

    expect(widest).toBeLessThan(14)
    expect(bodyOf(state).angle).toBeCloseTo(10.8, 1)
    expect(Math.abs(bodyOf(state).spin)).toBeLessThan(0.5)
  })

  it('bounces off the near edges as off the far ones', () => {
    const fast = body({ at: { x: 150, y: 80 }, velocity: { x: -2400, y: -2400 } })
    const { state, path } = untilStuck({ phase: 'thrown', body: fast, drop: 3400 })

    expect(Math.min(...path.map(({ at }) => at.x))).toBeGreaterThanOrEqual(100)
    expect(Math.min(...path.map(({ at }) => at.y))).toBeGreaterThanOrEqual(50)
    expect(path.some(({ velocity }) => velocity.x > 0 && velocity.y > 0)).toBe(true)
    expect(bodyOf(state).at.x).toBeGreaterThan(100)
  })

  it('does nothing in a frame that took no time', () => {
    const thrown = release(carryTo(700, 900, 10))

    expect(step(thrown, 0, LID)).toBe(thrown)
  })

  it('settles flat', () => {
    const tilted = body({ angle: 14, spin: 60, velocity: { x: 300, y: -200 } })
    const { state } = untilStuck({ phase: 'thrown', body: tilted, drop: 360 })

    expect(state.phase).toBe('stuck')
    expect(bodyOf(state).angle).toBe(0)
    expect(bodyOf(state).spin).toBe(0)
    expect(isLoose(state)).toBe(false)
    expect(step(state, FRAME_MS, LID)).toBe(state)
  })

  it('drops where it is, flat and still, when nothing should move by itself', () => {
    const held = carryTo(700, 600, 10)
    const calm = step(held, FRAME_MS, LID, true)
    const dropped = release(calm, { calm: true })

    expect(bodyOf(calm).angle).toBe(0)
    expect(dropped.phase).toBe('stuck')
    expect(bodyOf(dropped).velocity).toEqual({ x: 0, y: 0 })
    expect(bodyOf(dropped).at).toEqual(bodyOf(calm).at)
  })

  it('drops in place when the browser takes the pointer away', () => {
    const dropped = untilStuck(release(carryTo(700, 900, 10), { cancelled: true }))

    expect(dropped.state.phase).toBe('stuck')
    expect(bodyOf(dropped.state).at.x).toBeCloseTo(700, 0)
  })

  it('takes a second press only when nothing is in the hand', () => {
    const held = carryTo(600, 900, 5)

    expect(press(held, { ...MOUSE, at: { x: 1, y: 1 } }, body())).toBe(held)
    expect(move(IDLE, { x: 1, y: 1 })).toBe(IDLE)
    expect(release(IDLE)).toBe(IDLE)
  })

  it('remembers where home is, however far it has been carried', () => {
    const moved = restingBody({ x: 640, y: 700 }, { x: 100, y: 50 }, { x: 140, y: -200 })

    expect(moved.home).toEqual({ x: 500, y: 900 })
    expect(offsetOf(moved)).toEqual({ x: 140, y: -200 })
  })

  it('never mutates state', () => {
    const pressed: DragState = deepFreeze(pressAt(500, 900))
    const held: DragState = deepFreeze(move(pressed, { x: 520, y: 880 }))
    const stepped: DragState = deepFreeze(step(held, FRAME_MS, LID))
    const thrown: DragState = deepFreeze(release(stepped))

    expect(() => step(thrown, FRAME_MS, LID)).not.toThrow()
    expect(() => move(held, { x: 900, y: 100 })).not.toThrow()
    expect(() => release(held)).not.toThrow()
    expect(step(held, FRAME_MS, LID)).not.toBe(held)
    expect(pressed.phase).toBe('pressed')
    expect(bodyOf(held).at).toEqual({ x: 500, y: 900 })
    expect(Object.isFrozen(IDLE)).toBe(true)
  })
})
