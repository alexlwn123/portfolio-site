import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import { contactCopy } from './copy'

/** Collects every string in a value. */
function collectStrings(value: unknown): readonly string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap(collectStrings)
  }
  return []
}

describe('contactCopy', () => {
  it('is frozen all the way down', () => {
    expect(Object.isFrozen(contactCopy)).toBe(true)
    expect(Object.isFrozen(contactCopy.label.plea)).toBe(true)
  })

  it('holds no address, link, name or number: those are the record’s', () => {
    const strings = collectStrings(contactCopy)

    expect(strings.filter((text) => /https?:|@|\.(com|lol|dev|computer)\b/.test(text))).toEqual([])
    expect(strings.filter((text) => /\d/.test(text))).toEqual([])
    expect(
      strings.filter((text) =>
        [content.profile.givenName, content.profile.familyName, content.profile.location.city].some(
          (fact) => text.includes(fact),
        ),
      ),
    ).toEqual([])
  })

  it('types no arrows or stars: those glyphs are drawn', () => {
    expect(collectStrings(contactCopy).filter((text) => /[←-⇿✦★☆]/.test(text))).toEqual([])
  })
})
