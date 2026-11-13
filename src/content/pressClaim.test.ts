import { describe, expect, it } from 'vitest'

import { content } from './index'
import { pressClaim } from './pressClaim'
import type { Press } from './schema'

function pressItem(id: string): Press {
  const item = content.press.find((candidate) => candidate.id === id)
  if (!item) {
    throw new Error(`No press item "${id}"`)
  }
  return item
}

const npr = pressItem('npr-all-things-considered')

describe('pressClaim', () => {
  it('claims only that a hackathon he helped organize was covered', () => {
    expect(pressClaim(npr, content)).toEqual({
      claim:
        'Coverage of AI Hack for Freedom III in Washington, DC, a hackathon he helped organize.',
    })
  })

  it('never says he was featured, profiled, interviewed or named', () => {
    const { claim } = pressClaim(npr, content)

    expect(claim).not.toMatch(/featur|profil|interview|quoted|appear|names him\b/i)
  })

  it.each([
    [true, false],
    [false, true],
    [true, true],
    [false, false],
  ])(
    'says the same of a piece whoever it names, and nothing about who that is (event: %s, him: %s)',
    (namesEvent, namesOwner) => {
      const item: Press = {
        ...npr,
        subject: {
          kind: 'organizedEvent',
          organizedId: 'ai-hack-for-freedom-iii',
          namesEvent,
          namesOwner,
        },
      }

      expect(pressClaim(item, content)).toEqual(pressClaim(npr, content))
      expect(JSON.stringify(pressClaim(item, content))).not.toMatch(/\bnames?\b|does not/i)
    },
  )

  it.each([
    ['btcpp-nairobi-2026', 'Coverage of bitcoin++ open source edition in Nairobi, a hackathon'],
    ['auburnhacks-2021', 'Coverage of AuburnHacks 2021, a hackathon'],
    [
      'ai-hack-for-freedom-iv',
      'Coverage of AI Hack for Freedom IV in San Francisco, CA, a hackathon',
    ],
  ])('names the place only when the event had one (%s)', (organizedId, expected) => {
    const item: Press = {
      ...npr,
      subject: { kind: 'organizedEvent', organizedId, namesEvent: false, namesOwner: false },
    }

    expect(pressClaim(item, content).claim).toContain(expected)
  })

  it('names no place for an event whose place is not announced', () => {
    const unplaced = content.organized.map((event) =>
      event.id === 'ai-hack-for-freedom-iv' ? { ...event, location: null } : event,
    )
    const item: Press = {
      ...npr,
      subject: {
        kind: 'organizedEvent',
        organizedId: 'ai-hack-for-freedom-iv',
        namesEvent: false,
        namesOwner: false,
      },
    }

    expect(pressClaim(item, { ...content, organized: unplaced }).claim).toBe(
      'Coverage of AI Hack for Freedom IV, a hackathon he helped organize.',
    )
  })

  it('never gives a prize a placement in a winners announcement', () => {
    const item: Press = {
      ...npr,
      subject: { kind: 'win', winId: 'bitdevs-upgrade', namesOwner: false },
    }

    expect(pressClaim(item, content).claim).toBe(
      'Announcement of the AI4All winners, with BitDevs Upgrade among the prize winners.',
    )
  })

  it('names the team when the winning project’s name is not known', () => {
    const item: Press = {
      ...npr,
      subject: { kind: 'win', winId: 'ncr-global-hackathon-2021', namesOwner: true },
    }

    expect(pressClaim(item, content).claim).toBe(
      'Announcement of the NCR Global Hackathon winners, with Eth Heads placed 1st.',
    )
  })

  it('describes a winners announcement by event, project and result', () => {
    expect(pressClaim(pressItem('hrf-winners-announcement'), content)).toEqual({
      claim: 'Announcement of the AI Hack for Freedom I winners, with Stringer Safety placed 1st.',
    })
  })

  it('says the same of a winners announcement whether or not it names him', () => {
    const named: Press = {
      ...npr,
      subject: { kind: 'win', winId: 'stringer-safety', namesOwner: true },
    }
    const unnamed: Press = {
      ...npr,
      subject: { kind: 'win', winId: 'stringer-safety', namesOwner: false },
    }

    expect(pressClaim(named, content)).toEqual(pressClaim(unnamed, content))
  })

  it('says only what a plain reference page lists', () => {
    expect(pressClaim(pressItem('ai-hack-for-freedom-winners'), content)).toEqual({
      claim: 'Winners of all three editions',
    })
  })

  it('fails loudly when a reference does not resolve', () => {
    const broken: Press = {
      ...npr,
      subject: {
        kind: 'organizedEvent',
        organizedId: 'nope',
        namesEvent: false,
        namesOwner: false,
      },
    }

    expect(() => pressClaim(broken, content)).toThrow(/organized.*"nope"/)
  })
})
