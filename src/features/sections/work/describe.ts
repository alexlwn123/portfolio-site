import type { Education, HeldEvent, PartialDate, Patent, Profile, Win } from '../../../content'
import { formatDateSpan, formatPartialDate, isoDate } from '../../../lib/formatDate'
import { resultLabel, winTitle } from '../../cv/describe'
import { fieldFigure } from '../../lid/facts'
import { type Counted, workCopy } from './copy'

/* Turns the records on the career path into the phrases its stickers print. */

/** How many digits an asset number is padded to. */
const ASSET_DIGITS = 4
/** What a Code 39 barcode can spell, of the characters an asset code might hold. */
const NOT_BARCODE_SAFE = /[^A-Z0-9-]/g
const SEPARATOR = ' · '

/** A date as text, with the value its time element takes. */
export interface DateLabel {
  readonly text: string
  readonly iso: string
}

/** "hackathon win" for one, "hackathon wins" for any other count. */
export function plural(count: number, words: Counted): string {
  return count === 1 ? words.one : words.many
}

/** 4 becomes "0004", the way a tag prints an asset number. */
export function assetCode(assetNumber: number): string {
  return String(assetNumber).padStart(ASSET_DIGITS, '0')
}

/** "AL": the first letter of each of his names. */
export function initials({
  givenName,
  familyName,
}: Pick<Profile, 'givenName' | 'familyName'>): string {
  return [givenName, familyName].map((name) => name.charAt(0).toUpperCase()).join('')
}

/** What an asset tag's barcode spells: "AL-0004". Letters a barcode cannot print are left out. */
export function barcodeText(
  profile: Pick<Profile, 'givenName' | 'familyName'>,
  assetNumber: number,
): string {
  return `${initials(profile)}-${assetCode(assetNumber)}`.replaceAll(NOT_BARCODE_SAFE, '')
}

/** "March 2024", to the precision the record has. */
export function startedLabel(date: PartialDate): DateLabel {
  return { text: formatPartialDate(date, 'long'), iso: isoDate(date) }
}

/** How a win placed: "1st", "1st of 300+ teams", or the prize it took. */
function placing({ result, field }: Win): string {
  const label = resultLabel(result)
  return field === null ? label : `${label} ${workCopy.marks.outOf(fieldFigure(field))}`
}

/** A win in one line: what it was called, then how it placed and where. */
export function winLine(win: Win): { readonly name: string; readonly detail: string } {
  return { name: winTitle(win), detail: `${placing(win)}, ${win.event}` }
}

function cityOf({ location }: HeldEvent): string | null {
  return location?.kind === 'inPerson' ? location.city : null
}

/**
 * Where a year's hackathons were. One on its own is named, with its city and
 * his role when the record has them. Several are the cities he ran them in,
 * each once, in the order given, with a word for any that were online.
 */
export function organizedLine(events: readonly HeldEvent[]): string {
  const [only] = events
  if (only === undefined) {
    return ''
  }
  if (events.length === 1) {
    return [only.name, cityOf(only), only.role].filter((part) => part !== null).join(SEPARATOR)
  }
  const cities = [...new Set(events.flatMap((event) => cityOf(event) ?? []))].join(SEPARATOR)
  const online = events.some(({ location }) => location?.kind === 'online')
  if (cities === '') {
    return online ? workCopy.marks.online : ''
  }
  return online ? `${cities} + ${workCopy.marks.online}` : cities
}

/** What became of a filing: "granted 2025", "pending" or "abandoned". */
export function filedOutcome({ status }: Patent): string {
  switch (status.kind) {
    case 'granted':
      return workCopy.marks.grantedIn(status.granted.year)
    case 'pending':
      return workCopy.marks.pending
    case 'abandoned':
      return workCopy.marks.abandoned
  }
}

const yearOnly = ({ year }: PartialDate): PartialDate => ({ year, month: null, day: null })

/**
 * The years a school's record gives: "2018 – 2021". `open` is true when only
 * the first year is known. Null when even that is not.
 */
export function attendedYears({
  start,
  end,
}: Education): (DateLabel & { readonly open: boolean }) | null {
  if (start === null) {
    return null
  }
  const first = yearOnly(start)
  return {
    text: formatDateSpan({ start: first, end: end === null ? null : yearOnly(end) }),
    iso: isoDate(first),
    open: end === null,
  }
}
