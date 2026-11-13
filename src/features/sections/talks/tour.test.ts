import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { Talk } from '../../../content'
import {
  onAirShows,
  partLabels,
  PASS_TALKS,
  tourDates,
  tourFormats,
  tourLegs,
  tourYears,
  workshopPass,
} from './tour'

const dates = tourDates(content.talks)

function talk(overrides: Partial<Talk>): Talk {
  return {
    id: 'a-talk',
    when: { kind: 'date', date: { year: 2025, month: 5, day: 1 } },
    title: 'A Talk',
    format: 'talk',
    role: null,
    detail: null,
    alsoListedAs: null,
    venue: { name: 'Somewhere Hall', confirmed: true },
    links: [],
    source: { kind: 'owner', urls: [] },
    ...overrides,
  }
}

function dated(id: string) {
  const found = dates.find((date) => date.id === id)
  if (!found) {
    throw new Error(`No tour date for the talk "${id}"`)
  }
  return found
}

describe('tourDates', () => {
  it('has a line for every dated appearance and none for the show that is still running', () => {
    const expected = content.talks.filter((record) => record.when?.kind === 'date')

    expect(dates).toHaveLength(expected.length)
    expect(dates).toHaveLength(15)
    expect(dates.map(({ id }) => id)).not.toContain('bitdevs-radio-hour')
  })

  it('runs newest first, and keeps the order of the record within a day', () => {
    const stamps = dates.map(({ iso }) => iso)

    expect(stamps).toEqual([...stamps].sort().reverse())
    expect(dates.slice(0, 2).map(({ id }) => id)).toEqual([
      'the-alex-lewin-experience',
      'bitcoin-takeover-s17-e46',
    ])
    expect(dates.at(-1)?.id).toBe('state-of-bitcoin-67')
  })

  it('sorts by the date, whatever order the records come in', () => {
    const shuffled = [
      talk({ id: 'old', when: { kind: 'date', date: { year: 2023, month: null, day: null } } }),
      talk({ id: 'new', when: { kind: 'date', date: { year: 2026, month: 1, day: 2 } } }),
      talk({ id: 'mid', when: { kind: 'date', date: { year: 2025, month: 7, day: null } } }),
      talk({ id: 'mid-later', when: { kind: 'date', date: { year: 2025, month: 7, day: 9 } } }),
    ]

    expect(tourDates(shuffled).map(({ id }) => id)).toEqual(['new', 'mid-later', 'mid', 'old'])
  })

  it('prints the day without its year, to the precision the record has', () => {
    expect(dated('scaling-lightning')).toMatchObject({
      day: 'Oct 3',
      iso: '2025-10-03',
      year: 2025,
    })
    expect(dated('state-of-bitcoin-67')).toMatchObject({ day: 'Mar', iso: '2023-03' })
    expect(
      tourDates([
        talk({ when: { kind: 'date', date: { year: 2024, month: null, day: null } } }),
      ])[0],
    ).toMatchObject({ day: null, iso: '2024' })
  })

  it('names the place or the show, and leaves an unconfirmed one out', () => {
    expect(dated('sovereign-banks-fedi').venue).toBe('bitcoin++ Taipei')
    expect(dated('ai-unchained-003').venue).toBe('AI Unchained, Ai_003')
    expect(
      tourDates([talk({ venue: { name: 'Somewhere Hall', confirmed: false } })])[0]?.venue,
    ).toBe(null)
    expect(tourDates([talk({ venue: null })])[0]?.venue).toBe(null)
  })

  it('links a line to its first address, and keeps the others', () => {
    expect(dated('scaling-lightning').link).toEqual({
      label: 'Video on YouTube',
      url: 'https://www.youtube.com/watch?v=oFDaC_2WjP0',
    })
    expect(dated('scaling-lightning').more).toEqual([])
    expect(dated('teaching-ai-as-a-tool-for-freedom').link?.label).toBe('Broadcast on X')
    expect(dated('teaching-ai-as-a-tool-for-freedom').more).toEqual([
      { label: 'Event page', url: 'https://luma.com/pubkey-jj3u' },
    ])
    expect(dated('fun-with-lightning').link).toBeNull()
  })

  it('carries every title as the record has it', () => {
    for (const date of dates) {
      expect(content.talks.find(({ id }) => id === date.id)?.title).toBe(date.title)
    }
  })
})

describe('partLabels', () => {
  it('says what the appearance was and the part he played', () => {
    expect(dated('elevating-the-ux-of-self-custody').parts).toEqual(['Panel', 'Moderator'])
    expect(dated('bitcoin-takeover-s17-e46').parts).toEqual(['Podcast', 'Guest'])
    expect(dated('how-to-win-every-hackathon').parts).toEqual(['Workshop'])
    expect(dated('teaching-ai-as-a-tool-for-freedom').parts).toEqual(['Discussion'])
  })

  it('does not call a panelist on a panel a panelist as well', () => {
    expect(dated('lightning-plus-ecash').parts).toEqual(['Panel'])
    expect(partLabels(talk({ format: null, role: 'panelist' }))).toEqual(['Panelist'])
  })

  it('says nothing where the record says nothing', () => {
    expect(dated('fedimint-wallet-in-20-minutes').parts).toEqual([])
    expect(dated('the-alex-lewin-experience').parts).toEqual([])
  })
})

