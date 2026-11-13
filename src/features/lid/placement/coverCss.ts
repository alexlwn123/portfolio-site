import {
  type BoardName,
  type CoverDesign,
  type CoverName,
  type Frame,
  UNITS_PER_EM,
} from './artboards'
import type { CoverLayout, CoverPlacement } from './schema'
import { em, rule } from './toCss'

/*
 * Compiles the cover's placements into a stylesheet. The cover has four
 * compositions and exactly one applies at a time: the phone's, the laptop's,
 * and between them a tablet's, upright or on its side. So every rule here
 * sits inside a query, and no composition inherits a side or a line from
 * another.
 */

export interface CoverLayouts {
  /** Sticker ids in reading order. */
  readonly order: readonly string[]
  readonly layouts: Readonly<Record<CoverName, CoverLayout>>
}

const SHARE_DECIMALS = 3
const PX_DECIMALS = 2
const PERCENT = 100

function tidy(value: number, decimals: number): string {
  return String(Number(value.toFixed(decimals)))
}

/** The share of an artboard's width that is the column, in container-width units. */
function columnShare(board: BoardName, frame: Frame): number {
  return 1 - (frame.gutters[board] * 2) / frame[board].width
}

/**
 * The column the cover is set in: the sections' own. On the wide board it
 * stops growing where the page's unit does, and the margins take the rest.
 */
function boardRule(board: BoardName, frame: Frame): string {
  const share = columnShare(board, frame)
  const fluid = `${tidy(share * PERCENT, SHARE_DECIMALS)}cqw`
  const capped = `${tidy(share * frame.maxArtboardWidthPx, PX_DECIMALS)}px`
  return rule('[data-lid-board]', [`width:${board === 'wide' ? `min(${fluid},${capped})` : fluid}`])
}

/** The unit: the smaller of the two the screen allows, between the floor and the cap. */
function unitOf(
  { board, height, floorPx, capPx }: CoverDesign,
  frame: Frame,
  tall: string,
): string {
  const across = `calc(100cqw / ${String(frame[board].width / UNITS_PER_EM)})`
  const down = `max(${tidy(floorPx, PX_DECIMALS)}px,calc(${tall} / ${String(height / UNITS_PER_EM)}))`
  const cap = capPx === undefined ? [] : [`${tidy(capPx, PX_DECIMALS)}px`]
  return `min(${[across, down, ...cap].join(',')})`
}

function block(condition: string, rules: readonly string[]): readonly string[] {
  return [`${condition}{`, ...rules, '}']
}

/** What a browser calls the height of the screen with its bars showing, and what an older one has instead. */
const SMALL_VIEWPORT = '100svh'
const LARGE_VIEWPORT = '100vh'
/**
 * The condition under which the older height is used. The two are never
 * written as one rule with the newer last: a minifier keeps only the last of
 * two declarations of one property.
 */
const NO_SMALL_VIEWPORT = `@supports not (height:${SMALL_VIEWPORT})`

/**
 * The cover itself: its font size is its design unit, and it is never shorter
 * than its composition.
 */
function coverRule(design: CoverDesign, frame: Frame): string {
  return rule('[data-lid-cover]', [
    `font-size:${unitOf(design, frame, SMALL_VIEWPORT)}`,
    `min-height:${em(design.height)}`,
  ])
}

/**
 * Where the pile starts when the badge's ribbons trail further than the cover
 * is tall: under the last of them. The gap is what is left of the trail once
 * the cover's own height is taken from it, and never less than nothing.
 */
function trailRule(design: CoverDesign, frame: Frame, tall: string): readonly string[] {
  const { trail, height } = design
  if (trail === undefined) {
    return []
  }
  const unit = unitOf(design, frame, tall)
  const pastScreen = `calc(${unit} * ${String(trail / UNITS_PER_EM)} - ${tall})`
  const pastCover = `calc(${unit} * ${String((trail - height) / UNITS_PER_EM)})`
  return [rule('[data-lid-pile]', [`margin-top:max(0px,min(${pastScreen},${pastCover}))`])]
}

/** The same sizes for a browser that does not know the small viewport height. */
function olderRules(design: CoverDesign, frame: Frame): readonly string[] {
  return block(NO_SMALL_VIEWPORT, [
    rule('[data-lid-cover]', [`font-size:${unitOf(design, frame, LARGE_VIEWPORT)}`]),
    ...trailRule(design, frame, LARGE_VIEWPORT),
  ])
}

function across({ from, x }: CoverPlacement): string {
  return `${from}:${em(x)}`
}

function down({ against, y }: CoverPlacement): string {
  if (against === 'middle') {
    return `top:calc(50% + ${em(y)})`
  }
  return `${against}:${em(y)}`
}

function stickerRule(id: string, placement: CoverPlacement | undefined): string {
  if (placement === undefined) {
    throw new Error(`The sticker "${id}" has no placement on the cover`)
  }
  const { w, r, z } = placement
  return rule(`[data-sticker="${id}"]`, [
    across(placement),
    down(placement),
    ...(w === undefined ? [] : [`width:${em(w)}`]),
    `rotate:${String(r)}deg`,
    `z-index:${String(z)}`,
  ])
}

function composition(name: CoverName, { order, layouts }: CoverLayouts, frame: Frame): string[] {
  const design = frame.covers[name]
  return [
    coverRule(design, frame),
    boardRule(design.board, frame),
    ...trailRule(design, frame, SMALL_VIEWPORT),
    ...olderRules(design, frame),
    ...order.map((id) => stickerRule(id, layouts[name][id])),
  ]
}

/** The four compositions, each inside the query that picks it. */
export function coverCss(covers: CoverLayouts, frame: Frame): string {
  const container = `@container ${frame.containerName}`
  const phone = `(max-width:${String(frame.phoneMaxWidthPx)}px)`
  const wide = `(min-width:${String(frame.wideMinWidthPx)}px)`
  const upright = `(max-aspect-ratio:${frame.portraitMaxAspect})`

  return [
    ...block(`${container} ${phone}`, composition('phone', covers, frame)),
    ...block(`${container} (not ${phone}) and (not ${wide})`, [
      ...block(`@media ${upright}`, composition('portrait', covers, frame)),
      ...block(`@media not all and ${upright}`, composition('landscape', covers, frame)),
    ]),
    ...block(`${container} ${wide}`, composition('wide', covers, frame)),
    '',
  ].join('\n')
}
