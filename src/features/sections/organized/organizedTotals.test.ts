import { describe, expect, it } from 'vitest'

import { stats } from '../../../content'
import type { Stats } from '../../../content'
import { organizedCopy } from './copy'
import { organizedTotals } from './organizedTotals'

const totals = organizedTotals(stats.organized)

describe('organizedTotals', () => {
  it('prints the count of hackathons held, and says what it counts', () => {
    expect(totals.count.figure).toBe(String(stats.organized.count))
    expect(totals.count.figure).toBe('16')
    expect(totals.count.summary).toBe('16 hackathons organized')
  })

  it('counts the countries, with online said apart, and lists them', () => {
    expect(totals.countries.label).toBe('8 countries + online')
    expect(totals.countries.names).toEqual(stats.organized.countries)
    expect(totals.countries.names).toHaveLength(stats.organized.countryCount)
  })

  it('leaves "online" out when no event was', () => {
    const inPerson: Stats['organized'] = { ...stats.organized, includesOnline: false }

    expect(organizedTotals(inPerson).countries.label).toBe('8 countries')
  })

  it('gives the head count with the events it covers', () => {
    expect(totals.participants).toEqual({
      figure: '1,471',
      label: organizedCopy.participants,
      footnote: '12 events with a public head count',
    })
  })

  it('gives the prize money with the events it covers', () => {
    expect(totals.prizes).toEqual({
      figure: '$263,525',
      label: organizedCopy.prizes,
      footnote: '14 events with a public prize figure',
    })
  })

  it('never lets one footnote speak for both totals', () => {
    expect(totals.participants.footnote).not.toBe(totals.prizes.footnote)
    expect(totals.participants.footnote).toContain(String(stats.organized.headCountEvents))
    expect(totals.prizes.footnote).toContain(String(stats.organized.prizeEvents))
  })

  it('letters the stamp with the first year he ran one', () => {
    expect(totals.stamp).toEqual({ role: 'ORGANIZER', since: 'SINCE 2020' })
  })

  it('has no year to stamp before the first hackathon is held', () => {
    const none: Stats['organized'] = { ...stats.organized, sinceYear: null }

    expect(organizedTotals(none).stamp).toEqual({ role: 'ORGANIZER', since: null })
  })
})