describe('tourLegs', () => {
  it('groups the dates by year, newest year first', () => {
    const legs = tourLegs(content.talks)

    expect(legs.map(({ year }) => year)).toEqual([2026, 2025, 2024, 2023])
    expect(legs.map(({ dates: inYear }) => inYear.length)).toEqual([5, 3, 4, 3])
    expect(legs.flatMap(({ dates: inYear }) => inYear)).toEqual(dates)
  })

  it('has no legs when there is nothing to list', () => {
    expect(tourLegs([])).toEqual([])
    expect(tourLegs([talk({ when: { kind: 'ongoing' } })])).toEqual([])
  })

  it('keeps an appearance the record does not date, last and in a leg without a year', () => {
    const legs = tourLegs([talk({ id: 'undated', when: null }), talk({ id: 'dated' })])

    expect(legs.map(({ year }) => year)).toEqual([2025, null])
    expect(legs.at(-1)?.dates).toMatchObject([{ id: 'undated', day: null, iso: null, year: null }])
  })

  it('puts a date known to the day ahead of the same date known only to the month', () => {
    const month = talk({
      id: 'month',
      when: { kind: 'date', date: { year: 2025, month: 7, day: null } },
    })
    const first = talk({
      id: 'first',
      when: { kind: 'date', date: { year: 2025, month: 7, day: 1 } },
    })

    expect(tourDates([month, first]).map(({ id }) => id)).toEqual(['first', 'month'])
  })
})

describe('tourYears', () => {
  it('reads the first and the last year of the tour from the records', () => {
    expect(tourYears(content.talks)).toEqual({ first: 2023, last: 2026 })
  })

  it('is null when nothing is dated', () => {
    expect(tourYears([talk({ when: { kind: 'ongoing' } }), talk({ when: null })])).toBeNull()
  })
})

describe('tourFormats', () => {
  it('lists the kinds of appearance on the tour, the most frequent first', () => {
    expect(tourFormats(content.talks)).toEqual([
      'workshop',
      'podcast',
      'panel',
      'talk',
      'discussion',
    ])
  })

  it('counts only what the records give a format', () => {
    expect(tourFormats([talk({ format: null }), talk({ format: 'panel' })])).toEqual(['panel'])
  })
})

describe('onAirShows', () => {
  it('finds the show he is still on, with his part and its links', () => {
    expect(onAirShows(content.talks)).toEqual([
      {
        id: 'bitdevs-radio-hour',
        title: 'BitDevs Radio Hour',
        parts: ['Podcast', 'Co-host'],
        detail: 'A weekly podcast on technical bitcoin news, with Stephen DeLorme',
        links: [
          {
            label: 'Playlist on YouTube',
            url: 'https://youtube.com/playlist?list=PLy-DXclpjVLJZGXeBDY-9T2HoG708WfnX',
          },
          { label: 'Apple Podcasts', url: 'https://podcasts.apple.com/podcast/id1791756302' },
        ],
      },
    ])
  })

  it('finds none among dated talks', () => {
    expect(onAirShows([talk({})])).toEqual([])
  })
})

describe('workshopPass', () => {
  it('is for the workshop he has given twice, with where and when', () => {
    expect(workshopPass(content.talks)).toEqual({
      id: 'how-to-win-every-hackathon',
      title: 'How to Win Every Hackathon',
      lines: ['How to Win', 'Every Hackathon'],
      format: 'Workshop',
      given: [
        { id: 'how-to-win-every-hackathon', venue: 'bitcoin++ Florianópolis', year: 2025 },
        { id: 'fun-with-lightning', venue: 'bitcoin++ Buenos Aires', year: 2024 },
      ],
      links: [{ label: 'Video on YouTube', url: 'https://www.youtube.com/watch?v=X9yLrPk_LnE' }],
    })
    expect(PASS_TALKS).toHaveLength(2)
  })

  it('counts only the runs that are in the record', () => {
    const [first] = PASS_TALKS
    const only = content.talks.filter(({ id }) => id === first)

    expect(workshopPass(only)?.given).toHaveLength(1)
  })

  it('is not made when the workshop is not in the record', () => {
    expect(workshopPass([talk({})])).toBeNull()
  })

  it('leaves out a place that is unconfirmed and a format that is not recorded', () => {
    const [first] = PASS_TALKS
    const pass = workshopPass([
      talk({ id: first, format: null, venue: { name: 'Somewhere Hall', confirmed: false } }),
    ])

    expect(pass?.format).toBeNull()
    expect(pass?.given).toEqual([{ id: first, venue: null, year: 2025 }])
  })

  it('gives no year for a run the record does not date', () => {
    const [first] = PASS_TALKS
    const pass = workshopPass([talk({ id: first, when: { kind: 'ongoing' } })])

    expect(pass?.given).toEqual([{ id: first, venue: 'Somewhere Hall', year: null }])
  })
})
