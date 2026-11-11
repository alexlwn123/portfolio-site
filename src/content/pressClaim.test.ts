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
    const { claim, naming } = pressClaim(npr, content)

    expect(claim).toBe(
      'Coverage of AI Hack for Freedom III in Washington, DC, a hackathon he helped organize.',
    )
    expect(naming).toBe('The piece names neither the event nor him.')
  })

  it('never says he was featured, profiled, interviewed or named', () => {
    const { claim, naming } = pressClaim(npr, content)

    expect(`${claim} ${naming ?? ''}`).not.toMatch(
      /featur|profil|interview|quoted|appear|names him\b/i,
    )
  })

  it.each([
    [true, false, 'The piece names the event but not him.'],
    [false, true, 'The piece names him but not the event.'],
    [true, true, 'The piece names both the event and him.'],
  ])('states who is named (event: %s, him: %s)', (namesEvent, namesOwner, expected) => {
    const item: Press = {
      ...npr,
      subject: {
        kind: 'organizedEvent',
        organizedId: 'ai-hack-for-freedom-iii',
        namesEvent,
        namesOwner,
      },
    }

    expect(pressClaim(item, content).naming).toBe(expected)
  })

  it.each([
    ['btcpp-nairobi-2026', 'Coverage of bitcoin++ open source edition in Nairobi, a hackathon'],
    ['auburnhacks-2021', 'Coverage of AuburnHacks 2021, a hackathon'],
    ['ai-hack-for-freedom-iv', 'Coverage of AI Hack for Freedom IV, a hackathon'],
  ])('names the place only when the event had one (%s)', (organizedId, expected) => {
    const item: Press = {
      ...npr,
      subject: { kind: 'organizedEvent', organizedId, namesEvent: false, namesOwner: false },
    }

    expect(pressClaim(item, content).claim).toContain(expected)
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
      naming: 'The announcement does not name him.',
    })
  })

  it('adds no naming caveat when a winners announcement names him', () => {
    const item: Press = {
      ...npr,
      subject: { kind: 'win', winId: 'stringer-safety', namesOwner: true },
    }

    expect(pressClaim(item, content).naming).toBeNull()
  })

  it('says only what a plain reference page lists', () => {
    expect(pressClaim(pressItem('ai-hack-for-freedom-winners'), content)).toEqual({
      claim: 'Winners of all three editions',
      naming: null,
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
