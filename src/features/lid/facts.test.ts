import { describe, expect, it } from 'vitest'

import { content } from '../../content'
import type { Organized, Project, Win } from '../../content'
import {
  balanceLines,
  compactSats,
  currentJob,
  fieldFigure,
  fieldWin,
  filingNumbers,
  findById,
  firstWeekSats,
  inPersonCity,
  introOpening,
  latestPodiumWin,
  ownHackathon,
  projectHome,
  projectSummary,
  shortEventName,
  shortYear,
  siteHost,
  winSummary,
} from './facts'

const win = (id: string): Win => findById(content.wins, id, 'win')
const project = (id: string): Project => findById(content.projects, id, 'project')
const event = (id: string): Organized => findById(content.organized, id, 'hackathon')

describe('findById', () => {
  it('returns the record with that id', () => {
    expect(win('pleb-fm').project).toBe('Pleb FM')
  })

  it('stops the build, naming what is missing', () => {
    expect(() => win('no-such-win')).toThrow('No win has the id "no-such-win"')
  })
})

describe('inPersonCity', () => {
  it('reads the city a hackathon was held in', () => {
    expect(inPersonCity(event('btcpp-florianopolis-2025'))).toBe('Florianópolis')
  })

  it('refuses an online hackathon, which has no city to print', () => {
    expect(() => inPersonCity(event('auburnhacks-2021'))).toThrow(/auburnhacks-2021/)
  })

  it('refuses a hackathon whose place is not yet known', () => {
    const unplaced = { ...event('ai-hack-for-freedom-iv'), location: null }

    expect(() => inPersonCity(unplaced)).toThrow(/ai-hack-for-freedom-iv/)
  })
})

describe('projectHome', () => {
  it('prefers the project’s own site', () => {
    expect(projectHome(project('pleb-fm'))).toBe('https://pleb.fm')
    expect(projectHome(project('arion-parking'))).toBe('https://arionparking.tech')
  })

  it('stops the build for a project with nowhere to go', () => {
    const adrift = { ...project('pleb-fm'), links: [] }

    expect(() => projectHome(adrift)).toThrow('The project "pleb-fm" has no link')
  })

  it('falls back to the first link when there is no site', () => {
    expect(projectHome(project('lightning-welder'))).toBe(
      'https://github.com/alexlwn123/Lightning-Welder',
    )
  })
})

describe('ownHackathon', () => {
  it('finds the hackathon of his own that a win was won at', () => {
    expect(ownHackathon(win('lightning-welder'), content.organized).id).toBe('btcpp-berlin-2024')
  })

  it('refuses a win at somebody else’s hackathon', () => {
    expect(() => ownHackathon(win('pleb-fm'), content.organized)).toThrow(/pleb-fm/)
  })
})

describe('projectSummary', () => {
  it('follows the name with the description', () => {
    expect(projectSummary(project('btc-plinko'))).toBe('BTC Plinko: Plinko with sats.')
  })

  it('gives the name alone when the win record holds the description', () => {
    expect(projectSummary(project('pleb-fm'))).toBe('Pleb FM')
  })
})

describe('latestPodiumWin', () => {
  it('picks the newest win that has a place', () => {
    expect(latestPodiumWin(content.wins).id).toBe('stringer-safety')
  })

  it('goes by year, not by the order of the list', () => {
    expect(latestPodiumWin(content.wins.toReversed()).id).toBe('stringer-safety')
  })

  it('keeps the first of two wins from the same year, and skips prizes', () => {
    const wins = content.wins.filter(({ year }) => year === 2023)

    expect(wins.map(({ id }) => id)).toEqual(['bitdevs-upgrade', 'auntie-ln', 'last-pay-wins'])
    expect(latestPodiumWin(wins).id).toBe('auntie-ln')
    expect(latestPodiumWin(wins.toReversed()).id).toBe('last-pay-wins')
  })

  it('stops the build when no win has a place', () => {
    expect(() => latestPodiumWin([win('bitdevs-upgrade')])).toThrow(/podium/)
  })
})

describe('introOpening', () => {
  it('takes his own first line, without the article the tag already says', () => {
    expect(introOpening(content.profile)).toBe('software engineer from Atlanta, GA.')
    expect(introOpening({ selfDescription: ['An engineer.'] })).toBe('engineer.')
  })

  it('needs a line to work with', () => {
    expect(() => introOpening({ selfDescription: [] })).toThrow(/self-description/)
  })
})

describe('currentJob', () => {
  it('finds the job he holds now', () => {
    expect(currentJob(content.experience)).toMatchObject({
      id: 'finite-computer',
      organization: content.profile.role.organization,
    })
  })

  it('stops the build when no job is marked as current', () => {
    const past = content.experience.map((job) => ({ ...job, current: false }))

    expect(() => currentJob(past)).toThrow(/current/)
  })
})

