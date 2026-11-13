import type { PileId } from '../stickers'
import { ARTBOARDS, COLUMNS, LANDINGS } from './artboards'
import type { Layout } from './schema'
import { wide } from './wide'

/*
 * On a laptop the pile is a bulletin board: its stickers take the whole width
 * of the screen. The wide board is still drawn in the page's column, and each
 * sticker keeps the size it was drawn at. What changes is where it stands
 * across the screen. A sticker has some room to move in: the width of the
 * screen between the margins, less its own width. It was drawn some share of
 * the way across the room the column gave it, and it stands the same share of
 * the way across the room the screen gives it. So the sticker on the column's
 * left edge stands on the left margin, the one on its right edge on the right
 * margin, and the rest spread out between them as the screen widens.
 */

/** How far in from each side of the screen the outermost stickers stand, in units. */
export const SPREAD_MARGIN = 32

/** The lid kept bare between a sticker and the place the ribbons land, in units. */
const LANDING_GAP = 10

/**
 * How wide each sticker that sizes itself draws on the wide board, in units.
 * Only the spread reads these: it needs a width to know how much room a
 * sticker has. They are measured from the page, and a browser test holds them
 * to it.
 */
export const WIDE_SPANS = Object.freeze({
  'pile-title': 299,
  'job-finite-computer': 207,
  'job-fedi': 87,
  'job-zion': 108,
  'job-blockspaces': 142,
  'job-ncr': 215,
  'city-nairobi': 80,
  'city-taipei': 69,
  'city-riga': 59,
  'city-istanbul': 88,
  'city-florianopolis': 123,
  'city-berlin': 73,
  'city-toronto': 85,
  'city-austin': 74,
  phrase: 217,
} satisfies Partial<Record<PileId, number>>)

/**
 * The stickers that stand beside the place the badge's ribbons land, in the
 * pile's top right corner. That place hangs from the column's right edge, not
 * the screen's, so these do not spread to the margin: they spread as far as
 * the landing's left edge and stop.
 */
export const UNDER_THE_LANDING: readonly PileId[] = Object.freeze([
  'job-finite-computer',
  'sound',
  'tidy',
])

/** Where a sticker's room ends on the right: the screen's margin, or the place the ribbons land. */
export type SpreadStop = 'edge' | 'landing'

export interface Spread {
  /** How far across its room the sticker stands: 0 on the left end, 1 on the right. */
  readonly share: number
  /** How wide it draws, in units. */
  readonly width: number
  readonly stop: SpreadStop
}

export interface SpreadPlan {
  /** The margin kept on each side of the screen, in units. */
  readonly margin: number
  /** How far right of the middle of the screen the landing's room ends, in units. */
  readonly landingReach: number
  readonly stickers: Readonly<Record<string, Spread>>
}

/** What the plan is drawn from: the board the placements were set on. */
export interface SpreadBoard {
  readonly width: number
  readonly gutter: number
  readonly landing: { readonly width: number; readonly height: number }
}

export interface SpreadOptions {
  readonly spans: Readonly<Record<string, number>>
  readonly underLanding: readonly string[]
  readonly board: SpreadBoard
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** How far right of the board's middle a sticker beside the landing may reach. */
function landingReachOf({ width, gutter, landing }: SpreadBoard): number {
  return width / 2 - gutter - landing.width - LANDING_GAP
}

/**
 * Plans the spread of one board's stickers. Each sticker's share is how far
 * across its room it was drawn: the column, or for a sticker beside the
 * landing, the column as far as the landing.
 */
export function spreadPlan(layout: Layout, options: SpreadOptions): SpreadPlan {
  const { spans, underLanding, board } = options
  const column = board.width - board.gutter * 2
  const landingReach = landingReachOf(board)
  const roomBesideLanding = board.width / 2 + landingReach - board.gutter

  const stickers = Object.fromEntries(
    Object.entries(layout).map(([id, { x, w }]): readonly [string, Spread] => {
      const width = w ?? spans[id]
      if (width === undefined) {
        throw new Error(`The sticker "${id}" has no width to spread it by`)
      }
      const stop: SpreadStop = underLanding.includes(id) ? 'landing' : 'edge'
      const room = (stop === 'landing' ? roomBesideLanding : column) - width
      return [id, { share: clamp((x - board.gutter) / room), width, stop }]
    }),
  )

  return Object.freeze({ margin: SPREAD_MARGIN, landingReach, stickers: Object.freeze(stickers) })
}

/** Where a sticker's left edge stands on a screen so many units across. The stylesheet says the same in CSS. */
export function leftAt(plan: SpreadPlan, id: string, across: number): number {
  const spread = plan.stickers[id]
  if (spread === undefined) {
    throw new Error(`The sticker "${id}" is not in the spread`)
  }
  const { share, width, stop } = spread
  const end = stop === 'landing' ? across / 2 + plan.landingReach : across - plan.margin
  return plan.margin + share * (end - plan.margin - width)
}

/** The wide board's spread: every sticker of the pile on a laptop. */
export const wideSpread: SpreadPlan = spreadPlan(wide, {
  spans: WIDE_SPANS,
  underLanding: UNDER_THE_LANDING,
  board: {
    width: ARTBOARDS.wide.width,
    gutter: COLUMNS.wide.gutter,
    landing: LANDINGS.wide,
  },
})
