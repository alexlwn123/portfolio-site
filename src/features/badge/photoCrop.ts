/*
 * Which part of the portrait the badge shows, and how it gets there.
 *
 * The approved mockup carried a 300px square cut from src/assets/alex-lewin.png
 * (420 source pixels square, from x 265, y 300) and showed the band of it from
 * 18% down. BADGE_CROP is that band in source pixels.
 *
 * Astro's image pipeline can resize and trim towards the centre, but cannot
 * cut out an arbitrary rectangle. So the pipeline trims the portrait to a
 * centred column just wide enough to hold the crop, and the stylesheet slides
 * that column up behind the photo's frame (see BadgePhoto.module.css).
 */

export interface Size {
  readonly width: number
  readonly height: number
}

export interface Region extends Size {
  readonly x: number
  readonly y: number
}

export const BADGE_CROP: Region = Object.freeze({ x: 265, y: 321.2, width: 420, height: 302.4 })

/** The widths the column is published at. The largest is the portrait's own resolution. */
export const PHOTO_SCALES: readonly number[] = Object.freeze([0.5, 0.75, 1])

/**
 * The photo's frame is 21.5em wide: 56% of the phone artboard, 30% of the
 * desktop one, and 296px when the lid is at its widest.
 */
export const PHOTO_SIZES = '(max-width: 560px) 56vw, min(30vw, 296px)'

const PERCENT = 100
const PERCENT_DECIMALS = 2

/** The width of the narrowest centred column of the source that contains the crop. */
export function columnWidth(source: Size, crop: Region): number {
  const centre = source.width / 2
  const reach = Math.max(centre - crop.x, crop.x + crop.width - centre)
  return Math.ceil(reach) * 2
}

function percent(ratio: number): string {
  return `${String(Number((ratio * PERCENT).toFixed(PERCENT_DECIMALS)))}%`
}

/** Where the column sits behind a frame the size of the crop, as CSS percentages. */
export function columnPlacement(
  source: Size,
  crop: Region,
): { readonly left: string; readonly top: string; readonly width: string } {
  const column = columnWidth(source, crop)
  const columnLeft = (source.width - column) / 2
  return {
    left: percent((columnLeft - crop.x) / crop.width),
    top: percent(-crop.y / crop.height),
    width: percent(column / crop.width),
  }
}
