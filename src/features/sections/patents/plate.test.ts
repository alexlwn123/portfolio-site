import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { Patent } from '../../../content'
import { patentStats } from '../../../content/derive'
import {
  coInventorsField,
  numberField,
  plateCounts,
  plateFilings,
  recordSource,
  statusOf,
} from './plate'

function patent(id: string): Patent {
  const found = content.patents.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No patent has the id "${id}"`)
  }
  return found
}

describe('plateFilings', () => {
  it('is the filings he has chosen to show, in the record’s order: granted first', () => {
    expect(plateFilings(content.patents).map(({ id }) => id)).toEqual([
      'us-12536579',
      'us-12354083',
      'us-20230032782',
    ])
  })

  it('shows the abandoned application only once he flips its flag', () => {
    const flipped = content.patents.map((filing) => ({ ...filing, shown: true }))

    expect(plateFilings(content.patents).map(({ id }) => id)).not.toContain('us-20240037539')
    expect(plateFilings(flipped).map(({ id }) => id)).toContain('us-20240037539')
  })
})

describe('plateCounts', () => {
  it('counts patents and applications apart, from the derived numbers', () => {
    expect(plateCounts(stats.patents)).toEqual([
      { kind: 'granted', count: 2, label: 'Patents granted' },
      { kind: 'pending', count: 1, label: 'Application pending' },
    ])
  })

  it('never adds the two into one figure', () => {
    const counts = plateCounts(stats.patents).map(({ count }) => count)

    expect(counts).not.toContain(stats.patents.filings)
    expect(counts).not.toContain(stats.patents.granted + stats.patents.pending)
  })

  it('leaves out a count of nothing, and words a single patent as one', () => {
    const [granted] = content.patents

    expect(plateCounts(patentStats(granted ? [granted] : []))).toEqual([
      { kind: 'granted', count: 1, label: 'Patent granted' },
    ])
    expect(plateCounts(patentStats([]))).toEqual([])
  })
})

describe('numberField', () => {
  it('labels a granted patent’s number as a patent number, as the office prints it', () => {
    expect(numberField(patent('us-12536579'))).toEqual({
      label: 'Patent no.',
      value: 'US 12,536,579 B2',
    })
  })

  it('labels an application’s number as an application number', () => {
    expect(numberField(patent('us-20230032782'))).toEqual({
      label: 'Application no.',
      value: 'US 2023/0032782 A1',
    })
    expect(numberField(patent('us-20240037539')).label).toBe('Application no.')
  })
})

describe('statusOf', () => {
  it('is “granted”, with the day, for a granted patent', () => {
    expect(statusOf(patent('us-12354083'))).toEqual({
      label: 'Granted',
      date: { year: 2025, month: 7, day: 8 },
    })
  })

  it('is “application pending”, with no date, for one still pending', () => {
    expect(statusOf(patent('us-20230032782'))).toEqual({ label: 'Application pending', date: null })
  })

  it('says so when an application was abandoned', () => {
    expect(statusOf(patent('us-20240037539'))).toEqual({
      label: 'Application abandoned',
      date: null,
    })
  })
})

describe('coInventorsField', () => {
  it('names the one other inventor', () => {
    expect(coInventorsField(patent('us-12536579'))).toEqual({
      label: 'Co-inventor',
      value: 'Christian Lee McDaniel',
    })
  })

  it('names several, under a plural label', () => {
    expect(coInventorsField(patent('us-20240037539'))).toEqual({
      label: 'Co-inventors',
      value: 'Bryan Walser Nonni, Brent Vance Zucker',
    })
  })

  it('is nothing when he is the only inventor', () => {
    expect(coInventorsField({ ...patent('us-12536579'), coInventors: [] })).toBeNull()
  })
})

describe('recordSource', () => {
  it('is where the numbers lead, when they all lead to the same place', () => {
    expect(recordSource(plateFilings(content.patents))).toBe('Google Patents')
  })

  it('is nothing when they do not, or when there are none', () => {
    const elsewhere = {
      ...patent('us-12536579'),
      link: { label: 'USPTO', url: 'https://example.org' },
    }

    expect(recordSource([patent('us-12354083'), elsewhere])).toBeNull()
    expect(recordSource([])).toBeNull()
  })
})
