import { describe, expect, it } from 'vitest'

import {
  bitcoinPlusPlusStats,
  deriveStats,
  hasExactHeadCount,
  hasPublicPrizeFigure,
  heldEvents,
  organizedStats,
  patentStats,
  publishablePatents,
  publishableProjects,
  upcomingEvents,
  winStats,
} from './derive'
import { content } from './index'
import type { Organized, Patent } from './schema'

const stats = deriveStats(content)

const upcomingWithFigures: Organized = {
  id: 'a-future-event',
  status: 'upcoming',
  name: 'A Future Event',
  date: null,
  location: { kind: 'inPerson', city: 'Lisbon', region: null, country: 'Portugal' },
  participants: { unit: 'people', count: 500 },
  prizes: { kind: 'usd', amount: 99999 },
  projects: null,
  role: null,
  note: null,
  basis: 'stated',
  source: { kind: 'owner', urls: [] },
}

function event(id: string): Organized {
  const found = content.organized.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No hackathon with id "${id}"`)
  }
  return found
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

  it('1,471 participants over the 12 events with an exact public head count', () => {
    expect(stats.organized.headCountEvents).toBe(12)
    expect(stats.organized.participants).toBe(1471)
  })

  it('$263,525 in prizes over the 14 events with a public prize figure', () => {
    expect(stats.organized.prizeEvents).toBe(14)
    expect(stats.organized.prizeUsd).toBe(263525)
  })

  it('keeps the two totals on their own denominators: they no longer share one', () => {
    const held = heldEvents(content.organized)

    expect(held.filter(hasExactHeadCount)).toHaveLength(stats.organized.headCountEvents)
    expect(held.filter(hasPublicPrizeFigure)).toHaveLength(stats.organized.prizeEvents)
    expect(stats.organized.headCountEvents).not.toBe(stats.organized.prizeEvents)
    expect(stats.organized).not.toHaveProperty('publicFigureEvents')
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

  it('leaves team counts, an approximate head count and an unknown one out of the participants', () => {
    const excluded = heldEvents(content.organized).filter((held) => !hasExactHeadCount(held))

    expect(excluded.map((held) => [held.id, held.participants?.unit ?? null])).toEqual([
      ['ai-hack-for-freedom-iii', 'teams'],
      ['btcpp-toronto-2026', null],
      ['ai-hack-for-freedom-ii', 'teams'],
      ['btcpp-florianopolis-2026', 'aboutPeople'],
    ])
  })

  it('leaves a prize in sats and an unknown prize out of the dollar total', () => {
    const excluded = heldEvents(content.organized).filter((held) => !hasPublicPrizeFigure(held))

    expect(excluded.map((held) => [held.id, held.prizes?.kind ?? null])).toEqual([
      ['btcpp-toronto-2026', 'sats'],
      ['btcpp-florianopolis-2026', null],
    ])
  })

  it('never adds sats to dollars or an approximate head count to exact ones', () => {
    const toronto = event('btcpp-toronto-2026')
    const florianopolis = event('btcpp-florianopolis-2026')
    const without = content.organized.filter((held) => held !== toronto && held !== florianopolis)

    expect(organizedStats(without)).toMatchObject({
      participants: stats.organized.participants,
      prizeUsd: stats.organized.prizeUsd,
      headCountEvents: stats.organized.headCountEvents,
      prizeEvents: stats.organized.prizeEvents,
    })
  })

  it('adds the two AI Hack for Freedom pools to the prize total and nothing to the participants', () => {
    const pools = ['ai-hack-for-freedom-ii', 'ai-hack-for-freedom-iii'].map(event)

    expect(pools.every(hasPublicPrizeFigure)).toBe(true)
    expect(pools.some(hasExactHeadCount)).toBe(false)
    expect(pools.map((held) => held.prizes)).toEqual([
      { kind: 'usd', amount: 50000 },
      { kind: 'usd', amount: 50000 },
    ])
  })

  it('counts an event with non-monetary prizes among those with a public prize figure', () => {
    const turbo = event('btcpp-ai-turbo-austin-2025')

    expect(turbo.prizes).toEqual({ kind: 'nonMonetary' })
    expect(hasPublicPrizeFigure(turbo)).toBe(true)
    expect(hasExactHeadCount(turbo)).toBe(true)
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
  it('9 wins: 6 firsts, 2 seconds, 1 prize', () => {
    expect(stats.wins).toEqual({ total: 9, firsts: 6, seconds: 2, thirds: 0, prizes: 1 })
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

describe('patents', () => {
  it('2 granted of 4 filings, with 1 still pending', () => {
    expect(stats.patents).toEqual({ granted: 2, filings: 4, pending: 1, anyPending: true })
    expect(patentStats(content.patents)).toEqual(stats.patents)
  })

  it('never counts an application as a granted patent', () => {
    const { granted, pending, filings } = stats.patents

    expect(granted).toBeLessThan(filings)
    expect(granted + pending).toBeLessThan(filings)
  })

  it('reports nothing pending once no application is', () => {
    const decided = content.patents.filter((patent) => patent.status.kind !== 'pending')

    expect(patentStats(decided)).toEqual({ granted: 2, filings: 3, pending: 0, anyPending: false })
    expect(patentStats([])).toEqual({ granted: 0, filings: 0, pending: 0, anyPending: false })
  })
})

describe('publishablePatents', () => {
  it('drops the abandoned application, which the site does not show', () => {
    const shown = publishablePatents(content.patents)

    expect(shown.map((patent) => patent.status.kind)).toEqual(['granted', 'granted', 'pending'])
  })

  it('shows it again when its flag is flipped', () => {
    const flipped: readonly Patent[] = content.patents.map((patent) => ({ ...patent, shown: true }))

    expect(publishablePatents(flipped)).toHaveLength(content.patents.length)
  })
})

describe('publishableProjects', () => {
  it('drops projects that are still to be confirmed', () => {
    const publishable = publishableProjects(content.projects)

    expect(publishable).toHaveLength(content.projects.length - 1)
    expect(publishable.every((project) => project.confirmed)).toBe(true)
  })
})
