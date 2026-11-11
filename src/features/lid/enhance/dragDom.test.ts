import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  dragFrom,
  fakeEnv,
  type FakeEnv,
  LID_BOX,
  lidFixture,
  type LidFixture,
  place,
  pointer,
} from '../../../test/lidFixture'
import { installDrag } from './dragDom'
import { createTicker } from './ticker'

let fixture: LidFixture

function setUp(env: FakeEnv = fakeEnv()) {
  const hooks = {
    onLift: vi.fn<() => void>(),
    onDrop: vi.fn<(speed: number, pan: number) => void>(),
  }
  const drag = installDrag(fixture.lid, env, createTicker(env.frames), hooks)
  return { env, drag, hooks }
}

function share(element: HTMLElement, name: string): number {
  return Number(element.style.getPropertyValue(name))
}

/** Carries the CV sticker from its middle to a point and lets it settle in the hand. */
function carryCv(env: FakeEnv, to: readonly [number, number]): HTMLElement {
  const cv = fixture.sticker('cv')
  dragFrom(cv, [200 + share(cv, '--dx') * 1000, 450 + share(cv, '--dy') * 1000], to)
  env.frames.flush(240)
  return cv
}

/** Carries it, lets go and waits for it to stick. */
function moveCv(env: FakeEnv, to: readonly [number, number]): HTMLElement {
  const cv = carryCv(env, to)
  pointer(window, 'pointerup', { x: to[0], y: to[1] })
  env.frames.flush(600)
  return cv
}

beforeEach(() => {
  fixture = lidFixture()
})

