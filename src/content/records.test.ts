import { describe, expect, it } from 'vitest'

import { education, experience } from './experience'
import { organized } from './organized'
import { patents } from './patents'
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

  it('links to his live LinkedIn profile, corrected from the public record', () => {
    const linkedin = byId(profile.links, 'linkedin')

    expect(linkedin.url).toBe('https://www.linkedin.com/in/alex-lewin1/')
    expect(linkedin.source.kind).toBe('publicRecord')
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

  it('dates Auburn from 2018 to 2021 without claiming a graduation', () => {
    const auburn = byId(education, 'auburn-university')

    expect(auburn.start).toEqual({ year: 2018, month: 8, day: null })
    expect(auburn.end).toEqual({ year: 2021, month: null, day: null })
    expect(auburn.graduated).toBeNull()
    expect(auburn.source).toMatchObject({
      kind: 'publicRecord',
      urls: ['https://www.linkedin.com/in/alex-lewin1/'],
    })
  })
})

describe('wins', () => {
  it('lists the nine wins, newest first', () => {
    expect(wins.map((win) => win.id)).toEqual([
      'stringer-safety',
      'lightning-welder',
      'bitdevs-upgrade',
      'auntie-ln',
      'last-pay-wins',
      'pleb-fm',
      'arion-parking',
      'treepay-ux',
      'ncr-global-hackathon-2021',
    ])
    const years = wins.map((win) => win.year)
    expect(years).toEqual(years.toSorted((a, b) => b - a))
  })

  it('records the NCR win: first place of 300+ teams, as team Eth Heads', () => {
    const ncr = byId(wins, 'ncr-global-hackathon-2021')

    expect(ncr).toMatchObject({
      year: 2021,
      event: 'NCR Global Hackathon',
      edition: '3rd annual',
      result: { kind: 'place', place: 1, qualifier: null },
      field: { unit: 'teams', count: 300, atLeast: true },
    })
    expect(ncr.team).toEqual({
      name: 'Eth Heads',
      teammates: [
        'Bryan W. Nonni',
        'Sam (Abdulwahab) Jarkas',
        'Christian McDaniel',
        'Stefan Bjelcevic',
        'Jay Arcement',
      ],
    })
    expect(ncr.source).toEqual({
      kind: 'owner',
      urls: [
        'https://www.linkedin.com/posts/alex-lewin1_its-been-a-wild-first-month-in-the-real-share-6829077224755392512-INuT/',
      ],
    })
  })

  it('does not say what the NCR project was or what it was called, because nobody has', () => {
    const ncr = byId(wins, 'ncr-global-hackathon-2021')

    expect(ncr.project).toBeNull()
    expect(ncr.description).toBeNull()
    expect(ncr.eventDate).toBeNull()
  })

  it('AI4All is a prize, not a place', () => {
    const ai4all = byId(wins, 'bitdevs-upgrade')

    expect(ai4all.event).toBe('AI4All')
    expect(ai4all.result.kind).toBe('prize')
    expect(ai4all.result).not.toHaveProperty('place')
  })

  it('dates AI4All to July 2023 and names its prize, from the public record', () => {
    const ai4all = byId(wins, 'bitdevs-upgrade')

    expect(ai4all.year).toBe(2023)
    expect(ai4all.eventDate).toEqual({
      start: { year: 2023, month: 7, day: 1 },
      end: { year: 2023, month: 7, day: 31 },
    })
    expect(ai4all.result).toEqual({ kind: 'prize', prizeName: 'Bitcoin Education Track' })
    expect(ai4all.project).toBe('BitDevs Upgrade')
    expect(ai4all.announcedAs).toBe('BitDevs Upgraded')
    expect(ai4all.description).toBe(
      'A project to improve the UX of BitDevs websites and add AI generated summaries to help new attendees.',
    )
    expect(ai4all.source).toMatchObject({
      kind: 'publicRecord',
      urls: [
        'https://www.fedi.xyz/blog/prizes-and-promise-coming-out-of-the-ai4all-hackathon',
        'https://github.com/atlantabitdevs/bitdevs-upgrade',
      ],
    })
  })

  it('sources his place on the Stringer Safety team to his own post, with no caveat left', () => {
    const stringer = byId(wins, 'stringer-safety')

    expect(stringer.caveat).toBeNull()
    expect(stringer.source).toMatchObject({
      kind: 'publicRecord',
      urls: ['https://x.com/ALewin/status/2013474336208835045'],
    })
  })

  it('states the place of the newest win and the Last Pay Wins figure as data, not prose', () => {
    expect(byId(wins, 'stringer-safety').eventPlace).toEqual({
      venue: 'Bitcoin Park',
      city: 'Austin',
      region: 'TX',
    })
    expect(byId(wins, 'last-pay-wins').firstWeekSats).toEqual({ sats: 2_500_000, atLeast: true })
    expect(wins.flatMap((win) => win.notes).join(' ')).not.toMatch(/2\.5 million/)
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

  it('flags AI Hack for Freedom IV as upcoming, with the dates and city now announced', () => {
    expect(byId(organized, 'ai-hack-for-freedom-iv')).toMatchObject({
      status: 'upcoming',
      date: { start: { year: 2026, month: 12, day: 2 }, end: { year: 2026, month: 12, day: 4 } },
      location: { kind: 'inPerson', city: 'San Francisco', region: 'CA', country: 'USA' },
      participants: null,
      prizes: null,
      source: { kind: 'publicRecord', urls: ['https://www.aihackforfreedom.org/'] },
    })
  })

  it('includes Toronto 2026 and Florianópolis 2026, marked as inferred from his profile', () => {
    const toronto = byId(organized, 'btcpp-toronto-2026')
    const florianopolis = byId(organized, 'btcpp-florianopolis-2026')

    expect(toronto).toMatchObject({ status: 'held', basis: 'inferredFromProfile' })
    expect(florianopolis).toMatchObject({ status: 'held', basis: 'inferredFromProfile' })
  })

  it('stores Toronto’s projects and its prize in sats, which is not a dollar figure', () => {
    const toronto = byId(organized, 'btcpp-toronto-2026')

    expect(toronto.projects).toBe(16)
    expect(toronto.prizes).toEqual({ kind: 'sats', amount: 17_542_000 })
    expect(toronto.participants).toBeNull()
    expect(toronto.source).toMatchObject({
      kind: 'publicRecord',
      urls: ['https://btcpp.dev/toronto/hackathon'],
    })
  })

  it('stores Florianópolis 2026’s head count as approximate, which is not an exact one', () => {
    const florianopolis = byId(organized, 'btcpp-florianopolis-2026')

    expect(florianopolis.participants).toEqual({ unit: 'aboutPeople', count: 60 })
    expect(florianopolis.projects).toBe(21)
    expect(florianopolis.prizes).toBeNull()
    expect(florianopolis.source).toMatchObject({
      kind: 'publicRecord',
      urls: ['https://insider.btcpp.dev/p/bitcoin-exploits-edition-hackathon'],
    })
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

  it('dates AI Hack for Freedom II and III to the day and gives each its $50,000 pool', () => {
    expect(byId(organized, 'ai-hack-for-freedom-ii')).toMatchObject({
      date: { start: { year: 2026, month: 5, day: 9 }, end: { year: 2026, month: 5, day: 10 } },
      location: { city: 'Nashville' },
      prizes: { kind: 'usd', amount: 50000 },
      source: {
        kind: 'publicRecord',
        urls: ['https://hrf.org/latest/announcing-the-winners-of-ai-hack-for-freedom-ii/'],
      },
    })
    expect(byId(organized, 'ai-hack-for-freedom-iii')).toMatchObject({
      date: { start: { year: 2026, month: 9, day: 24 }, end: { year: 2026, month: 9, day: 25 } },
      location: { city: 'Washington' },
      prizes: { kind: 'usd', amount: 50000 },
      source: {
        kind: 'publicRecord',
        urls: ['https://hrf.org/latest/announcing-the-winners-of-ai-hack-for-freedom-iii/'],
      },
    })
  })

  it('records that he was executive director of AuburnHacks 2021', () => {
    const auburnHacks = byId(organized, 'auburnhacks-2021')

    expect(auburnHacks.role).toBe('Executive director')
    expect(auburnHacks.source).toMatchObject({
      kind: 'publicRecord',
      urls: ['https://eng.auburn.edu/news/2021/04/auburnhacks-2021.html'],
    })
  })

  it('lists held events newest first', () => {
    const starts = organized
      .filter((event) => event.status === 'held')
      .map(
        ({ date }) =>
          date.start.year * 10000 + (date.start.month ?? 0) * 100 + (date.start.day ?? 0),
      )

    expect(starts).toEqual(starts.toSorted((a, b) => b - a))
  })
})

describe('talks', () => {
  it('lists sixteen entries: the dated ones newest first, then the podcast he co-hosts', () => {
    expect(talks.map((talk) => talk.id)).toEqual([
      'the-alex-lewin-experience',
      'bitcoin-takeover-s17-e46',
      'teaching-ai-as-a-tool-for-freedom',
      'elevating-the-ux-of-self-custody',
      'lightning-plus-ecash',
      'sovereign-banks-fedi',
      'scaling-lightning',
      'how-to-win-every-hackathon',
      'fedimint-sdk-workshop',
      'fedimint-wallet-in-20-minutes',
      'how-ecash-works',
      'fun-with-lightning',
      'extending-bitcoin-with-zk-proofs',
      'ai-unchained-003',
      'state-of-bitcoin-67',
      'bitdevs-radio-hour',
    ])
    const dated = talks.flatMap(({ when }) =>
      when?.kind === 'date'
        ? [when.date.year * 10000 + (when.date.month ?? 0) * 100 + (when.date.day ?? 0)]
        : [],
    )
    expect(dated).toHaveLength(15)
    expect(dated).toEqual(dated.toSorted((a, b) => b - a))
  })

  it('keeps one record for the Sovereign Banks workshop: Taipei, with its video', () => {
    const talk = byId(talks, 'sovereign-banks-fedi')

    expect(talks.filter(({ title }) => title.includes('Sovereign Banks'))).toHaveLength(1)
    expect(talk).toMatchObject({
      when: { kind: 'date', date: { year: 2025, month: 12, day: 15 } },
      title: 'Building Sovereign Banks with Fedi',
      alsoListedAs: 'Building Sovereign Banks with Fedimint',
      format: 'workshop',
      venue: { name: 'bitcoin++ Taipei', confirmed: true },
      links: [{ label: 'Video on YouTube', url: 'https://youtu.be/-anhf5szB2I' }],
    })
    expect(talks.every((entry) => entry.venue?.confirmed !== false)).toBe(true)
  })

  it('records that he co-hosts BitDevs Radio Hour', () => {
    const podcast = byId(talks, 'bitdevs-radio-hour')

    expect(podcast.when).toEqual({ kind: 'ongoing' })
    expect(podcast.role).toBe('coHost')
    expect(podcast.detail).toContain('Stephen DeLorme')
    expect(podcast.source).toMatchObject({
      kind: 'publicRecord',
      urls: ['https://podcasts.apple.com/podcast/id1791756302'],
    })
  })

  it('dates the PubKey discussion and the Btrust workshop to the day', () => {
    expect(byId(talks, 'teaching-ai-as-a-tool-for-freedom').when).toEqual({
      kind: 'date',
      date: { year: 2026, month: 8, day: 5 },
    })
    expect(byId(talks, 'fedimint-sdk-workshop')).toMatchObject({
      when: { kind: 'date', date: { year: 2024, month: 12, day: 8 } },
      venue: { name: 'Btrust Developer Day, Africa Bitcoin Conference 2024, Nairobi' },
    })
  })

  it('says what part he played where it was not simply giving the talk', () => {
    const roles = Object.fromEntries(
      talks.flatMap((talk) => (talk.role === null ? [] : [[talk.id, talk.role]])),
    )

    expect(roles).toEqual({
      'bitcoin-takeover-s17-e46': 'guest',
      'elevating-the-ux-of-self-custody': 'moderator',
      'lightning-plus-ecash': 'panelist',
      'ai-unchained-003': 'guest',
      'state-of-bitcoin-67': 'guest',
      'bitdevs-radio-hour': 'coHost',
    })
  })

  it('keeps the State of Bitcoin episode to its month, because the day is not verified', () => {
    expect(byId(talks, 'state-of-bitcoin-67').when).toEqual({
      kind: 'date',
      date: { year: 2023, month: 3, day: null },
    })
  })

  it('marks every talk found by research as from the public record, with where it was found', () => {
    const found = talks.filter((talk) => talk.source.kind === 'publicRecord')

    expect(found.map((talk) => talk.id)).toEqual([
      'the-alex-lewin-experience',
      'bitcoin-takeover-s17-e46',
      'teaching-ai-as-a-tool-for-freedom',
      'elevating-the-ux-of-self-custody',
      'lightning-plus-ecash',
      'sovereign-banks-fedi',
      'fedimint-sdk-workshop',
      'how-ecash-works',
      'extending-bitcoin-with-zk-proofs',
      'ai-unchained-003',
      'state-of-bitcoin-67',
      'bitdevs-radio-hour',
    ])
    const unsourced = found.filter((talk) => talk.source.urls.length === 0)
    expect(unsourced.map((talk) => talk.id)).toEqual(['fedimint-sdk-workshop'])
  })

  it('carries the bitcoin++ profile figures', () => {
    expect(bitcoinPlusPlus.memberSince).toBe(2023)
    expect(bitcoinPlusPlus.editionsAttended).toBe(13)
    expect(bitcoinPlusPlus.stageSessions).toBe(51)
    expect(bitcoinPlusPlus.editions).toHaveLength(13)
  })
})

describe('patents', () => {
  it('lists four US filings: two granted, one pending and one abandoned', () => {
    expect(patents.map((patent) => [patent.number.serial, patent.status.kind])).toEqual([
      ['12,536,579', 'granted'],
      ['12,354,083', 'granted'],
      ['2023/0032782', 'pending'],
      ['2024/0037539', 'abandoned'],
    ])
    expect(new Set(patents.map((patent) => patent.number.office))).toEqual(new Set(['US']))
  })

  it('records each granted patent with its title, grant date, assignee and co-inventor', () => {
    expect(byId(patents, 'us-12536579')).toMatchObject({
      number: { office: 'US', serial: '12,536,579', kindCode: 'B2' },
      title: 'Methods and a system for in-store navigation',
      filed: { year: 2021, month: 7, day: 2 },
      status: { kind: 'granted', granted: { year: 2026, month: 1, day: 27 } },
      assignee: 'NCR Voyix Corp',
      coInventors: ['Christian Lee McDaniel'],
      link: {
        label: 'Google Patents',
        url: 'https://patents.google.com/patent/US12536579B2/en',
      },
    })
    expect(byId(patents, 'us-12354083')).toMatchObject({
      number: { office: 'US', serial: '12,354,083', kindCode: 'B2' },
      title: 'Self-sovereign identity structured messaging for cross channel authentication',
      filed: { year: 2022, month: 4, day: 29 },
      status: { kind: 'granted', granted: { year: 2025, month: 7, day: 8 } },
      assignee: 'Digital First Holdings LLC',
      coInventors: ['Bryan Walser Nonni'],
      link: {
        label: 'Google Patents',
        url: 'https://patents.google.com/patent/US12354083B2/en',
      },
    })
  })

  it('records the two applications with the dates they were filed', () => {
    expect(byId(patents, 'us-20230032782')).toMatchObject({
      number: { kindCode: 'A1' },
      title: 'Self-Sovereign Identity Verifiable Credentials for Consent Processing',
      filed: { year: 2022, month: 10, day: 14 },
      status: { kind: 'pending' },
      assignee: 'NCR Corp',
      coInventors: ['Bryan Walser Nonni'],
      link: {
        label: 'Google Patents',
        url: 'https://patents.google.com/patent/US20230032782A1/en',
      },
    })
    expect(byId(patents, 'us-20240037539')).toMatchObject({
      number: { kindCode: 'A1' },
      title: 'Methods and a system for managing and integrating non-fungible tokens (NFTs)',
      filed: { year: 2022, month: 7, day: 29 },
      status: { kind: 'abandoned' },
      assignee: 'NCR Voyix Corp',
      coInventors: ['Bryan Walser Nonni', 'Brent Vance Zucker'],
      link: {
        label: 'Google Patents',
        url: 'https://patents.google.com/patent/US20240037539A1/en',
      },
    })
  })

  it('shows all four: no filing that names him is held back', () => {
    expect(patents.filter((patent) => patent.shown).map((patent) => patent.id)).toEqual([
      'us-12536579',
      'us-12354083',
      'us-20230032782',
      'us-20240037539',
    ])
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

  it('records a headline only where the file quotes one', () => {
    expect(press.map((item) => item.title)).toEqual([
      'Human rights activists look to harness AI for the greater good',
      null,
      null,
    ])
  })
})
