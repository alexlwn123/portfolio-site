import type { Tone } from '../../stickers/tones'

/** What an asset tag is printed on: brushed silver or white label stock, with a band of colour. */
export interface TagStock {
  readonly metal: boolean
  readonly band: Tone
}

/** Employers do not share a label printer: the stocks take turns, by asset number. */
const STOCKS: readonly TagStock[] = Object.freeze([
  { metal: true, band: 'ink' },
  { metal: false, band: 'mint' },
  { metal: true, band: 'tang' },
  { metal: false, band: 'gum' },
])

/** The tag still in service is the one in highlighter. */
const IN_SERVICE: TagStock = Object.freeze({ metal: false, band: 'hi' })

const FIRST: TagStock = Object.freeze({ metal: true, band: 'ink' })

/** The stock for a job's tag. Voice, not fact: nothing here imitates an employer's own label. */
export function stockFor(assetNumber: number, current: boolean): TagStock {
  if (current) {
    return IN_SERVICE
  }
  const turn = (Math.max(1, Math.floor(assetNumber)) - 1) % STOCKS.length
  return STOCKS[turn] ?? FIRST
}
