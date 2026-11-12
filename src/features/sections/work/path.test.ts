import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { Experience, Talk } from '../../../content'
import {
  careerPath,
  firstStageTalk,
  markSection,
  NOW_KEY,
  type PathMark,
  type PathSource,
  type PathStop,
} from './path'

type MarkOf<Kind extends PathMark['kind']> = Extract<PathMark, { readonly kind: Kind }>

const path = careerPath(content)

function stopOf(stops: readonly PathStop[], key: string): PathStop {
  const found = stops.find((stop) => stop.key === key)
  if (!found) {
    throw new Error(`The path has no stop "${key}"`)
  }
  return found
}

function markOf<Kind extends PathMark['kind']>(key: string, kind: Kind): MarkOf<Kind> | undefined {
  return stopOf(path, key).marks.find((mark): mark is MarkOf<Kind> => mark.kind === kind)
}

function allMarks<Kind extends PathMark['kind']>(kind: Kind): readonly MarkOf<Kind>[] {
  return path.flatMap((stop) =>
    stop.marks.filter((mark): mark is MarkOf<Kind> => mark.kind === kind),
  )
}

const ids = (records: readonly { readonly id: string }[]): readonly string[] =>
  records.map(({ id }) => id)

function role(id: string): Experience {
  const found = content.experience.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No job has the id "${id}"`)
  }
  return found
}

const withJobs = (experience: readonly Experience[]): PathSource => ({ ...content, experience })

describe('careerPath', () => {
  it('runs from now down to the earliest year on record, missing none', () => {
    expect(path.map((stop) => stop.key)).toEqual([
      NOW_KEY,
      '2026',
      '2025',
      '2024',
      '2023',
      '2022',
      '2021',
      '2020',
      '2019',
      '2018',
    ])
    expect(path[0]?.year).toBeNull()
    expect(path.slice(1).map((stop) => stop.year)).toEqual([
      2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018,
    ])
  })

  it('puts the current job at the top, where no date is needed', () => {
    const now = stopOf(path, NOW_KEY)

    expect(ids(now.jobs.map((job) => job.role))).toEqual(['finite-computer'])
    expect(now.jobs[0]?.role.start).toBeNull()
    expect(now.marks).toEqual([])
    expect(now.schools).toEqual([])
  })

  it('pins every other job at the year it started, once', () => {
    const pinned = path
      .filter((stop) => stop.year !== null)
      .flatMap((stop) => stop.jobs.map((job) => [job.role.id, stop.year] as const))

    expect(pinned).toEqual([
      ['fedi', 2024],
      ['zion', 2023],
      ['blockspaces', 2022],
      ['ncr', 2020],
    ])
    expect(path.flatMap((stop) => stop.jobs)).toHaveLength(content.experience.length)
  })

  it('numbers the jobs in the order he joined them', () => {
    const numbers = Object.fromEntries(
      path.flatMap((stop) => stop.jobs.map((job) => [job.role.id, job.assetNumber])),
    )

    expect(numbers).toEqual({
      ncr: 1,
      blockspaces: 2,
      zion: 3,
      fedi: 4,
      'finite-computer': 5,
    })
  })

  it('pins the university at the year he began there', () => {
    expect(ids(stopOf(path, '2018').schools)).toEqual(['auburn-university'])
    expect(path.flatMap((stop) => stop.schools)).toHaveLength(content.education.length)
  })

  it('gives 2021 to his NCR years: the NCR win, a hackathon he ran and a patent filed', () => {
    expect(ids(markOf('2021', 'wins')?.wins ?? [])).toEqual(['ncr-global-hackathon-2021'])
    expect(ids(markOf('2021', 'organized')?.events ?? [])).toEqual(['auburnhacks-2021'])
    expect(ids(markOf('2021', 'filed')?.patents ?? [])).toEqual(['us-12536579'])
    expect(stopOf(path, '2021').jobs).toEqual([])
  })

  it('files each win under its year, in the order the record lists them', () => {
    expect(ids(markOf('2026', 'wins')?.wins ?? [])).toEqual(['stringer-safety'])
    expect(ids(markOf('2024', 'wins')?.wins ?? [])).toEqual(['lightning-welder'])
    expect(ids(markOf('2023', 'wins')?.wins ?? [])).toEqual([
      'bitdevs-upgrade',
      'auntie-ln',
      'last-pay-wins',
    ])
    expect(ids(markOf('2022', 'wins')?.wins ?? [])).toEqual([
      'pleb-fm',
      'arion-parking',
      'treepay-ux',
    ])
    expect(markOf('2025', 'wins')).toBeUndefined()
  })

  it('counts the hackathons he ran each year, oldest first, and never the upcoming one', () => {
    const counts = Object.fromEntries(
      path.flatMap((stop) => {
        const mark = stop.marks.find((candidate) => candidate.kind === 'organized')
        return mark?.kind === 'organized' ? [[stop.key, mark.events.length]] : []
      }),
    )

    expect(counts).toEqual({ '2026': 5, '2025': 8, '2024': 1, '2021': 1, '2020': 1 })
    expect(ids(markOf('2026', 'organized')?.events ?? [])).toEqual([
      'btcpp-florianopolis-2026',
      'ai-hack-for-freedom-ii',
      'btcpp-nairobi-2026',
      'btcpp-toronto-2026',
      'ai-hack-for-freedom-iii',
    ])
    expect(allMarks('organized').flatMap((mark) => ids(mark.events))).not.toContain(
      'ai-hack-for-freedom-iv',
    )
  })

  it('marks a patent filing once, in the year it was filed, the earliest first', () => {
    expect(ids(markOf('2021', 'filed')?.patents ?? [])).toEqual(['us-12536579'])
    expect(ids(markOf('2022', 'filed')?.patents ?? [])).toEqual([
      'us-12354083',
      'us-20240037539',
      'us-20230032782',
    ])
    expect(allMarks('filed').flatMap((mark) => mark.patents)).toHaveLength(stats.patents.filings)
  })

  it('has no mark for what became of a filing: nothing in the years two were granted', () => {
    const kinds = new Set<string>(path.flatMap((stop) => stop.marks.map((mark) => mark.kind)))

    expect([...kinds].toSorted()).toEqual(['filed', 'firstTalk', 'organized', 'wins'])
    expect(markOf('2025', 'filed')).toBeUndefined()
    expect(markOf('2026', 'filed')).toBeUndefined()
    expect(stopOf(path, '2025').marks.map((mark) => mark.kind)).toEqual(['organized'])
  })

  it('never marks a filing he has taken off the site', () => {
    const hidden = careerPath({
      ...content,
      patents: content.patents.map((patent) =>
        patent.id === 'us-20240037539' ? { ...patent, shown: false } : patent,
      ),
    })
    const marked = hidden.flatMap((stop) =>
      stop.marks.flatMap((mark) => (mark.kind === 'filed' ? ids(mark.patents) : [])),
    )

    expect(marked).toEqual(['us-12354083', 'us-20230032782', 'us-12536579'])
  })

  it('marks the year he first took a stage, which a podcast is not', () => {
    const first = markOf('2023', 'firstTalk')

    expect(first?.talk.id).toBe('extending-bitcoin-with-zk-proofs')
    expect(first?.date).toEqual({ year: 2023, month: 12, day: 13 })
    expect(allMarks('firstTalk')).toHaveLength(1)
  })

  it('leaves a year with nothing on record empty, and keeps it on the rule', () => {
    const quiet = stopOf(path, '2019')

    expect(quiet.jobs).toEqual([])
    expect(quiet.schools).toEqual([])
    expect(quiet.marks).toEqual([])
  })

  it('adds up to the totals the rest of the site prints', () => {
    expect(allMarks('wins').flatMap((mark) => mark.wins)).toHaveLength(stats.wins.total)
    expect(allMarks('organized').flatMap((mark) => mark.events)).toHaveLength(stats.organized.count)
  })

  it('sets the marks of a year down in one order: organized, wins, filed, first talk', () => {
    const order: readonly PathMark['kind'][] = ['organized', 'wins', 'filed', 'firstTalk']

    for (const stop of path) {
      const kinds = stop.marks.map((mark) => mark.kind)
      expect(kinds, stop.key).toEqual(order.filter((kind) => kinds.includes(kind)))
    }
    expect(stopOf(path, '2026').marks.map((mark) => mark.kind)).toEqual(['organized', 'wins'])
    expect(stopOf(path, '2022').marks.map((mark) => mark.kind)).toEqual(['wins', 'filed'])
    expect(stopOf(path, '2021').marks.map((mark) => mark.kind)).toEqual([
      'organized',
      'wins',
      'filed',
    ])
  })

  it('does not change the record it reads', () => {
    expect(Object.isFrozen(content.experience)).toBe(true)
    expect(() => careerPath(content)).not.toThrow()
    expect(careerPath(content)).toEqual(path)
  })
})

describe('careerPath, when the record changes', () => {
  it('keeps the current job at the top once its start date is known', () => {
    const dated = { ...role('finite-computer'), start: { year: 2025, month: 6, day: null } }
    const stops = careerPath(withJobs([dated, ...content.experience.slice(1)]))

    expect(ids(stopOf(stops, NOW_KEY).jobs.map((job) => job.role))).toEqual(['finite-computer'])
    expect(stopOf(stops, '2025').jobs).toEqual([])
    expect(stopOf(stops, NOW_KEY).jobs[0]?.assetNumber).toBe(content.experience.length)
  })

  it('stacks two jobs that began in one year, the later first', () => {
    const spring = { ...role('zion'), id: 'spring', start: { year: 2023, month: 2, day: null } }
    const stops = careerPath(withJobs([...content.experience, spring]))
    const jobs = stopOf(stops, '2023').jobs

    expect(ids(jobs.map((job) => job.role))).toEqual(['zion', 'spring'])
    expect(jobs.map((job) => job.assetNumber)).toEqual([4, 3])
    expect(stopOf(stops, '2024').jobs[0]?.assetNumber).toBe(5)
  })

  it('refuses a past job with no start date: there is nowhere honest to pin it', () => {
    const undated = { ...role('zion'), start: null }

    expect(() => careerPath(withJobs([undated]))).toThrow(/zion.*no start date/i)
  })

  it('refuses a school with no start date for the same reason', () => {
    const [auburn] = content.education
    const undated = auburn ? [{ ...auburn, start: null }] : []

    expect(() => careerPath({ ...content, education: undated })).toThrow(/auburn-university/)
  })

  it('reaches as far forward as the newest record, and no further', () => {
    const stops = careerPath({
      ...content,
      wins: content.wins.filter((win) => win.year < 2025),
      organized: [],
      patents: [],
      talks: [],
    })

    expect(stops[1]?.key).toBe('2024')
    expect(stops.at(-1)?.key).toBe('2018')
  })

  it('is only the present when nothing on record has a date', () => {
    const stops = careerPath({
      experience: [role('finite-computer')],
      education: [],
      wins: [],
      organized: [],
      talks: [],
      patents: [],
    })

    expect(stops.map((stop) => stop.key)).toEqual([NOW_KEY])
  })
})

describe('firstStageTalk', () => {
  const talk = (id: string): Talk => {
    const found = content.talks.find((candidate) => candidate.id === id)
    if (!found) {
      throw new Error(`No talk has the id "${id}"`)
    }
    return found
  }

  it('is the earliest dated talk that was not a podcast', () => {
    expect(firstStageTalk(content.talks)?.talk.id).toBe('extending-bitcoin-with-zk-proofs')
  })

  it('counts a talk whose format is not recorded as a stage', () => {
    const found = firstStageTalk([
      talk('state-of-bitcoin-67'),
      talk('fedimint-wallet-in-20-minutes'),
    ])

    expect(found?.talk.id).toBe('fedimint-wallet-in-20-minutes')
    expect(found?.date.year).toBe(2024)
  })

  it('is nothing when he has only been on podcasts, or the show has no date', () => {
    expect(firstStageTalk([talk('state-of-bitcoin-67'), talk('ai-unchained-003')])).toBeNull()
    expect(firstStageTalk([talk('bitdevs-radio-hour')])).toBeNull()
    expect(firstStageTalk([])).toBeNull()
  })
})

describe('markSection', () => {
  it('sends every mark to the section that tells the rest', () => {
    expect(markSection('wins')).toBe('wins')
    expect(markSection('organized')).toBe('organized')
    expect(markSection('filed')).toBe('patents')
    expect(markSection('firstTalk')).toBe('talks')
  })
})
