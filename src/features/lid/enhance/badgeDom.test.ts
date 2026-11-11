import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  fakeEnv,
  type FakeEnv,
  HANG_BOX,
  lidFixture,
  type LidFixture,
  place,
  placeHang,
  pointer,
} from '../../../test/lidFixture'
import { installBadge } from './badgeDom'
import { createTicker } from './ticker'

let fixture: LidFixture

/** Where the card's middle is on the screen when it hangs still: the fixture hangs it at one px to the unit. */
const MIDDLE = { x: HANG_BOX.left + 130, y: HANG_BOX.top + 531 } as const

beforeEach(() => {
  fixture = lidFixture()
})

function setUp(env: FakeEnv = fakeEnv()) {
  const onSnap = vi.fn<(strength: number, pan: number) => void>()
  const badge = installBadge(fixture.lid, env, createTicker(env.frames), { onSnap })
  if (badge === null) {
    throw new Error('The fixture has a badge to hang')
  }
  return { env, badge, onSnap }
}

function card(): HTMLElement {
  const found = fixture.lid.querySelector<HTMLElement>('[data-badge-card]')
  if (!found) {
    throw new Error('The fixture has a card')
  }
  return found
}

function link(): HTMLElement {
  const found = card().querySelector<HTMLElement>('a')
  if (!found) {
    throw new Error('The card has a ribbon')
  }
  return found
}

function em(name: string): number {
  return Number.parseFloat(fixture.sticker('badge').style.getPropertyValue(name) || '0')
}

/** How far the badge is drawn from where it hangs, in units. */
function offset(): { x: number; y: number } {
  return { x: em('--hang-dx') * 10, y: em('--hang-dy') * 10 }
}

/** Takes the badge by its middle and pulls it to a point, holding on. */
function grab(to: { x: number; y: number }, init = {}): void {
  pointer(link(), 'pointerdown', { ...MIDDLE, ...init })
  pointer(window, 'pointermove', { ...to, ...init })
}

function settled(): void {
  pointer(window, 'pointerup', MIDDLE)
}

describe('hanging the badge from the page', () => {
  it('takes the lanyard and the badge from the stylesheet’s sway', () => {
    setUp(fakeEnv({ reducedMotion: true }))

    expect(fixture.sticker('lanyard')).toHaveAttribute('data-hang')
    expect(fixture.sticker('badge')).toHaveAttribute('data-hang')
  })

  it('leaves a lid with no badge, or one it cannot measure, as it is', () => {
    fixture.sticker('badge').remove()
    expect(installBadge(fixture.lid, fakeEnv(), createTicker(fakeEnv().frames))).toBeNull()

    fixture = lidFixture()
    placeHang(fixture.lid, { ...HANG_BOX, width: 0 })
    expect(installBadge(fixture.lid, fakeEnv(), createTicker(fakeEnv().frames))).toBeNull()
    expect(fixture.sticker('lanyard')).not.toHaveAttribute('data-hang')
  })
})

describe('the badge arriving', () => {
  it('drops in on its lanyard, snaps the straps taut, settles and asks for nothing more', () => {
    const { env, onSnap } = setUp()

    expect(env.frames.pending()).toBe(1)
    env.frames.flush(3)
    expect(em('--hang-dy')).toBeLessThan(0)
    expect(fixture.sticker('badge')).toHaveAttribute('data-hang-moving')

    expect(env.frames.flush(1200)).toBeLessThan(1200)
    expect(onSnap).toHaveBeenCalled()
    expect(fixture.sticker('badge')).not.toHaveAttribute('style')
    expect(fixture.sticker('badge')).not.toHaveAttribute('data-hang-moving')
    expect(fixture.lid.querySelector('#lanyard-left')).toHaveAttribute('d', 'M-96 -300L124 268')
    expect(env.frames.pending()).toBe(0)
  })

  it('is tossed from where it is when the page has already been painted', () => {
    const { env } = setUp(fakeEnv({ painted: () => true }))
    env.frames.flush(3)

    expect(em('--hang-dy')).toBeLessThan(0)
    expect(em('--hang-dy')).toBeGreaterThan(-15)
  })

  it('does not drop in, nor ask for a frame, when less motion is asked for', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    expect(env.frames.pending()).toBe(0)
    expect(fixture.sticker('badge')).not.toHaveAttribute('style')
  })
})

