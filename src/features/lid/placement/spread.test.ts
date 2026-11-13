import { describe, expect, it } from 'vitest'

import { PILE_IDS, type PileId } from '../stickers'
import { ARTBOARDS, COLUMNS, columnWidth, LANDINGS, MAX_ARTBOARD_WIDTH_PX } from './artboards'
import {
  leftAt,
  SPREAD_MARGIN,
  spreadPlan,
  UNDER_THE_LANDING,
  WIDE_SPANS,
  wideSpread,
} from './spread'
import { wide } from './wide'

/** The wide board as it was drawn: 1100 units across. */
const DRAWN = ARTBOARDS.wide.width
/** How many units across a window is, once the page's unit has stopped growing. */
const unitsAcross = (px: number): number => (px / MAX_ARTBOARD_WIDTH_PX) * DRAWN
/** Windows wider than the page's unit grows for: a large laptop, a desktop, an ultrawide. */
const WIDER = [1728, 1920, 2560, 3440].map(unitsAcross)
const EVERY_WIDTH = [DRAWN, ...WIDER]

const widthOf = (id: PileId): number => wideSpread.stickers[id]?.width ?? 0
const rightAt = (id: PileId, across: number): number => leftAt(wideSpread, id, across) + widthOf(id)

describe('WIDE_SPANS', () => {
  it('has a width for every sticker of the wide board that sizes itself, and for no other', () => {
    const selfSized = PILE_IDS.filter((id) => wide[id].w === undefined)

    expect(Object.keys(WIDE_SPANS).toSorted()).toEqual([...selfSized].toSorted())
    for (const span of Object.values(WIDE_SPANS)) {
      expect(span).toBeGreaterThan(0)
    }
  })
})

describe('wideSpread', () => {
  it('plans every sticker of the pile, each at the width it draws', () => {
    expect(Object.keys(wideSpread.stickers).toSorted()).toEqual([...PILE_IDS].toSorted())
    expect(widthOf('cv')).toBe(wide.cv.w)
    expect(widthOf('pile-title')).toBe(WIDE_SPANS['pile-title'])
  })

  it('gives each a share of the way across, from none on the left edge to all of it on the right', () => {
    for (const { share } of Object.values(wideSpread.stickers)) {
      expect(share).toBeGreaterThanOrEqual(0)
      expect(share).toBeLessThanOrEqual(1)
    }
    // Flush with the column's left edge, and flush with its right.
    expect(wideSpread.stickers['pile-title']?.share).toBe(0)
    expect(wideSpread.stickers.workshop?.share).toBe(0)
    expect(wideSpread.stickers['organized-count']?.share).toBe(1)
    // Drawn hanging over an edge of the column: it stops at the margin like the rest.
    expect(wideSpread.stickers.elsewhere?.share).toBe(0)
    expect(wideSpread.stickers['more-elsewhere']?.share).toBe(1)
  })

  it.each(EVERY_WIDTH)(
    'keeps every sticker on the screen, inside the margin, at %d units',
    (across) => {
      for (const id of PILE_IDS) {
        expect(leftAt(wideSpread, id, across), id).toBeGreaterThanOrEqual(SPREAD_MARGIN - 0.01)
        expect(rightAt(id, across), id).toBeLessThanOrEqual(across - SPREAD_MARGIN + 0.01)
      }
    },
  )

  it.each(EVERY_WIDTH)('reaches the margin on both sides of the screen at %d units', (across) => {
    const lefts = PILE_IDS.map((id) => leftAt(wideSpread, id, across))
    const rights = PILE_IDS.map((id) => rightAt(id, across))

    expect(Math.min(...lefts)).toBeCloseTo(SPREAD_MARGIN, 1)
    expect(Math.max(...rights)).toBeCloseTo(across - SPREAD_MARGIN, 1)
  })

  it('moves nothing far from where it was drawn, at the width it was drawn for', () => {
    const gutter = COLUMNS.wide.gutter
    // The margin is narrower than the column's gutter, and no sticker moves further than the difference.
    const most = gutter - SPREAD_MARGIN + 1

    for (const id of PILE_IDS) {
      const drawn = Math.min(Math.max(wide[id].x, gutter), DRAWN - gutter - widthOf(id))
      expect(Math.abs(leftAt(wideSpread, id, DRAWN) - drawn), id).toBeLessThanOrEqual(most)
    }
  })

  it('spreads the pile out as the screen widens, and never draws it in', () => {
    for (const id of PILE_IDS) {
      const lefts = EVERY_WIDTH.map((across) => leftAt(wideSpread, id, across))
      expect(lefts, id).toEqual(lefts.toSorted((one, other) => one - other))
    }
    // The stickers on the right go further than those on the left.
    const far = unitsAcross(1920)
    expect(
      leftAt(wideSpread, 'latest-win', far) - leftAt(wideSpread, 'latest-win', DRAWN),
    ).toBeGreaterThan(leftAt(wideSpread, 'cv', far) - leftAt(wideSpread, 'cv', DRAWN))
  })
})

