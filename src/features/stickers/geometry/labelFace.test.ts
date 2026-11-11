import { describe, expect, it } from 'vitest'

import { LABEL_ADVANCE_UNKNOWN, LABEL_ADVANCES, labelWidth } from './labelFace'

describe('the label face’s widths', () => {
  it('has every capital and figure, each a sensible part of an em', () => {
    for (const character of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
      expect(LABEL_ADVANCES[character], character).toBeGreaterThan(0.2)
      expect(LABEL_ADVANCES[character], character).toBeLessThan(0.8)
    }
    expect(Object.isFrozen(LABEL_ADVANCES)).toBe(true)
  })

  it('adds up a word: every advance and the tracking after it, at the size asked for', () => {
    expect(labelWidth('ATL', 10, 0)).toBeCloseTo(13.404, 3)
    expect(labelWidth('ATL', 10, 0.1)).toBeCloseTo(16.404, 3)
    expect(labelWidth('ATL', 20, 0)).toBeCloseTo(26.808, 3)
    expect(labelWidth('', 10, 0.1)).toBe(0)
  })

  it('measures a word as it is shouted, whatever case it was written in', () => {
    expect(labelWidth('alex.lwn.lol', 13.5, 0.16)).toBe(labelWidth('ALEX.LWN.LOL', 13.5, 0.16))
  })

  it('takes a character it does not know to be a middling capital', () => {
    expect(labelWidth('✦', 10, 0)).toBe(LABEL_ADVANCE_UNKNOWN * 10)
  })
})
