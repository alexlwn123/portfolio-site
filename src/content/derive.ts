import type {
  BitcoinPlusPlus,
  Content,
  HeldEvent,
  Organized,
  Patent,
  Project,
  UpcomingEvent,
  Win,
} from './schema'

/*
 * Every number the site prints is computed here from the records. Nothing
 * else counts, adds or hardcodes a figure.
 */

export interface WinStats {
  readonly total: number
  readonly firsts: number
  readonly seconds: number
  readonly thirds: number
  readonly prizes: number
}

export interface OrganizedStats {
  /** Hackathons held. Upcoming events are never counted. */
  readonly count: number
  readonly upcomingCount: number
  /** The number the next hackathon will carry. */
  readonly nextNumber: number
  readonly sinceYear: number | null
  /** Held events with an exact public head count. The denominator of `participants`. */
  readonly headCountEvents: number
  /** Participants across those events only. */
  readonly participants: number
  /** Held events with a public prize figure. The denominator of `prizeUsd`. */
  readonly prizeEvents: number
  /** Prize money in US dollars across those events only. */
  readonly prizeUsd: number
  /** Countries of in-person events, in order of first appearance. */
  readonly countries: readonly string[]
  readonly countryCount: number
  readonly includesOnline: boolean
}

export interface BitcoinPlusPlusStats {
  readonly editions: number
  readonly stageSessions: number
  readonly memberSince: number
}

export interface PatentStats {
  /** Patents granted. An application is never counted here. */
  readonly granted: number
  /** Applications still pending. */
  readonly pending: number
  /** Every filing that names him: granted, pending and abandoned, shown or not. */
  readonly filings: number
  readonly anyPending: boolean
}

export interface Stats {
  readonly wins: WinStats
  readonly organized: OrganizedStats
  readonly bitcoinPlusPlus: BitcoinPlusPlusStats
  readonly patents: PatentStats
}

export function heldEvents(organized: readonly Organized[]): readonly HeldEvent[] {
  return organized.filter((event): event is HeldEvent => event.status === 'held')
}

export function upcomingEvents(organized: readonly Organized[]): readonly UpcomingEvent[] {
  return organized.filter((event): event is UpcomingEvent => event.status === 'upcoming')
}

/**
 * True when the event has an exact public head count. A count of teams and an
 * approximate head count are different kinds of figure and are left out.
 */
export function hasExactHeadCount(event: Organized): boolean {
  return event.participants?.unit === 'people'
}

/**
 * True when the event's prize figure is public in dollars: an amount, or a
 * statement that the prizes were non-monetary, which adds nothing. A prize in
 * sats is a different kind of figure and is left out.
 */
export function hasPublicPrizeFigure(event: Organized): boolean {
  return event.prizes?.kind === 'usd' || event.prizes?.kind === 'nonMonetary'
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function countriesOf(events: readonly HeldEvent[]): readonly string[] {
  const countries = events.flatMap(({ location }) =>
    location?.kind === 'inPerson' ? [location.country] : [],
  )
  return [...new Set(countries)]
}

export function winStats(wins: readonly Win[]): WinStats {
  const placed = (place: number): number =>
    wins.filter(({ result }) => result.kind === 'place' && result.place === place).length

  return {
    total: wins.length,
    firsts: placed(1),
    seconds: placed(2),
    thirds: placed(3),
    prizes: wins.filter(({ result }) => result.kind === 'prize').length,
  }
}

export function organizedStats(organized: readonly Organized[]): OrganizedStats {
  const held = heldEvents(organized)
  const withHeadCount = held.filter(hasExactHeadCount)
  const withPrizeFigure = held.filter(hasPublicPrizeFigure)
  const countries = countriesOf(held)
  const years = held.map(({ date }) => date.start.year)

  return {
    count: held.length,
    upcomingCount: upcomingEvents(organized).length,
    nextNumber: held.length + 1,
    sinceYear: years.length > 0 ? Math.min(...years) : null,
    headCountEvents: withHeadCount.length,
    participants: sum(withHeadCount.map(({ participants }) => participants?.count ?? 0)),
    prizeEvents: withPrizeFigure.length,
    prizeUsd: sum(
      withPrizeFigure.map(({ prizes }) => (prizes?.kind === 'usd' ? prizes.amount : 0)),
    ),
    countries,
    countryCount: countries.length,
    includesOnline: held.some(({ location }) => location?.kind === 'online'),
  }
}

export function bitcoinPlusPlusStats(record: BitcoinPlusPlus): BitcoinPlusPlusStats {
  return {
    editions: record.editionsAttended,
    stageSessions: record.stageSessions,
    memberSince: record.memberSince,
  }
}

/** Counts every filing in the record, whether or not the site shows it. */
export function patentStats(patents: readonly Patent[]): PatentStats {
  const withStatus = (kind: Patent['status']['kind']): number =>
    patents.filter(({ status }) => status.kind === kind).length
  const pending = withStatus('pending')

  return {
    granted: withStatus('granted'),
    pending,
    filings: patents.length,
    anyPending: pending > 0,
  }
}

export function deriveStats(
  content: Pick<Content, 'wins' | 'organized' | 'bitcoinPlusPlus' | 'patents'>,
): Stats {
  return {
    wins: winStats(content.wins),
    organized: organizedStats(content.organized),
    bitcoinPlusPlus: bitcoinPlusPlusStats(content.bitcoinPlusPlus),
    patents: patentStats(content.patents),
  }
}

/** Filings that may be shown. The others stay in the data until he flips their flag. */
export function publishablePatents(patents: readonly Patent[]): readonly Patent[] {
  return patents.filter((patent) => patent.shown)
}

/** Projects that may be shown. Unconfirmed ones wait for his say-so. */
export function publishableProjects(projects: readonly Project[]): readonly Project[] {
  return projects.filter((project) => project.confirmed)
}
