import type { Locator } from '@playwright/test'

/*
 * The column check used by the work, wins and projects specs. The other four
 * sections' specs use columnUse.ts, which was written at the same time and
 * measures the same two things its own way; the two are still to be made one.
 *
 * How a section's body uses the column it is set in. A body either runs from
 * the column's left edge to its right edge or is symmetric about its middle,
 * and it leaves no dead block: nothing empty that is wider than a third of
 * the column and taller than thirty ems. Everything is measured on the page
 * as drawn, so a tilted sticker counts by the box its corners reach.
 */

/** How far an outer edge may sit from the column's, in ems. A tilted corner pokes this far. */
export const EDGE_TOLERANCE_EM = 1.5
/** A dead block is wider than this share of the column, */
export const DEAD_BLOCK_SHARE = 1 / 3
/** and taller than this, in ems. */
export const DEAD_BLOCK_EM = 30

/** Two cells to the em: fine enough that a dead block cannot hide between two stickers. */
const CELLS_PER_EM = 2
/** A painted box this much of the column wide and this much of the body tall is a backdrop. */
const BACKDROP_WIDTH = 0.9
const BACKDROP_HEIGHT = 0.5
/** A failing spec names this many dead blocks, and no more. */
const MOST_REPORTED = 5

export interface Box {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

/** Where a dead block starts, in ems from the body's top left corner. */
export interface DeadBlock {
  readonly x: number
  readonly y: number
}

export interface ColumnUse {
  /** One em of the section's design unit, in pixels. */
  readonly em: number
  /** The column: the body's own box. */
  readonly column: Box
  /** The outermost edges of everything the body draws. */
  readonly content: { readonly left: number; readonly right: number }
  /** Where the body is left empty. Nothing, when all is well. */
  readonly deadBlocks: readonly DeadBlock[]
}

export interface ColumnUseOptions {
  /** Furniture that is meant to bleed to the screen's edge, and so is not measured. */
  readonly ignore?: string
}

interface Drawn {
  readonly em: number
  readonly column: Box
  /** Every box the body draws: each painted element, and each run of text. */
  readonly body: readonly Box[]
  /** The same for the heading, which is stuck over some bodies. */
  readonly header: readonly Box[]
}

/*
 * Runs in the page, so nothing outside it exists where it runs. A box is
 * drawn by an element that paints one (a background, a border, a drawing) or
 * by a run of text.
 */
function drawnBoxes(root: Element, ignore: string): Drawn {
  const body = root.querySelector('[data-section-body]')
  const units = root.querySelector('[data-units]')
  if (body === null || units === null) {
    throw new Error('The section has no body to measure')
  }
  const boxOf = ({ left, top, right, bottom }: DOMRect): Box => ({ left, top, right, bottom })
  const clear = (colour: string): boolean => colour === 'transparent' || /[,/]\s*0\)$/.test(colour)
  const edged = (style: CSSStyleDeclaration): boolean =>
    ['top', 'right', 'bottom', 'left'].some(
      (side) =>
        Number.parseFloat(style.getPropertyValue(`border-${side}-width`)) > 0 &&
        style.getPropertyValue(`border-${side}-style`) !== 'none' &&
        !clear(style.getPropertyValue(`border-${side}-color`)),
    )
  const paints = (element: Element, style: CSSStyleDeclaration): boolean =>
    element instanceof SVGSVGElement ||
    element instanceof HTMLImageElement ||
    style.backgroundImage !== 'none' ||
    !clear(style.backgroundColor) ||
    edged(style)
  const shown = (element: Element, style: CSSStyleDeclaration): boolean =>
    element.checkVisibility({ opacityProperty: true, visibilityProperty: true }) &&
    (ignore === '' || element.closest(ignore) === null) &&
    element.closest('defs') === null &&
    // Text for screen readers only is clipped away to nothing.
    style.clipPath !== 'inset(50%)'
  const textOf = (element: Element): readonly Box[] =>
    [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE && (node.nodeValue ?? '').trim() !== '')
      .flatMap((node) => {
        const range = document.createRange()
        range.selectNodeContents(node)
        return [...range.getClientRects()].map(boxOf)
      })
  const drawnBy = (element: Element): readonly Box[] => {
    const style = getComputedStyle(element)
    if (!shown(element, style)) {
      return []
    }
    const own = paints(element, style) ? [boxOf(element.getBoundingClientRect())] : []
    return [...own, ...textOf(element)].filter((box) => box.right - box.left > 1)
  }
  const header = root.querySelector('header')

