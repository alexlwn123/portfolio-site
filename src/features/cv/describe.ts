import type {
  EventLocation,
  Experience,
  Organized,
  PartialDate,
  PatentNumber,
  Profile,
  SatsFigure,
  Stats,
  Win,
  WinField,
  WinPlace,
  WinResult,
} from '../../content'
import { formatMillions, formatNumber, formatUsd, ordinal } from '../../lib/formatNumber'
import { LABELS } from './labels'

/* Turns records and derived numbers into the phrases the CV prints. */

type Participants = NonNullable<Organized['participants']>
type Prizes = NonNullable<Organized['prizes']>

/** "1 win", "8 wins", "1,471 participants". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`
}

/** "a", "a and b", "a, b and c". */
function joinList(items: readonly string[]): string {
  const last = items.at(-1) ?? ''
  return items.length < 2 ? last : `${items.slice(0, -1).join(', ')} and ${last}`
}

/**
 * The label for a result. A prize is never given a placement: the type has
 * no place to read one from.
 */
export function resultLabel(result: WinResult): string {
  if (result.kind === 'prize') {
    return result.prizeName === null
      ? LABELS.prizeWinner
      : `${LABELS.prizeWinner}: ${result.prizeName}`
  }
  const place = ordinal(result.place)
  if (result.qualifier === 'overall') {
    return `${place} ${LABELS.overall}`
  }
  return result.qualifier === 'tied' ? `${place} (${LABELS.tied})` : place
}

/** The project, or "Team Eth Heads" when the project's name is not known. */
export function winTitle(win: Win): string {
  if (win.project !== null) {
    return win.project
  }
  return win.team === null ? win.event : `${LABELS.team} ${win.team.name}`
}

/** "NCR Global Hackathon, 3rd annual", or the event alone when no edition is recorded. */
export function eventLabel({ event, edition }: Win): string {
  return edition === null ? event : `${event}, ${edition}`
}

/** "Bitcoin Park, Austin, TX". */
export function placeLabel({ venue, city, region }: WinPlace): string {
  return [venue, city, region].filter((part) => part !== null).join(', ')
}

/** "Out of 300+ teams". The plus is there only when the record says "more than". */
export function fieldLabel({ count, atLeast }: WinField): string {
  const teams = count === 1 ? 'team' : 'teams'
  return `${LABELS.outOf} ${formatNumber(count)}${atLeast ? '+' : ''} ${teams}`
}

/**
 * The people a source names on the team. A win titled by its team already
 * says the team's name, so only the teammates are listed.
 */
export function teammatesLine({ project, team }: Win): string | null {
  if (team === null) {
    return null
  }
  const others = team.teammates.length > 0 ? joinList(team.teammates) : null
  if (project === null) {
    return others === null ? null : `With ${others}.`
  }
  const named = `${LABELS.team} ${team.name}`
  return others === null ? `${named}.` : `${named}, with ${others}.`
}

/** "Collected and paid out more than 2.5 million sats in its first week." */
export function firstWeekNote({ sats, atLeast }: SatsFigure): string {
  const amount = `${atLeast ? 'more than ' : ''}${formatMillions(sats)} million sats`
  return `Collected and paid out ${amount} in its first week.`
}

/** "US 12,536,579 B2", the way the patent office prints it. */
export function patentNumber({ office, serial, kindCode }: PatentNumber): string {
  return `${office} ${serial} ${kindCode}`
}

/** "With Bryan Walser Nonni and Brent Vance Zucker". Null when he is the only inventor. */
export function coInventorsLabel(names: readonly string[]): string | null {
  return names.length === 0 ? null : `With ${joinList(names)}`
}

/**
 * "Named inventor on 4 patent filings." Every filing shown is counted alike,
 * so the noun is "patent filing". Null when there is none to count.
 */
export function patentsSummary({ filings }: Stats['patents']): string | null {
  return filings === 0
    ? null
    : `Named inventor on ${plural(filings, 'patent filing', 'patent filings')}.`
}

