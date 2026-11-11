/** A date known to the year, the month or the day. */
export interface PartialDateLike {
  readonly year: number
  readonly month: number | null
  readonly day: number | null
}

export interface DateSpanLike {
  readonly start: PartialDateLike
  readonly end: PartialDateLike | null
}

export type MonthStyle = 'short' | 'long'

const MONTHS: Readonly<Record<MonthStyle, readonly string[]>> = Object.freeze({
  short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  long: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
})

const EN_DASH = '–'
const ISO_PART_WIDTH = 2

function monthName(month: number, style: MonthStyle): string {
  const name = MONTHS[style][month - 1]
  if (name === undefined) {
    throw new RangeError(`Expected a month from 1 to 12, received ${String(month)}`)
  }
  return name
}

function monthAndDay(date: PartialDateLike, style: MonthStyle): string | null {
  if (date.month === null) {
    return null
  }
  const month = monthName(date.month, style)
  return date.day === null ? month : `${month} ${String(date.day)}`
}

/** "2024", "Sep 2026" or "Dec 16, 2025", depending on what is known. */
export function formatPartialDate(date: PartialDateLike, style: MonthStyle = 'short'): string {
  const lead = monthAndDay(date, style)
  if (lead === null) {
    return String(date.year)
  }
  return date.day === null ? `${lead} ${String(date.year)}` : `${lead}, ${String(date.year)}`
}

/** "Jun 17–18, 2026", "Apr 8 – May 20, 2025", or a single date when there is no end. */
export function formatDateSpan(span: DateSpanLike, style: MonthStyle = 'short'): string {
  const { start, end } = span
  if (end === null) {
    return formatPartialDate(start, style)
  }
  const hasDays = start.day !== null && end.day !== null
  if (!hasDays || start.year !== end.year) {
    return `${formatPartialDate(start, style)} ${EN_DASH} ${formatPartialDate(end, style)}`
  }
  if (start.month === end.month) {
    return `${monthAndDay(start, style) ?? ''}${EN_DASH}${String(end.day)}, ${String(end.year)}`
  }
  return `${monthAndDay(start, style) ?? ''} ${EN_DASH} ${formatPartialDate(end, style)}`
}

function pad(part: number): string {
  return String(part).padStart(ISO_PART_WIDTH, '0')
}

/** The value for a `<time datetime>` attribute: "2024", "2026-09" or "2025-02-08". */
export function isoDate(date: PartialDateLike): string {
  if (date.month === null) {
    return String(date.year)
  }
  const yearAndMonth = `${String(date.year)}-${pad(date.month)}`
  return date.day === null ? yearAndMonth : `${yearAndMonth}-${pad(date.day)}`
}
