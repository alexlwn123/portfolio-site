import { describe, expect, it } from 'vitest'

import { workCopy } from './copy'

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

describe('workCopy', () => {
  it('is frozen all the way down', () => {
    expect(Object.isFrozen(workCopy)).toBe(true)
    expect(Object.isFrozen(workCopy.marks.wins)).toBe(true)
    expect(Object.isFrozen(workCopy.title)).toBe(true)
  })

  it('holds no numbers, names of employers or addresses: those are the record’s', () => {
    const strings = collectStrings(workCopy)

    expect(strings.filter((text) => /\d/.test(text))).toEqual([])
    expect(strings.filter((text) => /https?:|@|\.(com|lol|dev)\b/.test(text))).toEqual([])
    expect(strings.filter((text) => /finite|fedi|zion|blockspaces|ncr|auburn/i.test(text))).toEqual(
      [],
    )
  })

  it('types no arrows, stars or ticks: those glyphs are drawn', () => {
    expect(collectStrings(workCopy).filter((text) => /[←-⇿✦★☆✓✔]/.test(text))).toEqual([])
  })

  it('fills its templates with what it is given', () => {
    expect(workCopy.marks.also(2023)).toBe('Also in 2023')
    expect(workCopy.marks.outOf('300+')).toBe('of 300+ teams')
  })

  it('counts patents as filings, on the path and in the running count', () => {
    const filings = { one: 'patent filing', many: 'patent filings' }

    expect(workCopy.marks.filed).toEqual(filings)
    expect(workCopy.totals.patents).toEqual(filings)
  })

  it('has no word for what became of a filing', () => {
    expect(
      collectStrings(workCopy).filter((text) => /grant|pending|abandon|application/i.test(text)),
    ).toEqual([])
  })
})
