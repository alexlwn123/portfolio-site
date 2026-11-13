import { type Artboard, type Frame, UNITS_PER_EM } from './artboards'
import {
  HIDDEN,
  type Layout,
  type PhoneLayout,
  type PhonePlacement,
  type Placement,
} from './schema'
import type { Spread, SpreadPlan } from './spread'

/*
 * Compiles the pile's placements into a stylesheet. Stickers carry no inline
 * styles: each is found by its data-sticker attribute, and the phone and wide
 * arrangements are the same set of rules inside a container query each. The
 * cover's rules are compiled beside these, in coverCss.ts.
 */

export interface PileLayouts {
  /** Sticker ids in reading order. */
  readonly order: readonly string[]
  readonly wide: Layout
  /** How the wide board's stickers are shared out across the screen (spread.ts). */
  readonly spread: SpreadPlan
  readonly desktop: Layout
  readonly phone: PhoneLayout
}

const EM_DECIMALS = 3
const SHARE_DECIMALS = 4
/** The width of the lid, and half of it, inside a calc(). */
const ACROSS = '100cqw'
const HALF_ACROSS = '50cqw'

/** A length in design units, written in em. */
export function em(units: number): string {
  const value = Number((units / UNITS_PER_EM).toFixed(EM_DECIMALS))
  return `${String(value === 0 ? 0 : value)}em`
}

function declarations(placement: PhonePlacement): readonly string[] {
  if (placement === HIDDEN) {
    return ['display:none']
  }
  const { x, y, w, r, z } = placement
  return [
    `left:${em(x)}`,
    `top:${em(y)}`,
    ...(w === undefined ? [] : [`width:${em(w)}`]),
    `rotate:${String(r)}deg`,
    `z-index:${String(z)}`,
  ]
}

export function rule(selector: string, lines: readonly string[]): string {
  return `${selector}{${lines.join(';')}}`
}

/** A length added to, or taken from, what stands before it in a calc(). */
function signedEm(units: number): string {
  return units < 0 ? `- ${em(-units)}` : `+ ${em(units)}`
}

/**
 * Where a sticker of the wide board stands across the screen: the margin,
 * and then its share of the room it has. The room is the screen between the
 * margins, or as far as the landing, less the sticker's own width.
 */
function spreadLeft({ share, width, stop }: Spread, { margin, landingReach }: SpreadPlan): string {
  if (share === 0) {
    return em(margin)
  }
  const room =
    stop === 'landing'
      ? `${HALF_ACROSS} ${signedEm(landingReach - margin - width)}`
      : `${ACROSS} ${signedEm(-(margin * 2 + width))}`
  return `calc(${em(margin)} + ${String(Number(share.toFixed(SHARE_DECIMALS)))} * (${room}))`
}

function spreadRule(id: string, placement: Placement | undefined, plan: SpreadPlan): string {
  const spread = plan.stickers[id]
  if (placement === undefined || spread === undefined) {
    throw new Error(
      `The sticker "${id}" has no placement on the wide board, or no place in its spread`,
    )
  }
  const { y, w, r, z } = placement
  return rule(`[data-sticker="${id}"]`, [
    `left:${spreadLeft(spread, plan)}`,
    `top:${em(y)}`,
    ...(w === undefined ? [] : [`width:${em(w)}`]),
    `rotate:${String(r)}deg`,
    `z-index:${String(z)}`,
  ])
}

function stickerRule(id: string, placement: PhonePlacement | undefined): string {
  if (placement === undefined) {
    throw new Error(`The sticker "${id}" has no placement`)
  }
  const selector = `[data-sticker="${id}"]`
  // Naming the stage as well outranks the display a component gives its own
  // sticker, whichever stylesheet loads last. Placed stickers keep the plain
  // selector, so that a lifted sticker's z-index can still outrank theirs.
  return placement === HIDDEN
    ? rule(`[data-lid-stage] ${selector}`, declarations(placement))
    : rule(selector, declarations(placement))
}

/** The pile as wide as the lid: its font size is the design unit, whatever the width. */
function pileRule({ width, height }: Artboard): string {
  return rule('[data-lid-pile]', [
    `font-size:calc(100cqw / ${String(width / UNITS_PER_EM)})`,
    `height:${em(height)}`,
  ])
}

/**
 * The same, for a board whose unit stops growing at a cap. The pile itself
 * stays as wide as the lid: past the cap its stickers go on spreading.
 */
function cappedPileRule({ width, height }: Artboard, capPx: number): string {
  const ems = String(width / UNITS_PER_EM)
  return rule('[data-lid-pile]', [
    `font-size:min(calc(100cqw / ${ems}),calc(${String(capPx)}px / ${ems}))`,
    `height:${em(height)}`,
  ])
}

function query(frame: Frame, condition: string, rules: readonly string[]): readonly string[] {
  return [`@container ${frame.containerName} (${condition}){`, ...rules, '}']
}

/**
 * The desktop arrangement is the plain rules. The phone's and the wide one's
 * each sit in a container query, and the two queries never match at once. The
 * wide one's stickers are spread across the screen, so each of its rules
 * says where a sticker stands by the width of the lid.
 */
export function toCss(layouts: PileLayouts, frame: Frame): string {
  const { order, wide, spread, desktop, phone } = layouts
  const lidRule = rule('[data-lid]', [`container:${frame.containerName} / inline-size`])
  const rulesOf = (layout: PhoneLayout): readonly string[] =>
    order.map((id) => stickerRule(id, layout[id]))

  return [
    lidRule,
    pileRule(frame.desktop),
    ...rulesOf(desktop),
    ...query(frame, `max-width:${String(frame.phoneMaxWidthPx)}px`, [
      pileRule(frame.phone),
      ...rulesOf(phone),
    ]),
    ...query(frame, `min-width:${String(frame.wideMinWidthPx)}px`, [
      cappedPileRule(frame.wide, frame.maxArtboardWidthPx),
      ...order.map((id) => spreadRule(id, wide[id], spread)),
    ]),
    '',
  ].join('\n')
}
