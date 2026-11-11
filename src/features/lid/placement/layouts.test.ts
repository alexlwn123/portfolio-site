import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { flattenStickers, isDecoration, linksOf } from '../stickerSpecs'
import { CONTROL_IDS, EMPLOYER_IDS, lidStickers, STICKER_IDS } from '../stickers'
import {
  ARTBOARDS,
  BLEED,
  FRAME,
  MAX_ARTBOARD_WIDTH_PX,
  PHONE_MAX_WIDTH_PX,
  WIDE_MIN_WIDTH_PX,
} from './artboards'
import { desktop } from './desktop'
import { lidPlacementCss } from './index'
import { phone } from './phone'
import { HIDDEN, type Placement } from './schema'
import { wide } from './wide'

const stickers = flattenStickers(lidStickers(content, stats))
const LAYOUTS = [
  ['wide', wide, ARTBOARDS.wide],
  ['desktop', desktop, ARTBOARDS.desktop],
  ['phone', phone, ARTBOARDS.phone],
] as const

/** How much of the wide artboard a 1440 by 900 laptop shows before any scrolling. */
const FIRST_SCREEN_UNITS = 620
/** What that first screen must hold: who he is, where he has worked and the headline counts. */
const FIRST_SCREEN = [
  'name',
  'hello',
  'cv',
  'wins-count',
  'organized-count',
  ...EMPLOYER_IDS,
] as const
/** The strap and the badge are drawn in a box this wide, hung from its middle. */
const HANG_WIDTH = 260

function placed(layout: Readonly<Record<string, Placement | typeof HIDDEN>>) {
  return Object.entries(layout).flatMap(([id, placement]) =>
    placement === HIDDEN ? [] : [{ id, ...placement }],
  )
}

function at(placement: Placement | typeof HIDDEN): Placement {
  if (placement === HIDDEN) {
    throw new Error('Expected a placed sticker')
  }
  return placement
}

describe('the lid’s artboards', () => {
  it('has three: wide for a laptop, the mockup’s for a tablet, and one for a phone', () => {
    expect(Object.keys(ARTBOARDS)).toEqual(['wide', 'desktop', 'phone'])
    expect(ARTBOARDS.wide.width).toBe(1100)
    expect(ARTBOARDS.desktop.width).toBe(728)
    expect(ARTBOARDS.phone.width).toBe(390)
  })

  it('changes arrangement at the two widths the sections change at', () => {
    expect(PHONE_MAX_WIDTH_PX).toBe(560)
    expect(WIDE_MIN_WIDTH_PX).toBe(1100)
    expect(MAX_ARTBOARD_WIDTH_PX).toBe(1920)
    expect(FRAME).toMatchObject({
      phoneMaxWidthPx: 560,
      wideMinWidthPx: 1100,
      maxArtboardWidthPx: 1920,
      wide: ARTBOARDS.wide,
      desktop: ARTBOARDS.desktop,
      phone: ARTBOARDS.phone,
    })
  })

  it('draws the wide artboard one unit to the pixel where it takes over', () => {
    expect(WIDE_MIN_WIDTH_PX).toBe(ARTBOARDS.wide.width)
  })

  it('makes the wide artboard landscape, and the other two portrait', () => {
    expect(ARTBOARDS.wide.height).toBeLessThan(ARTBOARDS.wide.width)
    expect(ARTBOARDS.desktop.height).toBeGreaterThan(ARTBOARDS.desktop.width)
    expect(ARTBOARDS.phone.height).toBeGreaterThan(ARTBOARDS.phone.width)
  })

  it('is looser on the wide artboard than on the mockup’s, but not by half', () => {
    const area = ({ width, height }: { width: number; height: number }): number => width * height
    const roomier = area(ARTBOARDS.wide) / area(ARTBOARDS.desktop)

    expect(roomier).toBeGreaterThan(1)
    expect(roomier).toBeLessThan(1.5)
  })
})

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

  it('hides nothing on the phone but pure decoration, and nothing at all on the other two', () => {
    const hidden = stickers.filter(({ id }) => phone[id] === HIDDEN)

    expect(hidden.map(({ id }) => id)).toEqual(['tally'])
    expect(hidden.every(isDecoration)).toBe(true)
    expect(placed(wide)).toHaveLength(STICKER_IDS.length)
    expect(placed(desktop)).toHaveLength(STICKER_IDS.length)
  })

  it.each(LAYOUTS)('placements stay inside the artboard: %s', (_, layout, artboard) => {
    const rise = 'rise' in artboard ? artboard.rise : BLEED

    for (const { id, x, y, w = 0 } of placed(layout)) {
      expect(x, id).toBeGreaterThanOrEqual(-BLEED)
      expect(x + w, id).toBeLessThanOrEqual(artboard.width + BLEED)
      expect(y, id).toBeGreaterThanOrEqual(-rise)
      expect(y, id).toBeLessThanOrEqual(artboard.height)
    }
  })

  it.each(LAYOUTS)('only what hangs starts above the bleed: %s', (_, layout) => {
    const high = placed(layout).filter(({ y }) => y < -BLEED)

    expect(high.every(({ id }) => id === 'lanyard' || id === 'badge')).toBe(true)
  })

  it.each(LAYOUTS)('places the medal and the compliance label with a width: %s', (_, layout) => {
    for (const id of ['ncr-win', 'patents'] as const) {
      expect(layout[id], id).not.toBe(HIDDEN)
      expect(layout[id], id).toMatchObject({ w: expect.any(Number) as unknown })
    }
    expect(layout.badge).not.toBe(HIDDEN)
  })

  it.each(LAYOUTS)('places the three buttons, on the layer under the badge: %s', (_, layout) => {
    for (const id of CONTROL_IDS) {
      expect(layout[id], id).not.toBe(HIDDEN)
      expect(layout[id], id).toMatchObject({ w: expect.any(Number) as unknown, z: 8 })
    }
  })

  it('gives a sticker a width on every layout or on none', () => {
    for (const { id, w } of [...placed(phone), ...placed(wide)]) {
      expect(w === undefined, id).toBe(desktop[id as keyof typeof desktop].w === undefined)
    }
  })

  it.each(LAYOUTS)('hangs the lanyard and the badge from the same point: %s', (_, layout) => {
    const { x, y, w } = at(layout.badge)

    expect(at(layout.lanyard)).toMatchObject({ x, y, w })
    expect(w).toBe(HANG_WIDTH)
  })

  it.each(LAYOUTS)(
    'keeps the badge on top of the stickers and the strap beneath them: %s',
    (_, layout) => {
      const layers = placed(layout).map(({ z }) => z)

      expect(at(layout.badge).z).toBe(Math.max(...layers))
      expect(at(layout.lanyard).z).toBeLessThan(at(layout.name).z)
    },
  )

  it.each(LAYOUTS)('lets an employer’s tag size itself: %s', (_, layout) => {
    for (const id of EMPLOYER_IDS) {
      expect(layout[id], id).not.toBe(HIDDEN)
      expect(at(layout[id]).w, id).toBeUndefined()
    }
  })
})

