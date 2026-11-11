import { type Artboard, type Frame, UNITS_PER_EM } from './artboards'
import { HIDDEN, type Layout, type PhoneLayout, type PhonePlacement } from './schema'

/*
 * Compiles the placements into one stylesheet. Stickers carry no inline
 * styles: each is found by its data-sticker attribute, and the phone and wide
 * arrangements are the same set of rules inside a container query each.
 */

export interface LidLayouts {
  /** Sticker ids in reading order, which is also the order they slap down in. */
  readonly order: readonly string[]
  readonly wide: Layout
  readonly desktop: Layout
  readonly phone: PhoneLayout
  /**
   * Stickers that are not there when the page loads and slap down after all
   * the others. They take no turn of their own, so adding one never changes
   * when the rest land.
   */
  readonly late?: readonly string[]
}

/** The slap animation is spread over this many steps, however many stickers there are. */
const SLAP_STEPS = 20
const EM_DECIMALS = 3

function em(units: number): string {
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

function rule(selector: string, lines: readonly string[]): string {
  return `${selector}{${lines.join(';')}}`
}

function stickerRule(
  id: string,
  placement: PhonePlacement | undefined,
  extra: readonly string[],
): string {
  if (placement === undefined) {
    throw new Error(`The sticker "${id}" has no placement`)
  }
  const selector = `[data-sticker="${id}"]`
  // Naming the stage as well outranks the display a component gives its own
  // sticker, whichever stylesheet loads last. Placed stickers keep the plain
  // selector, so that a lifted sticker's z-index can still outrank theirs.
  return placement === HIDDEN
    ? rule(`[data-lid-stage] ${selector}`, declarations(placement))
    : rule(selector, [...declarations(placement), ...extra])
}

function slapStep(index: number, count: number): number {
  return count > 1 ? Math.round((index * SLAP_STEPS) / (count - 1)) : 0
}

/** The stage as wide as the lid: its font size is the design unit, whatever the width. */
function stageRule({ width, height }: Artboard): string {
  return rule('[data-lid-stage]', [
    `font-size:calc(100cqw / ${String(width / UNITS_PER_EM)})`,
    `height:${em(height)}`,
  ])
}

/** The same, for an artboard that stops growing at a cap and then sits in the middle of the lid. */
function cappedStageRule({ width, height }: Artboard, capPx: number): string {
  const ems = String(width / UNITS_PER_EM)
  return rule('[data-lid-stage]', [
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
export function toCss(layouts: LidLayouts, frame: Frame): string {
  const { order, wide, desktop, phone, late = [] } = layouts
  const lidRule = rule('[data-lid]', [`container:${frame.containerName} / inline-size`])
  const prompt = order.filter((id) => !late.includes(id))
  const step = (id: string): number =>
    late.includes(id) ? SLAP_STEPS : slapStep(prompt.indexOf(id), prompt.length)
  const rulesOf = (layout: PhoneLayout): readonly string[] =>
    order.map((id) => stickerRule(id, layout[id], []))

  return [
    lidRule,
    stageRule(frame.desktop),
    ...order.map((id) => stickerRule(id, desktop[id], [`--i:${String(step(id))}`])),
    ...query(frame, `max-width:${String(frame.phoneMaxWidthPx)}px`, [
      stageRule(frame.phone),
      ...rulesOf(phone),
    ]),
    ...query(frame, `min-width:${String(frame.wideMinWidthPx)}px`, [
      cappedStageRule(frame.wide, frame.maxArtboardWidthPx),
      ...rulesOf(wide),
    ]),
    '',
  ].join('\n')
}
