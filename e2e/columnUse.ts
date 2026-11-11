import type { Locator } from '@playwright/test'

import { type Box, drawing, isReal, meet } from './drawn'

/*
 * How a section's body uses the column it is set in. SectionFrame gives every
 * body the page's column, so the body's own box is the column, and one em of
 * the frame is ten design units. Everything here is in that em, and is
 * measured from what is drawn (see drawn.ts).
 */

/** The widths at which a body is set beside itself and has to fill the column. */
export const COLUMN_WIDTHS = [1440, 900] as const

/** How far, in em, something may stop short of an edge of the column or poke past it. */
export const EDGE_TOLERANCE_EM = 1.5
/** An empty block is dead when it is wider than this share of the column, */
const DEAD_WIDTH_SHARE = 1 / 3
/** and taller than this. */
const DEAD_HEIGHT_EM = 30
/** The side of a square of the grid the body is surveyed on, in em. */
const CELL_EM = 0.5
const TENTHS = 10

/** Where something drawn is, against the column. */
export interface Drawn {
  /** How far inside the column's left edge it starts. Negative when it pokes past it. */
  readonly fromLeft: number
  /** How far inside the column's right edge it ends. Negative when it pokes past it. */
  readonly fromRight: number
  /** How far right of the column's middle its own middle is. */
  readonly offCentre: number
  /** How far down from the top of the body it starts, and ends. */
  readonly top: number
  readonly bottom: number
  /** How far down from the top of the body its own middle is. */
  readonly middle: number
  readonly width: number
  readonly height: number
}

