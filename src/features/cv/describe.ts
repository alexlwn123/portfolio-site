import type {
  EventLocation,
  Experience,
  Organized,
  PartialDate,
  Profile,
  Stats,
  WinResult,
} from '../../content'
import { formatNumber, formatUsd, ordinal } from '../../lib/formatNumber'
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

export function locationLabel(location: EventLocation): string {
  if (location.kind === 'online') {
    return location.context === null ? LABELS.online : `${LABELS.online}, ${location.context}`
  }
  return [location.city, location.region, location.country]
    .filter((part) => part !== null)
    .join(', ')
}

export function participantsLabel(participants: Participants): string {
  return participants.unit === 'teams'
    ? plural(participants.count, 'team', 'teams')
    : plural(participants.count, 'participant', 'participants')
}

export function prizesLabel(prizes: Prizes): string {
  switch (prizes.kind) {
    case 'usd':
      return `${formatUsd(prizes.amount)} in prizes`
    case 'nonMonetary':
      return LABELS.nonMonetaryPrizes
    case 'bitcoin':
      return LABELS.bitcoinPrizes
  }
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
  const events = plural(organized.publicFigureEvents, 'event', 'events')
  const participants = plural(organized.participants, 'participant', 'participants')

  return [
    `${hackathons} in ${countries} (${organized.countries.join(', ')})${online}.`,
    `The ${events} with public figures add up to ${participants} and ${formatUsd(organized.prizeUsd)} in prizes.`,
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
