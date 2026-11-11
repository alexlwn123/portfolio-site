import { describe, expect, it } from 'vitest'

import { fakeAudio } from '../../../test/fakeAudio'
import { createSound } from './sound'

function setUp(state: 'running' | 'suspended' = 'running') {
  const audio = fakeAudio(state)
  let made = 0
  const sound = createSound(() => {
    made += 1
    return audio.context
  })
  return { audio, sound, made: () => made }
}

describe('sound', () => {
  it('does nothing until enabled', () => {
    const { audio, sound, made } = setUp()

    sound.crackle(1)
    sound.slap(1, 0)
    sound.tick()
    sound.unlock()

    expect(sound.enabled()).toBe(false)
    expect(made()).toBe(0)
    expect(audio.started()).toEqual([])
  })

  it('makes its audio context only when it is turned on, and only once', () => {
    const { sound, made } = setUp()

    sound.enable(true)
    sound.tick()
    sound.slap(0.5, 0)
    sound.enable(true)

    expect(sound.enabled()).toBe(true)
    expect(made()).toBe(1)
  })

  it('remembers a wish without making a context, until a gesture unlocks it', () => {
    const { audio, sound, made } = setUp()

    sound.want(true)
    sound.tick()
    expect(sound.enabled()).toBe(true)
    expect(made()).toBe(0)
    expect(audio.started()).toEqual([])

    sound.unlock()
    sound.tick()
    expect(made()).toBe(1)
    expect(audio.started()).toHaveLength(1)
  })

  it('resumes a context the browser has suspended', () => {
    const { audio, sound } = setUp('suspended')

    sound.enable(true)

    expect(audio.resumed()).toBe(1)
  })

  it('goes quiet again when it is turned off', () => {
    const { audio, sound } = setUp()

    sound.enable(true)
    sound.enable(false)
    sound.tick()
    sound.slap(1, 0)
    sound.crackle(1)

    expect(sound.enabled()).toBe(false)
    expect(audio.started()).toEqual([])
  })

  it('survives a missing AudioContext', () => {
    const none = createSound(() => null)
    const throwing = createSound(() => {
      throw new Error('AudioContext is not allowed to start')
    })

    for (const sound of [none, throwing]) {
      expect(() => {
        sound.enable(true)
        sound.unlock()
        sound.crackle(0.5)
        sound.slap(0.5, 0.5)
        sound.tick()
      }).not.toThrow()
      expect(sound.enabled()).toBe(true)
    }
  })

  it('survives an audio graph that throws', () => {
    const { audio, sound } = setUp()
    sound.enable(true)
    audio.breakNodes()

    expect(() => {
      sound.tick()
      sound.slap(1, 0)
      sound.crackle(1)
    }).not.toThrow()
  })

  it('ticks quietly: one short, high note', () => {
    const { audio, sound } = setUp()

    sound.enable(true)
    sound.tick()

    const [tick] = audio.started()
    expect(audio.started()).toHaveLength(1)
    expect(tick?.kind).toBe('oscillator')
    expect(tick?.frequency).toBeGreaterThan(1500)
    expect(tick?.duration).toBeLessThan(0.06)
    expect(audio.peakGain()).toBeLessThanOrEqual(0.05)
  })

  it('slaps louder for a faster drop, and never loudly', () => {
    const loudness = (speed: number): number => {
      const { audio, sound } = setUp()
      sound.enable(true)
      sound.slap(speed, 0)
      return audio.peakGain()
    }

    expect(loudness(1)).toBeGreaterThan(loudness(0.2))
    expect(loudness(0.2)).toBeGreaterThan(loudness(0))
    expect(loudness(0)).toBeGreaterThan(0)
    expect(loudness(1)).toBeLessThanOrEqual(0.25)
    expect(loudness(50)).toBe(loudness(1))
  })

  it('pans a slap to where the sticker landed', () => {
    const panOf = (pan: number): number | undefined => {
      const { audio, sound } = setUp()
      sound.enable(true)
      sound.slap(0.5, pan)
      return audio.pans().at(-1)
    }

    expect(panOf(-1)).toBe(-1)
    expect(panOf(0.4)).toBeCloseTo(0.4, 6)
    expect(panOf(9)).toBe(1)
  })

  it('slaps without panning where the browser has no panner', () => {
    const audio = fakeAudio('running', { panner: false })
    const sound = createSound(() => audio.context)

    sound.enable(true)
    sound.slap(0.5, 1)

    expect(audio.started().length).toBeGreaterThan(0)
    expect(audio.pans()).toEqual([])
  })

  it('crackles higher the faster the sticker is peeled', () => {
    const pitch = (speed: number): number => {
      const { audio, sound } = setUp()
      sound.enable(true)
      sound.crackle(speed)
      return audio.filters().at(-1) ?? 0
    }

    expect(pitch(1)).toBeGreaterThan(pitch(0.5))
    expect(pitch(0.5)).toBeGreaterThan(pitch(0))
    expect(pitch(40)).toBe(pitch(1))
  })

  it('crackles as grains, not as a buzz: no two closer than a few hundredths of a second', () => {
    const { audio, sound } = setUp()

    sound.enable(true)
    sound.crackle(0.5)
    sound.crackle(0.5)
    sound.crackle(0.5)
    expect(audio.started()).toHaveLength(1)

    audio.advance(0.2)
    sound.crackle(0.5)
    expect(audio.started()).toHaveLength(2)
    expect(audio.started().every(({ kind }) => kind === 'noise')).toBe(true)
  })

  it('makes its noise once and plays it again each time', () => {
    const { audio, sound } = setUp()

    sound.enable(true)
    sound.crackle(0.5)
    audio.advance(1)
    sound.crackle(0.5)
    sound.slap(0.5, 0)

    expect(audio.buffers()).toBe(1)
  })

  it('is gentle: nothing it plays is louder than a quarter of full scale', () => {
    const { audio, sound } = setUp()

    sound.enable(true)
    sound.slap(1, 0)
    sound.tick()
    sound.crackle(1)

    expect(audio.peakGain()).toBeLessThanOrEqual(0.25)
    expect(audio.started().every(({ duration }) => duration <= 0.25)).toBe(true)
  })
})
