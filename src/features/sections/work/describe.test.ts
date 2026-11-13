import { describe, expect, it } from 'vitest'

import { content } from '../../../content'
import type { HeldEvent, Win } from '../../../content'
import { heldEvents } from '../../../content/derive'
import {
  assetCode,
  attendedYears,
  barcodeText,
  initials,
  organizedLine,
  plural,
  startedLabel,
  winLine,
} from './describe'

function win(id: string): Win {
  const found = content.wins.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No win has the id "${id}"`)
  }
  return found
}

/** The hackathons held in a year, oldest first, as the path hands them over. */
function heldIn(year: number): readonly HeldEvent[] {
  return heldEvents(content.organized)
    .filter((event) => event.date.start.year === year)
    .toReversed()
}

describe('assetCode', () => {
  it('pads an asset number to four digits, as a tag prints one', () => {
    expect(assetCode(1)).toBe('0001')
    expect(assetCode(42)).toBe('0042')
    expect(assetCode(12345)).toBe('12345')
  })
})

describe('barcodeText', () => {
  it('is his initials and the asset number, in what Code 39 can print', () => {
    expect(barcodeText(content.profile, 4)).toBe('AL-0004')
    expect(barcodeText({ givenName: 'éa', familyName: 'lewin' }, 1)).toBe('L-0001')
  })
})

describe('initials', () => {
  it('is the first letter of each of his names', () => {
    expect(initials(content.profile)).toBe('AL')
    expect(initials({ givenName: 'ada', familyName: 'lovelace' })).toBe('AL')
  })
})

describe('startedLabel', () => {
  it('is the month and the year a job began, with the value for a time element', () => {
    expect(startedLabel({ year: 2024, month: 3, day: null })).toEqual({
      text: 'March 2024',
      iso: '2024-03',
    })
    expect(startedLabel({ year: 2020, month: null, day: null })).toEqual({
      text: '2020',
      iso: '2020',
    })
  })
})

describe('winLine', () => {
  it('names the project and says how it placed, and where', () => {
    expect(winLine(win('stringer-safety'))).toEqual({
      name: 'Stringer Safety',
      detail: '1st, AI Hack for Freedom I',
    })
    expect(winLine(win('lightning-welder')).detail).toBe(
      '1st overall, bitcoin++ Berlin, ecash edition',
    )
    expect(winLine(win('treepay-ux')).detail).toBe('2nd (tied), Pleb.fi Miami')
    expect(winLine(win('pleb-fm')).detail).toBe('1st, SatsxSW hackathon')
  })

  it('names the team when the project is not known, and the field it was chosen from', () => {
    expect(winLine(win('ncr-global-hackathon-2021'))).toEqual({
      name: 'Team Eth Heads',
      detail: '1st of 300+ teams, NCR Global Hackathon',
    })
  })

  it('never gives a prize a place', () => {
    const { name, detail } = winLine(win('bitdevs-upgrade'))

    expect(name).toBe('BitDevs Upgrade')
    expect(detail).toBe('Prize winner: Bitcoin Education Track, AI4All')
    expect(detail).not.toMatch(/1st|2nd|3rd/)
  })
})

describe('organizedLine', () => {
  it('names a year’s only hackathon, with its city and his role when they are recorded', () => {
    expect(organizedLine(heldIn(2024))).toBe('bitcoin++ ecash edition · Berlin')
    expect(organizedLine(heldIn(2021))).toBe('AuburnHacks 2021 · Executive director')
    expect(organizedLine(heldIn(2020))).toBe('AuburnHacks 2020 · Auburn')
  })

  it('lists the cities of a busy year once each, in the order he got to them', () => {
    expect(organizedLine(heldIn(2026))).toBe(
      'Florianópolis · Nashville · Nairobi · Toronto · Washington',
    )
  })

  it('says so when one of them was online', () => {
    expect(organizedLine(heldIn(2025))).toBe(
      'Florianópolis · Austin · Riga · Istanbul · Berlin · Taipei + online',
    )
  })

  it('says only “online” when none of several was in a room', () => {
    const [online] = heldIn(2021)
    const twice = online ? [online, { ...online, id: 'again' }] : []

    expect(organizedLine(twice)).toBe('online')
  })

  it('has nothing to say about no hackathons', () => {
    expect(organizedLine([])).toBe('')
  })
})

describe('attendedYears', () => {
  const [auburn] = content.education

  it('is the years the record gives, and no more', () => {
    expect(auburn && attendedYears(auburn)).toEqual({
      text: '2018 – 2021',
      iso: '2018',
      open: false,
    })
  })

  it('is only the first year when no last year is recorded', () => {
    expect(auburn && attendedYears({ ...auburn, end: null })).toEqual({
      text: '2018',
      iso: '2018',
      open: true,
    })
  })

  it('is nothing when even the first year is unknown', () => {
    expect(auburn && attendedYears({ ...auburn, start: null })).toBeNull()
  })
})

describe('plural', () => {
  it('picks the word that goes with the count', () => {
    const words = { one: 'hackathon win', many: 'hackathon wins' }

    expect(plural(1, words)).toBe('hackathon win')
    expect(plural(3, words)).toBe('hackathon wins')
    expect(plural(0, words)).toBe('hackathon wins')
  })
})