  return {
    em: Number.parseFloat(getComputedStyle(units).fontSize),
    column: boxOf(body.getBoundingClientRect()),
    body: [...body.querySelectorAll('*')].flatMap(drawnBy),
    header: header === null ? [] : [...header.querySelectorAll('*')].flatMap(drawnBy),
  }
}

/** Whether a box covers so much of the column that it is what the body is drawn on. */
function isBackdrop(box: Box, column: Box): boolean {
  return (
    box.right - box.left >= (column.right - column.left) * BACKDROP_WIDTH &&
    box.bottom - box.top >= (column.bottom - column.top) * BACKDROP_HEIGHT
  )
}

interface Grid {
  readonly columns: number
  readonly rows: number
  /** For each row, the cells of it that something is drawn on. */
  readonly taken: readonly ReadonlySet<number>[]
}

/** The column as a grid of cells, each marked when a box touches it. */
function gridOf(column: Box, boxes: readonly Box[], cell: number): Grid {
  const columns = Math.max(1, Math.floor((column.right - column.left) / cell))
  const rows = Math.max(1, Math.floor((column.bottom - column.top) / cell))
  const taken = Array.from({ length: rows }, (_, row) => {
    const top = column.top + row * cell
    const across = boxes
      .filter((box) => box.top < top + cell && box.bottom > top)
      .flatMap((box) => {
        const from = Math.max(0, Math.floor((box.left - column.left) / cell))
        const to = Math.min(columns, Math.ceil((box.right - column.left) / cell))
        return Array.from({ length: Math.max(0, to - from) }, (_unused, index) => from + index)
      })
    return new Set(across)
  })
  return { columns, rows, taken }
}

/** The first column at which a window of cells, starting at a row, has nothing in it. */
function emptyWindowAt(grid: Grid, row: number, wide: number, tall: number): number | null {
  const band = grid.taken.slice(row, row + tall)
  const free = Array.from({ length: grid.columns }, (_, column) =>
    band.every((cells) => !cells.has(column)),
  )
  const start = free.findIndex(
    (_, column) =>
      column + wide <= grid.columns && free.slice(column, column + wide).every(Boolean),
  )
  return start < 0 ? null : start
}

/** Every block of the column that nothing is drawn on, one to a place. */
function deadBlocksIn(column: Box, boxes: readonly Box[], em: number): readonly DeadBlock[] {
  const cell = em / CELLS_PER_EM
  const grid = gridOf(column, boxes, cell)
  const wide = Math.ceil(grid.columns * DEAD_BLOCK_SHARE)
  const tall = Math.ceil(DEAD_BLOCK_EM * CELLS_PER_EM)
  const starts = Array.from({ length: Math.max(0, grid.rows - tall + 1) }, (_, row) => row)

  return starts
    .reduce<readonly DeadBlock[]>((found, row) => {
      const last = found.at(-1)
      // One block is reported once, not again for every row it runs down.
      if (last !== undefined && row < last.y * CELLS_PER_EM + tall) {
        return found
      }
      const column0 = emptyWindowAt(grid, row, wide, tall)
      return column0 === null
        ? found
        : [...found, { x: column0 / CELLS_PER_EM, y: row / CELLS_PER_EM }]
    }, [])
    .slice(0, MOST_REPORTED)
}

/** Measures a section's body against its column. */
export async function columnUse(
  section: Locator,
  { ignore = '' }: ColumnUseOptions = {},
): Promise<ColumnUse> {
  const { em, column, body, header } = await section.evaluate(drawnBoxes, ignore)
  if (body.length === 0) {
    throw new Error('The section body draws nothing')
  }
  const filling = [...body, ...header].filter((box) => !isBackdrop(box, column))

  return {
    em,
    column,
    content: {
      left: Math.min(...body.map(({ left }) => left)),
      right: Math.max(...body.map(({ right }) => right)),
    },
    deadBlocks: deadBlocksIn(column, filling, em),
  }
}

/** How far the body's outer edges are from the column's, in ems: nothing when they meet. */
export function edgeGaps(use: ColumnUse): { readonly left: number; readonly right: number } {
  return {
    left: Math.abs(use.content.left - use.column.left) / use.em,
    right: Math.abs(use.content.right - use.column.right) / use.em,
  }
}
