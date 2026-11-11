import { describe, expect, it } from 'vitest'

import { education, experience } from './experience'
import { organized } from './organized'
import { press } from './press'
import { profile } from './profile'
import { projects } from './projects'
import { PERSONAL_MAIL_DOMAINS } from './schema'
import { bitcoinPlusPlus, talks } from './talks'
import { wins } from './wins'

function byId<T extends { readonly id: string }>(records: readonly T[], id: string): T {
  const record = records.find((candidate) => candidate.id === id)
  if (!record) {
    throw new Error(`No record with id "${id}"`)
  }
  return record
}

describe('profile', () => {
  it('publishes the work email, never a personal mailbox', () => {
    const domain = profile.email.split('@')[1] ?? ''

    expect(domain).toBe('finite.computer')
    expect(PERSONAL_MAIL_DOMAINS).not.toContain(domain)
  })

  it('carries the title exactly as printed on the business card', () => {
    expect(profile.role).toEqual({
      title: 'Minister of Development',
      organization: 'Finite Computer',
    })
  })

  it('links only to https addresses', () => {
    for (const link of profile.links) {
      expect(link.url).toMatch(/^https:\/\//)
    }
  })
})

describe('experience and education', () => {
  it('lists five roles, newest first, with only the first marked current', () => {
    expect(experience.map((role) => role.organization)).toEqual([
      'Finite Computer',
      'Fedi',
      'Zion',
      'BlockSpaces',
      'NCR Corporation',
    ])
    expect(experience.map((role) => role.current)).toEqual([true, false, false, false, false])
  })

  it('leaves unknown dates as null instead of guessing', () => {
    expect(byId(experience, 'finite-computer').start).toBeNull()
    expect(experience.every((role) => role.end === null)).toBe(true)
    expect(education.every((entry) => entry.graduated === null)).toBe(true)
  })
})

describe('wins', () => {
  it('lists the eight wins, newest first', () => {
    expect(wins.map((win) => win.project)).toEqual([
      'Stringer Safety',
      'Lightning Welder',
      'BitDevs Upgrade',
      'Auntie LN',
      'Last Pay Wins',
      'Pleb FM',
      'Arion Parking',
      'TreePay UX',
    ])
  })

  it('AI4All is a prize, not a place', () => {
    const ai4all = byId(wins, 'bitdevs-upgrade')

    expect(ai4all.event).toBe('AI4All')
    expect(ai4all.result.kind).toBe('prize')
    expect(ai4all.result).not.toHaveProperty('place')
  })

  it('does not describe BitDevs Upgrade or name its prize, because the file does not', () => {
    const ai4all = byId(wins, 'bitdevs-upgrade')

    expect(ai4all.description).toBeNull()
    expect(ai4all.result).toEqual({ kind: 'prize', prizeName: null })
  })

  it('records that Lightning Welder won at an event he also ran', () => {
    expect(byId(wins, 'lightning-welder').alsoOrganizedId).toBe('btcpp-berlin-2024')
    expect(byId(organized, 'btcpp-berlin-2024').name).toBe('bitcoin++ ecash edition')
  })
})

describe('organized', () => {
  it('holds seventeen records: sixteen held and one upcoming', () => {
    expect(organized).toHaveLength(17)
    expect(organized.filter((event) => event.status === 'held')).toHaveLength(16)
    expect(organized.filter((event) => event.status === 'upcoming')).toHaveLength(1)
  })

  it('flags AI Hack for Freedom IV as upcoming with nothing announced', () => {
    expect(byId(organized, 'ai-hack-for-freedom-iv')).toMatchObject({
      status: 'upcoming',
      date: null,
      location: null,
      participants: null,
      prizes: null,
    })
  })

  it('includes Toronto 2026 and Florianópolis 2026, marked as inferred from his profile', () => {
    const toronto = byId(organized, 'btcpp-toronto-2026')
    const florianopolis = byId(organized, 'btcpp-florianopolis-2026')

    expect(toronto).toMatchObject({ status: 'held', basis: 'inferredFromProfile' })
    expect(florianopolis).toMatchObject({ status: 'held', basis: 'inferredFromProfile' })
    expect(toronto.participants).toBeNull()
    expect(florianopolis.prizes).toBeNull()
  })

  it('counts teams, not people, for the AI Hack for Freedom editions he organized', () => {
    expect(byId(organized, 'ai-hack-for-freedom-iii').participants).toEqual({
      unit: 'teams',
      count: 10,
    })
    expect(byId(organized, 'ai-hack-for-freedom-ii').participants).toEqual({
      unit: 'teams',
      count: 8,
    })
  })

  it('lists held events newest first', () => {
    const starts = organized
      .filter((event) => event.status === 'held')
      .map(
        ({ date }) =>
          date.start.year * 10000 + (date.start.month ?? 0) * 100 + (date.start.day ?? 0),
      )

    expect(starts).toEqual([...starts].sort((a, b) => b - a))
  })
})

describe('talks', () => {
  it('lists the nine entries from the file', () => {
    expect(talks).toHaveLength(9)
  })

  it('flags the Bitcoin Park venue as unconfirmed and leaves that talk undated', () => {
    const talk = byId(talks, 'sovereign-banks-fedimint')

    expect(talk.venue).toEqual({ name: 'Bitcoin Park', confirmed: false })
    expect(talk.when).toBeNull()
  })

  it('states no role on BitDevs Radio Hour, because none is recorded', () => {
    const podcast = byId(talks, 'bitdevs-radio-hour')

    expect(podcast.when).toEqual({ kind: 'ongoing' })
    expect(podcast).not.toHaveProperty('role')
  })

  it('carries the bitcoin++ profile figures', () => {
    expect(bitcoinPlusPlus.memberSince).toBe(2023)
    expect(bitcoinPlusPlus.editionsAttended).toBe(13)
    expect(bitcoinPlusPlus.stageSessions).toBe(51)
    expect(bitcoinPlusPlus.editions).toHaveLength(13)
  })
})

describe('projects', () => {
  it('lists the nineteen projects in the order of his profile', () => {
    expect(projects).toHaveLength(19)
    expect(projects[0]?.name).toBe('BTC Plinko')
    expect(projects.at(-1)?.name).toBe('Agent Camp Hack-and-Tell')
  })

  it('points "see wins" projects at their win instead of repeating the description', () => {
    const linked = projects.filter((project) => project.winId !== null)

    expect(linked.map((project) => project.id)).toEqual([
      'last-pay-wins',
      'pleb-fm',
      'lightning-welder',
      'arion-parking',
      'auntie-ln',
      'treepay-ux',
      'stringer-safety',
    ])
    expect(linked.every((project) => project.description === null)).toBe(true)
  })

  it('holds back the one project the file says to confirm before featuring', () => {
    const unconfirmed = projects.filter((project) => !project.confirmed)

    expect(unconfirmed.map((project) => project.id)).toEqual(['agent-camp-hack-and-tell'])
  })

  it('keeps the Chesscup record claim apart from the description', () => {
    const chesscup = byId(projects, 'chesscup-hack')

    expect(chesscup.description).not.toMatch(/record/i)
    expect(chesscup.unverifiedClaim).toMatch(/world records/)
  })
})

describe('press', () => {
  it('models the NPR piece as coverage of an event that names neither it nor him', () => {
    const npr = byId(press, 'npr-all-things-considered')

    expect(npr.outlet).toBe('NPR')
    expect(npr.subject).toEqual({
      kind: 'organizedEvent',
      organizedId: 'ai-hack-for-freedom-iii',
      namesEvent: false,
      namesOwner: false,
    })
  })

  it('ties the Human Rights Foundation announcement to the Stringer Safety win', () => {
    expect(byId(press, 'hrf-winners-announcement').subject).toEqual({
      kind: 'win',
      winId: 'stringer-safety',
      namesOwner: false,
    })
  })
})
