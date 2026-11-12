import { describe, expect, it } from 'vitest'

import { copy } from '../../../content/copy'
import { organizedCopy } from './copy'

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

describe('organizedCopy', () => {
  it('is frozen, and carries the approved mockup’s words unchanged', () => {
    expect(Object.isFrozen(organizedCopy)).toBe(true)
    expect(organizedCopy.title).toEqual(copy.wristbands.title)
    expect(organizedCopy.subtitle).toBe(copy.wristbands.subtitle)
  })

  it('holds no numbers and no addresses: every figure is handed to it', () => {
    const strings = collectStrings(organizedCopy)

    expect(strings.filter((text) => /\d/.test(text))).toEqual([])
    expect(strings.filter((text) => /https?:|@|\.(com|lol|dev|org)\b/.test(text))).toEqual([])
  })

  it('types no arrows or stars: the typefaces have none, so they are drawn', () => {
    expect(collectStrings(organizedCopy).filter((text) => /[←-⇿✦★☆]/.test(text))).toEqual([])
  })

  it('counts countries, with the online events said apart', () => {
    expect(organizedCopy.countries(8, true)).toBe('8 countries + online')
    expect(organizedCopy.countries(8, false)).toBe('8 countries')
    expect(organizedCopy.countries(1, false)).toBe('1 country')
  })

  it('says how many hackathons the big number counts', () => {
    expect(organizedCopy.count(16)).toBe('16 hackathons organized')
    expect(organizedCopy.count(1)).toBe('1 hackathon organized')
  })

  it('words each kind of figure a band’s label can carry', () => {
    expect(organizedCopy.people(90)).toBe('90 participants')
    expect(organizedCopy.people(1)).toBe('1 participant')
    expect(organizedCopy.aboutPeople(60)).toBe('about 60 participants')
    expect(organizedCopy.teams(10)).toBe('10 teams')
    expect(organizedCopy.teams(1)).toBe('1 team')
    expect(organizedCopy.projects(16)).toBe('16 projects')
    expect(organizedCopy.projects(1)).toBe('1 project')
    expect(organizedCopy.usdPrizes('$6,180')).toBe('$6,180 prizes')
    expect(organizedCopy.satsPrizes('17.542')).toBe('17.542M sats in prizes')
  })

  it('has no words for a figure that is not public: such a figure is simply left out', () => {
    expect(JSON.stringify(organizedCopy)).not.toMatch(/not public/i)
  })

  it('describes the hand for those who cannot see it', () => {
    expect(organizedCopy.hand('ORGANIZER SINCE 2020')).toBe(
      'A hand held up for a high five. The stamp on it reads: ORGANIZER SINCE 2020.',
    )
  })

  it('names the list and each band’s place in it', () => {
    expect(organizedCopy.listLabel).toBe('Hackathons organized, newest first')
    expect(organizedCopy.bandNumber(16)).toBe('Number 16:')
  })

  it('names the press link by what it is and what the piece covered', () => {
    expect(organizedCopy.linkName('covered by NPR', 'Coverage of a hackathon.')).toBe(
      'covered by NPR: Coverage of a hackathon.',
    )
  })
})
