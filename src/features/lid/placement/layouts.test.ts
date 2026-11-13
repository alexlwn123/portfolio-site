import { describe, expect, it } from 'vitest'

import { content, stats } from '../../../content'
import { flattenStickers, isDecoration, linksOf } from '../stickerSpecs'
import {
  CONTROL_IDS,
  COVER_IDS,
  EMPLOYER_IDS,
  lidStickers,
  PILE_IDS,
  STICKER_IDS,
} from '../stickers'
import {
  ARTBOARDS,
  BLEED,
  COLUMNS,
  columnWidth,
  COVERS,
  FRAME,
  LANDINGS,
  MAX_ARTBOARD_WIDTH_PX,
  NARROW_PHONE_PX,
  PHONE_MAX_WIDTH_PX,
  UNITS_PER_EM,
  WIDE_MIN_WIDTH_PX,
} from './artboards'
import { covers } from './cover'
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
const COVER_NAMES = ['wide', 'landscape', 'portrait', 'phone'] as const

/** The strap and the badge are drawn in a box this wide, hung from its middle. */
const HANG_WIDTH = 260
/** The card is this much narrower than its box on each side. */
const CARD_INSET = 12
/** What the pile leads with: where he has worked, and the two counts. */
const LEADS = [...EMPLOYER_IDS, 'wins-count', 'organized-count'] as const
const PROJECTS = ['last-pay-wins', 'arion-parking', 'clawthing-store', 'pleb-fm'] as const
const LINK_BANDS = ['elsewhere', 'more-elsewhere'] as const
/** How many stickers of a pile may hang over an edge of the column. */
const MAY_HANG_OVER = 4
/** No sticker that sizes itself is wider than this, in units. */
const WIDEST_SELF_SIZED = 380

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
  it('has three for the pile: wide for a laptop, the mockup’s for a tablet, and one for a phone', () => {
    expect(Object.keys(ARTBOARDS)).toEqual(['wide', 'desktop', 'phone'])
    expect(ARTBOARDS.wide.width).toBe(1100)
    expect(ARTBOARDS.desktop.width).toBe(728)
    expect(ARTBOARDS.phone.width).toBe(390)
  })

  it('changes arrangement at the two widths the sections change at, and stops growing where they do', () => {
    expect(PHONE_MAX_WIDTH_PX).toBe(560)
    expect(WIDE_MIN_WIDTH_PX).toBe(1100)
    expect(MAX_ARTBOARD_WIDTH_PX).toBe(1440)
    expect(FRAME).toMatchObject({
      phoneMaxWidthPx: 560,
      wideMinWidthPx: 1100,
      maxArtboardWidthPx: 1440,
      wide: ARTBOARDS.wide,
      desktop: ARTBOARDS.desktop,
      phone: ARTBOARDS.phone,
      covers: COVERS,
    })
  })

  it('sets everything in the sections’ column: 1000 units of 1100, with gutters of 30 and 16 below that', () => {
    expect(COLUMNS).toEqual({
      wide: { gutter: 50 },
      desktop: { gutter: 30 },
      phone: { gutter: 16 },
    })
    expect(columnWidth('wide')).toBe(1000)
    expect(columnWidth('desktop')).toBe(668)
    expect(columnWidth('phone')).toBe(358)
    expect(FRAME.gutters).toEqual({ wide: 50, desktop: 30, phone: 16 })
  })

  it('draws the wide artboard one unit to the pixel where it takes over', () => {
    expect(WIDE_MIN_WIDTH_PX).toBe(ARTBOARDS.wide.width)
  })

  it('makes the wide pile landscape, and the other two portrait', () => {
    expect(ARTBOARDS.wide.height).toBeLessThan(ARTBOARDS.wide.width)
    expect(ARTBOARDS.desktop.height).toBeGreaterThan(ARTBOARDS.desktop.width)
    expect(ARTBOARDS.phone.height).toBeGreaterThan(ARTBOARDS.phone.width)
  })
})

