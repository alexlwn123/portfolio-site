import { z } from 'zod'

import { parseContent } from '../../../content/parse'
import { type Artboard, BLEED, COVER_RISE } from './artboards'

/*
 * Where a sticker sits on an artboard. Placement is data: nothing here knows
 * what the sticker is, and the DOM order (reading order) never depends on it.
 */

/** Position, width, tilt in degrees and layer. A sticker with no width sizes itself. */
export type Placement = Readonly<{ x: number; y: number; w?: number; r: number; z: number }>

/** On the phone, pure decoration may be left off instead of placed. */
export const HIDDEN = 'hidden'
export type PhonePlacement = Placement | typeof HIDDEN

export type Layout<Id extends string = string> = Readonly<Record<Id, Placement>>
export type PhoneLayout<Id extends string = string> = Readonly<Record<Id, PhonePlacement>>

const MAX_TILT_DEGREES = 45
const TOP_LAYER = 20

const placementSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
  w: z.number().positive().exactOptional(),
  r: z.number().min(-MAX_TILT_DEGREES).max(MAX_TILT_DEGREES),
  z: z.int().min(1).max(TOP_LAYER),
})

function isInside({ x, y, w = 0 }: Placement, artboard: Artboard): boolean {
  const withinWidth = x >= -BLEED && x + w <= artboard.width + BLEED
  const withinHeight = y >= -BLEED && y <= artboard.height
  return withinWidth && withinHeight
}

function onArtboard(artboard: Artboard): z.ZodType<Placement> {
  const { width, height } = artboard
  return placementSchema.refine((placement) => isInside(placement, artboard), {
    error: `Placed outside the ${String(width)}×${String(height)} artboard (bleed ${String(BLEED)})`,
  })
}

/** One entry per sticker id: a missing sticker and an unknown one both fail. */
function layoutSchema<Entry extends z.ZodType>(ids: readonly string[], entry: Entry) {
  return z.strictObject(Object.fromEntries(ids.map((id) => [id, entry])))
}

function rootOf(name: string): string {
  return `lid.placement.${name}`
}

/**
 * Validates a layout when its module loads, so a bad placement stops the
 * build and the error names the sticker.
 */
export function parseLayout<Id extends string>(
  name: string,
  ids: readonly Id[],
  artboard: Artboard,
  raw: unknown,
): Layout<Id> {
  // The strict schema has exactly one key per id, which the type cannot say for itself.
  return parseContent(layoutSchema(ids, onArtboard(artboard)), raw, rootOf(name)) as Layout<Id>
}

/** The same, for a layout on which a sticker may be "hidden". */
export function parsePhoneLayout<Id extends string>(
  name: string,
  ids: readonly Id[],
  artboard: Artboard,
  raw: unknown,
): PhoneLayout<Id> {
  const entry = z.union([z.literal(HIDDEN), onArtboard(artboard)])
  return parseContent(layoutSchema(ids, entry), raw, rootOf(name)) as PhoneLayout<Id>
}

/*
 * The cover is not an artboard of one fixed shape: it is the screen, whatever
 * shape that is. So a placement on it says what it is measured from. Across,
 * that is one edge of the page's column, which keeps the name on the column's
 * left edge and the badge on its right at any width. Down, it is the top of
 * the screen (what hangs from it), its middle (what the screen is about) or
 * its bottom (the cue to scroll).
 */

/** The edge of the column `x` is measured from, inwards. */
export type CoverSide = 'left' | 'right'
/** The line of the screen `y` is measured from: down from the top or the middle, up from the bottom. */
export type CoverLine = 'top' | 'middle' | 'bottom'

export type CoverPlacement = Placement & Readonly<{ from: CoverSide; against: CoverLine }>
export type CoverLayout<Id extends string = string> = Readonly<Record<Id, CoverPlacement>>

/** The column a cover is set in, and the shortest screen it is drawn for, in units. */
export interface CoverField {
  readonly width: number
  readonly height: number
}

const HALF = 0.5

const coverPlacementSchema = placementSchema.extend({
  from: z.enum(['left', 'right']),
  against: z.enum(['top', 'middle', 'bottom']),
})

/** How far down a placement may start, and how far up, from the line it is measured against. */
function reachOf(against: CoverLine, height: number): readonly [number, number] {
  if (against === 'top') {
    return [-COVER_RISE, height]
  }
  return against === 'middle' ? [-height * HALF, height * HALF] : [0, height]
}

function isOnCover({ x, y, w = 0, against }: CoverPlacement, field: CoverField): boolean {
  const [least, most] = reachOf(against, field.height)
  return x >= -BLEED && x + w <= field.width + BLEED && y >= least && y <= most
}

/** The same check as a pile's layout gets, for the placements of one cover. */
export function parseCoverLayout<Id extends string>(
  name: string,
  ids: readonly Id[],
  field: CoverField,
  raw: unknown,
): CoverLayout<Id> {
  const entry = coverPlacementSchema.refine((placement) => isOnCover(placement, field), {
    error: `Placed off the ${String(field.width)}×${String(field.height)} cover (bleed ${String(BLEED)}, rise ${String(COVER_RISE)})`,
  })
  return parseContent(layoutSchema(ids, entry), raw, rootOf(name)) as CoverLayout<Id>
}