/** A block of the body with nothing drawn in it, from the body's top left corner. */
export interface EmptyBlock {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

export interface ColumnUse {
  /** Everything the body draws, taken together. Null when it draws nothing. */
  readonly content: Drawn | null
  /** The largest dead block in the body, when there is one. */
  readonly dead: EmptyBlock | null
}

function toTenths(value: number): number {
  return Math.round(value * TENTHS) / TENTHS
}

/** Where some boxes, taken together, are against the column. Null when there are none. */
function against(boxes: readonly Box[], column: Box, em: number): Drawn | null {
  if (boxes.length === 0) {
    return null
  }
  const left = Math.min(...boxes.map((box) => box.left))
  const top = Math.min(...boxes.map((box) => box.top))
  const right = Math.max(...boxes.map((box) => box.right))
  const bottom = Math.max(...boxes.map((box) => box.bottom))
  const inEm = (px: number): number => toTenths(px / em)
  return {
    fromLeft: inEm(left - column.left),
    fromRight: inEm(column.right - right),
    offCentre: inEm((left + right) / 2 - (column.left + column.right) / 2),
    top: inEm(top - column.top),
    bottom: inEm(bottom - column.top),
    middle: inEm((top + bottom) / 2 - column.top),
    width: inEm(right - left),
    height: inEm(bottom - top),
  }
}

/** The body as rows of squares: for each square, whether something is drawn in it. */
function squares(
  boxes: readonly Box[],
  column: Box,
  cell: number,
): readonly (readonly boolean[])[] {
  const across = Math.ceil((column.right - column.left) / cell)
  const down = Math.ceil((column.bottom - column.top) / cell)
  const inside = boxes.filter((box) => isReal(meet(box, column)))
  return Array.from({ length: down }, (_, row) => {
    const top = column.top + row * cell
    const here = inside.filter((box) => box.top < top + cell && box.bottom > top)
    return Array.from({ length: across }, (__, index) => {
      const start = column.left + index * cell
      return here.some((box) => box.left < start + cell && box.right > start)
    })
  })
}

interface Dead {
  /** How many squares wide and tall a block has to be to count. */
  readonly wide: number
  readonly tall: number
}

/**
 * The dead blocks that end on one row. `heights` says, for each square of the
 * row, how many squares up from it are empty, itself included.
 */
function blocksEndingOn(
  heights: readonly number[],
  row: number,
  { wide, tall }: Dead,
): readonly EmptyBlock[] {
  const starts = heights.flatMap((height, index) =>
    height >= tall && (heights[index - 1] ?? 0) < tall ? [index] : [],
  )
  return starts.flatMap((start) => {
    const stop = heights.findIndex((height, index) => index > start && height < tall)
    const run = heights.slice(start, stop === -1 ? heights.length : stop)
    const height = Math.min(...run)
    return run.length >= wide
      ? [{ left: start, top: row - height + 1, width: run.length, height }]
      : []
  })
}

/** The largest block of the body, of the size that counts as dead, with nothing drawn in it. */
function deadBlock(boxes: readonly Box[], column: Box, em: number): EmptyBlock | null {
  const cell = CELL_EM * em
  const dead = {
    wide: Math.ceil(((column.right - column.left) * DEAD_WIDTH_SHARE) / cell),
    tall: Math.ceil((DEAD_HEIGHT_EM * em) / cell),
  }
  const rows = squares(boxes, column, cell)
  const start = { heights: (rows[0] ?? []).map(() => 0), blocks: [] as readonly EmptyBlock[] }
  const { blocks } = rows.reduce((state, full, row) => {
    const heights = state.heights.map((height, index) => (full[index] === true ? 0 : height + 1))
    return { heights, blocks: [...state.blocks, ...blocksEndingOn(heights, row, dead)] }
  }, start)
  const [largest] = [...blocks].sort(
    (one, other) => other.width * other.height - one.width * one.height,
  )
  return largest
    ? {
        left: toTenths(largest.left * CELL_EM),
        top: toTenths(largest.top * CELL_EM),
        width: toTenths(largest.width * CELL_EM),
        height: toTenths(largest.height * CELL_EM),
      }
    : null
}

/**
 * How a section's body uses the column: where everything it draws starts and
 * ends, and the largest dead block in it. Furniture that is meant to run off
 * the column is left out by its selector.
 */
export async function columnUse(
  section: Locator,
  ignore: readonly string[] = [],
): Promise<ColumnUse> {
  const { all, column, em } = await drawing(section, ignore)
  return { content: against(all, column, em), dead: deadBlock(all, column, em) }
}

/**
 * Where each of some things in a section is drawn, against the column, in the
 * order the markup has them. A thing that draws nothing is left out.
 */
export async function drawnEach(
  section: Locator,
  selector: string,
  ignore: readonly string[] = [],
): Promise<readonly Drawn[]> {
  const { each, column, em } = await drawing(section, ignore, selector)
  return each.flatMap((boxes) => against(boxes, column, em) ?? [])
}

/** Where the one thing a selector finds is drawn, against the column. */
export async function drawnOne(section: Locator, selector: string): Promise<Drawn> {
  const [first, ...rest] = await drawnEach(section, selector)
  if (!first || rest.length > 0) {
    throw new Error(`Expected one thing drawn at ${selector}`)
  }
  return first
}

/**
 * The box the one thing a selector finds is laid out in, against the column,
 * whatever it draws: for a thing whose edge is drawn by its own trimmings.
 */
export async function laidOutOne(section: Locator, selector: string): Promise<Drawn> {
  const { laidOut, column, em } = await drawing(section, [], selector)
  const [first, ...rest] = laidOut.flatMap((box) => against([box], column, em) ?? [])
  if (!first || rest.length > 0) {
    throw new Error(`Expected one thing laid out at ${selector}`)
  }
  return first
}

/**
 * Things set side by side, gathered into the rows they make, top row first.
 * A thing is in a row when its middle is no lower than the row reaches.
 */
export function rowsOf(drawn: readonly Drawn[]): readonly (readonly Drawn[])[] {
  const downThePage = [...drawn].sort((one, other) => one.middle - other.middle)
  return downThePage.reduce<readonly (readonly Drawn[])[]>((rows, thing) => {
    const last = rows.at(-1)
    const reach = last ? Math.max(...last.map(({ bottom }) => bottom)) : Number.NEGATIVE_INFINITY
    return last && thing.middle < reach
      ? [...rows.slice(0, -1), [...last, thing]]
      : [...rows, [thing]]
  }, [])
}

/** Whether a row of things runs from the column's left edge to its right edge. */
export function spansColumn(row: readonly Drawn[]): boolean {
  return (
    isNear(Math.min(...row.map(({ fromLeft }) => fromLeft))) &&
    isNear(Math.min(...row.map(({ fromRight }) => fromRight)))
  )
}

/** Whether a distance is nothing, give or take the tolerance. */
export function isNear(distance: number, tolerance: number = EDGE_TOLERANCE_EM): boolean {
  return Math.abs(distance) <= tolerance
}

/**
 * What is wrong with how a body uses the column. It has to run from the
 * column's left edge to its right edge, or be set about its middle, and it
 * may not leave a dead block. An empty list when all is well.
 */
export function columnFaults({ content, dead }: ColumnUse): readonly string[] {
  if (content === null) {
    return ['the body draws nothing']
  }
  const { fromLeft, fromRight, offCentre } = content
  const placed = (isNear(fromLeft) && isNear(fromRight)) || isNear(offCentre)
  const edges = `starts ${String(fromLeft)}em inside the left edge and ends ${String(fromRight)}em inside the right edge: neither edge to edge nor centred`
  const block =
    dead &&
    `an empty block ${String(dead.width)}em wide and ${String(dead.height)}em tall, ${String(dead.left)}em across the body and ${String(dead.top)}em down it`
  return [...(placed ? [] : [edges]), ...(block === null ? [] : [block])]
}
