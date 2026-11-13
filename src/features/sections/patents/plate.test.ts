import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import type { Patent } from '../../../content'
import { patentStats } from '../../../content/derive'
import { numberField, plateCount, plateFilings, recordSource } from './plate'

function patent(id: string): Patent {
  const found = content.patents.find((candidate) => candidate.id === id)
  if (!found) {
    throw new Error(`No patent has the id "${id}"`)
  }
  return found
}

describe('plateFilings', () => {
  it('is every filing that names him, in the record’s order', () => {
    expect(plateFilings(content.patents).map(({ id }) => id)).toEqual([
      'us-12536579',
      'us-12354083',
      'us-20230032782',
      'us-20240037539',
    ])
  })

  it('leaves out a filing he has taken off the site', () => {
    const hidden = content.patents.map((filing) =>
      filing.id === 'us-20240037539' ? { ...filing, shown: false } : filing,
    )

    expect(plateFilings(hidden).map(({ id }) => id)).not.toContain('us-20240037539')
  })
})

describe('plateCount', () => {
  it('is one count of all the filings, from the derived number, worded as filings', () => {
    expect(plateCount(stats.patents)).toEqual({
      label: 'Named inventor on',
      count: 4,
      unit: 'U.S. patent filings',
    })
    expect(plateCount(stats.patents)?.count).toBe(stats.patents.filings)
  })

  it('words a single filing as one', () => {
    const [first] = content.patents

    expect(plateCount(patentStats(first ? [first] : []))).toEqual({
      label: 'Named inventor on',
      count: 1,
      unit: 'U.S. patent filing',
    })
  })

  it('is nothing when there is nothing to count', () => {
    expect(plateCount(patentStats([]))).toBeNull()
  })
})

describe('numberField', () => {
  it('labels every filing’s number the same way, and prints it as the office does', () => {
    expect(numberField(patent('us-12536579'))).toEqual({
      label: 'Publication no.',
      value: 'US 12,536,579 B2',
    })
    expect(numberField(patent('us-20230032782'))).toEqual({
      label: 'Publication no.',
      value: 'US 2023/0032782 A1',
    })
    expect(new Set(content.patents.map((filing) => numberField(filing).label))).toEqual(
      new Set(['Publication no.']),
    )
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
