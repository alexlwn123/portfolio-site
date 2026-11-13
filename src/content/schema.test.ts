import { describe, expect, it } from 'vitest'

import {
  bitcoinPlusPlusSchema,
  educationSchema,
  httpsUrlSchema,
  organizedSchema,
  partialDateSchema,
  patentSchema,
  PERSONAL_MAIL_DOMAINS,
  pressSchema,
  sourceSchema,
  talkSchema,
  winResultSchema,
  winSchema,
  workEmailSchema,
} from './schema'

const fromOwner = { kind: 'owner', urls: [] }

const validWin = {
  id: 'example-win',
  year: 2024,
  event: 'Example Hackathon',
  edition: null,
  eventDate: null,
  eventPlace: null,
  result: { kind: 'place', place: 1, qualifier: null },
  field: null,
  project: 'Example Project',
  announcedAs: null,
  team: null,
  description: null,
  firstWeekSats: null,
  notes: [],
  links: [],
  caveat: null,
  alsoOrganizedId: null,
  source: fromOwner,
}

const validHeld = {
  id: 'example-held',
  status: 'held',
  name: 'Example Hackathon',
  date: { start: { year: 2025, month: 5, day: 8 }, end: null },
  location: { kind: 'inPerson', city: 'Austin', region: 'TX', country: 'USA' },
  participants: { unit: 'people', count: 30 },
  prizes: { kind: 'usd', amount: 10000 },
  projects: null,
  role: null,
  note: null,
  basis: 'stated',
  source: fromOwner,
}

const validTalk = {
  id: 'example-talk',
  when: { kind: 'date', date: { year: 2026, month: 4, day: 28 } },
  title: 'An Example Panel',
  format: 'panel',
  role: 'panelist',
  detail: null,
  alsoListedAs: null,
  venue: { name: 'Example Conference', confirmed: true },
  links: [],
  source: fromOwner,
}

const validPatent = {
  id: 'us-12345678',
  number: { office: 'US', serial: '12,345,678', kindCode: 'B2' },
  title: 'Methods and a system for examples',
  filed: { year: 2021, month: 7, day: 2 },
  status: { kind: 'granted', granted: { year: 2026, month: 1, day: 27 } },
  link: { label: 'Google Patents', url: 'https://patents.google.com/patent/US12345678B2/en' },
  shown: true,
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
    const withoutEvent = Object.fromEntries(
      Object.entries(validWin).filter(([key]) => key !== 'event'),
    )

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

  it('lets the project be unknown when the team is named, but not both', () => {
    const team = { name: 'Example Team', teammates: ['A. N. Other'] }

    expect(winSchema.safeParse({ ...validWin, project: null, team }).success).toBe(true)
    expect(winSchema.safeParse({ ...validWin, project: null, team: null }).success).toBe(false)
  })

  it('takes the place of an event as a venue, a city and a region, never as prose', () => {
    const place = { venue: 'Example Hall', city: 'Austin', region: 'TX' }

    expect(winSchema.safeParse({ ...validWin, eventPlace: place }).success).toBe(true)
    expect(
      winSchema.safeParse({ ...validWin, eventPlace: 'Example Hall, Austin, TX' }).success,
    ).toBe(false)
    expect(winSchema.safeParse({ ...validWin, eventPlace: { ...place, city: '' } }).success).toBe(
      false,
    )
  })

  it('takes the size of the field and a first-week figure as numbers', () => {
    const field = { unit: 'teams', count: 300, atLeast: true }
    const firstWeekSats = { sats: 2_500_000, atLeast: true }

    expect(winSchema.safeParse({ ...validWin, field, firstWeekSats }).success).toBe(true)
    expect(winSchema.safeParse({ ...validWin, field: { ...field, count: 0 } }).success).toBe(false)
    expect(winSchema.safeParse({ ...validWin, field: '300+ teams' }).success).toBe(false)
    expect(winSchema.safeParse({ ...validWin, firstWeekSats: '2.5M+' }).success).toBe(false)
  })

  it('must say where its facts come from', () => {
    const unsourced = Object.fromEntries(
      Object.entries(validWin).filter(([key]) => key !== 'source'),
    )

    expect(winSchema.safeParse(unsourced).success).toBe(false)
  })
})

