import { beforeEach, describe, expect, it } from 'vitest'

import {
  fakeEnv,
  lidFixture,
  type LidFixture,
  memoryStorage,
  pointer,
} from '../../../test/lidFixture'
import { STORAGE_KEY } from './preference'
import { installSound } from './soundDom'

let fixture: LidFixture

const ON = '{"v":1,"on":true,"reduced":false}'

beforeEach(() => {
  fixture = lidFixture()
})

describe('the speaker sticker', () => {
  it('appears, off, and makes no audio context', () => {
    const env = fakeEnv()
    const sound = installSound(fixture.lid, env)

    expect(fixture.control('sound')).not.toHaveAttribute('hidden')
    expect(fixture.control('sound')).toHaveAttribute('aria-pressed', 'false')
    expect(sound.enabled()).toBe(false)
    expect(env.audioMade()).toBe(0)
  })

  it('turns sound on when pressed, remembers the choice and ticks to say so', () => {
    const env = fakeEnv()
    const storage = memoryStorage()
    const sound = installSound(fixture.lid, { ...env, storage })

    fixture.control('sound').click()

    expect(fixture.control('sound')).toHaveAttribute('aria-pressed', 'true')
    expect(sound.enabled()).toBe(true)
    expect(storage.items()).toEqual({ [STORAGE_KEY]: ON })
    expect(env.audioMade()).toBe(1)
    expect(env.audio.started()).toHaveLength(1)
  })

  it('turns sound off again, and remembers that too', () => {
    const storage = memoryStorage()
    const sound = installSound(fixture.lid, { ...fakeEnv(), storage })

    fixture.control('sound').click()
    fixture.control('sound').click()

    expect(fixture.control('sound')).toHaveAttribute('aria-pressed', 'false')
    expect(sound.enabled()).toBe(false)
    expect(storage.items()).toEqual({ [STORAGE_KEY]: '{"v":1,"on":false,"reduced":false}' })
  })

  it('comes back on after a reload, but makes no sound until the visitor does something', () => {
    const env = fakeEnv()
    const sound = installSound(fixture.lid, {
      ...env,
      storage: memoryStorage({ [STORAGE_KEY]: ON }),
    })

    expect(fixture.control('sound')).toHaveAttribute('aria-pressed', 'true')
    expect(sound.enabled()).toBe(true)
    sound.tick()
    expect(env.audioMade()).toBe(0)

    pointer(document.body, 'mousedown')
    pointer(document.body, 'mousedown')
    sound.tick()

    expect(env.audioMade()).toBe(1)
    expect(env.audio.started()).toHaveLength(1)
  })

  it('is unlocked by a key as well as by a press', () => {
    const env = fakeEnv()
    installSound(fixture.lid, { ...env, storage: memoryStorage({ [STORAGE_KEY]: ON }) })

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))

    expect(env.audioMade()).toBe(1)
  })

  it('waits for a real gesture: a modifier on its own, or Escape, lets no audio start', () => {
    const env = fakeEnv()
    installSound(fixture.lid, { ...env, storage: memoryStorage({ [STORAGE_KEY]: ON }) })
    const press = (key: string): void => {
      document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    }

    for (const key of ['Shift', 'Control', 'Alt', 'Meta', 'Escape']) {
      press(key)
    }
    expect(env.audioMade()).toBe(0)

    press('Enter')
    press('Enter')
    expect(env.audioMade()).toBe(1)
  })

  it('stays off when what is stored is not a preference', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{"v":1,"on":"yes"}' })
    const sound = installSound(fixture.lid, { ...fakeEnv(), storage })

    expect(sound.enabled()).toBe(false)
    expect(fixture.control('sound')).toHaveAttribute('aria-pressed', 'false')
  })

  it('stays off under reduced motion, whatever an earlier visit chose', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: ON })
    const sound = installSound(fixture.lid, { ...fakeEnv({ reducedMotion: true }), storage })

    expect(sound.enabled()).toBe(false)
    expect(fixture.control('sound')).toHaveAttribute('aria-pressed', 'false')
  })

  it('plays under reduced motion once the visitor turns it on there, and says so in what it stores', () => {
    const env = fakeEnv({ reducedMotion: true })
    const storage = memoryStorage()
    const sound = installSound(fixture.lid, { ...env, storage })

    fixture.control('sound').click()

    expect(sound.enabled()).toBe(true)
    expect(storage.items()).toEqual({ [STORAGE_KEY]: '{"v":1,"on":true,"reduced":true}' })
    expect(env.audio.started()).toHaveLength(1)
  })

  it('still works when nothing can be stored', () => {
    const sound = installSound(fixture.lid, { ...fakeEnv(), storage: null })

    fixture.control('sound').click()

    expect(sound.enabled()).toBe(true)
    expect(fixture.control('sound')).toHaveAttribute('aria-pressed', 'true')
  })

  it('still toggles where there is no Web Audio', () => {
    const sound = installSound(fixture.lid, { ...fakeEnv(), createAudio: () => null })

    expect(() => {
      fixture.control('sound').click()
    }).not.toThrow()
    expect(sound.enabled()).toBe(true)
  })

  it('ticks when the pointer or the keyboard reaches a ribbon of the badge', () => {
    const env = fakeEnv()
    installSound(fixture.lid, env)
    const ribbon = fixture.sticker('badge').querySelector('a') as HTMLElement
    fixture.control('sound').click()

    pointer(ribbon, 'pointerover')
    env.audio.advance(1)
    ribbon.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))

    expect(env.audio.started()).toHaveLength(3)
    expect(env.audio.started().every(({ kind }) => kind === 'oscillator')).toBe(true)
  })

  it('does not tick for the rest of the badge, or while sound is off', () => {
    const env = fakeEnv()
    installSound(fixture.lid, env)
    const ribbon = fixture.sticker('badge').querySelector('a') as HTMLElement

    pointer(ribbon, 'pointerover')
    fixture.control('sound').click()
    pointer(fixture.sticker('badge'), 'pointerover')

    expect(env.audio.started()).toHaveLength(1)
  })

  it('gives a working sound to a lid with no speaker sticker', () => {
    fixture.control('sound').remove()

    expect(installSound(fixture.lid, fakeEnv()).enabled()).toBe(false)
  })
})
