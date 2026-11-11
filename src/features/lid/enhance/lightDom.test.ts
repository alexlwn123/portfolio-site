import { beforeEach, describe, expect, it } from 'vitest'

import { fakeEnv, lidFixture, type LidFixture, pointer } from '../../../test/lidFixture'
import { installLight } from './lightDom'
import { createTicker } from './ticker'

let fixture: LidFixture

function lampOf(lid: HTMLElement): readonly [string, string] {
  return [lid.style.getPropertyValue('--lamp-x'), lid.style.getPropertyValue('--lamp-y')]
}

beforeEach(() => {
  fixture = lidFixture()
})

describe('lighting the lid', () => {
  it('never runs under reduced motion: the lamp stays at rest and nothing is watched', () => {
    const env = fakeEnv({ reducedMotion: true })
    const loop = installLight(fixture.lid, env, createTicker(env.frames))

    pointer(fixture.lid, 'pointermove', { x: 900, y: 900 })

    expect(loop).toBeNull()
    expect(env.watched()).toEqual([])
    expect(env.frames.pending()).toBe(0)
    expect(env.timers.pending()).toBe(0)
    expect(fixture.lid.getAttribute('style')).toBeNull()
  })

  it('does not run where stickers cannot be watched coming on screen', () => {
    const env = fakeEnv({ onScreen: null })

    expect(installLight(fixture.lid, env, createTicker(env.frames))).toBeNull()
    expect(env.frames.pending()).toBe(0)
  })

  it('watches every sticker, and lights only the ones on screen', () => {
    const env = fakeEnv()
    installLight(fixture.lid, env, createTicker(env.frames))
    const all = [...fixture.lid.querySelectorAll('[data-sticker]')]

    expect(env.watched()).toEqual(all)
    expect(fixture.lid.querySelectorAll('[data-lit]')).toHaveLength(0)

    env.report(fixture.sticker('cv'), true)
    env.report(fixture.sticker('pleb-fm'), true)
    env.report(fixture.sticker('cv'), false)

    expect(fixture.sticker('cv')).not.toHaveAttribute('data-lit')
    expect(fixture.sticker('pleb-fm')).toHaveAttribute('data-lit')
  })

  it('does no work while every sticker is off screen', () => {
    const env = fakeEnv()
    installLight(fixture.lid, env, createTicker(env.frames))

    pointer(fixture.lid, 'pointermove', { x: 900, y: 900 })

    expect(env.frames.pending()).toBe(0)
    expect(env.timers.pending()).toBe(0)
  })

  it('moves the lamp to the pointer by writing two variables on the lid, then stops', () => {
    const env = fakeEnv()
    installLight(fixture.lid, env, createTicker(env.frames))
    env.report(fixture.sticker('cv'), true)

    pointer(fixture.lid, 'pointermove', { x: 800, y: 450 })
    const ran = env.frames.flush(600)

    expect(lampOf(fixture.lid)).toEqual(['0.8', '0.25'])
    expect(ran).toBeLessThan(120)
    expect(env.frames.pending()).toBe(0)
    expect(env.timers.pending()).toBe(0)
    expect(fixture.lid.style).toHaveLength(2)
    expect(document.querySelectorAll('[style]')).toHaveLength(1)
  })

  it('leaves the lamp alone under a finger: a touch is for scrolling', () => {
    const env = fakeEnv()
    installLight(fixture.lid, env, createTicker(env.frames))
    env.report(fixture.sticker('cv'), true)
    env.frames.flush(600)

    pointer(fixture.lid, 'pointermove', { x: 800, y: 450, pointerType: 'touch' })
    env.frames.flush(600)

    expect(lampOf(fixture.lid)).toEqual(['', ''])
  })

  it('drifts when there is no pointer: before one arrives, and after it leaves', () => {
    const env = fakeEnv()
    installLight(fixture.lid, env, createTicker(env.frames))
    env.report(fixture.sticker('cv'), true)
    env.frames.flush(600)
    expect(env.timers.pending()).toBe(1)

    pointer(fixture.lid, 'pointermove', { x: 800, y: 450 })
    env.frames.flush(600)
    expect(env.timers.pending()).toBe(0)

    pointer(fixture.lid, 'pointerleave')
    env.frames.flush(600)
    expect(env.timers.pending()).toBe(1)
    expect(env.frames.pending()).toBe(0)
  })

  it('stops altogether when the last sticker leaves the screen', () => {
    const env = fakeEnv()
    installLight(fixture.lid, env, createTicker(env.frames))
    env.report(fixture.sticker('cv'), true)
    env.frames.flush(600)

    env.report(fixture.sticker('cv'), false)

    expect(env.timers.pending()).toBe(0)
    expect(env.frames.pending()).toBe(0)
  })

  it('moves the SVG foil with the lamp while a sticker cut from it is on screen', () => {
    const env = fakeEnv()
    installLight(fixture.lid, env, createTicker(env.frames))
    const foil = document.getElementById('lid-foil')
    const glow = document.getElementById('name-glow')
    env.report(fixture.sticker('name'), true)

    pointer(fixture.lid, 'pointermove', { x: 1000, y: 1800 })
    env.frames.flush(600)

    expect(foil).toHaveAttribute('gradientTransform', 'translate(130 0) rotate(20 240 140)')
    expect(glow).toHaveAttribute('cx', '480')
    expect(glow).toHaveAttribute('cy', '300')
  })

  it('leaves the SVG foil alone while nothing cut from it is on screen, and catches it up after', () => {
    const env = fakeEnv()
    installLight(fixture.lid, env, createTicker(env.frames))
    const foil = document.getElementById('lid-foil')
    env.report(fixture.sticker('cv'), true)

    pointer(fixture.lid, 'pointermove', { x: 1000, y: 1800 })
    env.frames.flush(600)
    expect(foil).toHaveAttribute('gradientTransform', 'at rest')

    env.report(fixture.sticker('lightning-welder'), true)
    expect(foil).toHaveAttribute('gradientTransform', 'translate(130 0) rotate(20 240 140)')
  })
})
