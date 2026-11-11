import { describe, expect, it } from 'vitest'

import { copy } from './copy'

/** Collects every string in a value, calling template functions with a marker. */
function collectStrings(value: unknown): readonly string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (typeof value === 'function') {
    return collectStrings((value as (argument: string) => unknown)('{value}'))
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(collectStrings)
  }
  return []
}

describe('copy', () => {
  it('is frozen, so no component can rewrite the voice', () => {
    expect(Object.isFrozen(copy)).toBe(true)
    expect(Object.isFrozen(copy.lid.lanyard.loop)).toBe(true)
  })

  it('holds no numbers: every figure arrives as an argument from the content module', () => {
    const withDigits = collectStrings(copy).filter((text) => /\d/.test(text))

    expect(withDigits).toEqual([])
  })

  it('holds no links or addresses', () => {
    const withAddresses = collectStrings(copy).filter((text) => /https?:|@|\.(com|lol|dev)\b/.test(text))

    expect(withAddresses).toEqual([])
  })

  it('fills its templates with the figures it is given', () => {
    expect(copy.lid.ghost.saved(17)).toBe('this spot saved for hackathon #17')
    expect(copy.lid.organizedSeal.countries(8)).toBe('8 COUNTRIES + ONLINE')
    expect(copy.lid.ribbons.times(16)).toBe('×16')
    expect(copy.wristbands.footnote(12)).toBe('12 events with public figures')
    expect(copy.wristbands.stamp(2020)).toBe('ORGANIZER ✦ SINCE 2020')
    expect(copy.wristbands.coveredBy('NPR')).toBe('covered by NPR')
    expect(copy.wristbands.next(8)).toBe('NEXT: 8 WINS')
    expect(copy.lid.winsSeal.times(8)).toBe('8×')
  })

  it('says the lid is coming on the placeholder', () => {
    expect(copy.placeholder.title).toMatch(/lid/i)
  })
})
