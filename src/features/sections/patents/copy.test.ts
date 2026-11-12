import { describe, expect, it } from 'vitest'

import { patentsCopy } from './copy'

/** Collects every string in a value, calling template functions with a marker. */
function collectStrings(value: unknown): readonly string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (typeof value === 'function') {
    return collectStrings((value as (...parts: string[]) => unknown)('{one}', '{other}'))
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(collectStrings)
  }
  return []
}

describe('patentsCopy', () => {
  it('is frozen all the way down', () => {
    expect(Object.isFrozen(patentsCopy)).toBe(true)
    expect(Object.isFrozen(patentsCopy.plate.fields.coInventors)).toBe(true)
  })

  it('holds no numbers, names or addresses: those are the record’s', () => {
    const strings = collectStrings(patentsCopy)

    expect(strings.filter((text) => /\d/.test(text))).toEqual([])
    expect(strings.filter((text) => /https?:|@|\.(com|lol|dev)\b/.test(text))).toEqual([])
    expect(strings.filter((text) => /google|ncr|lewin/i.test(text))).toEqual([])
  })

  it('has no word for a status: nothing is granted, pending or abandoned, patent or application', () => {
    const strings = collectStrings(patentsCopy)

    expect(
      strings.filter((text) => /grant|pending|abandon|application|status/i.test(text)),
    ).toEqual([])
  })

  it('counts filings, never "patents": the noun after the count is "patent filing(s)"', () => {
    expect(patentsCopy.plate.count).toEqual({
      label: 'Named inventor on',
      one: 'U.S. patent filing',
      many: 'U.S. patent filings',
    })
  })

  it('labels every filing’s number alike', () => {
    expect(patentsCopy.plate.fields.number).toBe('Publication no.')
    expect(Object.keys(patentsCopy.plate.fields)).toEqual([
      'number',
      'filed',
      'assignee',
      'coInventors',
    ])
  })

  it('imitates no real regulatory mark', () => {
    const strings = collectStrings(patentsCopy.stickers).join(' ')

    expect(strings).not.toMatch(/\b(CE|FCC|UL|RoHS|UKCA|ETL|CSA)\b/)
  })

  it('types no arrows, stars or ticks: those glyphs are drawn', () => {
    expect(collectStrings(patentsCopy).filter((text) => /[←-⇿✦★☆✓✔]/.test(text))).toEqual([])
  })

  it('fills its templates with what it is given', () => {
    expect(patentsCopy.plate.on('Google Patents')).toBe('on Google Patents')
    expect(patentsCopy.plate.footnote('Google Patents')).toBe(
      'Every number opens its public record on Google Patents.',
    )
  })
})
