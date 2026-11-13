import { describe, expect, it } from 'vitest'

import {
  parsePreference,
  readPreference,
  serializePreference,
  soundWanted,
  STORAGE_KEY,
  writePreference,
} from './preference'

function memoryStorage(initial: Readonly<Record<string, string>> = {}) {
  let items = { ...initial }
  return {
    getItem: (name: string): string | null => items[name] ?? null,
    setItem: (name: string, value: string): void => {
      items = { ...items, [name]: value }
    },
    items: () => items,
  }
}

const broken = {
  getItem: (): string | null => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  },
  setItem: (): void => {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
  },
}

describe('the sound preference', () => {
  it('round-trips through its own format', () => {
    const on = { on: true, reducedMotion: false }
    const off = { on: false, reducedMotion: true }

    expect(parsePreference(serializePreference(on))).toEqual(on)
    expect(parsePreference(serializePreference(off))).toEqual(off)
    expect(serializePreference(on)).toBe('{"v":1,"on":true,"reduced":false}')
  })

  it.each([
    ['nothing stored', null],
    ['an empty string', ''],
    ['not JSON', 'on'],
    ['a bare boolean', 'true'],
    ['null', 'null'],
    ['an array', '[1,true,false]'],
    ['a number for the flag', '{"v":1,"on":1,"reduced":false}'],
    ['a string for the flag', '{"v":1,"on":"true","reduced":false}'],
    ['a missing flag', '{"v":1,"on":true}'],
    ['a missing version', '{"on":true,"reduced":false}'],
    ['another version', '{"v":2,"on":true,"reduced":false}'],
    ['a field it does not know', '{"v":1,"on":true,"reduced":false,"volume":11}'],
    ['a prototype in disguise', '{"v":1,"on":true,"reduced":false,"__proto__":{"on":false}}'],
    ['truncated JSON', '{"v":1,"on":tr'],
    ['something that is not a string', 42],
    ['an object, already parsed', { v: 1, on: true, reduced: false }],
  ])('rejects malformed values: %s', (_, raw) => {
    expect(parsePreference(raw)).toBeNull()
  })

  it('reads what was stored, and nothing when nothing was', () => {
    const stored = memoryStorage({ [STORAGE_KEY]: '{"v":1,"on":true,"reduced":false}' })

    expect(readPreference(stored)).toEqual({ on: true, reducedMotion: false })
    expect(readPreference(memoryStorage())).toBeNull()
    expect(readPreference(memoryStorage({ [STORAGE_KEY]: 'yes please' }))).toBeNull()
  })

  it('writes under one key, and says whether it could', () => {
    const storage = memoryStorage()

    expect(writePreference(storage, { on: true, reducedMotion: false })).toBe(true)
    expect(storage.items()).toEqual({ [STORAGE_KEY]: '{"v":1,"on":true,"reduced":false}' })
  })

  it('survives storage that throws, or is not there at all', () => {
    expect(readPreference(broken)).toBeNull()
    expect(writePreference(broken, { on: true, reducedMotion: false })).toBe(false)
    expect(readPreference(null)).toBeNull()
    expect(writePreference(null, { on: true, reducedMotion: false })).toBe(false)
  })

  it('is off until asked', () => {
    expect(soundWanted(null, false)).toBe(false)
    expect(soundWanted({ on: false, reducedMotion: false }, false)).toBe(false)
    expect(soundWanted({ on: true, reducedMotion: false }, false)).toBe(true)
  })

  it('stays off under reduced motion unless it was turned on under reduced motion', () => {
    expect(soundWanted({ on: true, reducedMotion: false }, true)).toBe(false)
    expect(soundWanted({ on: true, reducedMotion: true }, true)).toBe(true)
    expect(soundWanted({ on: true, reducedMotion: true }, false)).toBe(true)
    expect(soundWanted(null, true)).toBe(false)
  })
})