describe('the wide arrangement', () => {
  it('opens on the whole career: every sticker of the first screen starts inside it', () => {
    for (const id of FIRST_SCREEN) {
      expect(wide[id].y, id).toBeGreaterThanOrEqual(0)
      expect(wide[id].y, id).toBeLessThan(FIRST_SCREEN_UNITS)
    }
  })

  it('hangs the badge right of centre, from above the top edge', () => {
    const centre = wide.badge.x + HANG_WIDTH / 2

    expect(centre).toBeGreaterThan(ARTBOARDS.wide.width / 2)
    expect(centre + HANG_WIDTH / 2).toBeLessThanOrEqual(ARTBOARDS.wide.width)
    expect(wide.badge.y).toBeLessThan(0)
  })

  it('is hand-set, not the tablet’s arrangement stretched', () => {
    const moved = STICKER_IDS.filter((id) => wide[id].x !== desktop[id].x)

    expect(moved.length).toBeGreaterThan(STICKER_IDS.length / 2)
  })
})

describe('the narrower arrangements', () => {
  it.each([
    ['desktop', desktop],
    ['phone', phone],
  ] as const)('puts the employers near the top, above the first win: %s', (_, layout) => {
    for (const id of EMPLOYER_IDS) {
      expect(at(layout[id]).y, id).toBeLessThan(at(layout['latest-win']).y)
    }
  })
})

describe('lidPlacementCss', () => {
  const css = lidPlacementCss()

  it('compiles the three layouts into one stylesheet, a rule per sticker on each', () => {
    for (const id of STICKER_IDS) {
      expect(css.split(`[data-sticker="${id}"]{`), id).toHaveLength(4)
    }
  })

  it('slaps the buttons down last, and leaves every other sticker its turn', () => {
    const [desktopCss = ''] = css.split('@container')
    const step = (id: string): string | undefined =>
      new RegExp(`\\[data-sticker="${id}"\\]\\{[^}]*--i:(\\d+)`).exec(desktopCss)?.[1]

    expect(CONTROL_IDS.map(step)).toEqual(['20', '20', '20'])
    expect(step('name')).toBe('0')
    expect(step('more-elsewhere')).toBe('20')
    expect(step('elsewhere')).toBe('19')
  })

  it('opens two container queries: one for the phone and one for the wide artboard', () => {
    expect(css.match(/@container/g)).toHaveLength(2)
    expect(css).toContain(`@container lid (max-width:${String(FRAME.phoneMaxWidthPx)}px)`)
    expect(css).toContain(`@container lid (min-width:${String(FRAME.wideMinWidthPx)}px)`)
  })

  it('never caps or pads the lid itself: only the wide artboard stops growing', () => {
    expect(css).not.toContain('data-lid-desk')
    expect(css.match(/max-width:1920px/g)).toHaveLength(1)
  })
})
