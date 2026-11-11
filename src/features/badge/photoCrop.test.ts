import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  ARTBOARDS,
  COVERS,
  PHONE_MAX_WIDTH_PX,
  UNITS_PER_EM,
  WIDE_MIN_WIDTH_PX,
} from '../lid/placement/artboards'
import { BADGE_CROP, columnPlacement, columnWidth, PHOTO_SIZES } from './photoCrop'

const PORTRAIT = { width: 946, height: 1154 }
const FRAME_WIDTH_EM = 21.5

const css = readFileSync(resolve(import.meta.dirname, 'BadgePhoto.module.css'), 'utf8')

describe('the badge photo’s crop', () => {
  it('keeps the frame’s own shape: 1 to 0.72', () => {
    expect(BADGE_CROP.height / BADGE_CROP.width).toBeCloseTo(0.72)
  })

  it('trims the portrait to the narrowest centred column that holds the crop', () => {
    const column = columnWidth(PORTRAIT, BADGE_CROP)
    const left = (PORTRAIT.width - column) / 2

    expect(column).toBe(424)
    expect(left).toBeLessThanOrEqual(BADGE_CROP.x)
    expect(left + column).toBeGreaterThanOrEqual(BADGE_CROP.x + BADGE_CROP.width)
  })

  it('handles a crop that sits left of centre', () => {
    expect(
      columnWidth({ width: 1000, height: 500 }, { x: 100, y: 0, width: 300, height: 200 }),
    ).toBe(800)
  })

  it('slides the column behind the frame by the amounts the stylesheet uses', () => {
    const { left, top, width } = columnPlacement(PORTRAIT, BADGE_CROP)

    expect({ left, top, width }).toEqual({ left: '-0.95%', top: '-106.22%', width: '100.95%' })
    expect(css).toContain(`left: ${left};`)
    expect(css).toContain(`top: ${top};`)
    expect(css).toContain(`width: ${width};`)
  })

  it('tells the browser how wide the photo is drawn on each artboard', () => {
    const share = (artboard: { width: number }): number =>
      Math.ceil((FRAME_WIDTH_EM * UNITS_PER_EM * 100) / artboard.width)

    // The badge is on the cover, whose unit stops growing at a cap of its own.
    const capped = Math.ceil(COVERS.wide.capPx * FRAME_WIDTH_EM)

    expect(PHOTO_SIZES).toBe(
      `(max-width: ${String(PHONE_MAX_WIDTH_PX)}px) ${String(share(ARTBOARDS.phone))}vw, ` +
        `(max-width: ${String(WIDE_MIN_WIDTH_PX - 1)}px) ${String(share(ARTBOARDS.desktop))}vw, ` +
        `min(${String(share(ARTBOARDS.wide))}vw, ${String(capped)}px)`,
    )
  })
})
