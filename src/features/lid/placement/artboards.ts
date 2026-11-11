/*
 * The lid is drawn on three hand-set artboards, measured in design units. One
 * unit is one CSS pixel when an artboard is shown at its own width, and the
 * stage's font size makes one em ten units wide at any width, so a placement
 * of 470 units is always 47em.
 *
 * The lid itself is always as wide as the screen. An artboard fills it, so the
 * unit grows with the screen: on the wide artboard it is 1px at 1100, 1.31px
 * at 1440 and 1.75px at 1920. Past that the artboard stops growing and sits in
 * the middle of the lid, which carries on to both edges.
 */

export interface Artboard {
  readonly width: number
  readonly height: number
  /**
   * How far above the top edge a placement may start, where that is more than
   * the bleed. Only what hangs from the top of the lid has any use for it.
   */
  readonly rise?: number
}

export const UNITS_PER_EM = 10

export const ARTBOARDS = Object.freeze({
  /**
   * A laptop's: landscape, and looser. The badge is hung higher here than on
   * the other two, so that its ribbons start on the first screen.
   */
  wide: Object.freeze({ width: 1100, height: 1090, rise: 120 }),
  /** design/mockups/01-first-screen.html, re-flowed for what has been stuck on since. */
  desktop: Object.freeze({ width: 728, height: 1510 }),
  /** The mockup's phone arrangement, retuned so no label is under 11px. */
  phone: Object.freeze({ width: 390, height: 2526 }),
} satisfies Record<string, Artboard>)

export type LayoutName = keyof typeof ARTBOARDS

/** The container name the layout's queries are written against. */
export const CONTAINER_NAME = 'lid'

/** At this lid width or narrower, the phone artboard is used. */
export const PHONE_MAX_WIDTH_PX = 560

/** At this lid width or wider, the wide artboard is used. One unit is then 1px or more. */
export const WIDE_MIN_WIDTH_PX = ARTBOARDS.wide.width

/**
 * The wide artboard is never drawn wider than this. Without the cap a very
 * large screen shows stickers the size of dinner plates. The sections under
 * the lid stop at the same width (src/features/sections/SectionFrame.module.css).
 */
export const MAX_ARTBOARD_WIDTH_PX = 1920

/** How far a sticker may hang over an edge of its artboard, in units. */
export const BLEED = 40

/** The narrowest phone the type is checked against, and the smallest text allowed on it. */
export const NARROW_PHONE_PX = 360
export const MIN_TEXT_PX = 11

/** Everything the stylesheet needs to know about the frame around the stickers. */
export interface Frame {
  readonly containerName: string
  readonly phoneMaxWidthPx: number
  readonly wideMinWidthPx: number
  readonly maxArtboardWidthPx: number
  readonly wide: Artboard
  readonly desktop: Artboard
  readonly phone: Artboard
}

export const FRAME: Frame = Object.freeze({
  containerName: CONTAINER_NAME,
  phoneMaxWidthPx: PHONE_MAX_WIDTH_PX,
  wideMinWidthPx: WIDE_MIN_WIDTH_PX,
  maxArtboardWidthPx: MAX_ARTBOARD_WIDTH_PX,
  wide: ARTBOARDS.wide,
  desktop: ARTBOARDS.desktop,
  phone: ARTBOARDS.phone,
})
