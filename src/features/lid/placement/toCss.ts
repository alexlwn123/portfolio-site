import { type Frame, UNITS_PER_EM } from './artboards'
import { HIDDEN, type Layout, type PhoneLayout, type PhonePlacement } from './schema'

/*
 * Compiles the placements into one stylesheet. Stickers carry no inline
 * styles: each is found by its data-sticker attribute, and the phone
 * arrangement is the same set of rules inside a container query.
 */

export interface LidLayouts {
  /** Sticker ids in reading order, which is also the order they slap down in. */
  readonly order: readonly string[]
  readonly desktop: Layout
  readonly phone: PhoneLayout
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

function stickerRule(id: string, placement: PhonePlacement | undefined, extra: string[]): string {
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

function stageRule({ width, height }: Frame['desktop']): string {
  return rule('[data-lid-stage]', [
    `font-size:calc(100cqw / ${String(width / UNITS_PER_EM)})`,
    `height:${em(height)}`,
  ])
}

export function toCss({ order, desktop, phone }: LidLayouts, frame: Frame): string {
  const deskRule = rule('[data-lid-desk]', [`--lid-max-width:${String(frame.maxWidthPx)}px`])
  const lidRule = rule('[data-lid]', [`container:${frame.containerName} / inline-size`])
  const desktopRules = order.map((id, index) =>
    stickerRule(id, desktop[id], [`--i:${String(slapStep(index, order.length))}`]),
  )
  const phoneRules = order.map((id) => stickerRule(id, phone[id], []))
  const query = `@container ${frame.containerName} (max-width:${String(frame.phoneMaxWidthPx)}px)`

  return [
    deskRule,
    lidRule,
    stageRule(frame.desktop),
    ...desktopRules,
    `${query}{`,
    stageRule(frame.phone),
    ...phoneRules,
    '}',
    '',
  ].join('\n')
}
