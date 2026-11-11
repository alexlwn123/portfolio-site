import type { Patent, Stats } from '../../../content'
import { publishablePatents } from '../../../content/derive'
import { patentNumber } from '../../cv/describe'
import { patentsCopy } from './copy'

/* Turns the patent records into what the rating plate prints, field by field. */

/** One boxed field of the plate: what it is, and what is stamped in it. */
export interface PlateField {
  readonly label: string
  readonly value: string
}

export interface PlateCount {
  readonly kind: 'granted' | 'pending'
  readonly count: number
  readonly label: string
}

type GrantDate = Extract<Patent['status'], { kind: 'granted' }>['granted']

const NAME_SEPARATOR = ', '

/** The filings he has chosen to show, in the record's order: granted first. */
export function plateFilings(patents: readonly Patent[]): readonly Patent[] {
  return publishablePatents(patents)
}

/**
 * The plate's two counts, kept apart: patents granted, and applications
 * pending. An application is never counted as a patent, and a count of
 * nothing is left off.
 */
export function plateCounts(stats: Stats['patents']): readonly PlateCount[] {
  const { counts } = patentsCopy.plate
  const all: readonly PlateCount[] = [
    {
      kind: 'granted',
      count: stats.granted,
      label: stats.granted === 1 ? counts.granted.one : counts.granted.many,
    },
    {
      kind: 'pending',
      count: stats.pending,
      label: stats.pending === 1 ? counts.pending.one : counts.pending.many,
    },
  ]
  return all.filter(({ count }) => count > 0)
}

/** The filing's number, labelled as what it is: a patent's, or an application's. */
export function numberField({ number, status }: Patent): PlateField {
  const { fields } = patentsCopy.plate
  return {
    label: status.kind === 'granted' ? fields.patentNumber : fields.applicationNumber,
    value: patentNumber(number),
  }
}

/** Where a filing stands. Only a granted patent has a date to go with it. */
export function statusOf({ status }: Patent): {
  readonly label: string
  readonly date: GrantDate | null
} {
  return {
    label: patentsCopy.plate.status[status.kind],
    date: status.kind === 'granted' ? status.granted : null,
  }
}

/** The other named inventors. Null when he is the only one. */
export function coInventorsField({ coInventors }: Patent): PlateField | null {
  if (coInventors.length === 0) {
    return null
  }
  const { one, many } = patentsCopy.plate.fields.coInventors
  return {
    label: coInventors.length === 1 ? one : many,
    value: coInventors.join(NAME_SEPARATOR),
  }
}

/**
 * Where the plate's numbers lead, when every one of them leads to the same
 * place: "Google Patents". Null when they differ, or when there are none.
 */
export function recordSource(patents: readonly Patent[]): string | null {
  const sources = new Set(patents.map(({ link }) => link.label))
  const [only] = sources
  return sources.size === 1 && only !== undefined ? only : null
}