describe('labels shortened to fit a sticker', () => {
  it('drops the word "hackathon" from the end of an event name', () => {
    expect(shortEventName('SatsxSW hackathon')).toBe('SatsxSW')
    expect(shortEventName('Pleb.fi Miami')).toBe('Pleb.fi Miami')
  })

  it('writes a year as two digits after an apostrophe', () => {
    expect(shortYear(2024)).toBe('’24')
  })

  it('reads the host from an address', () => {
    expect(siteHost(content.profile.site)).toBe('alex.lwn.lol')
  })

  it('splits a title over two lines of nearly equal length', () => {
    expect(balanceLines('How to Win Every Hackathon')).toEqual(['How to Win', 'Every Hackathon'])
    expect(balanceLines('Scaling Lightning')).toEqual(['Scaling', 'Lightning'])
    expect(balanceLines('Hackathon')).toEqual(['Hackathon', ''])
  })
})

describe('figures the record states as numbers', () => {
  it('writes sats in millions, with a plus when the record says "more than"', () => {
    expect(compactSats({ sats: 2_500_000, atLeast: true })).toBe('2.5M+')
    expect(compactSats({ sats: 3_000_000, atLeast: false })).toBe('3M')
  })

  it('reads the first-week figure from the win’s own field', () => {
    expect(compactSats(firstWeekSats(win('last-pay-wins')))).toBe('2.5M+')
  })

  it('follows the number, not the wording of any note', () => {
    const busier = {
      ...win('last-pay-wins'),
      firstWeekSats: { sats: 4_250_000, atLeast: false },
      notes: ['Collected and paid out more than 2.5 million sats in its first week.'],
    }

    expect(compactSats(firstWeekSats(busier))).toBe('4.25M')
  })

  it('stops the build when the win records no such figure', () => {
    expect(() => firstWeekSats(win('pleb-fm'))).toThrow(/pleb-fm/)
  })
})

describe('the win that was chosen from a field', () => {
  it('writes the size of the field, with a plus when the record says "more than"', () => {
    expect(fieldFigure({ unit: 'teams', count: 300, atLeast: true })).toBe('300+')
    expect(fieldFigure({ unit: 'teams', count: 1200, atLeast: false })).toBe('1,200')
  })

  it('accepts a podium win that records its field and its team', () => {
    const ncr = fieldWin(win('ncr-global-hackathon-2021'))

    expect(ncr.field.count).toBe(300)
    expect(ncr.team.name).toBe('Eth Heads')
    expect(ncr.result.place).toBe(1)
  })

  it('stops the build for a win with no field, no team or no place', () => {
    const ncr = win('ncr-global-hackathon-2021')

    expect(() => fieldWin(win('pleb-fm'))).toThrow(/pleb-fm/)
    expect(() => fieldWin({ ...ncr, project: 'Something', team: null })).toThrow(/ncr-global/)
    expect(() => fieldWin({ ...ncr, result: { kind: 'prize', prizeName: null } })).toThrow(
      /ncr-global/,
    )
  })
})

describe('filingNumbers', () => {
  it('lists the publication number of every filing, in the record’s order', () => {
    expect(filingNumbers(content.patents)).toEqual([
      '12,536,579',
      '12,354,083',
      '2023/0032782',
      '2024/0037539',
    ])
  })

  it('takes every filing alike: what became of one decides nothing', () => {
    const numbers = filingNumbers(content.patents)

    expect(numbers).toEqual(content.patents.map((patent) => patent.number.serial))
    expect(new Set(content.patents.map((patent) => patent.status.kind)).size).toBeGreaterThan(1)
  })

  it('leaves out a filing he has taken off the site', () => {
    const oneHidden = content.patents.map((patent) =>
      patent.id === 'us-12354083' ? { ...patent, shown: false } : patent,
    )

    expect(filingNumbers(oneHidden)).toEqual(['12,536,579', '2023/0032782', '2024/0037539'])
  })

  it('stops the build when there is no filing to print', () => {
    const noneShown = content.patents.map((patent) => ({ ...patent, shown: false }))

    expect(() => filingNumbers(noneShown)).toThrow(/patent filing/)
    expect(() => filingNumbers([])).toThrow(/patent filing/)
  })
})

describe('links', () => {
  it('says a win in one line, as the CV does', () => {
    expect(winSummary(win('lightning-welder'))).toBe(
      'Lightning Welder: 1st overall, bitcoin++ Berlin, ecash edition, 2024',
    )
  })

  it('says a win by its team when the project has no known name', () => {
    expect(winSummary(win('ncr-global-hackathon-2021'))).toBe(
      'Eth Heads: 1st, NCR Global Hackathon, 2021',
    )
  })
})
