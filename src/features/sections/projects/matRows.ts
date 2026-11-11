import type { FaceKind, ProjectSticker } from './projectStickers'

/*
 * The rows the stickers stand in on the mat. Nobody places a sticker by
 * hand: each asks for a number of the mat's columns by how its face is cut
 * and how much its caption has to say, the stickers are shared out into rows of about the mat's width, in the
 * order the records give them, and every row is then fitted to the width
 * exactly, so that its first sticker stands on the mat's left edge and its
 * last on the right. A project added to the records later is stood in a row
 * like any other.
 */

/** Where a sticker stands in its row. */
export type RowPlace = 'first' | 'middle' | 'last' | 'only'

export interface Standing {
  /** Which row, from the top: the first is 1. */
  readonly row: number
  /** How many of the mat's columns it is given. */
  readonly span: number
  readonly place: RowPlace
}

/** A sticker's standing at each width the mat is set in rows. */
export interface MatPlace {
  readonly laptop: Standing
  readonly tablet: Standing
}

interface MatWidth {
  /** How many columns the mat is ruled into. */
  readonly columns: number
  /** What the lead project asks for, a sticker cut wide and low, any other, and the scraps. */
  readonly lead: number
  readonly wide: number
  readonly regular: number
  readonly scraps: number
}

/** The mat at the two widths it is set in rows. A phone sets it in one column instead. */
export const MAT: Readonly<Record<keyof MatPlace, MatWidth>> = Object.freeze({
  laptop: { columns: 24, lead: 10, wide: 6, regular: 5, scraps: 4 },
  tablet: { columns: 12, lead: 7, wide: 5, regular: 4, scraps: 3 },
})

/** No sticker is given fewer columns than this: its caption could not be read. */
const NARROWEST_SPAN = 3

/** The faces that are cut wide and low, and ask for more of a row. */
const WIDE_FACES: readonly FaceKind[] = ['jukebox', 'capsule', 'ticket', 'mint', 'ramp', 'bumper']

const sum = (numbers: readonly number[]): number => numbers.reduce((total, each) => total + each, 0)

/** How many stickers each row takes, so that every row asks for about the same width. */
function shareOut(wanted: readonly number[], columns: number): readonly number[] {
  const total = sum(wanted)
  const rows = Math.min(wanted.length, Math.max(1, Math.round(total / columns)))
  const running = wanted.map((_, index) => sum(wanted.slice(0, index + 1)))

  // Where each row ends: at the sticker that brings the running width nearest its share.
  const ends = Array.from({ length: rows }, (_, row) => row + 1).reduce<readonly number[]>(
    (found, row) => {
      const from = (found.at(-1) ?? 0) + 1
      const until = wanted.length - (rows - row)
      const target = (total * row) / rows
      const candidates = Array.from({ length: until - from + 1 }, (_, index) => from + index)
      const nearest = candidates.reduce(
        (best, end) =>
          Math.abs((running[end - 1] ?? 0) - target) < Math.abs((running[best - 1] ?? 0) - target)
            ? end
            : best,
        from,
      )
      return [...found, row === rows ? wanted.length : nearest]
    },
    [],
  )
  return ends.map((end, index) => end - (ends[index - 1] ?? 0))
}

/** Takes a column from the widest of a row, or gives one to the narrowest, until it fits. */
function settle(spans: readonly number[], columns: number): readonly number[] {
  const total = sum(spans)
  if (total === columns) {
    return spans
  }
  const over = total > columns
  const chosen = over ? spans.indexOf(Math.max(...spans)) : spans.indexOf(Math.min(...spans))
  if (over && (spans[chosen] ?? 0) <= NARROWEST_SPAN) {
    return spans
  }
  return settle(
    spans.map((span, index) => (index === chosen ? span + (over ? -1 : 1) : span)),
    columns,
  )
}