export function locationLabel(location: EventLocation): string {
  if (location.kind === 'online') {
    return location.context === null ? LABELS.online : `${LABELS.online}, ${location.context}`
  }
  return [location.city, location.region, location.country]
    .filter((part) => part !== null)
    .join(', ')
}

export function participantsLabel(participants: Participants): string {
  switch (participants.unit) {
    case 'people':
      return plural(participants.count, 'participant', 'participants')
    case 'aboutPeople':
      return `${LABELS.about} ${plural(participants.count, 'participant', 'participants')}`
    case 'teams':
      return plural(participants.count, 'team', 'teams')
  }
}

export function prizesLabel(prizes: Prizes): string {
  switch (prizes.kind) {
    case 'usd':
      return `${formatUsd(prizes.amount)} in prizes`
    case 'sats':
      return `${formatMillions(prizes.amount)}M sats in prizes`
    case 'nonMonetary':
      return LABELS.nonMonetaryPrizes
  }
}

export function projectsLabel(count: number): string {
  return plural(count, 'project', 'projects')
}

export function winsSummary(wins: Stats['wins']): string {
  const kinds = [
    wins.firsts > 0 ? plural(wins.firsts, 'first place', 'first places') : null,
    wins.seconds > 0 ? plural(wins.seconds, 'second place', 'second places') : null,
    wins.thirds > 0 ? plural(wins.thirds, 'third place', 'third places') : null,
    wins.prizes > 0 ? plural(wins.prizes, 'prize', 'prizes') : null,
  ].filter((kind) => kind !== null)

  return `${plural(wins.total, 'win', 'wins')}: ${joinList(kinds)}.`
}

export function organizedSummary(organized: Stats['organized']): readonly string[] {
  const hackathons = plural(organized.count, 'hackathon', 'hackathons')
  const countries = plural(organized.countryCount, 'country', 'countries')
  const online = organized.includesOnline ? ' plus online' : ''
  const counted = plural(organized.headCountEvents, 'event', 'events')
  const participants = plural(organized.participants, 'participant', 'participants')
  const awarded = plural(organized.prizeEvents, 'event', 'events')

  // Each total is over its own set of events, so each sentence names its own.
  return [
    `${hackathons} in ${countries} (${organized.countries.join(', ')})${online}.`,
    `The ${counted} with a public head count add up to ${participants}.`,
    `The ${awarded} with a public prize figure add up to ${formatUsd(organized.prizeUsd)} in prizes.`,
  ]
}

export function bitcoinPlusPlusSummary(record: Stats['bitcoinPlusPlus']): string {
  const editions = plural(record.editions, 'edition', 'editions')
  const sessions = plural(record.stageSessions, 'stage session', 'stage sessions')

  return `${LABELS.bitcoinPlusPlus} community member since ${String(record.memberSince)}: ${editions} attended and ${sessions}.`
}

export interface WhenLabel {
  readonly label: string
  readonly date: PartialDate | null
}

/**
 * When a role was held, as far as the record goes. End dates are not
 * recorded, so only a start date or the "current" flag is ever shown.
 */
export function experienceWhen(role: Experience): WhenLabel | null {
  if (role.current) {
    return role.start === null
      ? { label: LABELS.current, date: null }
      : { label: LABELS.currentFrom, date: role.start }
  }
  return role.start === null ? null : { label: LABELS.from, date: role.start }
}

/** "Minister of Development at Finite Computer". */
export function roleLine(profile: Profile): string {
  return `${profile.role.title} at ${profile.role.organization}`
}

/** "Atlanta, Georgia, USA". */
export function placeLine(profile: Profile): string {
  const { city, region, country } = profile.location
  return `${city}, ${region}, ${country}`
}

/** A URL without its scheme, for display: "alex.lwn.lol/cv/". */
export function displayUrl(url: string): string {
  const { host, pathname } = new URL(url)
  return pathname === '/' ? host : `${host}${pathname}`
}
