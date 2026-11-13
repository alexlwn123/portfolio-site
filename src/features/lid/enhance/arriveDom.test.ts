import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fakeEnv, type FakeEnv, lidFixture, type LidFixture, seen } from '../../../test/lidFixture'
import { installArrivals } from './arriveDom'

let fixture: LidFixture

function pressed(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`The fixture has nothing with the id "${id}"`)
  }
  return element
}

function setUp(env: FakeEnv = fakeEnv()) {
  const onLand = vi.fn<(strength: number, pan: number) => void>()
  installArrivals(document, fixture.lid, env, { onLand })
  return { env, onLand }
}

function delayOf(element: HTMLElement): string {
  return element.style.getPropertyValue('--land-delay')
}

beforeEach(() => {
  fixture = lidFixture()
})

describe('sticking things down as they scroll into view', () => {
  it('watches every sticker of the pile and everything a section presses on, and nothing on the cover', () => {
    const { env } = setUp()
    const watched = env.sighted()

    expect(watched).toContain(fixture.sticker('cv'))
    expect(watched).toContain(fixture.sticker('next-spot'))
    expect(watched).toContain(pressed('work-title'))
    expect(watched).toContain(pressed('work-tag'))
    expect(watched).not.toContain(fixture.sticker('name'))
    expect(watched).not.toContain(fixture.sticker('badge'))
    expect(watched).toHaveLength(
      fixture.lid.querySelectorAll('[data-lid-pile] [data-sticker]').length + 2,
    )
  })

  it.each([
    ['less motion was asked for', { reducedMotion: true }],
    ['the browser cannot say what is in view', { onSight: null }],
  ])('does nothing at all when %s', (_, without) => {
    const { env } = setUp(fakeEnv(without))

    expect(env.sighted()).toEqual([])
    expect(document.querySelector('[data-land]')).toBeNull()
    expect(env.timers.pending()).toBe(0)
  })

  it('touches nothing until the browser has said where things are', () => {
    setUp()

    expect(document.querySelector('[data-land]')).toBeNull()
    expect(document.querySelector('[style]')).toBeNull()
  })

  it('leaves alone what is already on screen when it is first seen, and stops watching it', () => {
    const { env } = setUp()
    const cv = fixture.sticker('cv')

    env.sight([seen(cv, true), seen(pressed('work-title'), true)])

    expect(cv).not.toHaveAttribute('data-land')
    expect(pressed('work-title')).not.toHaveAttribute('data-land')
    expect(env.sighted()).not.toContain(cv)
    expect(env.sighted()).not.toContain(pressed('work-title'))
    expect(env.timers.pending()).toBe(0)
  })

  it('leaves alone what is showing by so much as an edge when it is first seen: it never vanishes', () => {
    const { env } = setUp()
    const cv = fixture.sticker('cv')

    env.sight([seen(cv, false, { showing: true })])

    expect(cv).not.toHaveAttribute('data-land')
    expect(env.sighted()).not.toContain(cv)
  })

  it('waits for enough of a held-back thing to show before it lands it', () => {
    const { env } = setUp()
    const cv = fixture.sticker('cv')
    env.sight([seen(cv, false)])

    env.sight([seen(cv, false, { showing: true })])
    expect(cv).toHaveAttribute('data-land', 'wait')

    env.sight([seen(cv, true)])
    expect(cv).toHaveAttribute('data-land', 'slap')
  })

  it('holds back what is off screen when it is first seen', () => {
    const { env } = setUp()

    env.sight([seen(fixture.sticker('cv'), false), seen(pressed('work-tag'), false)])

    expect(fixture.sticker('cv')).toHaveAttribute('data-land', 'wait')
    expect(pressed('work-tag')).toHaveAttribute('data-land', 'wait')
    expect(env.sighted()).toContain(fixture.sticker('cv'))
  })

  it('slaps a sticker of the pile down when it comes into view, and presses a section’s on', () => {
    const { env } = setUp()
    const [cv, tag] = [fixture.sticker('cv'), pressed('work-tag')]
    env.sight([seen(cv, false), seen(tag, false)])

    env.sight([seen(cv, true), seen(tag, true)])

    expect(cv).toHaveAttribute('data-land', 'slap')
    expect(tag).toHaveAttribute('data-land', 'press')
    expect(delayOf(cv)).toBe('0ms')
    expect(delayOf(tag)).toBe('0ms')
  })

  it('lands neighbours one after another, in the order they are read, never on one frame', () => {
    const { env } = setUp()
    const [cv, welder, spot] = [
      fixture.sticker('cv'),
      fixture.sticker('lightning-welder'),
      fixture.sticker('next-spot'),
    ]
    env.sight([seen(cv, false), seen(welder, false), seen(spot, false)])

    env.sight([
      seen(spot, true, { left: 600, top: 410 }),
      seen(welder, true, { left: 300, top: 400 }),
      seen(cv, true, { left: 20, top: 420 }),
    ])

    expect([cv, welder, spot].map(delayOf)).toEqual(['0ms', '60ms', '120ms'])
  })

  it('keeps the pile’s turns and the sections’ turns apart: a pressed thing never waits for a slap', () => {
    const { env } = setUp()
    const [cv, welder, tag] = [
      fixture.sticker('cv'),
      fixture.sticker('lightning-welder'),
      pressed('work-tag'),
    ]
    env.sight([seen(cv, false), seen(welder, false), seen(tag, false)])

    env.sight([seen(cv, true), seen(welder, true, { left: 300 }), seen(tag, true, { top: 800 })])

    expect(delayOf(welder)).toBe('60ms')
    expect(delayOf(tag)).toBe('0ms')
  })

  it('lets a later arrival wait for the one before it to land', () => {
    const { env } = setUp()
    const [cv, welder] = [fixture.sticker('cv'), fixture.sticker('lightning-welder')]
    env.sight([seen(cv, false), seen(welder, false)])
    env.frames.step(1000)

    env.sight([seen(cv, true)])
    env.frames.step(1020)
    env.sight([seen(welder, true)])

    expect(delayOf(cv)).toBe('0ms')
    expect(delayOf(welder)).toBe('40ms')
  })

  it('leaves the page as it found it once a thing has landed, and never lands it twice', () => {
    const { env } = setUp()
    const cv = fixture.sticker('cv')
    env.sight([seen(cv, false)])
    env.sight([seen(cv, true)])

    expect(env.sighted()).not.toContain(cv)
    expect(env.timers.fire()).toBe(1)

    expect(cv).not.toHaveAttribute('data-land')
    expect(cv.getAttribute('style')).toBeNull()
    env.sight([seen(cv, false)])
    env.sight([seen(cv, true)])
    expect(cv).not.toHaveAttribute('data-land')
  })

  it('waits for the slap to play out before it tidies up: the delay and then the slap itself', () => {
    const { env } = setUp()
    const [cv, welder] = [fixture.sticker('cv'), fixture.sticker('lightning-welder')]
    env.sight([seen(cv, false), seen(welder, false)])

    env.sight([seen(cv, true), seen(welder, true, { left: 300 })])

    const [first = 0, second = 0] = env.timers.delays()
    expect(second - first).toBe(60)
    expect(first).toBeGreaterThanOrEqual(500)
  })

  it('lets a few of the pile’s landings be heard, never all of them, and none of a section’s', () => {
    const { env, onLand } = setUp()
    const pile = [...fixture.lid.querySelectorAll<HTMLElement>('[data-lid-pile] [data-sticker]')]
    const tag = pressed('work-tag')
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 })
    env.sight([...pile.map((sticker) => seen(sticker, false)), seen(tag, false)])

    env.sight([
      ...pile.map((sticker, index) => seen(sticker, true, { left: index * 100 })),
      seen(tag, true),
    ])
    env.timers.fire()

    expect(pile.length).toBeGreaterThan(5)
    expect(onLand.mock.calls.length).toBeGreaterThan(0)
    expect(onLand.mock.calls.length).toBeLessThan(pile.length / 2)
    for (const [strength, pan] of onLand.mock.calls) {
      expect(strength).toBeGreaterThan(0)
      expect(strength).toBeLessThan(0.5)
      expect(Math.abs(pan)).toBeLessThanOrEqual(1)
    }
    // The first to land is heard, from the left of the screen where it is.
    expect(onLand.mock.calls[0]?.[1]).toBe(-1)
  })

  it('shows everything it was holding back if anything goes wrong, and watches no more', () => {
    const { env } = setUp()
    const [cv, welder] = [fixture.sticker('cv'), fixture.sticker('lightning-welder')]
    env.sight([seen(cv, false), seen(welder, false)])
    vi.spyOn(cv, 'setAttribute').mockImplementation(() => {
      throw new Error('the page changed under it')
    })

    env.sight([seen(cv, true)])

    expect(welder).not.toHaveAttribute('data-land')
    expect(cv).not.toHaveAttribute('data-land')
    expect(env.sighted()).toEqual([])
  })

  it('ignores a sighting of something it never watched', () => {
    const { env } = setUp()

    env.sight([seen(fixture.sticker('name'), false)])

    expect(fixture.sticker('name')).not.toHaveAttribute('data-land')
  })
})
