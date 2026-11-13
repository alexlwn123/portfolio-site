import { BADGE_CROP, columnWidth, PHOTO_SCALES, PHOTO_SIZES, type Size } from './photoCrop'

/*
 * Turns the portrait into the files the badge needs, through whatever image
 * pipeline it is handed. The page passes Astro's getImage. Nothing here
 * imports Astro, so this is plain code that the unit tests can run.
 */

type Format = 'avif' | 'webp'

/**
 * The photo is reduced to three inks and printed over with halftone dots, so
 * it can be compressed harder than a photograph shown as it was taken.
 */
const QUALITY: Readonly<Record<Format, number>> = { avif: 40, webp: 55 }

/** The one request this module makes of a pipeline: trim to a centred box, in a format. */
export interface PhotoTransform<Source> {
  readonly src: Source
  readonly width: number
  readonly height: number
  readonly fit: 'cover'
  readonly format: Format
  readonly quality: number
}

export type TransformImage<Source> = (
  options: PhotoTransform<Source>,
) => Promise<{ readonly src: string }>

export interface PhotoSource {
  readonly type: string
  readonly srcSet: string
}

/** Everything a <picture> needs. Every address is one the pipeline returned. */
export interface BadgePhotoImage {
  readonly sources: readonly PhotoSource[]
  /** The fallback for the <img> itself. */
  readonly src: string
  readonly width: number
  readonly height: number
  readonly sizes: string
}

function columnAt(portrait: Size, scale: number): Size {
  return {
    width: Math.round(columnWidth(portrait, BADGE_CROP) * scale),
    height: Math.round(portrait.height * scale),
  }
}

async function sourceSet<Source extends Size>(
  transform: TransformImage<Source>,
  portrait: Source,
  format: Format,
): Promise<string> {
  const candidates = await Promise.all(
    PHOTO_SCALES.map(async (scale) => {
      const size = columnAt(portrait, scale)
      const { src } = await transform({
        src: portrait,
        ...size,
        fit: 'cover',
        format,
        quality: QUALITY[format],
      })
      return `${src} ${String(size.width)}w`
    }),
  )
  return candidates.join(', ')
}

/** The badge photo in AVIF and WebP at each published width. */
export async function resolveBadgePhoto<Source extends Size>(
  transform: TransformImage<Source>,
  portrait: Source,
): Promise<BadgePhotoImage> {
  const full = columnAt(portrait, 1)
  const [avif, webp, fallback] = await Promise.all([
    sourceSet(transform, portrait, 'avif'),
    sourceSet(transform, portrait, 'webp'),
    // The same file as the largest WebP candidate. The pipeline makes it once.
    transform({ src: portrait, ...full, fit: 'cover', format: 'webp', quality: QUALITY.webp }),
  ])
  return {
    sources: [
      { type: 'image/avif', srcSet: avif },
      { type: 'image/webp', srcSet: webp },
    ],
    src: fallback.src,
    ...full,
    sizes: PHOTO_SIZES,
  }
}
