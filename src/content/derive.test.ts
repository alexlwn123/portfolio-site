import { describe, expect, it } from 'vitest'

import {
  bitcoinPlusPlusStats,
  deriveStats,
  hasPublicFigures,
  heldEvents,
  organizedStats,
  publishableProjects,
  upcomingEvents,
  winStats,
} from './derive'
import { content } from './index'
import type { Organized } from './schema'

const stats = deriveStats(content)

const upcomingWithFigures: Organized = {
  id: 'a-future-event',
  status: 'upcoming',
  name: 'A Future Event',
  date: null,
  location: { kind: 'inPerson', city: 'Lisbon', region: null, country: 'Portugal' },
  participants: { unit: 'people', count: 500 },
  prizes: { kind: 'usd', amount: 99999 },
  note: null,
  basis: 'stated',
}

describe('organized hackathons', () => {
  it('16 organized excluding upcoming', () => {
    expect(stats.organized.count).toBe(16)
    expect(stats.organized.upcomingCount).toBe(1)
    expect(heldEvents(content.organized)).toHaveLength(16)
    expect(upcomingEvents(content.organized).map((event) => event.name)).toEqual([
      'AI Hack for Freedom IV',
    ])
  })

  it('1,471 participants and $163,525 over 12 events', () => {
    expect(stats.organized.publicFigureEvents).toBe(12)
    expect(stats.organized.participants).toBe(1471)
    expect(stats.organized.prizeUsd).toBe(163525)
  })

  it('8 countries', () => {
    expect(stats.organized.countryCount).toBe(8)
    expect(stats.organized.countries).toEqual([
      'USA',
      'Canada',
      'Kenya',
      'Brazil',
      'Taiwan',
      'Germany',
      'Türkiye',
      'Latvia',
    ])
    expect(stats.organized.includesOnline).toBe(true)
  })

  it('never counts an upcoming event, even one with figures and a new country', () => {
    const withFuture = organizedStats([upcomingWithFigures, ...content.organized])

    expect(withFuture).toEqual({ ...stats.organized, upcomingCount: 2 })
  })

  it('leaves the four events without public figures out of the totals', () => {
    const excluded = heldEvents(content.organized).filter((event) => !hasPublicFigures(event))

    expect(excluded.map((event) => event.id)).toEqual([
      'ai-hack-for-freedom-iii',
      'btcpp-toronto-2026',
      'ai-hack-for-freedom-ii',
      'btcpp-florianopolis-2026',
    ])
  })

  it('counts an event with non-monetary prizes among those with public figures', () => {
    const turbo = content.organized.find((event) => event.id === 'btcpp-ai-turbo-austin-2025')

    expect(turbo && hasPublicFigures(turbo)).toBe(true)
  })

  it('numbers the next hackathon 17 and dates the first to 2020', () => {
    expect(stats.organized.nextNumber).toBe(17)
    expect(stats.organized.sinceYear).toBe(2020)
  })

  it('reports no starting year when nothing has been held', () => {
    expect(organizedStats([upcomingWithFigures])).toMatchObject({
      count: 0,
      sinceYear: null,
      nextNumber: 1,
      countries: [],
      includesOnline: false,
    })
  })
})

describe('hackathon wins', () => {
  it('8 wins: 5 firsts, 2 seconds, 1 prize', () => {
    expect(stats.wins).toEqual({ total: 8, firsts: 5, seconds: 2, thirds: 0, prizes: 1 })
  })

  it('never counts a prize as a podium place', () => {
    const { firsts, seconds, thirds, prizes, total } = winStats(content.wins)

    expect(firsts + seconds + thirds).toBe(total - prizes)
  })
})

describe('bitcoin++ record', () => {
  it('13 editions and 51 stage sessions, from the profile figures', () => {
    expect(stats.bitcoinPlusPlus).toEqual({ editions: 13, stageSessions: 51, memberSince: 2023 })
    expect(bitcoinPlusPlusStats(content.bitcoinPlusPlus)).toEqual(stats.bitcoinPlusPlus)
  })
})

describe('publishableProjects', () => {
  it('drops projects that are still to be confirmed', () => {
    const publishable = publishableProjects(content.projects)

    expect(publishable).toHaveLength(content.projects.length - 1)
    expect(publishable.every((project) => project.confirmed)).toBe(true)
  })
})
