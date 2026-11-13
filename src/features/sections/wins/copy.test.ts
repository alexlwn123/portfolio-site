import { describe, expect, it } from 'vitest'

import { winsCopy } from './copy'

/** Collects every string in a value, calling template functions with a marker. */
function collectStrings(value: unknown): readonly string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (typeof value === 'function') {
    return collectStrings((value as (...figures: string[]) => unknown)('{a}', '{b}'))
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(collectStrings)
  }
  return []
}

describe('winsCopy', () => {
  it('is frozen, so no component can rewrite the voice', () => {
    expect(Object.isFrozen(winsCopy)).toBe(true)
    expect(Object.isFrozen(winsCopy.sheet)).toBe(true)
  })

  it('holds no numbers and no addresses: every figure is handed to it', () => {
    const strings = collectStrings(winsCopy)

    expect(strings.filter((text) => /\d/.test(text))).toEqual([])
    expect(strings.filter((text) => /https?:|@|\.(com|lol|dev|org)\b/.test(text))).toEqual([])
  })

  it('types no arrows or stars: the typefaces have none, so they are drawn', () => {
    expect(collectStrings(winsCopy).filter((text) => /[←-⇿✦★☆]/.test(text))).toEqual([])
  })

  it('never words a prize as a place', () => {
    expect(winsCopy.rank.prize).not.toMatch(/1st|2nd|3rd|first|second|third/i)
  })

  it('counts the pieces on the sheet, and the years they span', () => {
    expect(winsCopy.sheet.pieces(9)).toBe('9 pcs')
    expect(winsCopy.sheet.pieces(1)).toBe('1 pc')
    expect(winsCopy.sheet.series(2021, 2026)).toBe('2021–2026')
    expect(winsCopy.sheet.series(2026, 2026)).toBe('2026')
  })

  it('counts each kind of result in the number it calls for', () => {
    expect(winsCopy.tally.first(6)).toBe('6 firsts')
    expect(winsCopy.tally.first(1)).toBe('1 first')
    expect(winsCopy.tally.second(2)).toBe('2 seconds')
    expect(winsCopy.tally.third(1)).toBe('1 third')
    expect(winsCopy.tally.prize(1)).toBe('1 prize')
    expect(winsCopy.tally.prize(3)).toBe('3 prizes')
  })

  it('says a field of teams the way a medal does', () => {
    expect(winsCopy.sticker.field('300+')).toBe('of 300+ teams')
  })

  it('names a link by what it is and what it belongs to', () => {
    expect(winsCopy.linkName('Code', 'Pleb FM')).toBe('Code: Pleb FM')
  })
})
