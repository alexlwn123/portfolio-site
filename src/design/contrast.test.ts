import { describe, expect, it } from 'vitest'

import { contrastRatio, relativeLuminance } from './contrast'

describe('contrast', () => {
  it('gives black on white the maximum ratio of 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })

  it('does not depend on the order of the two colours', () => {
    expect(contrastRatio('#2B35F5', '#ffffff')).toBe(contrastRatio('#ffffff', '#2B35F5'))
  })

  it('gives a colour against itself a ratio of 1', () => {
    expect(contrastRatio('#2B35F5', '#2b35f5')).toBe(1)
  })

  it('computes relative luminance at the ends of the range', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
  })

  it.each(['2B35F5', '#fff', '#2B35F', 'cobalt', '#GGGGGG'])('rejects %s', (value) => {
    expect(() => contrastRatio(value, '#ffffff')).toThrow(/six-digit hex colour/)
  })
})