describe('taking hold of the badge', () => {
  it('leaves a press that barely moves alone: the ribbon’s link is followed', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    pointer(link(), 'pointerdown', MIDDLE)
    pointer(window, 'pointermove', { x: MIDDLE.x + 3, y: MIDDLE.y + 2 })
    pointer(window, 'pointerup', { x: MIDDLE.x + 3, y: MIDDLE.y + 2 })

    expect(pointer(link(), 'click').stopped).toBe(false)
    expect(env.frames.pending()).toBe(0)
    expect(fixture.sticker('badge')).not.toHaveAttribute('data-hang-held')
  })

  it('picks it up once the pointer moves, and pulls it after the pointer by the point it was taken by', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    grab({ x: MIDDLE.x + 60, y: MIDDLE.y - 50 })
    expect(fixture.sticker('badge')).toHaveAttribute('data-hang-held')
    env.frames.flush(120)

    expect(offset().x).toBeCloseTo(60, -1)
    expect(offset().y).toBeCloseTo(-50, -1)
  })

  it('does not follow the link a drag ends on, and follows the next click', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    grab({ x: MIDDLE.x + 40, y: MIDDLE.y })
    env.frames.flush(10)
    settled()

    expect(pointer(link(), 'click').stopped).toBe(true)
    pointer(link(), 'pointerdown', MIDDLE)
    pointer(window, 'pointerup', MIDDLE)
    expect(pointer(link(), 'click').stopped).toBe(false)
  })

  it('stretches the straps when pulled far down, and goes no further than they allow', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    grab({ x: MIDDLE.x, y: MIDDLE.y + 600 })
    env.frames.flush(240)
    const thin = Number(
      fixture.lid
        .querySelector<SVGElement>('[data-strap="from"]')
        ?.style.getPropertyValue('--thin'),
    )

    expect(offset().y).toBeGreaterThan(20)
    expect(offset().y).toBeLessThan(200)
    expect(thin).toBeLessThan(1)
  })

  it('lets go: the badge swings back to where it hangs, falls asleep and asks for no frames', () => {
    const { env } = setUp()
    env.frames.flush(1200)

    grab({ x: MIDDLE.x + 150, y: MIDDLE.y - 100 })
    env.frames.flush(60)
    settled()
    expect(env.frames.pending()).toBe(1)

    expect(env.frames.flush(1200)).toBeLessThan(1200)
    expect(fixture.sticker('badge')).not.toHaveAttribute('style')
    expect(fixture.sticker('badge')).not.toHaveAttribute('data-hang-held')
    expect(env.frames.pending()).toBe(0)
  })

  it('under reduced motion, comes straight back without going past where it hangs', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    grab({ x: MIDDLE.x + 150, y: MIDDLE.y - 100 })
    env.frames.flush(120)
    settled()
    const path = Array.from({ length: 60 }, () => {
      env.frames.flush(1)
      return offset().x
    })

    expect(path.every((x, index) => x >= 0 && x <= (path[index - 1] ?? Infinity))).toBe(true)
    env.frames.flush(600)
    expect(fixture.sticker('badge')).not.toHaveAttribute('style')
    expect(env.frames.pending()).toBe(0)
  })

  it('ends a hold the browser takes away, without eating the next click', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    grab({ x: MIDDLE.x + 40, y: MIDDLE.y }, { pointerType: 'touch' })
    pointer(window, 'pointercancel', { ...MIDDLE, pointerType: 'touch' })

    expect(fixture.sticker('badge')).not.toHaveAttribute('data-hang-held')
    expect(pointer(link(), 'click').stopped).toBe(false)
    env.frames.flush(600)
    expect(env.frames.pending()).toBe(0)
  })

  it('lets go when the mouse moves with no button down: the release was never seen', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    // A press that opened a menu: the button came up where the page could not see it.
    pointer(link(), 'pointerdown', MIDDLE)
    pointer(window, 'pointermove', { x: MIDDLE.x + 90, y: MIDDLE.y, buttons: 0 })
    expect(fixture.sticker('badge')).not.toHaveAttribute('data-hang-held')
    expect(env.frames.pending()).toBe(0)

    // And one that had already taken hold.
    grab({ x: MIDDLE.x + 40, y: MIDDLE.y })
    pointer(window, 'pointermove', { x: MIDDLE.x + 90, y: MIDDLE.y, buttons: 0 })
    expect(fixture.sticker('badge')).not.toHaveAttribute('data-hang-held')
    expect(pointer(link(), 'click').stopped).toBe(false)
    env.frames.flush(600)
    expect(env.frames.pending()).toBe(0)
  })

  it('forgets a drag that no click follows, as after a finger: the next click is a click', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    grab({ x: MIDDLE.x + 40, y: MIDDLE.y }, { pointerType: 'touch' })
    env.frames.flush(10)
    pointer(window, 'pointerup', { ...MIDDLE, pointerType: 'touch' })
    expect(env.timers.fire()).toBe(1)

    expect(pointer(link(), 'click').stopped).toBe(false)
  })

  it('ignores a second pointer, and a mouse’s other buttons', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    pointer(link(), 'pointerdown', { ...MIDDLE, button: 2 })
    pointer(window, 'pointermove', { x: MIDDLE.x + 90, y: MIDDLE.y })
    expect(env.frames.pending()).toBe(0)

    grab({ x: MIDDLE.x + 40, y: MIDDLE.y })
    pointer(card(), 'pointerdown', { ...MIDDLE, pointerId: 2 })
    pointer(window, 'pointermove', { x: MIDDLE.x - 300, y: MIDDLE.y, pointerId: 2 })
    env.frames.flush(120)
    expect(offset().x).toBeGreaterThan(0)
  })

  it('stops the browser dragging the photo or a link away', () => {
    setUp(fakeEnv({ reducedMotion: true }))
    const dragstart = new Event('dragstart', { bubbles: true, cancelable: true })
    card().querySelector('img')?.dispatchEvent(dragstart)

    expect(dragstart.defaultPrevented).toBe(true)
  })
})

