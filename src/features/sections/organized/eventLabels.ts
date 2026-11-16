import type { Content, DateSpan, Organized, Press } from '../../../content'
import { pressClaim } from '../../../content/pressClaim'
import { organizedCopy } from './copy'

/*
 * What is lettered beside each wristband. Nothing here states a fact of its
 * own: every city, date and line is read from the hackathon's record. Its
 * head count, projects and prizes are left off the label: they count only
 * towards the section's totals.
 */

/** A piece of press about the hackathon, worded by pressClaim and by nothing else. */
export interface PressLine {
  readonly label: string
  readonly href: string
  readonly claim: string
}

export interface EventLabel {
  readonly id: string
  /** The number on the band: 1 is the first hackathon he ran. */
  readonly number: number
  readonly name: string
  /** True for a hackathon that has not been held, which is never counted. */
  readonly upcoming: boolean
  /** The city, or "Online". Null when no place has been announced. */
  readonly place: string | null
  readonly date: DateSpan | null
  /** What follows the date: the country, or what an online event was for. */
  readonly where: string | null
  /** A line more, where the record has one: his role, then its own note. */
  readonly about: readonly string[]
  readonly press: readonly PressLine[]
  /** A line in his handwriting. */
  readonly scrawl: string | null
}

type Sources = Pick<Content, 'organized' | 'wins' | 'press'>

function placeOf({ location }: Organized): string | null {
  if (location === null) {
    return null
  }
  if (location.kind === 'online') {
    return organizedCopy.online
  }
  return location.region === null ? location.city : `${location.city}, ${location.region}`
}

function whereOf({ location, date }: Organized): string | null {
  if (location === null) {
    return date === null ? organizedCopy.notAnnounced : null
  }
  return location.kind === 'online' ? location.context : location.country
}

function pressLine(item: Press, sources: Sources): PressLine {
  const { claim } = pressClaim(item, sources)
  return { label: organizedCopy.coveredBy(item.outlet), href: item.url, claim }
}

function pressOf(event: Organized, sources: Sources): readonly PressLine[] {
  return sources.press
    .filter(({ subject }) => subject.kind === 'organizedEvent' && subject.organizedId === event.id)
    .map((item) => pressLine(item, sources))
}

/** The one thing written by hand: beside a hackathon still to come. */
function scrawlOf(event: Organized): string | null {
  return event.status === 'upcoming' ? organizedCopy.blank : null
}

/**
 * The number each band carries. The record lists the newest first, so a
 * hackathon is numbered by how many of its own kind come after it: the held
 * ones from 1, and the upcoming ones on from the last of those.
 */
function numbers(organized: readonly Organized[]): readonly number[] {
  const heldCount = organized.filter(({ status }) => status === 'held').length
  return organized.map((event, index) => {
    const after = organized.slice(index + 1).filter(({ status }) => status === event.status).length
    return event.status === 'held' ? after + 1 : heldCount + after + 1
  })
}

/** The label beside every wristband, in the record's order: newest first. */
export function eventLabels(sources: Sources): readonly EventLabel[] {
  const numbered = numbers(sources.organized)

  return sources.organized.map((event, index) => ({
    id: event.id,
    number: numbered[index] ?? 0,
    name: event.name,
    upcoming: event.status === 'upcoming',
    place: placeOf(event),
    date: event.date,
    where: whereOf(event),
    about: [event.role, event.note].filter((line) => line !== null),
    press: pressOf(event, sources),
    scrawl: scrawlOf(event),
  }))
}
