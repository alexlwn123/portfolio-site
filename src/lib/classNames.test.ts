import { describe, expect, it } from 'vitest'

import { cx } from './classNames'

describe('cx', () => {
  it('joins class names with spaces', () => {
    expect(cx('sticker', 'pill')).toBe('sticker pill')
  })

  it('leaves out anything that is not a name', () => {
    const big = false as boolean

    expect(cx('sticker', big && 'big', undefined, null, '')).toBe('sticker')
  })

  it('returns an empty string when nothing is left', () => {
    expect(cx(undefined, false)).toBe('')
  })
})
