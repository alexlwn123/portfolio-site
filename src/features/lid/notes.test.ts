import { describe, expect, it } from 'vitest'

import { content } from '../../content'
import { isNoted, lidNotes, NOTED_IDS } from './notes'
import { STICKER_IDS } from './stickers'

const notes = lidNotes(content)

describe('lidNotes', () => {
  it('puts a note under every win and every project on the lid, and nothing else', () => {
    expect(Object.keys(notes)).toEqual([...NOTED_IDS])
    for (const id of NOTED_IDS) {
      expect(STICKER_IDS).toContain(id)
    }
    expect(isNoted('pleb-fm')).toBe(true)
    expect(isNoted('cv')).toBe(false)
  })

  it('is frozen, like the content it is built from', () => {
    expect(Object.isFrozen(notes)).toBe(true)
    expect(Object.isFrozen(notes['pleb-fm'].links)).toBe(true)
  })

  it('says what the newest win is, how it placed and when', () => {
    expect(notes['latest-win']).toMatchObject({
      title: 'Stringer Safety',
      lines: [
        'App that helps protect journalists in high-risk places: a trusted contact network, location and status sharing, and a one-click SOS that triggers AI response recommendations.',
        '1st at AI Hack for Freedom I, 2026.',
      ],
    })
  })

  it('gives a win its project’s links, then its own, then the way to the CV', () => {
    expect(notes['latest-win'].links).toEqual([
      { label: 'Site', href: 'https://stringersafety.com' },
      { label: 'Post on X', href: 'https://x.com/ALewin/status/2013474336208835045' },
      { label: 'More in the CV', href: '/cv/#wins' },
    ])
  })

  it('names the NCR win by its team and states the size of the field', () => {
    expect(notes['ncr-win']).toMatchObject({
      title: 'Team Eth Heads',
      lines: ['1st at NCR Global Hackathon, 3rd annual, 2021.', 'Out of 300+ teams.'],
    })
    expect(notes['ncr-win'].links.map(({ label }) => label)).toEqual([
      'Post on LinkedIn',
      'More in the CV',
    ])
  })

  it('keeps the qualifier of a result', () => {
    expect(notes['lightning-welder'].lines).toEqual([
      'Helps legacy Lightning wallets pay BOLT12 offers.',
      '1st overall at bitcoin++ Berlin, ecash edition, 2024.',
    ])
  })

  it('tells a winning project’s story from its win record, first-week figure included', () => {
    expect(notes['last-pay-wins']).toMatchObject({
      title: 'Last Pay Wins',
      lines: [
        content.wins.find(({ id }) => id === 'last-pay-wins')?.description,
        '2nd at Pleb.fi Miami, 2023.',
        'Collected and paid out more than 2.5 million sats in its first week.',
      ],
    })
    expect(notes['pleb-fm'].lines.at(-1)).toBe('1st at SatsxSW hackathon, 2022.')
    expect(notes['arion-parking'].lines.at(-1)).toBe('1st at Bolt.fun Shock the Web, 2022.')
  })

  it('sends a project’s note to the projects section, with every link of its record', () => {
    expect(notes['pleb-fm'].links).toEqual([
      { label: 'Site', href: 'https://pleb.fm' },
      { label: 'Code', href: 'https://github.com/PlebFM/PlebFM' },
      { label: 'Demo video', href: 'https://youtu.be/_AwXSzzc9k0?t=839' },
      { label: 'More in the CV', href: '/cv/#projects' },
    ])
  })

  it('says only what a project that never competed records: what it is', () => {
    expect(notes['clawthing-store']).toEqual({
      title: 'Clawthing Store',
      lines: ['AI-designed crab merch and apparel. Marketed towards agents.'],
      links: [
        { label: 'Site', href: 'https://clawthing.store' },
        { label: 'More in the CV', href: '/cv/#projects' },
      ],
    })
  })

  it('never repeats an address within a note', () => {
    const doubled = {
      ...content,
      wins: content.wins.map((win) =>
        win.id === 'pleb-fm' ? { ...win, links: [{ label: 'Site', url: 'https://pleb.fm' }] } : win,
      ),
    }
    const hrefs = lidNotes(doubled)['pleb-fm'].links.map(({ href }) => href)

    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('follows the record when it changes', () => {
    const [latest, ...older] = content.wins
    if (!latest) {
      throw new Error('Expected at least one win')
    }
    const renamed = { ...content, wins: [{ ...latest, description: null, year: 2027 }, ...older] }

    expect(lidNotes(renamed)['latest-win'].lines).toEqual(['1st at AI Hack for Freedom I, 2027.'])
  })
})
