/*
 * The lid is drawn on two hand-set artboards, measured in design units. One
 * unit is one CSS pixel when an artboard is shown at its own width, and the
 * stage's font size makes one em ten units wide at any width, so a placement
 * of 470 units is always 47em.
 */

export interface Artboard {
  readonly width: number
  readonly height: number
}

export const UNITS_PER_EM = 10

export const ARTBOARDS = Object.freeze({
  /** design/mockups/01-first-screen.html, as approved. */
  desktop: Object.freeze({ width: 728, height: 1300 }),
  /** The mockup's phone arrangement, retuned so no label is under 11px. */
  phone: Object.freeze({ width: 390, height: 2256 }),
} satisfies Record<string, Artboard>)

export type LayoutName = keyof typeof ARTBOARDS

/** The container name the layout's queries are written against. */
export const CONTAINER_NAME = 'lid'

/** At this lid width or narrower, the phone artboard is used. */
export const PHONE_MAX_WIDTH_PX = 560

/**
 * The desktop artboard is never drawn larger than this. Without the cap a
 * laptop shows a lid three screens tall; with it the lid stops at 1001px.
 */
export const MAX_SCALE = 1.375

export const MAX_WIDTH_PX = ARTBOARDS.desktop.width * MAX_SCALE

/** How far a sticker may hang over an edge of its artboard, in units. */
export const BLEED = 40

/** The narrowest phone the type is checked against, and the smallest text allowed on it. */
export const NARROW_PHONE_PX = 360
export const MIN_TEXT_PX = 11

/** Everything the stylesheet needs to know about the frame around the stickers. */
export interface Frame {
  readonly containerName: string
  readonly phoneMaxWidthPx: number
  readonly maxWidthPx: number
  readonly desktop: Artboard
  readonly phone: Artboard
}

export const FRAME: Frame = Object.freeze({
  containerName: CONTAINER_NAME,
  phoneMaxWidthPx: PHONE_MAX_WIDTH_PX,
  maxWidthPx: MAX_WIDTH_PX,
  desktop: ARTBOARDS.desktop,
  phone: ARTBOARDS.phone,
})
