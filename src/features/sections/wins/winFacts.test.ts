import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { Win } from '../../../content'
import { pressClaim } from '../../../content/pressClaim'
import { latestPodiumWin } from '../../lid/facts'
import { winsCopy } from './copy'
import { type WinFacts, winFacts, winsSpan, winsTally } from './winFacts'

const facts = winFacts(content)

function fact(id: string): WinFacts {
  const found = facts.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No facts for the win "${id}"`)
  }
  return found
}

function record(id: string): Win {
  const found = content.wins.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No win has the id "${id}"`)
  }
  return found
}

const hrefs = (id: string): readonly string[] => fact(id).links.map(({ href }) => href)

describe('winFacts', () => {
  it('has facts for every win in the record, newest first', () => {
    expect(facts.map(({ id }) => id)).toEqual(content.wins.map(({ id }) => id))
    expect(facts).toHaveLength(stats.wins.total)
    expect(facts.map(({ year }) => year)).toEqual(
      facts.map(({ year }) => year).toSorted((one, other) => other - one),
    )
  })

  it('titles a win by its project, or by the team when the project is not known', () => {
    expect(fact('pleb-fm').title).toBe('Pleb FM')
    expect(fact('ncr-global-hackathon-2021').title).toBe('Team Eth Heads')
  })

  it('cuts a first from one finish, a second from another and the prize from its own', () => {
    const finishes = facts.map(({ finish }) => finish)

    expect(finishes.filter((finish) => finish === 'first')).toHaveLength(stats.wins.firsts)
    expect(finishes.filter((finish) => finish === 'second')).toHaveLength(stats.wins.seconds)
    expect(finishes.filter((finish) => finish === 'third')).toHaveLength(stats.wins.thirds)
    expect(finishes.filter((finish) => finish === 'prize')).toHaveLength(stats.wins.prizes)
    expect(fact('bitdevs-upgrade').finish).toBe('prize')
    expect(fact('treepay-ux').finish).toBe('second')
  })

  it('prints the place big, and never gives the prize one', () => {
    expect(fact('stringer-safety').rank).toBe('1st')
    expect(fact('last-pay-wins').rank).toBe('2nd')
    expect(fact('bitdevs-upgrade').rank).toBe(winsCopy.rank.prize)
    expect(fact('bitdevs-upgrade').result).toBe('Prize winner: Bitcoin Education Track')
    expect(`${fact('bitdevs-upgrade').rank} ${fact('bitdevs-upgrade').result}`).not.toMatch(
      /1st|2nd|3rd|first|second|third|place/i,
    )
  })

  it('keeps the qualifier the record gives a place', () => {
    expect(fact('lightning-welder').result).toBe('1st overall')
    expect(fact('treepay-ux').result).toBe('2nd (tied)')
  })

  it('names the event with its edition, and gives its year', () => {
    expect(fact('ncr-global-hackathon-2021').event).toBe('NCR Global Hackathon, 3rd annual')
    expect(fact('pleb-fm').event).toBe('SatsxSW hackathon')
    for (const win of content.wins) {
      expect(fact(win.id).year).toBe(win.year)
    }
  })

  it('says when and where an event was held where the record does', () => {
    expect(fact('stringer-safety').when).toEqual(record('stringer-safety').eventDate)
    expect(fact('stringer-safety').place).toBe('Bitcoin Park, Austin, TX')
    expect(fact('pleb-fm').when).toBeNull()
    expect(fact('pleb-fm').place).toBeNull()
  })

  it('says what the project is, in the record’s words', () => {
    for (const win of content.wins) {
      expect(fact(win.id).description).toBe(win.description)
    }
  })

  it('prints only the team and the field for the win whose project is not known', () => {
    const ncr = fact('ncr-global-hackathon-2021')

    expect(ncr.description).toBeNull()
    expect(ncr.field).toBe('Out of 300+ teams')
    expect(ncr.lines).toEqual([
      'With Bryan W. Nonni, Sam (Abdulwahab) Jarkas, Christian McDaniel, Stefan Bjelcevic and Jay Arcement.',
    ])
    expect(ncr.hand).toBeNull()
  })

  it('gives the field only where the record has one', () => {
    expect(facts.filter(({ field }) => field !== null).map(({ id }) => id)).toEqual([
      'ncr-global-hackathon-2021',
    ])
  })

  it('prints the notes the record carries, and the first-week figure from its number', () => {
    expect(fact('stringer-safety').lines).toEqual([
      'Team captain: journalist Anjan Sundaram.',
      'First-place prize: 0.5 BTC.',
    ])
    expect(fact('last-pay-wins').lines).toEqual([
      'Collected and paid out more than 2.5 million sats in its first week.',
    ])
    expect(fact('bitdevs-upgrade').lines).toEqual(['Announced as “BitDevs Upgraded”.'])
    expect(fact('pleb-fm').lines).toEqual(['Later raised over 2 million sats at TABConf 2023.'])
    expect(fact('arion-parking').lines).toEqual([])
  })

  it('says in the record’s own words that he ran the hackathon he won, and adds his own', () => {
    const welder = fact('lightning-welder')

    expect(record('lightning-welder').alsoOrganizedId).not.toBeNull()
    expect(welder.lines).toEqual(record('lightning-welder').notes)
    expect(welder.lines.join(' ')).toContain('took no part in the judging')
    expect(welder.hand).toBe(winsCopy.hand.ownHackathon)
  })

  it('writes by hand that the prize was for a track, on the prize alone', () => {
    expect(fact('bitdevs-upgrade').hand).toBe(winsCopy.hand.trackPrize)
    expect(facts.filter(({ hand }) => hand === winsCopy.hand.trackPrize)).toHaveLength(
      stats.wins.prizes,
    )
  })

  it('lends a win its project’s links, then its own, each address once', () => {
    expect(hrefs('pleb-fm')).toEqual([
      'https://pleb.fm',
      'https://github.com/PlebFM/PlebFM',
      'https://youtu.be/_AwXSzzc9k0?t=839',
    ])
    expect(fact('pleb-fm').links.map(({ label }) => label)).toEqual(['Site', 'Code', 'Demo video'])
    expect(hrefs('stringer-safety')).toEqual([
      'https://stringersafety.com',
      'https://x.com/ALewin/status/2013474336208835045',
    ])
    expect(hrefs('bitdevs-upgrade')).toEqual(['https://github.com/atlantabitdevs/bitdevs-upgrade'])
    for (const win of facts) {
      expect(new Set(win.links.map(({ href }) => href)).size, win.id).toBe(win.links.length)
    }
  })

  it('carries every link the win and its project record', () => {
    for (const win of content.wins) {
      const project = content.projects.find(({ winId }) => winId === win.id)
      const recorded = [...(project?.links ?? []), ...win.links].map(({ url }) => url)

      expect(new Set(hrefs(win.id)), win.id).toEqual(new Set(recorded))
    }
  })

  it('links the announcement of the win it names, worded by the claim', () => {
    const announcement = content.press.find(({ subject }) => subject.kind === 'win')
    if (!announcement) {
      throw new Error('Expected a press item about a win')
    }
    const { claim, naming } = pressClaim(announcement, content)

    expect(fact('stringer-safety').press).toEqual([
      { label: announcement.outlet, href: announcement.url, claim, naming },
    ])
    expect(naming).toBe('The announcement does not name him.')
    expect(facts.filter(({ press }) => press.length > 0)).toHaveLength(1)
  })

  it('marks the one win whose sticker is on the lid: its slot on the sheet is empty', () => {
    const onTheLid = latestPodiumWin(content.wins)

    expect(facts.filter(({ peeled }) => peeled).map(({ id }) => id)).toEqual([onTheLid.id])
    expect(fact('stringer-safety').peeled).toBe(true)
  })

  it('letters each sticker with the name, a short event and the year', () => {
    expect(fact('lightning-welder').sticker).toEqual({
      name: 'Lightning Welder',
      event: 'bitcoin++ Berlin',
      year: '2024',
      field: null,
    })
    expect(fact('pleb-fm').sticker.event).toBe('SatsxSW')
    expect(fact('arion-parking').sticker.event).toBe('Bolt.fun Shock the Web')
    expect(fact('ncr-global-hackathon-2021').sticker).toEqual({
      name: 'Team Eth Heads',
      event: 'NCR Global',
      year: '2021',
      field: 'of 300+ teams',
    })
  })
})

describe('winsTally', () => {
  it('counts the firsts, the seconds and the prize from the derived numbers', () => {
    expect(winsTally(stats.wins)).toEqual([
      { finish: 'first', count: 6, label: '6 firsts' },
      { finish: 'second', count: 2, label: '2 seconds' },
      { finish: 'prize', count: 1, label: '1 prize' },
    ])
  })

  it('adds up to every win', () => {
    const counted = winsTally(stats.wins).reduce((sum, { count }) => sum + count, 0)

    expect(counted).toBe(stats.wins.total)
  })

  it('lists a third place once there is one', () => {
    const withThird = winsTally({ ...stats.wins, thirds: 1 })

    expect(withThird.map(({ finish }) => finish)).toEqual(['first', 'second', 'third', 'prize'])
    expect(withThird[2]?.label).toBe('1 third')
  })
})

describe('winsSpan', () => {
  it('runs from the first win’s year to the latest', () => {
    expect(winsSpan(content.wins)).toEqual({ from: 2021, to: 2026 })
  })

  it('has nothing to span when there are no wins', () => {
    expect(winsSpan([])).toBeNull()
  })
})
