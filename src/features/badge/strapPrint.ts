import { labelWidth } from '../stickers/geometry/labelFace'
import { STRAP_LETTERING, STRAP_STAR } from '../stickers/geometry/lanyard'

/*
 * Where each word and each star sits along a strap. A strap is lettered from
 * one end with its words in turn, a star after each, until it is covered.
 * Every place is a share of the strap's length, from 0 to 1: lettering set by
 * shares keeps its place on a strap that bends, and spaces out on one that
 * stretches.
 */

export interface PrintedWord {
  readonly text: string
  /** Where the middle of the word is, as a share of the strap's length. */
  readonly centre: number
  /** How long the word is set, in the strap's own units. */
  readonly length: number
}

export interface StrapPrint {
  readonly words: readonly PrintedWord[]
  /** Where the middle of each star is, as a share of the strap's length. */
  readonly stars: readonly number[]
}

const NOTHING: StrapPrint = Object.freeze({ words: [], stars: [] })

const { size, tracking } = STRAP_LETTERING
/** From the end of a word to the middle of its star, and from there to the next word. */
const TO_STAR = (STRAP_STAR.before + STRAP_STAR.size / 2) * size
const FROM_STAR = (STRAP_STAR.size / 2 + STRAP_STAR.after) * size

/** Where each of a run of lengths starts, when they are laid end to end. */
function startsOf(lengths: readonly number[]): readonly number[] {
  return lengths.map((_, index) => lengths.slice(0, index).reduce((sum, length) => sum + length, 0))
}

export function printStrap(words: readonly string[], length: number): StrapPrint {
  const printable = words.filter((word) => word !== '')
  if (printable.length === 0 || length <= 0) {
    return NOTHING
  }
  const widths = printable.map((word) => labelWidth(word, size, tracking))
  const pitches = widths.map((width) => width + TO_STAR + FROM_STAR)
  const turn = pitches.reduce((sum, pitch) => sum + pitch, 0)
  const turns = Math.ceil(length / turn)
  const starts = Array.from({ length: turns }, (_, lap) =>
    startsOf(pitches).map((start) => lap * turn + start),
  ).flat()
  const printed = starts.flatMap((start, index) => {
    const width = widths[index % widths.length] ?? 0
    const text = printable[index % printable.length] ?? ''
    return start < length ? [{ text, start, width }] : []
  })

  return {
    words: printed.map(({ text, start, width }) => ({
      text,
      centre: (start + width / 2) / length,
      length: width,
    })),
    stars: printed.map(({ start, width }) => (start + width + TO_STAR) / length),
  }
}
