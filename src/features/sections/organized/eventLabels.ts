import type { Content, DateSpan, Organized, Press } from '../../../content'
import { pressClaim } from '../../../content/pressClaim'
import { formatMillions, formatNumber, formatUsd } from '../../../lib/formatNumber'
import { organizedCopy } from './copy'

/*
 * What is lettered beside each wristband. Nothing here states a fact of its
 * own: every city, date and figure is read from the hackathon's record, and
 * each kind of figure keeps its own wording, so a count of teams never reads
 * as a head count and a prize in sats never reads as dollars.
 */

/** A count, a prize, or a figure the organizers never published. */
export type ChipKind = 'count' | 'prize' | 'unknown'

export interface Chip {
  readonly kind: ChipKind
  readonly text: string
}

/** A piece of press about the hackathon, worded by pressClaim and by nothing else. */
export interface PressLine {
  readonly label: string
  readonly href: string
  readonly claim: string
  readonly naming: string | null
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
  readonly chips: readonly Chip[]
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

function headCount({ participants }: Organized): Chip | null {
  if (participants === null) {
    return null
  }
  const figure = formatNumber(participants.count)
  switch (participants.unit) {
    case 'people':
      return { kind: 'count', text: organizedCopy.people(figure) }
    case 'aboutPeople':
      return { kind: 'count', text: organizedCopy.aboutPeople(figure) }
    case 'teams':
      return { kind: 'count', text: organizedCopy.teams(figure) }
  }
}

function prize({ prizes }: Organized): Chip | null {
  if (prizes === null) {
    return null
  }
  switch (prizes.kind) {
    case 'usd':
      return { kind: 'prize', text: organizedCopy.usdPrizes(formatUsd(prizes.amount)) }
    case 'sats':
      return { kind: 'prize', text: organizedCopy.satsPrizes(formatMillions(prizes.amount)) }
    case 'nonMonetary':
      return { kind: 'prize', text: organizedCopy.nonMonetary }
  }
}

/** What the organizers never published, said once when it is both figures. */
function gaps(event: Organized): readonly Chip[] {
  const noHeadCount = event.participants === null
  const noPrize = event.prizes === null
  if (noHeadCount && noPrize) {
    return [{ kind: 'unknown', text: organizedCopy.figuresNotPublic }]
  }
  return [
    ...(noHeadCount ? [organizedCopy.headCountNotPublic] : []),
    ...(noPrize ? [organizedCopy.prizesNotPublic] : []),
  ].map((text) => ({ kind: 'unknown', text }))
}

/** What is known first: the counts, then the prize, then what is not public. */
function chipsOf(event: Organized): readonly Chip[] {
  if (event.status === 'upcoming') {
    return []
  }
  const projects: readonly Chip[] =
    event.projects === null
      ? []
      : [{ kind: 'count', text: organizedCopy.projects(formatNumber(event.projects)) }]

  return [headCount(event), ...projects, prize(event)]
    .filter((chip) => chip !== null)
    .concat(gaps(event))
}

function pressLine(item: Press, sources: Sources): PressLine {
  const { claim, naming } = pressClaim(item, sources)
  return { label: organizedCopy.coveredBy(item.outlet), href: item.url, claim, naming }
}

function pressOf(event: Organized, sources: Sources): readonly PressLine[] {
  return sources.press
    .filter(({ subject }) => subject.kind === 'organizedEvent' && subject.organizedId === event.id)
    .map((item) => pressLine(item, sources))
}

function scrawlOf(event: Organized, { wins }: Sources): string | null {
  if (event.status === 'upcoming') {
    return organizedCopy.blank
  }
  return wins.some(({ alsoOrganizedId }) => alsoOrganizedId === event.id)
    ? organizedCopy.ownWin
    : null
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
    chips: chipsOf(event),
    press: pressOf(event, sources),
    scrawl: scrawlOf(event, sources),
  }))
}