describe('picking stickers up on the page', () => {
  it('leaves a press that barely moves alone: it is a click, and nothing is written', () => {
    const { env, hooks } = setUp()
    const cv = fixture.sticker('cv')

    pointer(cv, 'pointerdown', { x: 200, y: 450 })
    pointer(window, 'pointermove', { x: 203, y: 452 })
    pointer(window, 'pointerup', { x: 203, y: 452 })
    const click = pointer(cv, 'click')

    expect(cv).not.toHaveAttribute('data-carry')
    expect(cv.getAttribute('style')).toBeNull()
    expect(click.stopped).toBe(false)
    expect(env.frames.requested()).toBe(0)
    expect(hooks.onLift).not.toHaveBeenCalled()
  })

  it('picks a sticker up once it has moved 5px, and brings it to the front', () => {
    const { env, hooks } = setUp()
    const cv = carryCv(env, [400, 650])

    expect(cv).toHaveAttribute('data-carry', 'held')
    expect(share(cv, '--front')).toBeGreaterThanOrEqual(50)
    expect(hooks.onLift).toHaveBeenCalledTimes(1)
  })

  it('follows the pointer, in shares of the lid’s width', () => {
    const { env } = setUp()
    const cv = carryCv(env, [400, 650])

    expect(share(cv, '--dx')).toBeCloseTo(0.2, 4)
    expect(share(cv, '--dy')).toBeCloseTo(0.2, 4)
    expect(cv.style.getPropertyValue('--swing')).toMatch(/deg$/)
  })

  it('throws it when it is let go, and sticks it down where it stops', () => {
    const { env, hooks } = setUp()
    const cv = fixture.sticker('cv')

    dragFrom(cv, [200, 450], [260, 450])
    env.frames.flush(3)
    pointer(window, 'pointermove', { x: 520, y: 450 })
    env.frames.flush(2)
    pointer(window, 'pointerup', { x: 520, y: 450 })

    expect(cv).toHaveAttribute('data-carry', 'thrown')
    env.frames.flush(600)

    expect(cv).toHaveAttribute('data-carry', 'stuck')
    expect(share(cv, '--dx')).toBeGreaterThan(0.32)
    expect(cv.style.getPropertyValue('--swing')).toBe('')
    expect(env.frames.pending()).toBe(0)
    expect(hooks.onDrop).toHaveBeenCalledTimes(1)
    const [speed, pan] = hooks.onDrop.mock.calls[0] ?? []
    expect(speed).toBeGreaterThan(0)
    expect(speed).toBeLessThanOrEqual(1)
    expect(pan).toBeGreaterThan(-1)
    expect(pan).toBeLessThan(1)
  })

  it('stops the click that ends a drag from following the link, and only that one', () => {
    const { env } = setUp()
    const cv = moveCv(env, [400, 650])

    expect(pointer(cv, 'click').stopped).toBe(true)
    expect(pointer(cv, 'click').stopped).toBe(false)
  })

  it('never leaves the lid', () => {
    const { env } = setUp()
    const cv = moveCv(env, [5000, -5000])

    expect(share(cv, '--dx')).toBeCloseTo((LID_BOX.width - 100 - 200) / 1000, 4)
    expect(share(cv, '--dy')).toBeCloseTo((50 - 450) / 1000, 4)
  })

  it('never drags under a finger: a touch is for scrolling', () => {
    const { env } = setUp()
    const cv = fixture.sticker('cv')

    pointer(cv, 'pointerdown', { x: 200, y: 450, pointerType: 'touch' })
    pointer(window, 'pointermove', { x: 400, y: 650, pointerType: 'touch' })
    pointer(window, 'pointerup', { x: 400, y: 650, pointerType: 'touch' })

    expect(cv).not.toHaveAttribute('data-carry')
    expect(env.frames.requested()).toBe(0)
  })

  it('leaves the corner that peels, and the note, to themselves', () => {
    const { env } = setUp()

    dragFrom(fixture.tab('pleb-fm'), [590, 890], [300, 300])
    pointer(window, 'pointerup')
    dragFrom(fixture.note('pleb-fm'), [500, 950], [300, 300])
    pointer(window, 'pointerup')

    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-carry')
    expect(env.frames.requested()).toBe(0)
  })

  it('leaves alone what is drawn on the lid itself', () => {
    setUp()

    dragFrom(fixture.sticker('next-spot'), [10, 10], [300, 300])

    expect(fixture.sticker('next-spot')).not.toHaveAttribute('data-carry')
  })

  it('ignores a second pointer while one sticker is in the hand', () => {
    const { env } = setUp()
    const cv = carryCv(env, [400, 650])

    pointer(window, 'pointermove', { x: 900, y: 900, pointerId: 2 })
    pointer(window, 'pointerup', { x: 900, y: 900, pointerId: 2 })
    env.frames.flush(60)

    expect(cv).toHaveAttribute('data-carry', 'held')
    expect(share(cv, '--dx')).toBeCloseTo(0.2, 4)
  })

  it('picks a moved sticker up from where it now is', () => {
    const { env } = setUp()
    moveCv(env, [400, 650])
    const cv = moveCv(env, [500, 650])

    expect(share(cv, '--dx')).toBeCloseTo(0.3, 3)
    expect(share(cv, '--dy')).toBeCloseTo(0.2, 3)
  })

  it('catches a sticker that is still sliding, where it has got to', () => {
    const { env, hooks } = setUp()
    const cv = fixture.sticker('cv')
    dragFrom(cv, [200, 450], [260, 450])
    env.frames.flush(3)
    pointer(window, 'pointermove', { x: 520, y: 450 })
    env.frames.flush(2)
    pointer(window, 'pointerup', { x: 520, y: 450 })
    env.frames.flush(2)
    const sliding = share(cv, '--dx')

    dragFrom(cv, [200 + sliding * 1000, 450], [200 + sliding * 1000, 650])
    env.frames.flush(240)

    expect(cv).toHaveAttribute('data-carry', 'held')
    expect(share(cv, '--dx')).toBeCloseTo(sliding, 2)
    expect(share(cv, '--dy')).toBeCloseTo(0.2, 2)
    expect(hooks.onDrop).not.toHaveBeenCalled()
  })

  it('puts each sticker it lifts on top of the last', () => {
    const { env } = setUp()
    const cv = moveCv(env, [400, 650])
    const first = share(cv, '--front')

    dragFrom(fixture.sticker('name'), [200, 125], [300, 300])
    env.frames.flush(5)

    expect(share(fixture.sticker('name'), '--front')).toBeGreaterThan(first)
  })

  it('keeps the sticker under the pointer when the page scrolls mid-drag', () => {
    const { env } = setUp()
    const cv = carryCv(env, [400, 650])

    place(fixture.lid, { ...LID_BOX, top: -100 })
    env.frames.flush(240)

    expect(share(cv, '--dy')).toBeCloseTo(0.3, 3)
  })

  it('drops the sticker where it is when the browser takes the pointer away', () => {
    const { env } = setUp()
    const cv = carryCv(env, [400, 650])

    pointer(window, 'pointercancel', { x: 0, y: 0 })
    env.frames.flush(600)

    expect(cv).toHaveAttribute('data-carry', 'stuck')
    expect(share(cv, '--dx')).toBeCloseTo(0.2, 3)
  })

  it('stops the browser dragging a sticker’s link as a link', () => {
    setUp()
    const start = new Event('dragstart', { bubbles: true, cancelable: true })
    const elsewhere = new Event('dragstart', { bubbles: true, cancelable: true })

    fixture.sticker('cv').dispatchEvent(start)
    fixture.sticker('next-spot').dispatchEvent(elsewhere)

    expect(start.defaultPrevented).toBe(true)
    expect(elsewhere.defaultPrevented).toBe(false)
  })

  it('tidies: every sticker goes back, and nothing is left written on it', () => {
    const { env, drag } = setUp()
    const cv = moveCv(env, [400, 650])
    dragFrom(fixture.sticker('name'), [200, 125], [300, 300])
    env.frames.flush(5)

    drag.tidy()
    env.frames.flush(600)

    for (const sticker of [cv, fixture.sticker('name')]) {
      expect(sticker).not.toHaveAttribute('data-carry')
      expect(sticker.style).toHaveLength(0)
    }
    expect(env.frames.pending()).toBe(0)
    expect(fixture.lid.querySelectorAll('[data-carry]')).toHaveLength(0)
  })

  it('tidies by itself when the lid changes arrangement, since every home has moved', () => {
    const { env } = setUp()
    const cv = moveCv(env, [400, 650])

    env.rearrange()

    expect(cv).not.toHaveAttribute('data-carry')
    expect(cv.style).toHaveLength(0)
  })

  it('carries without swinging or throwing under reduced motion', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))
    const cv = fixture.sticker('cv')

    dragFrom(cv, [120, 450], [600, 450])
    env.frames.flush(3)
    const swing = cv.style.getPropertyValue('--swing')
    pointer(window, 'pointerup', { x: 600, y: 450 })

    expect(swing).toBe('0deg')
    expect(cv).toHaveAttribute('data-carry', 'stuck')
    expect(share(cv, '--dx')).toBeCloseTo(0.48, 3)
    expect(env.frames.flush(600)).toBeLessThanOrEqual(1)
    expect(share(cv, '--dx')).toBeCloseTo(0.48, 3)
  })

  it('survives a browser that will not capture the pointer', () => {
    const { env } = setUp()
    const cv = fixture.sticker('cv')
    Object.defineProperty(cv, 'setPointerCapture', {
      value: () => {
        throw new DOMException('No active pointer', 'NotFoundError')
      },
    })

    expect(() => carryCv(env, [400, 650])).not.toThrow()
    expect(cv).toHaveAttribute('data-carry', 'held')
  })
})
