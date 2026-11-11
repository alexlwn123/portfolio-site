import { describe, expect, it } from 'vitest'

import {
  bitcoinPlusPlusSchema,
  httpsUrlSchema,
  organizedSchema,
  partialDateSchema,
  PERSONAL_MAIL_DOMAINS,
  pressSchema,
  winResultSchema,
  winSchema,
  workEmailSchema,
} from './schema'

const validWin = {
  id: 'example-win',
  year: 2024,
  event: 'Example Hackathon',
  eventDate: null,
  eventPlace: null,
  result: { kind: 'place', place: 1, qualifier: null },
  project: 'Example Project',
  description: null,
  notes: [],
  caveat: null,
  alsoOrganizedId: null,
}

const validHeld = {
  id: 'example-held',
  status: 'held',
  name: 'Example Hackathon',
  date: { start: { year: 2025, month: 5, day: 8 }, end: null },
  location: { kind: 'inPerson', city: 'Austin', region: 'TX', country: 'USA' },
  participants: { unit: 'people', count: 30 },
  prizes: { kind: 'usd', amount: 10000 },
  note: null,
  basis: 'stated',
}

describe('httpsUrlSchema', () => {
  it('accepts https URLs', () => {
    expect(httpsUrlSchema.parse('https://example.com/path')).toBe('https://example.com/path')
  })

  it.each(['http://example.com', 'ftp://example.com', 'example.com', 'mailto:a@example.com', ''])(
    'rejects non-https URLs: %s',
    (value) => {
      expect(httpsUrlSchema.safeParse(value).success).toBe(false)
    },
  )
})

describe('workEmailSchema', () => {
  it('accepts an address at a work domain', () => {
    expect(workEmailSchema.safeParse('person@example.computer').success).toBe(true)
  })

  it.each(PERSONAL_MAIL_DOMAINS)('rejects a personal mailbox at %s', (domain) => {
    expect(workEmailSchema.safeParse(`owner@${domain}`).success).toBe(false)
  })

  it('rejects text that is not an address', () => {
    expect(workEmailSchema.safeParse('not an address').success).toBe(false)
  })
})

describe('partialDateSchema', () => {
  it('accepts a year, a year and month, or a full date', () => {
    expect(partialDateSchema.safeParse({ year: 2024, month: null, day: null }).success).toBe(true)
    expect(partialDateSchema.safeParse({ year: 2024, month: 3, day: null }).success).toBe(true)
    expect(partialDateSchema.safeParse({ year: 2024, month: 3, day: 9 }).success).toBe(true)
  })

  it('rejects a day without a month', () => {
    expect(partialDateSchema.safeParse({ year: 2024, month: null, day: 9 }).success).toBe(false)
  })

  it('rejects a month that does not exist', () => {
    expect(partialDateSchema.safeParse({ year: 2024, month: 13, day: null }).success).toBe(false)
  })
})

describe('winSchema', () => {
  it('accepts a complete win', () => {
    expect(winSchema.safeParse(validWin).success).toBe(true)
  })

  it('rejects a win without an event', () => {
    const { event: _event, ...withoutEvent } = validWin

    expect(winSchema.safeParse(withoutEvent).success).toBe(false)
    expect(winSchema.safeParse({ ...validWin, event: '   ' }).success).toBe(false)
  })

  it('keeps "place" and "prize" as distinct kinds of result', () => {
    expect(winResultSchema.safeParse({ kind: 'prize', prizeName: null }).success).toBe(true)
    expect(winResultSchema.safeParse({ kind: 'prize', prizeName: null, place: 1 }).success).toBe(
      false,
    )
    expect(winResultSchema.safeParse({ kind: 'place', qualifier: null }).success).toBe(false)
  })

  it.each([0, 4, 1.5, '1'])('rejects %s as a place: only 1, 2 and 3 are podium places', (place) => {
    expect(winResultSchema.safeParse({ kind: 'place', place, qualifier: null }).success).toBe(false)
  })
})

describe('organizedSchema', () => {
  it('accepts a held event with public figures', () => {
    expect(organizedSchema.safeParse(validHeld).success).toBe(true)
  })

  it('requires a date for a held event', () => {
    expect(organizedSchema.safeParse({ ...validHeld, date: null }).success).toBe(false)
  })

  it('lets an upcoming event leave date, place and figures unknown', () => {
    const upcoming = {
      ...validHeld,
      status: 'upcoming',
      date: null,
      location: null,
      participants: null,
      prizes: null,
    }

    expect(organizedSchema.safeParse(upcoming).success).toBe(true)
  })

  it('rejects a head count that is not a positive whole number', () => {
    const zero = { ...validHeld, participants: { unit: 'people', count: 0 } }
    const fraction = { ...validHeld, participants: { unit: 'people', count: 1.5 } }

    expect(organizedSchema.safeParse(zero).success).toBe(false)
    expect(organizedSchema.safeParse(fraction).success).toBe(false)
  })

  it('rejects an amount on a prize paid in undisclosed bitcoin', () => {
    const withAmount = { ...validHeld, prizes: { kind: 'bitcoin', amountPublic: false, amount: 5 } }

    expect(organizedSchema.safeParse(withAmount).success).toBe(false)
  })
})

describe('bitcoinPlusPlusSchema', () => {
  const record = {
    profileUrl: 'https://example.com/profile',
    memberSince: 2023,
    editionsAttended: 2,
    stageSessions: 5,
    editions: [
      { city: 'Austin', year: 2023 },
      { city: 'Berlin', year: 2024 },
    ],
  }

  it('accepts a record whose edition list matches its stated count', () => {
    expect(bitcoinPlusPlusSchema.safeParse(record).success).toBe(true)
  })

  it('rejects a record whose edition list disagrees with its stated count', () => {
    expect(bitcoinPlusPlusSchema.safeParse({ ...record, editionsAttended: 3 }).success).toBe(false)
  })
})

describe('pressSchema', () => {
  const item = {
    id: 'example-press',
    outlet: 'Example Radio',
    programme: null,
    date: null,
    title: 'A headline',
    reporter: null,
    url: 'https://example.com/story',
    subject: { kind: 'organizedEvent', organizedId: 'example-held', namesEvent: false, namesOwner: false },
  }

  it('accepts coverage of an organized event', () => {
    expect(pressSchema.safeParse(item).success).toBe(true)
  })

  it('has no free-text claim field for copy to overreach with', () => {
    expect(pressSchema.safeParse({ ...item, claim: 'Featured on national radio' }).success).toBe(
      false,
    )
  })

  it('must say whether the piece names the event and the owner', () => {
    const vague = { ...item, subject: { kind: 'organizedEvent', organizedId: 'example-held' } }

    expect(pressSchema.safeParse(vague).success).toBe(false)
  })
})
