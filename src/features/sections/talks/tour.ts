import type { Link, PartialDate, Talk } from '../../../content'
import { formatPartialDate, isoDate } from '../../../lib/formatDate'
import { TALK_FORMATS, TALK_ROLES } from '../../cv/labels'
import { balanceLines } from '../../lid/facts'

/*
 * The tour, read from the talk records: every appearance with a date as a
 * line of the print, the show that is still running, and the workshop he has
 * given more than once. Nothing here states a fact of its own.
 */

type Format = NonNullable<Talk['format']>

/** One line of the tour print. */
export interface TourDate {
  readonly id: string
  /** Null for an appearance the record does not date. */
  readonly year: number | null
  /** "Oct 14", or "Mar" when the day is not known. The year heads the leg. */
  readonly day: string | null
  /** The value for a time element. */
  readonly iso: string | null
  /** Where it was given: for a podcast, the show and the episode. */
  readonly venue: string | null
  readonly title: string
  /** What it was and the part he played: "Panel", "Moderator". */
  readonly parts: readonly string[]
  /** The recording or the page, when the record has one. */
  readonly link: Link | null
  /** Any further addresses the record gives. */
  readonly more: readonly Link[]
}

/** The dates of one year. */
export interface TourLeg {
  readonly year: number | null
  readonly dates: readonly TourDate[]
}

export interface TourYears {
  readonly first: number
  readonly last: number
}

/** A show he is on for as long as it runs. */
export interface OnAirShow {
  readonly id: string
  readonly title: string
  readonly parts: readonly string[]
  readonly detail: string | null
  readonly links: readonly Link[]
}

/** One time the workshop on the pass was given. */
export interface PassRun {
  readonly id: string
  readonly venue: string | null
  readonly year: number | null
}

export interface WorkshopPass {
  readonly id: string
  readonly title: string
  /** The title, split over two lines. */
  readonly lines: readonly [string, string]
  readonly format: string | null
  /** Each time it was given, newest first. */
  readonly given: readonly PassRun[]
  readonly links: readonly Link[]
}

/**
 * The workshop the backstage pass is for, and the earlier run of it under a
 * longer name. Which records these are is a design decision, as the lid's
 * choice of workshop is. How many times it was given is counted from them.
 */
export const PASS_TALKS = Object.freeze([
  'how-to-win-every-hackathon',
  'fun-with-lightning',
] as const)

/** A panelist on a panel is said once. */
const ROLE_IMPLIED_BY: Readonly<Partial<Record<Format, Talk['role']>>> = Object.freeze({
  panel: 'panelist',
})

function dateOf(talk: Talk): PartialDate | null {
  return talk.when?.kind === 'date' ? talk.when.date : null
}

/** An unconfirmed venue is treated like an unknown one: it is not printed. */
function venueOf(talk: Talk): string | null {
  return talk.venue?.confirmed === true ? talk.venue.name : null
}

/** "Oct 14" or "Mar": the date without the year its leg is headed by. */
function dayLabel(date: PartialDate): string | null {
  if (date.month === null) {
    return null
  }
  const full = formatPartialDate(date)
  return full.slice(0, full.lastIndexOf(String(date.year))).replace(/[,\s]+$/, '')
}

/** What the appearance was and his part in it, in the CV's own words. */
export function partLabels({ format, role }: Pick<Talk, 'format' | 'role'>): readonly string[] {
  const implied = format !== null && ROLE_IMPLIED_BY[format] === role
  return [
    ...(format === null ? [] : [TALK_FORMATS[format]]),
    ...(role === null || implied ? [] : [TALK_ROLES[role]]),
  ]
}

function toTourDate(talk: Talk): TourDate {
  const date = dateOf(talk)
  const [link = null, ...more] = talk.links

  return {
    id: talk.id,
    year: date?.year ?? null,
    day: date === null ? null : dayLabel(date),
    iso: date === null ? null : isoDate(date),
    venue: venueOf(talk),
    title: talk.title,
    parts: partLabels(talk),
    link,
    more,
  }
}

/** A number that grows with the date, so that the newest sorts first. */
function sortKey(talk: Talk): string {
  const date = dateOf(talk)
  return date === null ? '' : isoDate({ ...date, month: date.month ?? 1, day: date.day ?? 1 })
}

/** A date known only to the month or the year follows the ones known to the day. */
function precision(talk: Talk): number {
  const date = dateOf(talk)
  return [date?.month, date?.day].filter((part) => part != null).length
}

function newestFirst(one: Talk, other: Talk): number {
  return sortKey(other).localeCompare(sortKey(one)) || precision(other) - precision(one)
}

/**
 * Every appearance that is not a running show, newest first. Appearances of
 * one day keep the order of the record, and an undated one comes last.
 */
export function tourDates(talks: readonly Talk[]): readonly TourDate[] {
  return talks
    .filter((talk) => talk.when?.kind !== 'ongoing')
    .toSorted(newestFirst)
    .map(toTourDate)
}

/** The dates grouped by year, newest year first. */
export function tourLegs(talks: readonly Talk[]): readonly TourLeg[] {
  const dates = tourDates(talks)
  const years = [...new Set(dates.map(({ year }) => year))]

  return years.map((year) => ({ year, dates: dates.filter((date) => date.year === year) }))
}

/** The first and the last year of the tour, or null when nothing is dated. */
export function tourYears(talks: readonly Talk[]): TourYears | null {
  const years = talks.flatMap((talk) => dateOf(talk)?.year ?? [])
  return years.length === 0 ? null : { first: Math.min(...years), last: Math.max(...years) }
}

/** The kinds of appearance on the tour, the most frequent first. */
export function tourFormats(talks: readonly Talk[]): readonly Format[] {
  const formats = talks
    .filter((talk) => talk.when?.kind !== 'ongoing')
    .flatMap(({ format }) => format ?? [])
  const count = (format: Format): number => formats.filter((each) => each === format).length

  return [...new Set(formats)].toSorted((one, other) => count(other) - count(one))
}

/** The shows that are still running. */
export function onAirShows(talks: readonly Talk[]): readonly OnAirShow[] {
  return talks
    .filter((talk) => talk.when?.kind === 'ongoing')
    .map((talk) => ({
      id: talk.id,
      title: talk.title,
      parts: partLabels(talk),
      detail: talk.detail,
      links: talk.links,
    }))
}

/** The backstage pass, or null when the workshop is no longer in the record. */
export function workshopPass(talks: readonly Talk[]): WorkshopPass | null {
  const runs = PASS_TALKS.flatMap((id) => talks.find((talk) => talk.id === id) ?? [])
  const [first] = runs
  if (!first) {
    return null
  }

  return {
    id: first.id,
    title: first.title,
    lines: balanceLines(first.title),
    format: first.format === null ? null : TALK_FORMATS[first.format],
    given: runs.map((run) => ({
      id: run.id,
      venue: venueOf(run),
      year: dateOf(run)?.year ?? null,
    })),
    links: runs.flatMap(({ links }) => links),
  }
}
