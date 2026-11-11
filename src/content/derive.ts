import type {
  BitcoinPlusPlus,
  Content,
  HeldEvent,
  Organized,
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
  /** Held events with a public head count and a public prize figure. */
  readonly publicFigureEvents: number
  /** Participants across those events only. */
  readonly participants: number
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

export interface Stats {
  readonly wins: WinStats
  readonly organized: OrganizedStats
  readonly bitcoinPlusPlus: BitcoinPlusPlusStats
}

export function heldEvents(organized: readonly Organized[]): readonly HeldEvent[] {
  return organized.filter((event): event is HeldEvent => event.status === 'held')
}

export function upcomingEvents(organized: readonly Organized[]): readonly UpcomingEvent[] {
  return organized.filter((event): event is UpcomingEvent => event.status === 'upcoming')
}

/**
 * True when both figures are public: a head count (not a team count) and a
 * prize that is either a dollar amount or stated to be non-monetary.
 */
export function hasPublicFigures(event: Organized): boolean {
  const publicHeadCount = event.participants?.unit === 'people'
  const publicPrize = event.prizes?.kind === 'usd' || event.prizes?.kind === 'nonMonetary'
  return publicHeadCount && publicPrize
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
  const withFigures = held.filter(hasPublicFigures)
  const countries = countriesOf(held)
  const years = held.map(({ date }) => date.start.year)

  return {
    count: held.length,
    upcomingCount: upcomingEvents(organized).length,
    nextNumber: held.length + 1,
    sinceYear: years.length > 0 ? Math.min(...years) : null,
    publicFigureEvents: withFigures.length,
    participants: sum(withFigures.map(({ participants }) => participants?.count ?? 0)),
    prizeUsd: sum(withFigures.map(({ prizes }) => (prizes?.kind === 'usd' ? prizes.amount : 0))),
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

export function deriveStats(
  content: Pick<Content, 'wins' | 'organized' | 'bitcoinPlusPlus'>,
): Stats {
  return {
    wins: winStats(content.wins),
    organized: organizedStats(content.organized),
    bitcoinPlusPlus: bitcoinPlusPlusStats(content.bitcoinPlusPlus),
  }
}

/** Projects that may be shown. Unconfirmed ones wait for his say-so. */
export function publishableProjects(projects: readonly Project[]): readonly Project[] {
  return projects.filter((project) => project.confirmed)
}
