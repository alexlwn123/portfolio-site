import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import {
  bitcoinPlusPlusSummary,
  experienceWhen,
  locationLabel,
  organizedSummary,
  participantsLabel,
  plural,
  prizesLabel,
  resultLabel,
  winsSummary,
} from './describe'

describe('resultLabel', () => {
  it('writes podium places as ordinals', () => {
    expect(resultLabel({ kind: 'place', place: 1, qualifier: null })).toBe('1st')
    expect(resultLabel({ kind: 'place', place: 2, qualifier: null })).toBe('2nd')
    expect(resultLabel({ kind: 'place', place: 3, qualifier: null })).toBe('3rd')
  })

  it('adds the qualifier the file gives', () => {
    expect(resultLabel({ kind: 'place', place: 1, qualifier: 'overall' })).toBe('1st overall')
    expect(resultLabel({ kind: 'place', place: 2, qualifier: 'tied' })).toBe('2nd (tied)')
  })

  it('never gives a prize a placement', () => {
    const unnamed = resultLabel({ kind: 'prize', prizeName: null })
    const named = resultLabel({ kind: 'prize', prizeName: 'Education Prize' })

    expect(unnamed).toBe('Prize winner')
    expect(named).toBe('Prize winner: Education Prize')
    expect(`${unnamed} ${named}`).not.toMatch(/1st|2nd|3rd|first|second|third|place/i)
  })
})

describe('locationLabel', () => {
  it('writes city, region and country', () => {
    expect(locationLabel({ kind: 'inPerson', city: 'Austin', region: 'TX', country: 'USA' })).toBe(
      'Austin, TX, USA',
    )
    expect(
      locationLabel({ kind: 'inPerson', city: 'Nairobi', region: null, country: 'Kenya' }),
    ).toBe('Nairobi, Kenya')
  })

  it('writes online events, with their context when there is one', () => {
    expect(locationLabel({ kind: 'online', context: null })).toBe('Online')
    expect(locationLabel({ kind: 'online', context: 'for a conference' })).toBe(
      'Online, for a conference',
    )
  })
})

describe('participantsLabel and prizesLabel', () => {
  it('keeps people and teams as different units', () => {
    expect(participantsLabel({ unit: 'people', count: 832 })).toBe('832 participants')
    expect(participantsLabel({ unit: 'people', count: 1 })).toBe('1 participant')
    expect(participantsLabel({ unit: 'teams', count: 10 })).toBe('10 teams')
    expect(participantsLabel({ unit: 'teams', count: 1 })).toBe('1 team')
  })

  it('formats dollar prizes and names the other kinds without inventing an amount', () => {
    expect(prizesLabel({ kind: 'usd', amount: 58750 })).toBe('$58,750 in prizes')
    expect(prizesLabel({ kind: 'nonMonetary' })).toBe('Non-monetary prizes')
    expect(prizesLabel({ kind: 'bitcoin', amountPublic: false })).toBe('Prizes paid in bitcoin')
  })
})

describe('summaries', () => {
  it('summarizes the wins from the derived stats', () => {
    expect(winsSummary(stats.wins)).toBe('8 wins: 5 first places, 2 second places and 1 prize.')
  })

  it('leaves out kinds of result with no wins and uses singulars', () => {
    expect(winsSummary({ total: 1, firsts: 1, seconds: 0, thirds: 0, prizes: 0 })).toBe(
      '1 win: 1 first place.',
    )
    expect(winsSummary({ total: 3, firsts: 0, seconds: 1, thirds: 2, prizes: 0 })).toBe(
      '3 wins: 1 second place and 2 third places.',
    )
  })

  it('summarizes the organized hackathons from the derived stats', () => {
    expect(organizedSummary(stats.organized)).toEqual([
      '16 hackathons in 8 countries (USA, Canada, Kenya, Brazil, Taiwan, Germany, Türkiye, Latvia) plus online.',
      'The 12 events with public figures add up to 1,471 participants and $163,525 in prizes.',
    ])
  })

  it('does not mention online when nothing was held online', () => {
    const [first] = organizedSummary({ ...stats.organized, includesOnline: false })

    expect(first).not.toMatch(/online/i)
  })

  it('summarizes the bitcoin++ record from the derived stats', () => {
    expect(bitcoinPlusPlusSummary(stats.bitcoinPlusPlus)).toBe(
      'bitcoin++ community member since 2023: 13 editions attended and 51 stage sessions.',
    )
  })
})

describe('experienceWhen', () => {
  const [current, previous] = content.experience

  it('marks the current role and gives no date when the start is not recorded', () => {
    expect(current && experienceWhen(current)).toEqual({ label: 'Current', date: null })
  })

  it('gives a start date only, because end dates are not recorded', () => {
    expect(previous && experienceWhen(previous)).toEqual({
      label: 'From',
      date: { year: 2024, month: 3, day: null },
    })
  })

  it('gives nothing at all for a past role with no start date', () => {
    expect(previous && experienceWhen({ ...previous, start: null })).toBeNull()
  })

  it('gives both for a current role with a known start', () => {
    const start = { year: 2026, month: 1, day: null }

    expect(current && experienceWhen({ ...current, start })).toEqual({
      label: 'Current, from',
      date: start,
    })
  })
})

describe('plural', () => {
  it('picks the form that matches the count', () => {
    expect(plural(1, 'win', 'wins')).toBe('1 win')
    expect(plural(0, 'win', 'wins')).toBe('0 wins')
    expect(plural(1471, 'participant', 'participants')).toBe('1,471 participants')
  })
})
