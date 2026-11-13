import { describe, expect, it, vi } from 'vitest'

import { type PhotoTransform, resolveBadgePhoto } from './photoSources'

const PORTRAIT = { width: 946, height: 1154, name: 'alex-lewin' }

function fakePipeline() {
  return vi.fn(({ src, width, height, format }: PhotoTransform<typeof PORTRAIT>) =>
    Promise.resolve({ src: `/_astro/${src.name}.${String(width)}x${String(height)}.${format}` }),
  )
}

describe('resolveBadgePhoto', () => {
  it('asks the pipeline for a centred column in AVIF and WebP at three widths', async () => {
    const pipeline = fakePipeline()

    await resolveBadgePhoto(pipeline, PORTRAIT)

    const requests = pipeline.mock.calls.map(([options]) => options)
    expect(new Set(requests.map(({ width, format }) => `${String(width)} ${format}`)).size).toBe(6)
    expect(new Set(requests.map(({ format }) => format))).toEqual(new Set(['avif', 'webp']))
    expect(new Set(requests.map(({ width }) => width))).toEqual(new Set([212, 318, 424]))
    for (const request of requests) {
      expect(request).toMatchObject({ src: PORTRAIT, fit: 'cover' })
      expect(request.quality).toBeGreaterThan(0)
      expect(request.quality).toBeLessThan(80)
      expect(request.height / request.width).toBeCloseTo(PORTRAIT.height / 424, 1)
    }
  })

  it('never asks for more pixels than the portrait has', async () => {
    const pipeline = fakePipeline()

    await resolveBadgePhoto(pipeline, PORTRAIT)

    for (const [{ width, height }] of pipeline.mock.calls) {
      expect(width).toBeLessThanOrEqual(PORTRAIT.width)
      expect(height).toBeLessThanOrEqual(PORTRAIT.height)
    }
  })

  it('returns a source set per format, AVIF first, with the WebP as the fallback', async () => {
    const photo = await resolveBadgePhoto(fakePipeline(), PORTRAIT)

    expect(photo.sources).toEqual([
      {
        type: 'image/avif',
        srcSet:
          '/_astro/alex-lewin.212x577.avif 212w, /_astro/alex-lewin.318x866.avif 318w, /_astro/alex-lewin.424x1154.avif 424w',
      },
      {
        type: 'image/webp',
        srcSet:
          '/_astro/alex-lewin.212x577.webp 212w, /_astro/alex-lewin.318x866.webp 318w, /_astro/alex-lewin.424x1154.webp 424w',
      },
    ])
    expect(photo.src).toBe('/_astro/alex-lewin.424x1154.webp')
  })

  it('reports the column’s own size and how wide it is drawn', async () => {
    const photo = await resolveBadgePhoto(fakePipeline(), PORTRAIT)

    expect(photo).toMatchObject({ width: 424, height: 1154 })
    expect(photo.sizes).toContain('vw')
  })

  it('carries no image data itself: only addresses from the pipeline', async () => {
    const photo = await resolveBadgePhoto(fakePipeline(), PORTRAIT)

    expect(JSON.stringify(photo)).not.toContain('data:')
  })
})
