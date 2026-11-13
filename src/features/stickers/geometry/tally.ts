/*
 * Tally marks, counted the old way: four uprights and a slash through them
 * for every five. Drawn in a 50-unit-wide column, one group to a row, in the
 * unsteady hand of the mockup's paint marker: its three rows are kept as
 * three "hands", used in turn.
 */

export interface TallyMarks {
  readonly width: number
  readonly height: number
  /** One path per mark, so the number of paths is the count. */
  readonly strokes: readonly string[]
}

/** Where an upright starts, how far it leans and how long it is. */
type Upright = readonly [x: number, rise: number, lean: number, length: number]
/** A slash, from its low left end to its high right end, measured from the row's top. */
type Slash = readonly [fromX: number, fromY: number, toX: number, toY: number]

interface Hand {
  readonly uprights: readonly [Upright, Upright, Upright, Upright]
  readonly slash: Slash
}

const [FIRST_HAND, SECOND_HAND, THIRD_HAND]: readonly [Hand, Hand, Hand] = [
  {
    uprights: [
      [8, 0, -1, 30],
      [17, 1, 1, 31],
      [27, 0, -1, 30],
      [36, 1, 1, 31],
    ],
    slash: [2, 24, 43, 4],
  },
  {
    uprights: [
      [8, 0, 1, 30],
      [18, 1, -1, 31],
      [27, 0, 1, 30],
      [37, 1, -1, 31],
    ],
    slash: [2, 25, 44, 3],
  },
  {
    uprights: [
      [7, 0, 1, 30],
      [17, 1, 1, 31],
      [27, 0, -1, 30],
      [36, 1, 1, 31],
    ],
    slash: [1, 24, 43, 4],
  },
]

const HANDS = 3
const GROUP = 5
const WIDTH = 50
const ROW_PITCH = 46
const FIRST_ROW_TOP = 6
/** The last row needs no gap beneath it. */
const ROW_GAP = 14

function handFor(row: number): Hand {
  const turn = row % HANDS
  if (turn === 0) {
    return FIRST_HAND
  }
  return turn === 1 ? SECOND_HAND : THIRD_HAND
}

function mark(index: number): string {
  const row = Math.floor(index / GROUP)
  const column = index % GROUP
  const top = FIRST_ROW_TOP + row * ROW_PITCH
  const hand = handFor(row)
  const upright = hand.uprights[column]

  if (upright === undefined) {
    const [fromX, fromY, toX, toY] = hand.slash
    return `M${String(fromX)} ${String(top + fromY)}L${String(toX)} ${String(top + toY)}`
  }
  const [x, rise, lean, length] = upright
  return `M${String(x)} ${String(top - rise)}l${String(lean)} ${String(length)}`
}

/** The marks for a count, and the size of the drawing that holds them. */
export function tallyMarks(count: number): TallyMarks {
  const total = Math.max(0, Math.floor(count))
  const rows = Math.max(1, Math.ceil(total / GROUP))
  return {
    width: WIDTH,
    height: rows * ROW_PITCH - ROW_GAP,
    strokes: Array.from({ length: total }, (_, index) => mark(index)),
  }
}

export const TALLY_GROUP = GROUP
