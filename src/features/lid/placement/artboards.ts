/*
 * The lid is two blocks, one under the other, and each is drawn on hand-set
 * artboards measured in design units. Ten units are one em wherever a sticker
 * is placed, so a placement of 470 units is always 47em.
 *
 * The cover is the first screen and nothing but: the name, the hello tag, the
 * badge on its lanyard, a quiet way to the contact section and a cue to
 * scroll. It is exactly as tall as the screen, and its unit comes from the
 * smaller of the screen's width and its height, so the composition always
 * fits, as a picture set to "contain" does.
 *
 * The pile is everything else that has been stuck on. It has an artboard for
 * each of the page's three widths, and its unit is the sections' own: it
 * grows with the page up to 1440px across and stops there.
 *
 * Both are set in the page's one column (see COLUMNS), the same column every
 * section under the lid is set in.
 */

export interface Artboard {
  readonly width: number
  readonly height: number
}

export const UNITS_PER_EM = 10

/** The three widths the page is drawn at. The sections use the same three. */
export type BoardName = 'wide' | 'desktop' | 'phone'

/** The pile's artboards. */
export const ARTBOARDS = Object.freeze({
  /** A laptop's: landscape, and the loosest of the three. */
  wide: Object.freeze({ width: 1100, height: 856 }),
  /** A tablet's, the width of design/mockups/01-first-screen.html. */
  desktop: Object.freeze({ width: 728, height: 1296 }),
  /** A phone's, set so that no label is under 11px on a 360px screen. */
  phone: Object.freeze({ width: 390, height: 2212 }),
} satisfies Record<BoardName, Artboard>)

export type LayoutName = keyof typeof ARTBOARDS

/**
 * The column: how far in from each edge of an artboard the page's content
 * starts. A section's heading sits on the left one, and so do the name on the
 * cover and the pile's own heading.
 */
export const COLUMNS = Object.freeze({
  wide: Object.freeze({ gutter: 50 }),
  desktop: Object.freeze({ gutter: 30 }),
  phone: Object.freeze({ gutter: 16 }),
} satisfies Record<BoardName, { readonly gutter: number }>)

/** How wide the column is on a board, in units. */
export function columnWidth(board: BoardName): number {
  return ARTBOARDS[board].width - COLUMNS[board].gutter * 2
}

/** The container name the layout's queries are written against. */
export const CONTAINER_NAME = 'lid'

/** At this lid width or narrower, the phone artboard is used. */
export const PHONE_MAX_WIDTH_PX = 560

/** At this lid width or wider, the wide artboard is used. One unit is then 1px or more. */
export const WIDE_MIN_WIDTH_PX = ARTBOARDS.wide.width

/**
 * The page's unit stops growing at this width. Past it the margins grow and
 * the type does not. The sections under the lid stop at the same width
 * (src/features/sections/SectionFrame.module.css).
 */
export const MAX_ARTBOARD_WIDTH_PX = 1440

/** How far a sticker may hang over an edge of its artboard, in units. */
export const BLEED = 40

/** The narrowest phone the type is checked against, and the smallest text allowed on it. */
export const NARROW_PHONE_PX = 360
export const MIN_TEXT_PX = 11

/**
 * One composition of the cover. It is laid out in the column of a board, for
 * a screen at least `height` units tall. On a shorter screen the unit shrinks
 * until everything fits, but never under `floorPx` to the em: past that the
 * type would be too small to read, so the cover grows taller than the screen
 * instead. `capPx` is where the unit stops growing on a very large screen.
 */
export interface CoverDesign {
  readonly board: BoardName
  readonly height: number
  readonly floorPx: number
  readonly capPx?: number
  /**
   * How far below the top of the screen the badge's last ribbon ends, where
   * the pile must wait for it: the pile then starts under the ribbons, however
   * short the screen. Left out, the pile starts at the foot of the cover and
   * keeps a corner of its own artboard clear instead (see LANDINGS).
   */
  readonly trail?: number
}

export type CoverName = 'wide' | 'landscape' | 'portrait' | 'phone'

/** How much larger than the page's own unit the cover's may grow on a large screen. */
const COVER_GROWTH = 1.1

/**
 * How far above the top edge of the screen something that hangs from it may
 * be placed. The lanyard's straps are 300 units longer than that again.
 */
export const COVER_RISE = 240

export const COVERS = Object.freeze({
  /** A laptop: the name on the left of the column, the badge hung on its right. */
  wide: Object.freeze({
    board: 'wide',
    height: 620,
    floorPx: 10,
    capPx: (MAX_ARTBOARD_WIDTH_PX / (ARTBOARDS.wide.width / UNITS_PER_EM)) * COVER_GROWTH,
  }),
  /** A tablet on its side, or a small window: the laptop's composition, drawn on the tablet's board. */
  landscape: Object.freeze({ board: 'desktop', height: 546, floorPx: 10 }),
  /** A tablet held upright: the name across the top, the badge hung under its right end. */
  portrait: Object.freeze({ board: 'desktop', height: 880, floorPx: 10 }),
  /** A phone: the name, the hello tag under it, and the badge trailing off the screen. */
  phone: Object.freeze({
    board: 'phone',
    height: 693,
    floorPx: NARROW_PHONE_PX / (ARTBOARDS.phone.width / UNITS_PER_EM),
    trail: 988,
  }),
} satisfies Record<CoverName, CoverDesign>)

/**
 * The badge's ribbons trail off the bottom of the cover and come to rest on
 * the top of the pile. On the two wider boards the pile keeps this much of
 * its top right corner bare for them: a box this wide, in from the column's
 * right edge, and this tall. On a phone the badge is most of the screen's
 * width, so the whole pile waits under it instead (see CoverDesign.trail).
 */
export const LANDINGS = Object.freeze({
  wide: Object.freeze({ width: 280, height: 130 }),
  desktop: Object.freeze({ width: 280, height: 190 }),
} satisfies Partial<Record<BoardName, { readonly width: number; readonly height: number }>>)

/**
 * A tablet's screen at this shape or taller is upright: narrower than nine
 * tenths of its own height.
 */
export const PORTRAIT_MAX_ASPECT = '9/10'

/** Everything the stylesheet needs to know about the frame around the stickers. */
export interface Frame {
  readonly containerName: string
  readonly phoneMaxWidthPx: number
  readonly wideMinWidthPx: number
  readonly maxArtboardWidthPx: number
  readonly portraitMaxAspect: string
  readonly gutters: Readonly<Record<BoardName, number>>
  readonly wide: Artboard
  readonly desktop: Artboard
  readonly phone: Artboard
  readonly covers: Readonly<Record<CoverName, CoverDesign>>
}

export const FRAME: Frame = Object.freeze({
  containerName: CONTAINER_NAME,
  phoneMaxWidthPx: PHONE_MAX_WIDTH_PX,
  wideMinWidthPx: WIDE_MIN_WIDTH_PX,
  maxArtboardWidthPx: MAX_ARTBOARD_WIDTH_PX,
  portraitMaxAspect: PORTRAIT_MAX_ASPECT,
  gutters: Object.freeze({
    wide: COLUMNS.wide.gutter,
    desktop: COLUMNS.desktop.gutter,
    phone: COLUMNS.phone.gutter,
  }),
  wide: ARTBOARDS.wide,
  desktop: ARTBOARDS.desktop,
  phone: ARTBOARDS.phone,
  covers: COVERS,
})
