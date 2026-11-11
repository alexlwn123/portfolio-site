import { ordinal } from '../lib/formatNumber'
import type { Content, Organized, Press, Win } from './schema'

/** What a page may say about a press item: the claim, and who the piece names. */
export interface PressClaim {
  readonly claim: string
  /** Null when there is nothing to add about who is named. */
  readonly naming: string | null
}

type Sources = Pick<Content, 'organized' | 'wins'>

function findById<T extends { readonly id: string }>(
  records: readonly T[],
  id: string,
  kind: string,
): T {
  const record = records.find((candidate) => candidate.id === id)
  if (!record) {
    throw new Error(`Press item refers to an unknown ${kind} record: "${id}"`)
  }
  return record
}

function eventWithPlace(event: Organized): string {
  if (event.location?.kind !== 'inPerson') {
    return event.name
  }
  const { city, region } = event.location
  return `${event.name} in ${region === null ? city : `${city}, ${region}`}`
}

function namingOfCoverage(namesEvent: boolean, namesOwner: boolean): string {
  if (namesEvent && namesOwner) {
    return 'The piece names both the event and him.'
  }
  if (namesEvent) {
    return 'The piece names the event but not him.'
  }
  if (namesOwner) {
    return 'The piece names him but not the event.'
  }
  return 'The piece names neither the event nor him.'
}

function resultPhrase(win: Win): string {
  return win.result.kind === 'place'
    ? `placed ${ordinal(win.result.place)}`
    : 'among the prize winners'
}

/**
 * Builds the only sentences a page may print about a press item. They come
 * from the record's structure, so the wording cannot claim more than is true:
 * a piece about an event he helped organize is never a piece about him.
 */
export function pressClaim(item: Press, sources: Sources): PressClaim {
  const { subject } = item
  switch (subject.kind) {
    case 'organizedEvent': {
      const event = findById(sources.organized, subject.organizedId, 'organized')
      return {
        claim: `Coverage of ${eventWithPlace(event)}, a hackathon he helped organize.`,
        naming: namingOfCoverage(subject.namesEvent, subject.namesOwner),
      }
    }
    case 'win': {
      const win = findById(sources.wins, subject.winId, 'win')
      return {
        claim: `Announcement of the ${win.event} winners, with ${win.project} ${resultPhrase(win)}.`,
        naming: subject.namesOwner ? null : 'The announcement does not name him.',
      }
    }
    case 'reference':
      return { claim: subject.label, naming: null }
  }
}