describe('the place the ribbons land', () => {
  const landing = LANDINGS.wide
  /** The landing's left edge: it hangs from the column's right edge, wherever the column is. */
  const landingLeft = (across: number): number =>
    across / 2 + columnWidth('wide') / 2 - landing.width

  it('stops the stickers beside it short of it, at any width', () => {
    expect(UNDER_THE_LANDING.length).toBeGreaterThan(0)
    for (const id of UNDER_THE_LANDING) {
      expect(wideSpread.stickers[id]?.stop).toBe('landing')
      for (const across of [...EVERY_WIDTH, unitsAcross(5120)]) {
        expect(rightAt(id, across), id).toBeLessThanOrEqual(landingLeft(across))
      }
    }
  })

  it('is reached by no other sticker that starts above its foot, however wide the screen', () => {
    const above = PILE_IDS.filter((id) => wide[id].y < landing.height)
    const free = above.filter((id) => !UNDER_THE_LANDING.includes(id))

    expect(above.length).toBeGreaterThan(UNDER_THE_LANDING.length)
    for (const id of free) {
      expect(wideSpread.stickers[id]?.stop).toBe('edge')
      for (const across of [...EVERY_WIDTH, unitsAcross(5120)]) {
        expect(rightAt(id, across), id).toBeLessThanOrEqual(landingLeft(across))
      }
    }
  })
})

describe('spreadPlan', () => {
  const board = { width: 1100, gutter: 50, landing: { width: 280, height: 130 } }

  it('shares a sticker out by how far across the free room it was drawn', () => {
    const plan = spreadPlan(
      { half: { x: 450, y: 300, w: 200, r: 0, z: 1 } },
      { spans: {}, underLanding: [], board },
    )

    // The column leaves 800 units free beside a sticker 200 wide, and it was drawn 400 into them.
    expect(plan.stickers.half).toEqual({ share: 0.5, width: 200, stop: 'edge' })
    expect(leftAt(plan, 'half', 1100)).toBeCloseTo(
      SPREAD_MARGIN + (1100 - 2 * SPREAD_MARGIN - 200) / 2,
    )
  })

  it('takes a self-sizing sticker’s width from the spans', () => {
    const plan = spreadPlan(
      { pill: { x: 50, y: 300, r: 0, z: 1 } },
      { spans: { pill: 80 }, underLanding: [], board },
    )

    expect(plan.stickers.pill).toEqual({ share: 0, width: 80, stop: 'edge' })
  })

  it('refuses a sticker with no width to go by', () => {
    expect(() =>
      spreadPlan({ pill: { x: 50, y: 300, r: 0, z: 1 } }, { spans: {}, underLanding: [], board }),
    ).toThrow(/pill/)
  })

  it('throws when asked where a sticker it never planned is', () => {
    const plan = spreadPlan({}, { spans: {}, underLanding: [], board })

    expect(() => leftAt(plan, 'missing', 1100)).toThrow(/missing/)
  })
})
