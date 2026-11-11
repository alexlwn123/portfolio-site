/*
 * Fits a name to a sticker. The display face is Bowlby One, and a drawing
 * cannot ask the browser how wide a word will come out, so the advance of
 * each glyph is written down here, as measured in Chromium at 1000px. Kerning
 * only ever tightens a word, so the sum is never narrower than what is drawn.
 */

/** A glyph's advance, in thousandths of an em. */
const ADVANCE: Readonly<Record<string, number>> = Object.freeze({
  A: 800,
  B: 767,
  C: 760,
  D: 805,
  E: 638,
  F: 618,
  G: 821,
  H: 808,
  I: 411,
  J: 675,
  K: 804,
  L: 618,
  M: 1071,
  N: 843,
  O: 803,
  P: 746,
  Q: 802,
  R: 762,
  S: 725,
  T: 644,
  U: 789,
  V: 759,
  W: 1040,
  X: 781,
  Y: 744,
  Z: 681,
  '0': 714,
  '1': 771,
  '2': 712,
  '3': 710,
  '4': 700,
  '5': 717,
  '6': 711,
  '7': 714,
  '8': 708,
  '9': 711,
  ' ': 350,
  '.': 378,
  ',': 359,
  '+': 621,
  '-': 419,
  '&': 886,
  ':': 376,
  '!': 387,
  '?': 547,
  "'": 392,
  '’': 354,
  '(': 406,
  ')': 408,
  '/': 393,
  '#': 756,
})

/** A glyph that was not measured is given the room of the widest letter. */
const UNMEASURED = 1071
const UNITS_PER_EM = 1000

/** How tall a capital is, as a share of the type size. */
export const CAP_HEIGHT = 0.742
/** The gap between two lines, as a share of the smaller line's size. */
const LINE_GAP = 0.26

/** Where a block of lettering sits in its drawing, in the drawing's own units. */
export interface LetteringBlock {
  /** The point every line is anchored to, across. */
  readonly x: number
  /** The middle of the block, down. */
  readonly y: number
  /** No line is set wider than this. */
  readonly width: number
  /** No line is set larger than this. */
  readonly max: number
}

/** One line, sized and placed. */
export interface SetLine {
  readonly text: string
  readonly size: number
  readonly baseline: number
}

function toTenths(value: number): number {
  return Number(value.toFixed(1))
}

/** How wide a word is in the display face, in ems. The face is always shouted. */
export function displayWidth(text: string): number {
  const units = Array.from(text.toUpperCase())
    .map((glyph) => ADVANCE[glyph] ?? UNMEASURED)
    .reduce((total, advance) => total + advance, 0)
  return units / UNITS_PER_EM
}

/**
 * Sets each line as large as the block allows, one under the other, with the
 * whole stack centred on the block's middle.
 */
export function setLines(lines: readonly string[], block: LetteringBlock): readonly SetLine[] {
  const sized = lines
    .filter((text) => text !== '')
    .map((text) => ({ text, size: Math.min(block.max, block.width / displayWidth(text)) }))
  const gapAfter = (index: number): number => {
    const next = sized[index + 1]
    return next === undefined ? 0 : LINE_GAP * Math.min(sized[index]?.size ?? 0, next.size)
  }
  const heights = sized.map(({ size }, index) => CAP_HEIGHT * size + gapAfter(index))
  const total = heights.reduce((sum, height) => sum + height, 0)
  const top = block.y - total / 2

  return sized.map(({ text, size }, index) => {
    const above = heights.slice(0, index).reduce((sum, height) => sum + height, 0)
    return { text, size: toTenths(size), baseline: toTenths(top + above + CAP_HEIGHT * size) }
  })
}
