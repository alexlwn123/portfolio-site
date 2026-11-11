import { type Artboard, type Frame, UNITS_PER_EM } from './artboards'
import { HIDDEN, type Layout, type PhoneLayout, type PhonePlacement } from './schema'

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
  readonly desktop: Layout
  readonly phone: PhoneLayout
}

const EM_DECIMALS = 3

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

/** The same, for an artboard that stops growing at a cap and then sits in the middle of the lid. */
function cappedPileRule({ width, height }: Artboard, capPx: number): string {
  const ems = String(width / UNITS_PER_EM)
  return rule('[data-lid-pile]', [
    `font-size:min(calc(100cqw / ${ems}),calc(${String(capPx)}px / ${ems}))`,
    `height:${em(height)}`,
    `max-width:${String(capPx)}px`,
    'margin-inline:auto',
  ])
}

function query(frame: Frame, condition: string, rules: readonly string[]): readonly string[] {
  return [`@container ${frame.containerName} (${condition}){`, ...rules, '}']
}

/**
 * The desktop arrangement is the plain rules. The phone's and the wide one's
 * each sit in a container query, and the two queries never match at once.
 */
export function toCss(layouts: PileLayouts, frame: Frame): string {
  const { order, wide, desktop, phone } = layouts
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
      ...rulesOf(wide),
    ]),
    '',
  ].join('\n')
}
