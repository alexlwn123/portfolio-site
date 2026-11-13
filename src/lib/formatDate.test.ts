import { describe, expect, it } from 'vitest'

import { formatDateSpan, formatPartialDate, isoDate } from './formatDate'

const date = (year: number, month: number | null = null, day: number | null = null) => ({
  year,
  month,
  day,
})

describe('formatPartialDate', () => {
  it('writes as much of the date as is known', () => {
    expect(formatPartialDate(date(2024))).toBe('2024')
    expect(formatPartialDate(date(2026, 9))).toBe('Sep 2026')
    expect(formatPartialDate(date(2025, 12, 16))).toBe('Dec 16, 2025')
  })

  it('can spell the month out', () => {
    expect(formatPartialDate(date(2024, 3), 'long')).toBe('March 2024')
    expect(formatPartialDate(date(2026, 10, 27), 'long')).toBe('October 27, 2026')
  })

  it('refuses a month outside the calendar', () => {
    expect(() => formatPartialDate(date(2024, 13))).toThrow(/month/i)
  })
})

describe('formatDateSpan', () => {
  it('writes a single date when there is no end', () => {
    expect(formatDateSpan({ start: date(2025, 9, 4), end: null })).toBe('Sep 4, 2025')
    expect(formatDateSpan({ start: date(2026, 7), end: null })).toBe('Jul 2026')
  })

  it('shares the month and year across a span inside one month', () => {
    expect(formatDateSpan({ start: date(2026, 6, 17), end: date(2026, 6, 18) })).toBe(
      'Jun 17–18, 2026',
    )
  })

  it('shares the year across a span inside one year', () => {
    expect(formatDateSpan({ start: date(2025, 4, 8), end: date(2025, 5, 20) })).toBe(
      'Apr 8 – May 20, 2025',
    )
  })

  it('writes both dates in full across a new year', () => {
    expect(formatDateSpan({ start: date(2025, 12, 30), end: date(2026, 1, 2) })).toBe(
      'Dec 30, 2025 – Jan 2, 2026',
    )
  })

  it('writes both ends in full when either lacks a day', () => {
    expect(formatDateSpan({ start: date(2025, 4), end: date(2025, 5) })).toBe('Apr 2025 – May 2025')
  })
})

describe('isoDate', () => {
  it('gives the machine-readable form for a time element', () => {
    expect(isoDate(date(2024))).toBe('2024')
    expect(isoDate(date(2026, 9))).toBe('2026-09')
    expect(isoDate(date(2025, 2, 8))).toBe('2025-02-08')
  })
})
