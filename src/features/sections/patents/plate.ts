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

/** The plate's one count: how many filings, and the words either side of the figure. */
export interface PlateCount {
  readonly label: string
  readonly count: number
  readonly unit: string
}

/** The filings he shows, in the record's order. Every one is listed the same way. */
export function plateFilings(patents: readonly Patent[]): readonly Patent[] {
  return publishablePatents(patents)
}

/**
 * The plate's one count: every filing shown, counted alike and worded as
 * "patent filings". Null when there is nothing to count.
 */
export function plateCount({ filings }: Stats['patents']): PlateCount | null {
  const { label, one, many } = patentsCopy.plate.count
  return filings === 0 ? null : { label, count: filings, unit: filings === 1 ? one : many }
}

/** The filing's publication number, under the one label every filing's number takes. */
export function numberField({ number }: Patent): PlateField {
  return { label: patentsCopy.plate.fields.number, value: patentNumber(number) }
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
