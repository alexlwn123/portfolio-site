import { z } from 'zod'

import { parseContent } from '../../../content/parse'
import { type Artboard, BLEED } from './artboards'

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
  const withinHeight = y >= -(artboard.rise ?? BLEED) && y <= artboard.height
  return withinWidth && withinHeight
}

function onArtboard(artboard: Artboard): z.ZodType<Placement> {
  const { width, height, rise = BLEED } = artboard
  return placementSchema.refine((placement) => isInside(placement, artboard), {
    error: `Placed outside the ${String(width)}×${String(height)} artboard (bleed ${String(BLEED)}, rise ${String(rise)})`,
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