/**
 * A row's widths, made to add up to the mat's. Each sticker keeps its share
 * of the row, in whole columns: the columns left over go to the stickers that
 * were rounded down the furthest, and none is left too narrow to read.
 */
function fit(wanted: readonly number[], columns: number): readonly number[] {
  const total = sum(wanted)
  if (total === 0) {
    return wanted
  }
  const shares = wanted.map((span) => (span * columns) / total)
  const whole = shares.map(Math.floor)
  const spare = columns - sum(whole)
  // The stickers in the order they are owed a spare column: by what rounding took from them.
  const owed = shares
    .map((share, index) => ({ index, lost: share - Math.floor(share) }))
    .toSorted((one, other) => other.lost - one.lost)
    .slice(0, spare)
    .map(({ index }) => index)
  const shared = whole.map((span, index) =>
    Math.max(NARROWEST_SPAN, owed.includes(index) ? span + 1 : span),
  )

  return settle(shared, columns)
}

function placeIn(index: number, length: number): RowPlace {
  if (length === 1) {
    return 'only'
  }
  if (index === 0) {
    return 'first'
  }
  return index === length - 1 ? 'last' : 'middle'
}

/**
 * Stands stickers in rows. Each asks for a number of columns; the answer
 * gives each its row, the columns it was given, and where in the row it is.
 */
export function standInRows(wanted: readonly number[], columns: number): readonly Standing[] {
  if (wanted.length === 0) {
    return []
  }
  const counts = shareOut(wanted, columns)

  return counts.flatMap((count, row) => {
    const from = sum(counts.slice(0, row))
    const spans = fit(wanted.slice(from, from + count), columns)
    return spans.map((span, index) => ({ row: row + 1, span, place: placeIn(index, count) }))
  })
}

/** A caption longer than this runs to too many lines under a sticker of the regular width. */
const LONG_CAPTION = 100

function wantedBy(sticker: ProjectSticker, lead: string | undefined, width: MatWidth): number {
  if (sticker.id === lead) {
    return width.lead
  }
  const wordy = (sticker.description?.length ?? 0) > LONG_CAPTION
  return wordy || WIDE_FACES.includes(sticker.face.kind) ? width.wide : width.regular
}

/**
 * Where every sticker stands on the mat, at a laptop's width and a tablet's,
 * and where the weeded scraps lie: they are swept to the end of the last row.
 * The first sticker given is the lead, and is cut the widest.
 */
export function matPlaces(stickers: readonly ProjectSticker[]): {
  readonly stickers: readonly MatPlace[]
  readonly scraps: MatPlace
} {
  const lead = stickers[0]?.id
  const standings = (width: MatWidth): readonly Standing[] =>
    standInRows(
      [...stickers.map((sticker) => wantedBy(sticker, lead, width)), width.scraps],
      width.columns,
    )
  const laptop = standings(MAT.laptop)
  const tablet = standings(MAT.tablet)
  const at = (index: number): MatPlace => {
    const [onLaptop, onTablet] = [laptop[index], tablet[index]]
    if (onLaptop === undefined || onTablet === undefined) {
      throw new Error(`The mat has no place for sticker ${String(index)}`)
    }
    return { laptop: onLaptop, tablet: onTablet }
  }

  return { stickers: stickers.map((_, index) => at(index)), scraps: at(stickers.length) }
}

/** A standing as the mat's stylesheet reads it: the columns, and the place in the row. */
export type PlaceData = Readonly<
  Partial<Record<'data-span' | 'data-span-tablet', number>> &
    Partial<Record<'data-place' | 'data-place-tablet', RowPlace>>
>

/** What an item on the mat says about where it stands. Nothing, when it was given no place. */
export function placeData(place: MatPlace | undefined): PlaceData {
  if (place === undefined) {
    return {}
  }
  return {
    'data-span': place.laptop.span,
    'data-place': place.laptop.place,
    'data-span-tablet': place.tablet.span,
    'data-place-tablet': place.tablet.place,
  }
}
