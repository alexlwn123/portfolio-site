import { ordinal } from '../lib/formatNumber'
import type { Content, Organized, Press, Win } from './schema'
import { winName } from './winName'

/** What a page may say about a press item: what the piece is, and no more. */
export interface PressClaim {
  readonly claim: string
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

function resultPhrase(win: Win): string {
  return win.result.kind === 'place'
    ? `placed ${ordinal(win.result.place)}`
    : 'among the prize winners'
}

/**
 * Builds the only sentence a page may print about a press item. It comes
 * from the record's structure, so the wording cannot claim more than is true:
 * a piece about an event he helped organize is said to be exactly that, and
 * never a piece about him. Whether the piece names him stays in the record
 * (namesOwner, namesEvent) and is not printed.
 */
export function pressClaim(item: Press, sources: Sources): PressClaim {
  const { subject } = item
  switch (subject.kind) {
    case 'organizedEvent': {
      const event = findById(sources.organized, subject.organizedId, 'organized')
      return {
        claim: `Coverage of ${eventWithPlace(event)}, a hackathon he helped organize.`,
      }
    }
    case 'win': {
      const win = findById(sources.wins, subject.winId, 'win')
      return {
        claim: `Announcement of the ${win.event} winners, with ${winName(win)} ${resultPhrase(win)}.`,
      }
    }
    case 'reference':
      return { claim: subject.label }
  }
}
