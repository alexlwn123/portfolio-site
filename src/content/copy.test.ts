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
    const withAddresses = collectStrings(copy).filter((text) =>
      /https?:|@|\.(com|lol|dev)\b/.test(text),
    )

    expect(withAddresses).toEqual([])
  })

  it('fills its templates with the figures it is given', () => {
    expect(copy.lid.ghost.saved(17)).toBe('this spot saved for hackathon #17')
    expect(copy.lid.organizedSeal.countries(8)).toBe('8 COUNTRIES + ONLINE')
    expect(copy.lid.ribbons.times(16)).toBe('×16')
    expect(copy.wristbands.participantsFootnote(12)).toBe('12 events with a public head count')
    expect(copy.wristbands.prizesFootnote(14)).toBe('14 events with a public prize figure')
    expect(copy.wristbands.stamp(2020)).toBe('ORGANIZER ✦ SINCE 2020')
    expect(copy.wristbands.coveredBy('NPR')).toBe('covered by NPR')
    expect(copy.wristbands.next(9)).toBe('NEXT: 9 WINS')
    expect(copy.lid.winsSeal.times(9)).toBe('9×')
  })

  it('gives each total its own footnote: no line speaks for both', () => {
    expect(copy.wristbands).not.toHaveProperty('footnote')
    expect(copy.wristbands.participantsFootnote(12)).not.toBe(copy.wristbands.prizesFootnote(12))
  })

  it('fills the lid’s accessible names and small print the same way', () => {
    expect(copy.lid.winsSeal.summary(9)).toBe('9 hackathon wins')
    expect(copy.lid.organizedSeal.summary(16, 8)).toBe(
      '16 hackathons organized in 8 countries plus online',
    )
    expect(copy.lid.organizedSeal.summaryInPerson(3, 2)).toBe(
      '3 hackathons organized in 2 countries',
    )
    expect(copy.lid.organizedSeal.countriesInPerson(2)).toBe('2 COUNTRIES')
    expect(copy.lid.badge.photoAlt('Alex Lewin')).toBe('Alex Lewin, smiling, in a cap')
    expect(copy.lid.button.firstWeek('2.5M+')).toBe('2.5M+ SATS IN WEEK ONE')
    expect(copy.lid.record.editions(13)).toBe('13 editions')
    expect(copy.lid.record.sessions(51)).toBe('51 stage sessions')
  })

  it('words the three additions: the inventor ribbon, the patent label and the medal', () => {
    expect(copy.lid.ribbons.inventor).toBe('INVENTOR')
    expect(copy.lid.patentLabel).toEqual({
      one: 'U.S. PAT. NO.',
      many: 'U.S. PAT. NOS.',
      pending: 'OTHER PATENTS PENDING',
    })
    expect(copy.lid.medal.outOf('300+')).toBe('OF 300+')
    expect(copy.lid.medal.teams).toBe('TEAMS')
    expect(copy.lid.medal.team('Eth Heads')).toBe('Team Eth Heads')
    expect(copy.lid.medal.summary('1st', '300+', 'NCR Global Hackathon 2021', 'Eth Heads')).toBe(
      '1st of 300+ teams, NCR Global Hackathon 2021, team Eth Heads',
    )
  })

  it('types no arrows or stars on the lid: those glyphs are drawn', () => {
    const drawn = collectStrings(copy.lid).filter((text) => /[←-⇿✦★☆]/.test(text))

    expect(drawn).toEqual([])
  })
})
