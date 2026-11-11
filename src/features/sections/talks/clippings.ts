import type { Content, PartialDate, Press } from '../../../content'
import { pressClaim } from '../../../content/pressClaim'
import { LABELS } from '../../cv/labels'

/*
 * The press, cut out. What a clipping may say about him is not written here:
 * it is the sentence pressClaim builds from the record, and nothing more.
 */

type Sources = Pick<Content, 'organized' | 'press' | 'wins'>

/** A piece of coverage: something a newsroom or a foundation published. */
export interface ClippingSpec {
  readonly id: string
  readonly outlet: string
  readonly programme: string | null
  /** The headline as published. Null when the record has none. */
  readonly headline: string | null
  /** "Reported by Jenna McLaughlin". */
  readonly byline: string | null
  readonly date: PartialDate | null
  /** The only thing the page may say the piece is. */
  readonly claim: string
  /** Who the piece names, when that needs saying. */
  readonly naming: string | null
  readonly url: string
}

/** A plain page of reference: it lists something and claims nothing about him. */
export interface ReferenceSpec {
  readonly id: string
  readonly outlet: string
  readonly label: string
  readonly url: string
}

export interface PressCuttings {
  readonly clippings: readonly ClippingSpec[]
  readonly references: readonly ReferenceSpec[]
}

function toClipping(item: Press, sources: Sources): ClippingSpec {
  const { claim, naming } = pressClaim(item, sources)

  return {
    id: item.id,
    outlet: item.outlet,
    programme: item.programme,
    headline: item.title,
    byline: item.reporter === null ? null : `${LABELS.reportedBy} ${item.reporter}`,
    date: item.date,
    claim,
    naming,
    url: item.url,
  }
}

function toReference(item: Press, sources: Sources): ReferenceSpec {
  return {
    id: item.id,
    outlet: item.outlet,
    label: pressClaim(item, sources).claim,
    url: item.url,
  }
}

/** The press records, sorted into coverage and reference pages, in the record's order. */
export function pressCuttings(sources: Sources): PressCuttings {
  const isReference = ({ subject }: Press): boolean => subject.kind === 'reference'

  return {
    clippings: sources.press
      .filter((item) => !isReference(item))
      .map((item) => toClipping(item, sources)),
    references: sources.press.filter(isReference).map((item) => toReference(item, sources)),
  }
}
