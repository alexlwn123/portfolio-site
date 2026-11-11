/*
 * Code 39, the barcode an asset tag carries: digits, capitals, a dash, a dot
 * and a space. A symbol is nine elements, bar and space by turns, of which
 * three are wide: two of its five bars and one of its four spaces. The bars
 * count in a two-of-five code and the wide space says which of four groups
 * of ten the symbol belongs to, so the whole table is built from that rule
 * and not typed out. Text is framed by the start and stop mark, an asterisk.
 */

export interface BarcodeBar {
  readonly x: number
  readonly width: number
}

export interface BarcodeDrawing {
  readonly width: number
  readonly bars: readonly BarcodeBar[]
}

/** How wide a narrow element is, and a wide one, in the drawing's units. */
export const CODE39_NARROW = 1
export const CODE39_WIDE = 3

const START_STOP = '*'

/** The four groups of ten, each with the space that is wide in it (0 to 3, left to right). */
const GROUPS: readonly (readonly [symbols: string, wideSpace: number])[] = [
  ['1234567890', 1],
  ['ABCDEFGHIJ', 2],
  ['KLMNOPQRST', 3],
  ['UVWXYZ-. *', 0],
]

/** The two bars that are wide for each place in a group: a two-of-five code. */
const WIDE_BARS: readonly (readonly [number, number])[] = [
  [0, 4],
  [1, 4],
  [0, 1],
  [2, 4],
  [0, 2],
  [1, 2],
  [3, 4],
  [0, 3],
  [1, 3],
  [2, 3],
]

const ELEMENTS = 9

function patternAt(place: number, wideSpace: number): string {
  const wideBars: readonly number[] = WIDE_BARS[place] ?? []
  return Array.from({ length: ELEMENTS }, (_, element) => {
    const index = Math.floor(element / 2)
    const isBar = element % 2 === 0
    const wide = isBar ? wideBars.includes(index) : index === wideSpace
    return wide ? 'w' : 'n'
  }).join('')
}

/**
 * The nine elements of one symbol, bar first, as "n" for narrow and "w" for
 * wide: "nwnnwnwnn" for the asterisk.
 */
export function code39Pattern(symbol: string): string {
  const group =
    symbol.length === 1 ? GROUPS.find(([symbols]) => symbols.includes(symbol)) : undefined
  if (!group) {
    throw new RangeError(`Code 39 cannot print "${symbol}"`)
  }
  const [symbols, wideSpace] = group
  return patternAt(symbols.indexOf(symbol), wideSpace)
}

/** The bars of one symbol, starting at an offset, and where the symbol ends. */
function symbolBars(symbol: string, offset: number): BarcodeDrawing {
  return Array.from(code39Pattern(symbol)).reduce<BarcodeDrawing>(
    (drawn, part, element) => {
      const width = part === 'w' ? CODE39_WIDE : CODE39_NARROW
      const isBar = element % 2 === 0
      return {
        width: drawn.width + width,
        bars: isBar ? [...drawn.bars, { x: drawn.width, width }] : drawn.bars,
      }
    },
    { width: offset, bars: [] },
  )
}

/**
 * The bars for a piece of text, with the start and stop marks around it and a
 * narrow gap between symbols. Throws when the text holds what Code 39 cannot
 * print, the asterisk included: that one is the frame.
 */
export function code39(text: string): BarcodeDrawing {
  if (text.includes(START_STOP)) {
    throw new RangeError(`Code 39 keeps "${START_STOP}" for its start and stop marks`)
  }
  const symbols = Array.from(`${START_STOP}${text}${START_STOP}`)

  return symbols.reduce<BarcodeDrawing>(
    (drawn, symbol, index) => {
      const gap = index === 0 ? 0 : CODE39_NARROW
      const next = symbolBars(symbol, drawn.width + gap)
      return { width: next.width, bars: [...drawn.bars, ...next.bars] }
    },
    { width: 0, bars: [] },
  )
}