describe('the cover’s compositions', () => {
  it('has four: a laptop’s, a tablet’s on its side and upright, and a phone’s', () => {
    expect(Object.keys(COVERS)).toEqual(['wide', 'landscape', 'portrait', 'phone'])
    expect(Object.keys(covers)).toEqual(Object.keys(COVERS))
    expect(COVERS.wide.board).toBe('wide')
    expect(COVERS.landscape.board).toBe('desktop')
    expect(COVERS.portrait.board).toBe('desktop')
    expect(COVERS.phone.board).toBe('phone')
  })

  it('holds the name, the hello tag, the badge on its lanyard and the two ways on, and nothing else', () => {
    expect(COVER_IDS).toEqual(['name', 'lanyard', 'badge', 'hello', 'contact', 'cue'])
    for (const name of COVER_NAMES) {
      expect(Object.keys(covers[name]).toSorted(), name).toEqual([...COVER_IDS].toSorted())
    }
  })

  it('is drawn for a 16:9 laptop, a 4:3 tablet and a 360 by 640 phone at full size', () => {
    const shape = (name: (typeof COVER_NAMES)[number]): number =>
      ARTBOARDS[COVERS[name].board].width / COVERS[name].height

    expect(shape('wide')).toBeCloseTo(16 / 9, 1)
    expect(shape('landscape')).toBeCloseTo(4 / 3, 2)
    expect(shape('portrait')).toBeLessThan(0.9)
    expect(COVERS.phone.height).toBe(Math.floor((640 * ARTBOARDS.phone.width) / NARROW_PHONE_PX))
  })

  it('never shrinks its type below what the narrowest phone and the narrowest laptop show', () => {
    expect(COVERS.wide.floorPx).toBe(WIDE_MIN_WIDTH_PX / (ARTBOARDS.wide.width / UNITS_PER_EM))
    expect(COVERS.phone.floorPx).toBeCloseTo(
      NARROW_PHONE_PX / (ARTBOARDS.phone.width / UNITS_PER_EM),
    )
  })

  it('lets the laptop’s unit grow a tenth past the page’s own, and no further', () => {
    const pageUnit = MAX_ARTBOARD_WIDTH_PX / (ARTBOARDS.wide.width / UNITS_PER_EM)

    expect(COVERS.wide.capPx / pageUnit).toBeCloseTo(1.1)
    expect(COVERS.landscape).not.toHaveProperty('capPx')
  })

  it.each(COVER_NAMES)('starts the name on the column’s left edge: %s', (name) => {
    const { from, x } = covers[name].name

    expect(from).toBe('left')
    expect(Math.abs(x)).toBeLessThanOrEqual(8)
  })

  it('makes the name the hero on a laptop: 55 to 60 percent of the column', () => {
    const share = (covers.wide.name.w ?? 0) / columnWidth('wide')

    expect(share).toBeGreaterThanOrEqual(0.55)
    expect(share).toBeLessThanOrEqual(0.6)
  })

  it.each(['portrait', 'phone'] as const)(
    'runs the name across the column on an upright screen: %s',
    (name) => {
      const share = (covers[name].name.w ?? 0) / columnWidth(COVERS[name].board)

      expect(share).toBeGreaterThan(0.9)
    },
  )

  it.each(COVER_NAMES)(
    'hangs the lanyard and the badge from one point at the top, with the card’s edge on the column’s right: %s',
    (name) => {
      const { from, against, x, y, w } = covers[name].badge

      expect(covers[name].lanyard).toMatchObject({ from, against, x, y, w })
      expect([from, against]).toEqual(['right', 'top'])
      expect(w).toBe(HANG_WIDTH)
      expect(x).toBe(-CARD_INSET)
    },
  )

  it.each(COVER_NAMES)('keeps the badge on top and the strap beneath the name: %s', (name) => {
    const layers = Object.values(covers[name]).map(({ z }) => z)

    expect(covers[name].badge.z).toBe(Math.max(...layers))
    expect(covers[name].lanyard.z).toBeLessThan(covers[name].name.z)
  })

  it.each(['wide', 'landscape'] as const)(
    'sets the name and the hello tag about the middle of the screen, the hello under the name: %s',
    (name) => {
      const { name: lettering, hello } = covers[name]

      expect(lettering.against).toBe('middle')
      expect(hello.against).toBe('middle')
      expect(lettering.y).toBeLessThan(0)
      expect(hello.y).toBeGreaterThan(0)
    },
  )

  it.each(COVER_NAMES)('writes the cue at the foot of the screen, on the bare lid: %s', (name) => {
    expect(covers[name].cue.against).toBe('bottom')
    expect(covers[name].cue.z).toBeLessThan(covers[name].hello.z)
  })

  it.each(COVER_NAMES)(
    'writes the way to the contact section under the hello tag, on the bare lid, and moves with it: %s',
    (name) => {
      const { contact, hello } = covers[name]

      expect(contact.from).toBe(hello.from)
      expect(contact.against).toBe(hello.against)
      expect(contact.y).toBeGreaterThan(hello.y)
      expect(contact.z).toBeLessThan(hello.z)
    },
  )
})

