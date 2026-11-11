import { describe, expect, it } from 'vitest'

import { deepFreeze } from './deepFreeze'

describe('deepFreeze', () => {
  it('freezes nested objects and arrays', () => {
    const frozen = deepFreeze({ list: [{ value: 1 }], nested: { inner: { value: 2 } } })

    expect(Object.isFrozen(frozen)).toBe(true)
    expect(Object.isFrozen(frozen.list)).toBe(true)
    expect(Object.isFrozen(frozen.list[0])).toBe(true)
    expect(Object.isFrozen(frozen.nested.inner)).toBe(true)
  })

  it('makes mutation throw', () => {
    const frozen = deepFreeze({ nested: { value: 1 } })

    expect(() => {
      Reflect.defineProperty(frozen.nested, 'value', { value: 2 })
      Object.assign(frozen.nested, { value: 2 })
    }).toThrow(TypeError)
    expect(frozen.nested.value).toBe(1)
  })

  it('returns primitives and null unchanged', () => {
    expect(deepFreeze(null)).toBeNull()
    expect(deepFreeze('text')).toBe('text')
    expect(deepFreeze(16)).toBe(16)
  })

  it('keeps functions callable', () => {
    const frozen = deepFreeze({ greet: (name: string) => `hello ${name}` })

    expect(frozen.greet('lid')).toBe('hello lid')
  })
})
