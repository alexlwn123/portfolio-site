import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { flattenStickers, isDecoration, linksOf } from '../stickerSpecs'
import { lidStickers, STICKER_IDS } from '../stickers'
import { ARTBOARDS, BLEED, FRAME, MAX_WIDTH_PX } from './artboards'
import { desktop } from './desktop'
import { lidPlacementCss } from './index'
import { phone } from './phone'
import { HIDDEN, type Placement } from './schema'

const stickers = flattenStickers(lidStickers(content, stats))
const LAYOUTS = [
  ['desktop', desktop, ARTBOARDS.desktop],
  ['phone', phone, ARTBOARDS.phone],
] as const

function placed(layout: Readonly<Record<string, Placement | typeof HIDDEN>>) {
  return Object.entries(layout).flatMap(([id, placement]) =>
    placement === HIDDEN ? [] : [{ id, ...placement }],
  )
}

describe('the lid’s placements', () => {
  it.each(LAYOUTS)('every sticker is placed on every layout: %s', (_, layout) => {
    expect(Object.keys(layout).toSorted()).toEqual([...STICKER_IDS].toSorted())
  })

  it('link stickers are never hidden', () => {
    const links = stickers.filter((spec) => linksOf(spec).length > 0)

    expect(links.length).toBeGreaterThan(0)
    for (const { id } of links) {
      expect(phone[id], id).not.toBe(HIDDEN)
    }
  })

  it('hides nothing on the phone but pure decoration', () => {
    const hidden = stickers.filter(({ id }) => phone[id] === HIDDEN)

    expect(hidden.map(({ id }) => id)).toEqual(['tally'])
    expect(hidden.every(isDecoration)).toBe(true)
  })

  it.each(LAYOUTS)('placements stay inside the artboard: %s', (_, layout, artboard) => {
    for (const { id, x, y, w = 0 } of placed(layout)) {
      expect(x, id).toBeGreaterThanOrEqual(-BLEED)
      expect(x + w, id).toBeLessThanOrEqual(artboard.width + BLEED)
      expect(y, id).toBeGreaterThanOrEqual(-BLEED)
      expect(y, id).toBeLessThanOrEqual(artboard.height)
    }
  })

  it('gives a sticker a width on both layouts or on neither', () => {
    for (const { id, w } of placed(phone)) {
      expect(w === undefined, id).toBe(desktop[id as keyof typeof desktop].w === undefined)
    }
  })

  it('hangs the lanyard and the badge from the same point', () => {
    expect(desktop.lanyard).toMatchObject({ x: desktop.badge.x, y: desktop.badge.y })
    expect(phone.lanyard).toMatchObject(anchor(phone.badge))
  })

  it('keeps the badge on top of the stickers and the strap beneath them', () => {
    const layers = placed(desktop).map(({ z }) => z)

    expect(desktop.badge.z).toBe(Math.max(...layers))
    expect(desktop.lanyard.z).toBeLessThan(desktop.name.z)
  })

  it('caps the lid at about 1000px, so a laptop shows the approved density', () => {
    expect(MAX_WIDTH_PX).toBeGreaterThanOrEqual(960)
    expect(MAX_WIDTH_PX).toBeLessThanOrEqual(1040)
    expect(FRAME.phoneMaxWidthPx).toBeLessThan(ARTBOARDS.desktop.width)
  })
})

function anchor(placement: Placement | typeof HIDDEN): { x: number; y: number } {
  if (placement === HIDDEN) {
    throw new Error('The badge is never hidden')
  }
  return { x: placement.x, y: placement.y }
}

describe('lidPlacementCss', () => {
  const css = lidPlacementCss()

  it('compiles both layouts into one stylesheet, a rule per sticker', () => {
    for (const id of STICKER_IDS) {
      expect(css.split(`[data-sticker="${id}"]{`), id).toHaveLength(3)
    }
  })

  it('opens exactly one container query, for the phone', () => {
    expect(css.match(/@container/g)).toHaveLength(1)
    expect(css).toContain(`@container lid (max-width:${String(FRAME.phoneMaxWidthPx)}px)`)
  })
})