describe('the pile’s placements', () => {
  it.each(LAYOUTS)('every sticker of the pile is placed on every layout: %s', (_, layout) => {
    expect(Object.keys(layout).toSorted()).toEqual([...PILE_IDS].toSorted())
  })

  it('link stickers are never hidden', () => {
    const links = stickers.filter(
      (spec) => linksOf(spec).length > 0 && PILE_IDS.some((id) => id === spec.id),
    )

    expect(links.length).toBeGreaterThan(0)
    for (const { id } of links) {
      expect(phone[id as keyof typeof phone], id).not.toBe(HIDDEN)
    }
  })

  it('hides nothing on the phone but pure decoration, and nothing at all on the other two', () => {
    const hidden = stickers.filter(({ id }) => phone[id as keyof typeof phone] === HIDDEN)

    expect(hidden.map(({ id }) => id)).toEqual(['tally'])
    expect(hidden.every(isDecoration)).toBe(true)
    expect(placed(wide)).toHaveLength(PILE_IDS.length)
    expect(placed(desktop)).toHaveLength(PILE_IDS.length)
  })

  it.each(LAYOUTS)('placements stay inside the artboard: %s', (_, layout, artboard) => {
    for (const { id, x, y, w = 0 } of placed(layout)) {
      expect(x, id).toBeGreaterThanOrEqual(-BLEED)
      expect(x + w, id).toBeLessThanOrEqual(artboard.width + BLEED)
      expect(y, id).toBeGreaterThanOrEqual(-BLEED)
      expect(y, id).toBeLessThanOrEqual(artboard.height)
    }
  })

  it.each(LAYOUTS)(
    'puts the heading on the column’s left edge, above all else: %s',
    (name, layout) => {
      const title = at(layout['pile-title'])
      const others = placed(layout).filter(({ id }) => id !== 'pile-title')

      expect(title.x).toBe(COLUMNS[name].gutter)
      expect(at(layout['pile-kicker']).y).toBeGreaterThan(title.y)
      expect(Math.min(...others.map(({ y }) => y))).toBeGreaterThanOrEqual(title.y - BLEED)
    },
  )

  it.each(LAYOUTS)(
    'leads with the employers and the two counts, above every project: %s',
    (_, layout, artboard) => {
      const firstProject = Math.min(...PROJECTS.map((id) => at(layout[id]).y))

      for (const id of LEADS) {
        expect(at(layout[id]).y, id).toBeLessThan(firstProject)
        expect(at(layout[id]).y, id).toBeLessThan(artboard.height / 2)
      }
    },
  )

  it.each(LAYOUTS)('ends with the links, under everything there is to read: %s', (_, layout) => {
    const bands = LINK_BANDS.map((id) => at(layout[id]).y)
    const rest = placed(layout).filter(({ id }) => !LINK_BANDS.some((band) => band === id))

    expect(Math.min(...bands)).toBeGreaterThan(Math.max(...rest.map(({ y }) => y)))
  })

  it.each(LAYOUTS)(
    'keeps its mass in the column: only a few stickers hang over an edge: %s',
    (name, layout, artboard) => {
      const { gutter } = COLUMNS[name]
      const over = placed(layout).filter(
        ({ x, w = 0 }) => x < gutter - 1 || x + w > artboard.width - gutter + 1,
      )

      expect(over.length).toBeLessThanOrEqual(MAY_HANG_OVER)
      // The two bands of links are what hangs: one off each side.
      expect(over.map(({ id }) => id)).toEqual(expect.arrayContaining([...LINK_BANDS]))
    },
  )

  it.each(['wide', 'desktop'] as const)(
    'keeps the corner under the badge bare, for the ribbons to land on: %s',
    (name) => {
      const layout = name === 'wide' ? wide : desktop
      const landing = LANDINGS[name]
      const left = ARTBOARDS[name].width - COLUMNS[name].gutter - landing.width
      const high = placed(layout).filter(({ y }) => y < landing.height)

      expect(high.length).toBeGreaterThan(0)
      for (const { id, x, w = WIDEST_SELF_SIZED } of high) {
        // A sticker that sizes itself is never wider than the heading, the widest of them.
        const right = id === 'pile-title' ? x + WIDEST_SELF_SIZED : x + Math.min(w, 220)
        expect(right, id).toBeLessThanOrEqual(left)
      }
    },
  )

  it('makes the phone’s pile wait under the ribbons instead, since the badge is most of its width', () => {
    expect(COVERS.phone.trail).toBeGreaterThan(COVERS.phone.height)
    expect(COVERS.wide).not.toHaveProperty('trail')
    expect(COVERS.landscape).not.toHaveProperty('trail')
    expect(COVERS.portrait).not.toHaveProperty('trail')
    expect(LANDINGS).not.toHaveProperty('phone')
  })

  it.each(LAYOUTS)('places the medal and the compliance label with a width: %s', (_, layout) => {
    for (const id of ['ncr-win', 'patents'] as const) {
      expect(layout[id], id).not.toBe(HIDDEN)
      expect(layout[id], id).toMatchObject({ w: expect.any(Number) as unknown })
    }
  })

  it.each(LAYOUTS)('places the three buttons, on a layer above the stickers: %s', (_, layout) => {
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

  it.each(LAYOUTS)('lets an employer’s tag and the heading size themselves: %s', (_, layout) => {
    for (const id of [...EMPLOYER_IDS, 'pile-title'] as const) {
      expect(layout[id], id).not.toBe(HIDDEN)
      expect(at(layout[id]).w, id).toBeUndefined()
    }
  })

  it('is hand-set on the laptop, not the tablet’s arrangement stretched', () => {
    const moved = PILE_IDS.filter((id) => wide[id].x !== desktop[id].x)

    expect(moved.length).toBeGreaterThan(PILE_IDS.length / 2)
  })
})

describe('lidPlacementCss', () => {
  const css = lidPlacementCss()

  it('compiles every arrangement into one stylesheet: three rules for a sticker of the pile, four for one of the cover', () => {
    for (const id of PILE_IDS) {
      expect(css.split(`[data-sticker="${id}"]{`), id).toHaveLength(4)
    }
    for (const id of COVER_IDS) {
      expect(css.split(`[data-sticker="${id}"]{`), id).toHaveLength(5)
    }
    expect(STICKER_IDS).toEqual([...COVER_IDS, ...PILE_IDS])
  })

  it('opens the pile’s two container queries and then the cover’s three', () => {
    expect(css.match(/@container/g)).toHaveLength(5)
    expect(css).toContain(`@container lid (max-width:${String(FRAME.phoneMaxWidthPx)}px)`)
    expect(css).toContain(`@container lid (min-width:${String(FRAME.wideMinWidthPx)}px)`)
    expect(css.match(/\[data-lid\]\{container:lid \/ inline-size\}/g)).toHaveLength(1)
  })

  it('never caps or pads the lid itself: only the wide pile and the cover’s column stop growing', () => {
    expect(css).not.toContain('data-lid-desk')
    expect(css.match(/max-width:1440px/g)).toHaveLength(1)
    expect(css).not.toContain('1920')
  })
})