describe('sourceSchema', () => {
  it('accepts a record he stated, with or without pages that back it up', () => {
    expect(sourceSchema.safeParse({ kind: 'owner', urls: [] }).success).toBe(true)
    expect(
      sourceSchema.safeParse({ kind: 'owner', urls: ['https://example.com/post'] }).success,
    ).toBe(true)
  })

  it('makes a record from the public record say what the research added', () => {
    const found = { kind: 'publicRecord', urls: ['https://example.com/page'], note: 'Date added.' }

    expect(sourceSchema.safeParse(found).success).toBe(true)
    expect(sourceSchema.safeParse({ ...found, note: '' }).success).toBe(false)
    expect(sourceSchema.safeParse({ kind: 'publicRecord', urls: found.urls }).success).toBe(false)
  })

  it('rejects a source that is not an https address, and an unknown kind', () => {
    expect(sourceSchema.safeParse({ kind: 'owner', urls: ['example.com'] }).success).toBe(false)
    expect(sourceSchema.safeParse({ kind: 'hearsay', urls: [] }).success).toBe(false)
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

  it('keeps a prize in sats and a prize in dollars as different kinds', () => {
    const inSats = { ...validHeld, prizes: { kind: 'sats', amount: 17_542_000 } }
    const inBoth = { ...validHeld, prizes: { kind: 'usd', amount: 10000, sats: 17_542_000 } }

    expect(organizedSchema.safeParse(inSats).success).toBe(true)
    expect(organizedSchema.safeParse(inBoth).success).toBe(false)
  })

  it('keeps an approximate head count apart from an exact one', () => {
    const about = { ...validHeld, participants: { unit: 'aboutPeople', count: 60 } }
    const fudged = { ...validHeld, participants: { unit: 'people', count: 60, approximate: true } }

    expect(organizedSchema.safeParse(about).success).toBe(true)
    expect(organizedSchema.safeParse(fudged).success).toBe(false)
  })

  it('takes a count of projects and his role, when a source gives them', () => {
    const detailed = { ...validHeld, projects: 21, role: 'Executive director' }

    expect(organizedSchema.safeParse(detailed).success).toBe(true)
    expect(organizedSchema.safeParse({ ...validHeld, projects: 0 }).success).toBe(false)
  })
})

describe('talkSchema', () => {
  it('accepts a talk with the part he played in it', () => {
    expect(talkSchema.safeParse(validTalk).success).toBe(true)
    expect(talkSchema.safeParse({ ...validTalk, role: null }).success).toBe(true)
  })

  it('rejects a part it does not know', () => {
    expect(talkSchema.safeParse({ ...validTalk, role: 'keynote' }).success).toBe(false)
  })
})

describe('educationSchema', () => {
  const entry = {
    id: 'example-university',
    institution: 'Example University',
    level: 'Undergraduate',
    subject: 'Software Engineering',
    start: { year: 2018, month: 8, day: null },
    end: { year: 2021, month: null, day: null },
    graduated: null,
    source: fromOwner,
  }

  it('keeps the last year attended apart from a graduation date', () => {
    expect(educationSchema.safeParse(entry).success).toBe(true)
    expect(educationSchema.parse(entry).graduated).toBeNull()
  })
})

describe('patentSchema', () => {
  it('refuses an assignee or co-inventors: the site carries neither', () => {
    const assigned = { ...validPatent, assignee: 'Example Corp' }
    const shared = { ...validPatent, coInventors: ['A. N. Other'] }

    expect(patentSchema.safeParse(assigned).success).toBe(false)
    expect(patentSchema.safeParse(shared).success).toBe(false)
  })

  it('accepts a granted patent', () => {
    expect(patentSchema.safeParse(validPatent).success).toBe(true)
  })

  it.each(['pending', 'abandoned'])('accepts an application that is %s', (kind) => {
    const application = {
      ...validPatent,
      number: { office: 'US', serial: '2023/0032782', kindCode: 'A1' },
      status: { kind },
    }

    expect(patentSchema.safeParse(application).success).toBe(true)
  })

  it('knows only three states: granted, pending and abandoned', () => {
    expect(patentSchema.safeParse({ ...validPatent, status: { kind: 'expired' } }).success).toBe(
      false,
    )
  })

  it('needs a grant date for a granted patent, and takes none for an application', () => {
    const undated = { ...validPatent, status: { kind: 'granted' } }
    const vague = {
      ...validPatent,
      status: { kind: 'granted', granted: { year: 2026, month: 1, day: null } },
    }
    const early = {
      ...validPatent,
      status: { kind: 'pending', granted: { year: 2026, month: 1, day: 27 } },
    }

    expect(patentSchema.safeParse(undated).success).toBe(false)
    expect(patentSchema.safeParse(vague).success).toBe(false)
    expect(patentSchema.safeParse(early).success).toBe(false)
  })

  it.each(['12345678', 'US 12,345,678', '2023-0032782', ''])(
    'rejects %s as a serial number: it is written as the patent office prints it',
    (serial) => {
      const misnumbered = { ...validPatent, number: { ...validPatent.number, serial } }

      expect(patentSchema.safeParse(misnumbered).success).toBe(false)
    },
  )

  it('does not call an application a patent: its number must match its state', () => {
    const application = { office: 'US', serial: '2023/0032782', kindCode: 'A1' }
    const grantedApplication = { ...validPatent, number: application }
    const pendingPatent = { ...validPatent, status: { kind: 'pending' } }

    expect(patentSchema.safeParse(grantedApplication).success).toBe(false)
    expect(patentSchema.safeParse(pendingPatent).success).toBe(false)
  })

  it('must say whether the site shows it', () => {
    const undecided = Object.fromEntries(
      Object.entries(validPatent).filter(([key]) => key !== 'shown'),
    )

    expect(patentSchema.safeParse(undecided).success).toBe(false)
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
    subject: {
      kind: 'organizedEvent',
      organizedId: 'example-held',
      namesEvent: false,
      namesOwner: false,
    },
  }

  it('accepts coverage of an organized event', () => {
    expect(pressSchema.safeParse(item).success).toBe(true)
  })

  it('has no free-text claim field for copy to overreach with', () => {
    expect(pressSchema.safeParse({ ...item, claim: 'Featured on national radio' }).success).toBe(
      false,
    )
  })

  it('lets the headline be unknown, but not empty', () => {
    expect(pressSchema.safeParse({ ...item, title: null }).success).toBe(true)
    expect(pressSchema.safeParse({ ...item, title: '' }).success).toBe(false)
  })

  it('must say whether the piece names the event and the owner', () => {
    const vague = { ...item, subject: { kind: 'organizedEvent', organizedId: 'example-held' } }

    expect(pressSchema.safeParse(vague).success).toBe(false)
  })
})
