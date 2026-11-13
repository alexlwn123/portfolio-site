import { beforeEach, describe, expect, it } from 'vitest'

import {
  dragFrom,
  fakeEnv,
  lidFixture,
  type LidFixture,
  pointer,
  seen,
} from '../../../test/lidFixture'
import { enhanceLid } from './index'

let fixture: LidFixture

beforeEach(() => {
  fixture = lidFixture()
})

describe('enhancing the lid', () => {
  it('does nothing on a page with no lid', () => {
    document.body.innerHTML = '<main><h1>Plain CV</h1></main>'

    expect(enhanceLid(document, fakeEnv())).toBe(false)
    expect(document.body.innerHTML).toBe('<main><h1>Plain CV</h1></main>')
  })

  it('marks the lid as enhanced and shows the buttons that now do something', () => {
    expect(enhanceLid(document, fakeEnv())).toBe(true)

    expect(fixture.lid).toHaveAttribute('data-enhanced')
    expect(fixture.control('sound')).not.toHaveAttribute('hidden')
    expect(fixture.control('tidy')).not.toHaveAttribute('hidden')
    expect(fixture.control('tilt')).toHaveAttribute('hidden')
    expect(fixture.tab('pleb-fm')).not.toHaveAttribute('hidden')
  })

  it('holds the pile back until it scrolls into view, then slaps it down', () => {
    const env = fakeEnv()
    enhanceLid(document, env)
    const cv = fixture.sticker('cv')

    env.sight([seen(cv, false)])
    expect(cv).toHaveAttribute('data-land', 'wait')
    env.sight([seen(cv, true)])

    expect(cv).toHaveAttribute('data-land', 'slap')
    expect(fixture.sticker('name')).not.toHaveAttribute('data-land')
  })

  it('holds nothing back when less motion was asked for', () => {
    const env = fakeEnv({ reducedMotion: true })
    enhanceLid(document, env)

    expect(env.sighted()).toEqual([])
    expect(document.querySelector('[data-land]')).toBeNull()
  })

  it('tidies everything with one press: stickers go home and the open note closes', () => {
    const env = fakeEnv()
    enhanceLid(document, env)
    dragFrom(fixture.sticker('cv'), [200, 450], [400, 650])
    env.frames.flush(10)
    pointer(window, 'pointerup', { x: 400, y: 650 })
    env.frames.flush(600)
    fixture.tab('pleb-fm').click()
    env.frames.flush(600)

    fixture.control('tidy').click()
    env.frames.flush(600)

    expect(fixture.lid.querySelectorAll('[data-carry], [data-peel]')).toHaveLength(0)
    expect(fixture.sticker('cv').style).toHaveLength(0)
  })

  it('re-sticks an open note when a sticker is picked up', () => {
    const env = fakeEnv()
    enhanceLid(document, env)
    fixture.tab('pleb-fm').click()
    env.frames.flush(600)

    dragFrom(fixture.sticker('cv').firstChild?.parentElement ?? fixture.lid, [200, 450], [400, 650])
    env.frames.flush(600)

    expect(fixture.tab('pleb-fm')).toHaveAttribute('aria-expanded', 'false')
  })

  it('makes its three sounds once sound is on: the peel, the drop and the tick', () => {
    const env = fakeEnv()
    enhanceLid(document, env)
    fixture.control('sound').click()
    const afterTick = env.audio.started().length

    fixture.tab('pleb-fm').click()
    env.audio.advance(1)
    env.frames.flush(600)
    const afterPeel = env.audio.started().length

    dragFrom(fixture.sticker('cv'), [200, 450], [400, 650])
    env.frames.flush(10)
    pointer(window, 'pointerup', { x: 400, y: 650 })
    env.frames.flush(600)

    expect(afterTick).toBe(1)
    expect(afterPeel).toBeGreaterThan(afterTick)
    expect(env.audio.started().length).toBeGreaterThan(afterPeel)
    expect(env.audio.pans().at(-1)).toBeCloseTo(-0.2, 1)
  })

  it('is silent until sound is asked for, whatever is done to the lid', () => {
    const env = fakeEnv()
    enhanceLid(document, env)

    fixture.tab('pleb-fm').click()
    env.frames.flush(600)

    expect(env.audioMade()).toBe(0)
  })

  it('still drags, peels and tidies where the light cannot run', () => {
    const env = fakeEnv({ onScreen: null, reducedMotion: true })

    expect(enhanceLid(document, env)).toBe(true)
    fixture.tab('pleb-fm').click()

    expect(fixture.sticker('pleb-fm').style.getPropertyValue('--peel')).toBe('1')
    expect(fixture.lid.style.getPropertyValue('--lamp-x')).toBe('')
  })

  it('hangs the badge, which drops in and settles, and tidying puts it back from the hand', () => {
    const env = fakeEnv()
    enhanceLid(document, env)
    env.frames.flush(1200)
    const badge = fixture.sticker('badge')

    expect(badge).toHaveAttribute('data-hang')
    expect(badge).not.toHaveAttribute('style')

    const link = badge.querySelector('a') ?? badge
    pointer(link, 'pointerdown', { x: 530, y: 631 })
    pointer(window, 'pointermove', { x: 700, y: 600 })
    env.frames.flush(30)
    expect(badge.style.getPropertyValue('--hang-dx')).not.toBe('')

    fixture.control('tidy').click()
    expect(badge).not.toHaveAttribute('style')
  })

  it('leans the badge with a tilted phone', async () => {
    const { fakeOrientation } = await import('../../../test/lidFixture')
    const orientation = fakeOrientation(true)
    const env = fakeEnv({ touch: true, orientation })
    enhanceLid(document, env)
    env.frames.flush(1200)

    fixture.control('tilt').click()
    await Promise.resolve()
    await Promise.resolve()
    orientation.send({ beta: 0, gamma: 0 })
    orientation.send({ beta: 0, gamma: 20 })
    env.frames.flush(30)

    expect(
      Number.parseFloat(fixture.sticker('badge').style.getPropertyValue('--hang-dx')),
    ).toBeGreaterThan(0)
  })

  it('moves the lamp with a tilted phone, through the same loop as the pointer', async () => {
    const { fakeOrientation } = await import('../../../test/lidFixture')
    const orientation = fakeOrientation(true)
    const env = fakeEnv({ touch: true, orientation })
    enhanceLid(document, env)
    env.report(fixture.sticker('cv'), true)

    fixture.control('tilt').click()
    await Promise.resolve()
    await Promise.resolve()
    orientation.send({ beta: 0, gamma: 0 })
    orientation.send({ beta: 0, gamma: 28 })
    env.frames.flush(600)

    expect(fixture.lid.style.getPropertyValue('--lamp-x')).toBe('0.85')
  })
})
