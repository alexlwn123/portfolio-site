import type { Page } from '@playwright/test'

/** A rectangle on the page, in CSS pixels, with the name of what it holds. */
export interface Region {
  readonly name: string
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

export interface PixelDiff {
  readonly width: number
  readonly height: number
  /** Pixels whose colour differs by more than the threshold in any channel. */
  readonly differing: number
  /** `differing` as a share of all pixels, from 0 to 1. */
  readonly ratio: number
  /** Differing pixels by the smallest region that contains each. `outside` is in none. */
  readonly byRegion: Readonly<Record<string, number>>
  /** A picture of the difference: the first image in grey, differing pixels in red. */
  readonly image: Buffer
}

/** Anti-aliasing and resampling stay under this. A changed colour does not. */
export const CHANNEL_THRESHOLD = 32

/** What every pixel outside the regions is counted under. */
export const OUTSIDE = 'outside'

interface Comparison {
  readonly width: number
  readonly height: number
  /** One character per pixel, row by row: "1" where the two images differ. */
  readonly mask: string
  /** The picture of the difference, as a base64 PNG. */
  readonly image: string
}

/* Runs in the browser, which already knows how to decode and encode a PNG. */
async function compareInPage(input: {
  readonly first: string
  readonly second: string
  readonly threshold: number
}): Promise<Comparison> {
  const CHANNELS = 4
  const decode = async (base64: string): Promise<ImageBitmap> => {
    const response = await fetch(`data:image/png;base64,${base64}`)
    return createImageBitmap(await response.blob())
  }
  const [first, second] = await Promise.all([decode(input.first), decode(input.second)])
  const width = Math.max(first.width, second.width)
  const height = Math.max(first.height, second.height)
  const canvas = new OffscreenCanvas(width, height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('No 2D canvas to compare images on')
  }
  const pixels = (bitmap: ImageBitmap): Uint8ClampedArray => {
    context.clearRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0)
    return context.getImageData(0, 0, width, height).data
  }
  const [a, b] = [pixels(first), pixels(second)]
  const picture = context.createImageData(width, height)
  const mask = Array.from({ length: width * height }, (_, index) => {
    const at = index * CHANNELS
    const channel = (offset: number, data: Uint8ClampedArray): number => data[at + offset] ?? 0
    const deltas = [0, 1, 2].map((offset) => Math.abs(channel(offset, a) - channel(offset, b)))
    const differs = Math.max(...deltas) > input.threshold
    const grey = 128 + (channel(0, a) + channel(1, a) + channel(2, a)) / 6
    picture.data.set(differs ? [255, 0, 80, 255] : [grey, grey, grey, 255], at)
    return differs ? '1' : '0'
  })
  context.putImageData(picture, 0, 0)
  const blob = await canvas.convertToBlob({ type: 'image/png' })
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const image = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
  return { width, height, mask: mask.join(''), image }
}

function area({ left, top, right, bottom }: Region): number {
  return (right - left) * (bottom - top)
}

/** Counts the differing pixels under the smallest region that holds each one. */
function countByRegion(
  { width, mask }: Comparison,
  regions: readonly Region[],
): Readonly<Record<string, number>> {
  const smallestFirst = regions.toSorted((one, other) => area(one) - area(other))
  const counts = new Map<string, number>()

  for (let index = mask.indexOf('1'); index >= 0; index = mask.indexOf('1', index + 1)) {
    const x = index % width
    const y = Math.floor(index / width)
    const region = smallestFirst.find(
      ({ left, top, right, bottom }) => x >= left && x < right && y >= top && y < bottom,
    )
    const name = region?.name ?? OUTSIDE
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return Object.fromEntries(counts)
}

/**
 * Compares two PNG screenshots pixel by pixel, on a blank page of the given
 * page's browser context. The images may differ in size: the smaller is
 * padded with transparent pixels, which count as different.
 */
export async function diffScreenshots(
  page: Page,
  first: Buffer,
  second: Buffer,
  regions: readonly Region[] = [],
): Promise<PixelDiff> {
  const scratch = await page.context().newPage()
  try {
    const comparison = await scratch.evaluate(compareInPage, {
      first: first.toString('base64'),
      second: second.toString('base64'),
      threshold: CHANNEL_THRESHOLD,
    })
    const byRegion = countByRegion(comparison, regions)
    const differing = Object.values(byRegion).reduce((total, count) => total + count, 0)
    return {
      width: comparison.width,
      height: comparison.height,
      differing,
      ratio: differing / (comparison.width * comparison.height),
      byRegion,
      image: Buffer.from(comparison.image, 'base64'),
    }
  } finally {
    await scratch.close()
  }
}
