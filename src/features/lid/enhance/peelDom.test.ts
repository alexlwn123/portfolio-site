import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  dragFrom,
  fakeEnv,
  type FakeEnv,
  lidFixture,
  type LidFixture,
  place,
  pointer,
} from '../../../test/lidFixture'
import { installPeel } from './peelDom'
import { createTicker } from './ticker'

let fixture: LidFixture

function setUp(env: FakeEnv = fakeEnv()) {
  const onPeel = vi.fn<(speed: number) => void>()
  const peel = installPeel(fixture.lid, env, createTicker(env.frames), { onPeel })
  return { env, peel, onPeel }
}

function peelOf(id: string): string {
  return fixture.sticker(id).style.getPropertyValue('--peel')
}

function open(env: FakeEnv, id: string): void {
  fixture.tab(id).click()
  env.frames.flush(600)
}

function key(target: EventTarget, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true })
  target.dispatchEvent(event)
  return event
}

beforeEach(() => {
  fixture = lidFixture()
})

describe('peeling stickers on the page', () => {
  it('shows the corner of every sticker that has a note under it', () => {
    setUp()

    expect(fixture.tab('pleb-fm')).not.toHaveAttribute('hidden')
    expect(fixture.tab('ncr-win')).not.toHaveAttribute('hidden')
    expect(fixture.lid.querySelectorAll('[data-peel]')).toHaveLength(0)
  })

  it('opens when the corner is pressed, and says so', () => {
    const { env } = setUp()

    fixture.tab('pleb-fm').click()

    expect(fixture.sticker('pleb-fm')).toHaveAttribute('data-peel')
    expect(fixture.tab('pleb-fm')).toHaveAttribute('aria-expanded', 'true')
    env.frames.flush(600)
    expect(peelOf('pleb-fm')).toBe('1')
    expect(env.frames.pending()).toBe(0)
  })

  it('re-sticks when the corner is pressed again, and leaves nothing written behind', () => {
    const { env } = setUp()
    open(env, 'pleb-fm')

    fixture.tab('pleb-fm').click()
    expect(fixture.tab('pleb-fm')).toHaveAttribute('aria-expanded', 'false')
    env.frames.flush(600)

    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-peel')
    expect(fixture.sticker('pleb-fm').style).toHaveLength(0)
    expect(env.frames.pending()).toBe(0)
  })

  it('closes the one that was open when another is opened', () => {
    const { env } = setUp()
    open(env, 'pleb-fm')
    open(env, 'ncr-win')

    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-peel')
    expect(fixture.tab('pleb-fm')).toHaveAttribute('aria-expanded', 'false')
    expect(peelOf('ncr-win')).toBe('1')
    expect(fixture.lid.querySelectorAll('[aria-expanded="true"]')).toHaveLength(1)
  })

  it('re-sticks on Escape, and hands focus back to the corner when it was in the note', () => {
    const { env } = setUp()
    open(env, 'pleb-fm')
    fixture.note('pleb-fm').querySelector('a')?.focus()

    key(document.activeElement ?? document.body, 'Escape')
    env.frames.flush(600)

    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-peel')
    expect(document.activeElement).toBe(fixture.tab('pleb-fm'))
  })

  it('leaves focus where it is on Escape when it was not in the note', () => {
    const { env } = setUp()
    open(env, 'pleb-fm')
    fixture.sticker('cv').focus()

    key(document.body, 'Escape')

    expect(fixture.tab('pleb-fm')).toHaveAttribute('aria-expanded', 'false')
    expect(document.activeElement).toBe(fixture.sticker('cv'))
  })

  it('toggles at once under reduced motion, with no frames at all', () => {
    const { env } = setUp(fakeEnv({ reducedMotion: true }))

    fixture.tab('pleb-fm').click()
    expect(peelOf('pleb-fm')).toBe('1')
    expect(fixture.tab('pleb-fm')).toHaveAttribute('aria-expanded', 'true')

    fixture.tab('ncr-win').click()
    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-peel')
    expect(peelOf('ncr-win')).toBe('1')

    key(document.body, 'Escape')
    expect(fixture.lid.querySelectorAll('[data-peel]')).toHaveLength(0)
    expect(env.frames.requested()).toBe(0)
  })

  it('follows the corner as it is dragged, and opens when it is let go past halfway', () => {
    const { env } = setUp()
    const tab = fixture.tab('pleb-fm')

    dragFrom(tab, [590, 890], [510, 810])
    env.frames.flush(1)

    expect(fixture.sticker('pleb-fm')).toHaveAttribute('data-peel', 'held')
    expect(Number(peelOf('pleb-fm'))).toBeCloseTo(0.843, 2)

    pointer(window, 'pointerup', { x: 510, y: 810 })
    expect(pointer(tab, 'click').stopped).toBe(true)
    tab.click()
    env.frames.flush(600)

    expect(peelOf('pleb-fm')).toBe('')
  })

  it('stays open after a drag past halfway: the click that ends the drag does not close it', () => {
    const { env } = setUp()
    const tab = fixture.tab('pleb-fm')

    dragFrom(tab, [590, 890], [510, 810])
    pointer(window, 'pointerup', { x: 510, y: 810 })
    pointer(tab, 'click')
    env.frames.flush(600)

    expect(peelOf('pleb-fm')).toBe('1')
    expect(tab).toHaveAttribute('aria-expanded', 'true')
  })

  it('springs back when the corner is let go before halfway', () => {
    const { env } = setUp()
    const tab = fixture.tab('pleb-fm')

    dragFrom(tab, [590, 890], [570, 870])
    env.frames.flush(1)
    expect(Number(peelOf('pleb-fm'))).toBeCloseTo(0.211, 2)

    pointer(window, 'pointerup', { x: 570, y: 870 })
    pointer(tab, 'click')
    env.frames.flush(600)

    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-peel')
    expect(tab).toHaveAttribute('aria-expanded', 'false')
  })

  it('takes a press that barely moves as a press, and ignores every pointer but the one that has the corner', () => {
    const { env } = setUp()
    const tab = fixture.tab('pleb-fm')

    pointer(tab, 'pointerdown', { x: 590, y: 890 })
    pointer(window, 'pointermove', { x: 300, y: 300, pointerId: 2 })
    pointer(window, 'pointerup', { x: 300, y: 300, pointerId: 2 })
    pointer(window, 'pointermove', { x: 588, y: 889 })
    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-peel')

    pointer(window, 'pointerup', { x: 588, y: 889 })
    tab.click()
    env.frames.flush(600)
    expect(peelOf('pleb-fm')).toBe('1')
  })

  it('opens a sticker whose note is missing, with nothing to fit', () => {
    fixture.note('ncr-win').remove()
    const { env } = setUp()

    open(env, 'ncr-win')

    expect(peelOf('ncr-win')).toBe('1')
    expect(fixture.sticker('ncr-win').style.getPropertyValue('--note-x')).toBe('0px')
  })

  it('takes a tap on the corner as a press, and never drags under a finger', () => {
    const { env } = setUp()
    const tab = fixture.tab('pleb-fm')

    pointer(tab, 'pointerdown', { x: 590, y: 890, pointerType: 'touch' })
    pointer(window, 'pointermove', { x: 510, y: 810, pointerType: 'touch' })
    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-peel')

    tab.click()
    env.frames.flush(600)
    expect(peelOf('pleb-fm')).toBe('1')
  })

  it('peels and re-sticks with the arrow keys on the corner, without scrolling the page', () => {
    const { env } = setUp()
    const tab = fixture.tab('pleb-fm')

    const up = key(tab, 'ArrowUp')
    env.frames.flush(600)
    expect(peelOf('pleb-fm')).toBe('1')
    expect(up.defaultPrevented).toBe(true)

    key(tab, 'ArrowDown')
    env.frames.flush(600)
    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-peel')
    expect(key(fixture.sticker('cv'), 'ArrowUp').defaultPrevented).toBe(false)
  })

  it('re-sticks when something outside the sticker is pressed, and not for a press inside it', () => {
    const { env } = setUp()
    open(env, 'pleb-fm')

    pointer(fixture.note('pleb-fm'), 'pointerdown')
    expect(fixture.tab('pleb-fm')).toHaveAttribute('aria-expanded', 'true')

    pointer(fixture.sticker('cv'), 'pointerdown')
    env.frames.flush(600)
    expect(fixture.sticker('pleb-fm')).not.toHaveAttribute('data-peel')
  })

  it('re-sticks when focus moves on to another sticker, so a note never hides what has focus', () => {
    const { env } = setUp()
    open(env, 'pleb-fm')
    const link = fixture.note('pleb-fm').querySelector('a') as HTMLElement

    link.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }))
    link.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: fixture.tab('pleb-fm') }),
    )
    expect(fixture.tab('pleb-fm')).toHaveAttribute('aria-expanded', 'true')

    link.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: fixture.sticker('cv') }),
    )
    expect(fixture.tab('pleb-fm')).toHaveAttribute('aria-expanded', 'false')
  })

  it('reports how fast the corner is moving, for the sound of it', () => {
    const { env, onPeel } = setUp()

    open(env, 'pleb-fm')

    expect(onPeel).toHaveBeenCalled()
    for (const [speed] of onPeel.mock.calls) {
      expect(speed).toBeGreaterThan(0)
      expect(speed).toBeLessThanOrEqual(1)
    }
  })

  it('nudges a note back onto the lid when it would hang over the edge', () => {
    const { env } = setUp()
    place(fixture.note('ncr-win'), { left: 900, top: -40, width: 230, height: 150 })

    open(env, 'ncr-win')

    const nudge = fixture.sticker('ncr-win').style
    expect(Number.parseFloat(nudge.getPropertyValue('--note-x'))).toBeLessThanOrEqual(-130)
    expect(Number.parseFloat(nudge.getPropertyValue('--note-y'))).toBeGreaterThanOrEqual(40)
    expect(nudge.getPropertyValue('--note-x')).toMatch(/px$/)
  })

  it('leaves a note that fits where it is', () => {
    const { env } = setUp()
    place(fixture.note('pleb-fm'), { left: 450, top: 850, width: 230, height: 150 })

    open(env, 'pleb-fm')

    expect(fixture.sticker('pleb-fm').style.getPropertyValue('--note-x')).toBe('0px')
    expect(fixture.sticker('pleb-fm').style.getPropertyValue('--note-y')).toBe('0px')
  })

  it('closes from outside: for the tidy sticker, and for a sticker being picked up', () => {
    const { env, peel } = setUp()
    open(env, 'pleb-fm')

    peel.close()
    env.frames.flush(600)

    expect(fixture.lid.querySelectorAll('[data-peel]')).toHaveLength(0)
    expect(() => {
      peel.close()
    }).not.toThrow()
  })
})