describe('the badge and the rest of the lid', () => {
  it('is put back by tidying the lid, even in the hand', () => {
    const { env, badge } = setUp(fakeEnv({ reducedMotion: true }))
    grab({ x: MIDDLE.x + 90, y: MIDDLE.y })
    env.frames.flush(30)

    badge.tidy()

    expect(fixture.sticker('badge')).not.toHaveAttribute('style')
    expect(fixture.sticker('badge')).not.toHaveAttribute('data-hang-held')
    expect(env.frames.pending()).toBe(0)
    pointer(window, 'pointermove', { x: MIDDLE.x + 200, y: MIDDLE.y })
    expect(env.frames.pending()).toBe(0)
  })

  it('measures the hang again when the lid is rearranged, and is pulled in the new units', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))
    placeHang(fixture.lid, { ...HANG_BOX, width: 520 })
    fixture.lid.querySelectorAll<HTMLElement>('[data-badge-card]').forEach((element) => {
      Object.defineProperties(element, {
        offsetLeft: { configurable: true, value: 24 },
        offsetTop: { configurable: true, value: 592 },
        offsetWidth: { configurable: true, value: 472 },
        offsetHeight: { configurable: true, value: 940 },
      })
    })
    env.rearrange()

    const middle = { x: HANG_BOX.left + 260, y: HANG_BOX.top + 1062 }
    pointer(link(), 'pointerdown', middle)
    pointer(window, 'pointermove', { x: middle.x + 100, y: middle.y })
    env.frames.flush(120)

    expect(offset().x).toBeCloseTo(50, -1)
  })

  it('puts the badge back, even from the hand, when a rearrangement hangs it somewhere new', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))
    grab({ x: MIDDLE.x + 90, y: MIDDLE.y })
    env.frames.flush(30)

    placeHang(fixture.lid, { ...HANG_BOX, left: 100 })
    place(card(), { left: 12, top: 316, width: 236, height: 470 })
    env.rearrange()

    expect(fixture.sticker('badge')).not.toHaveAttribute('style')
    expect(fixture.sticker('badge')).not.toHaveAttribute('data-hang-held')
    expect(env.frames.pending()).toBe(0)

    const middle = { x: 100 + 130, y: HANG_BOX.top + 551 }
    pointer(link(), 'pointerdown', middle)
    pointer(window, 'pointermove', { x: middle.x, y: middle.y - 60 })
    env.frames.flush(120)
    expect(offset().y).toBeCloseTo(-60, -1)
    expect(em('--hang-oy')).toBeCloseTo(55.1, 6)
  })

  it('measures again when the window is resized, and keeps its last measure when the lid cannot be read', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))
    placeHang(fixture.lid, { ...HANG_BOX, width: 0 })
    window.dispatchEvent(new Event('resize'))

    grab({ x: MIDDLE.x + 60, y: MIDDLE.y })
    pointer(window, 'pointerup', { ...MIDDLE, pointerId: 7 })
    env.frames.flush(120)

    expect(fixture.sticker('badge')).toHaveAttribute('data-hang-held')
    expect(offset().x).toBeCloseTo(60, -1)
  })

  it('leans with a tilted phone and sleeps where it hangs then, and comes home when it is level', () => {
    const { env, badge } = setUp()
    env.frames.flush(1200)

    badge.lean(0.3)
    expect(env.frames.flush(1200)).toBeLessThan(1200)
    expect(offset().x).toBeGreaterThan(20)

    badge.lean(0)
    env.frames.flush(1200)
    expect(fixture.sticker('badge')).not.toHaveAttribute('style')
  })

  it('does not lean while it is off the screen: nobody is looking', () => {
    const { env, badge } = setUp()
    env.frames.flush(1200)

    place(fixture.sticker('badge'), { ...HANG_BOX, top: -(HANG_BOX.height + 1) })
    badge.lean(0.3)
    expect(env.frames.pending()).toBe(0)

    place(fixture.sticker('badge'), HANG_BOX)
    badge.lean(0.3)
    expect(env.frames.pending()).toBe(1)
  })

  it('does not lean when less motion is asked for', () => {
    const { env, badge } = setUp(fakeEnv({ reducedMotion: true }))

    badge.lean(0.3)

    expect(env.frames.pending()).toBe(0)
  })
})
