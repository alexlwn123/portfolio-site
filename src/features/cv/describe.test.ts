import { describe, expect, it } from 'vitest'

import { content, stats } from '../../content'
import {
  bitcoinPlusPlusSummary,
  coInventorsLabel,
  displayUrl,
  eventLabel,
  experienceWhen,
  fieldLabel,
  firstWeekNote,
  locationLabel,
  organizedSummary,
  participantsLabel,
  patentNumber,
  patentsSummary,
  placeLabel,
  plural,
  placeLine,
  prizesLabel,
  projectsLabel,
  resultLabel,
  roleLine,
  teammatesLine,
  winsSummary,
  winTitle,
} from './describe'

function win(id: string) {
  const found = content.wins.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No win with id "${id}"`)
  }
  return found
}

describe('resultLabel', () => {
  it('writes podium places as ordinals', () => {
    expect(resultLabel({ kind: 'place', place: 1, qualifier: null })).toBe('1st')
    expect(resultLabel({ kind: 'place', place: 2, qualifier: null })).toBe('2nd')
    expect(resultLabel({ kind: 'place', place: 3, qualifier: null })).toBe('3rd')
  })

  it('adds the qualifier the file gives', () => {
    expect(resultLabel({ kind: 'place', place: 1, qualifier: 'overall' })).toBe('1st overall')
    expect(resultLabel({ kind: 'place', place: 2, qualifier: 'tied' })).toBe('2nd (tied)')
  })

  it('never gives a prize a placement', () => {
    const unnamed = resultLabel({ kind: 'prize', prizeName: null })
    const named = resultLabel({ kind: 'prize', prizeName: 'Education Prize' })

    expect(unnamed).toBe('Prize winner')
    expect(named).toBe('Prize winner: Education Prize')
    expect(`${unnamed} ${named}`).not.toMatch(/1st|2nd|3rd|first|second|third|place/i)
  })

  it('names the AI4All prize by its track, still without a placement', () => {
    const label = resultLabel(win('bitdevs-upgrade').result)

    expect(label).toBe('Prize winner: Bitcoin Education Track')
    expect(label).not.toMatch(/1st|2nd|3rd|first|second|third|place/i)
  })
})

describe('what a win prints', () => {
  it('titles a win with its project, or with its team when the project has no known name', () => {
    expect(winTitle(win('pleb-fm'))).toBe('Pleb FM')
    expect(winTitle(win('ncr-global-hackathon-2021'))).toBe('Team Eth Heads')
  })

  it('adds the edition to the name of an event that numbers them', () => {
    expect(eventLabel(win('ncr-global-hackathon-2021'))).toBe('NCR Global Hackathon, 3rd annual')
    expect(eventLabel(win('bitdevs-upgrade'))).toBe('AI4All')
  })

  it('writes a place from its venue, city and region', () => {
    expect(placeLabel({ venue: 'Bitcoin Park', city: 'Austin', region: 'TX' })).toBe(
      'Bitcoin Park, Austin, TX',
    )
    expect(placeLabel({ venue: null, city: 'Miami', region: null })).toBe('Miami')
  })

  it('says how large the field was, with a plus only when the record says "more than"', () => {
    expect(fieldLabel({ unit: 'teams', count: 300, atLeast: true })).toBe('Out of 300+ teams')
    expect(fieldLabel({ unit: 'teams', count: 1200, atLeast: false })).toBe('Out of 1,200 teams')
    expect(fieldLabel({ unit: 'teams', count: 1, atLeast: false })).toBe('Out of 1 team')
  })

  it('lists the teammates a source names', () => {
    expect(teammatesLine(win('ncr-global-hackathon-2021'))).toBe(
      'With Bryan W. Nonni, Sam (Abdulwahab) Jarkas, Christian McDaniel, Stefan Bjelcevic and Jay Arcement.',
    )
    expect(teammatesLine(win('pleb-fm'))).toBeNull()
  })

  it('names the team as well when the win has a project of its own', () => {
    const named = { ...win('pleb-fm'), team: { name: 'Plebs', teammates: ['A', 'B'] } }
    const alone = { ...win('pleb-fm'), team: { name: 'Plebs', teammates: [] } }
    const unnamed = { ...win('ncr-global-hackathon-2021'), team: { name: 'Solo', teammates: [] } }

    expect(teammatesLine(named)).toBe('Team Plebs, with A and B.')
    expect(teammatesLine(alone)).toBe('Team Plebs.')
    expect(teammatesLine(unnamed)).toBeNull()
  })

  it('writes the first-week figure as a sentence, from the number', () => {
    expect(firstWeekNote({ sats: 2_500_000, atLeast: true })).toBe(
      'Collected and paid out more than 2.5 million sats in its first week.',
    )
    expect(firstWeekNote({ sats: 3_000_000, atLeast: false })).toBe(
      'Collected and paid out 3 million sats in its first week.',
    )
  })
})

describe('what a patent prints', () => {
  it('writes a number the way the patent office does', () => {
    expect(patentNumber({ office: 'US', serial: '12,536,579', kindCode: 'B2' })).toBe(
      'US 12,536,579 B2',
    )
    expect(patentNumber({ office: 'US', serial: '2023/0032782', kindCode: 'A1' })).toBe(
      'US 2023/0032782 A1',
    )
  })

  it('names the other inventors', () => {
    expect(coInventorsLabel(['Bryan Walser Nonni'])).toBe('With Bryan Walser Nonni')
    expect(coInventorsLabel(['Bryan Walser Nonni', 'Brent Vance Zucker'])).toBe(
      'With Bryan Walser Nonni and Brent Vance Zucker',
    )
    expect(coInventorsLabel([])).toBeNull()
  })

  it('summarizes granted patents and pending applications apart, from the derived stats', () => {
    expect(patentsSummary(stats.patents)).toBe('2 patents granted and 1 application pending.')
  })

  it('never folds applications into the count of patents', () => {
    const summary = patentsSummary(stats.patents)

    expect(summary).not.toMatch(/\b[34] patents\b|four|three/i)
    expect(summary).not.toContain(String(stats.patents.filings))
  })

  it('leaves out what there is none of, and uses singulars', () => {
    const base = { granted: 1, pending: 0, filings: 1, anyPending: false }

    expect(patentsSummary(base)).toBe('1 patent granted.')
    expect(patentsSummary({ ...base, granted: 0, pending: 2, anyPending: true })).toBe(
      '2 applications pending.',
    )
  })
})

describe('locationLabel', () => {
  it('writes city, region and country', () => {
    expect(locationLabel({ kind: 'inPerson', city: 'Austin', region: 'TX', country: 'USA' })).toBe(
      'Austin, TX, USA',
    )
    expect(
      locationLabel({ kind: 'inPerson', city: 'Nairobi', region: null, country: 'Kenya' }),
    ).toBe('Nairobi, Kenya')
  })

  it('writes online events, with their context when there is one', () => {
    expect(locationLabel({ kind: 'online', context: null })).toBe('Online')
    expect(locationLabel({ kind: 'online', context: 'for a conference' })).toBe(
      'Online, for a conference',
    )
  })
})

describe('participantsLabel and prizesLabel', () => {
  it('keeps people and teams as different units', () => {
    expect(participantsLabel({ unit: 'people', count: 832 })).toBe('832 participants')
    expect(participantsLabel({ unit: 'people', count: 1 })).toBe('1 participant')
    expect(participantsLabel({ unit: 'teams', count: 10 })).toBe('10 teams')
    expect(participantsLabel({ unit: 'teams', count: 1 })).toBe('1 team')
  })

  it('says so when a head count is approximate', () => {
    expect(participantsLabel({ unit: 'aboutPeople', count: 60 })).toBe('About 60 participants')
  })

  it('formats dollar prizes and prizes in sats, each in its own unit', () => {
    expect(prizesLabel({ kind: 'usd', amount: 58750 })).toBe('$58,750 in prizes')
    expect(prizesLabel({ kind: 'sats', amount: 17_542_000 })).toBe('17.542M sats in prizes')
    expect(prizesLabel({ kind: 'nonMonetary' })).toBe('Non-monetary prizes')
    expect(prizesLabel({ kind: 'sats', amount: 17_542_000 })).not.toContain('$')
  })

  it('counts the projects a hackathon produced', () => {
    expect(projectsLabel(21)).toBe('21 projects')
    expect(projectsLabel(1)).toBe('1 project')
  })
})

describe('summaries', () => {
  it('summarizes the wins from the derived stats', () => {
    expect(winsSummary(stats.wins)).toBe('9 wins: 6 first places, 2 second places and 1 prize.')
  })

  it('leaves out kinds of result with no wins and uses singulars', () => {
    expect(winsSummary({ total: 1, firsts: 1, seconds: 0, thirds: 0, prizes: 0 })).toBe(
      '1 win: 1 first place.',
    )
    expect(winsSummary({ total: 3, firsts: 0, seconds: 1, thirds: 2, prizes: 0 })).toBe(
      '3 wins: 1 second place and 2 third places.',
    )
  })

  it('summarizes the organized hackathons from the derived stats', () => {
    expect(organizedSummary(stats.organized)).toEqual([
      '16 hackathons in 8 countries (USA, Canada, Kenya, Brazil, Taiwan, Germany, Türkiye, Latvia) plus online.',
      'The 12 events with a public head count add up to 1,471 participants.',
      'The 14 events with a public prize figure add up to $263,525 in prizes.',
    ])
  })

  it('names the right number of events for each total, never one for both', () => {
    const sentences = organizedSummary({ ...stats.organized, headCountEvents: 5, prizeEvents: 7 })

    expect(sentences[1]).toMatch(/^The 5 events with a public head count/)
    expect(sentences[2]).toMatch(/^The 7 events with a public prize figure/)
    expect(sentences.join(' ')).not.toMatch(/public figures/)
  })

  it('does not mention online when nothing was held online', () => {
    const [first] = organizedSummary({ ...stats.organized, includesOnline: false })

    expect(first).not.toMatch(/online/i)
  })

  it('summarizes the bitcoin++ record from the derived stats', () => {
    expect(bitcoinPlusPlusSummary(stats.bitcoinPlusPlus)).toBe(
      'bitcoin++ community member since 2023: 13 editions attended and 51 stage sessions.',
    )
  })
})

describe('experienceWhen', () => {
  const [current, previous] = content.experience

  it('marks the current role and gives no date when the start is not recorded', () => {
    expect(current && experienceWhen(current)).toEqual({ label: 'Current', date: null })
  })

  it('gives a start date only, because end dates are not recorded', () => {
    expect(previous && experienceWhen(previous)).toEqual({
      label: 'From',
      date: { year: 2024, month: 3, day: null },
    })
  })

  it('gives nothing at all for a past role with no start date', () => {
    expect(previous && experienceWhen({ ...previous, start: null })).toBeNull()
  })

  it('gives both for a current role with a known start', () => {
    const start = { year: 2026, month: 1, day: null }

    expect(current && experienceWhen({ ...current, start })).toEqual({
      label: 'Current, from',
      date: start,
    })
  })
})

describe('plural', () => {
  it('picks the form that matches the count', () => {
    expect(plural(1, 'win', 'wins')).toBe('1 win')
    expect(plural(0, 'win', 'wins')).toBe('0 wins')
    expect(plural(1471, 'participant', 'participants')).toBe('1,471 participants')
  })
})

describe('profile lines', () => {
  it('joins the title and organization, and the parts of the location', () => {
    expect(roleLine(content.profile)).toBe(
      `${content.profile.role.title} at ${content.profile.role.organization}`,
    )
    expect(placeLine(content.profile)).toBe('Atlanta, Georgia, USA')
  })
})

describe('displayUrl', () => {
  it('drops the scheme, and the path when it is only a slash', () => {
    expect(displayUrl('https://example.com')).toBe('example.com')
    expect(displayUrl('https://example.com/')).toBe('example.com')
    expect(displayUrl('https://example.com/cv/')).toBe('example.com/cv/')
  })
})
