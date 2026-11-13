import { describe, expect, it } from 'vitest'

import { HIDDEN } from './schema'
import { spreadPlan } from './spread'
import { toCss } from './toCss'

const FRAME = {
  containerName: 'lid',
  phoneMaxWidthPx: 560,
  wideMinWidthPx: 1100,
  maxArtboardWidthPx: 1440,
  portraitMaxAspect: '9/10',
  gutters: { wide: 50, desktop: 30, phone: 16 },
  wide: { width: 1100, height: 1080 },
  desktop: { width: 728, height: 1300 },
  phone: { width: 390, height: 1870 },
  covers: {
    wide: { board: 'wide', height: 620, floorPx: 10 },
    landscape: { board: 'desktop', height: 546, floorPx: 10 },
    portrait: { board: 'desktop', height: 880, floorPx: 10 },
    phone: { board: 'phone', height: 693, floorPx: 9.23 },
  },
} as const

const ORDER = ['name', 'pill', 'bolt'] as const

/** Drawn on the wide board: one on its left edge, one half way across, one beside the landing. */
const WIDE = {
  name: { x: 20, y: 18, w: 500, r: -3, z: 6 },
  pill: { x: 515, y: 700, r: 4, z: 3 },
  bolt: { x: 375, y: 90, w: 60, r: -12, z: 8 },
} as const

const BOARD = { width: 1100, gutter: 50, landing: { width: 280, height: 130 } } as const

const SPREAD = spreadPlan(WIDE, { spans: { pill: 70 }, underLanding: ['bolt'], board: BOARD })

const css = toCss(
  {
    order: ORDER,
    wide: WIDE,
    spread: SPREAD,
    desktop: {
      name: { x: 14, y: 30, w: 470, r: -4, z: 6 },
      pill: { x: 8, y: 770, r: -7, z: 3 },
      bolt: { x: 652, y: 1168, w: 50, r: -16, z: 8 },
    },
    phone: {
      name: { x: 6, y: 22, w: 344, r: -4, z: 6 },
      pill: { x: -6, y: 838.5, r: 0, z: 3 },
      bolt: HIDDEN,
    },
  },
  FRAME,
)

const PHONE_QUERY = '@container lid (max-width:560px)'
const WIDE_QUERY = '@container lid (min-width:1100px)'
const [desktopCss = '', afterDesktop = ''] = css.split(PHONE_QUERY)
const [phoneCss = '', wideCss = ''] = afterDesktop.split(WIDE_QUERY)

function rulesFor(sheet: string, id: string): readonly string[] {
  return sheet.split('\n').filter((line) => line.includes(`[data-sticker="${id}"]{`))
}

describe('toCss', () => {
  it('emits one rule per sticker on each of the three layouts', () => {
    for (const id of ORDER) {
      expect(rulesFor(desktopCss, id)).toHaveLength(1)
      expect(rulesFor(phoneCss, id)).toHaveLength(1)
      expect(rulesFor(wideCss, id)).toHaveLength(1)
    }
  })

  it('phone rules sit inside the phone’s container query', () => {
    expect(css.split(PHONE_QUERY)).toHaveLength(2)
    expect(phoneCss.trimStart().startsWith('{')).toBe(true)
    expect(phoneCss.trimEnd().endsWith('}')).toBe(true)
    expect(desktopCss).not.toContain('34.4em')
    expect(rulesFor(phoneCss, 'name')).toEqual([
      '[data-sticker="name"]{left:0.6em;top:2.2em;width:34.4em;rotate:-4deg;z-index:6}',
    ])
  })

  it('wide rules sit inside a container query of their own, which is the last', () => {
    expect(css.split(WIDE_QUERY)).toHaveLength(2)
    expect(css.match(/@container/g)).toHaveLength(2)
    expect(wideCss.trimStart().startsWith('{')).toBe(true)
    expect(css.trimEnd().endsWith('}')).toBe(true)
    expect(rulesFor(wideCss, 'name')).toHaveLength(1)
    expect(rulesFor(wideCss, 'bolt')).toHaveLength(1)
  })

  it('spreads the wide board’s stickers across the screen, each by its share of the room it has', () => {
    // On the column's left edge: it stands on the margin, at any width.
    expect(rulesFor(wideCss, 'name')).toEqual([
      '[data-sticker="name"]{left:3.2em;top:1.8em;width:50em;rotate:-3deg;z-index:6}',
    ])
    // Half way across its room: the screen between the margins, less its own width.
    expect(rulesFor(wideCss, 'pill')).toEqual([
      '[data-sticker="pill"]{left:calc(3.2em + 0.5 * (100cqw - 13.4em));top:70em;rotate:4deg;z-index:3}',
    ])
    // Beside the landing: its room ends at the landing, which hangs from the middle of the screen.
    expect(rulesFor(wideCss, 'bolt')).toEqual([
      '[data-sticker="bolt"]{left:calc(3.2em + 0.5 * (50cqw + 11.8em));top:9em;width:6em;rotate:-12deg;z-index:8}',
    ])
  })

  it('spreads nothing on a tablet or a phone: those boards are the width of the screen already', () => {
    expect(desktopCss).not.toContain('cqw -')
    expect(phoneCss).not.toContain('calc(3.2em')
  })

  it('writes placements in em, ten design units to the em', () => {
    expect(rulesFor(desktopCss, 'name')).toEqual([
      '[data-sticker="name"]{left:1.4em;top:3em;width:47em;rotate:-4deg;z-index:6}',
    ])
  })

  it('leaves the width to the sticker when its placement has none', () => {
    expect(rulesFor(desktopCss, 'pill')).toEqual([
      '[data-sticker="pill"]{left:0.8em;top:77em;rotate:-7deg;z-index:3}',
    ])
    expect(rulesFor(phoneCss, 'pill')).toEqual([
      '[data-sticker="pill"]{left:-0.6em;top:83.85em;rotate:0deg;z-index:3}',
    ])
    expect(rulesFor(wideCss, 'pill').join('')).not.toContain('width:')
  })

  it('takes a sticker hidden on the phone out of the page, whatever its own styles say', () => {
    expect(rulesFor(phoneCss, 'bolt')).toEqual([
      '[data-lid-stage] [data-sticker="bolt"]{display:none}',
    ])
  })

  it('makes the lid a named container, as wide as whatever holds it', () => {
    expect(desktopCss).toContain('[data-lid]{container:lid / inline-size}')
    expect(css).not.toContain('data-lid-desk')
    expect(css).not.toContain('--lid-max-width')
  })

  it('sizes the pile from the artboards: one em is ten units at any width', () => {
    expect(desktopCss).toContain('[data-lid-pile]{font-size:calc(100cqw / 72.8);height:130em}')
    expect(phoneCss).toContain('[data-lid-pile]{font-size:calc(100cqw / 39);height:187em}')
    expect(css).not.toContain('[data-lid-stage]{')
  })

  it('stops the wide board’s unit growing where the sections’ stops, and leaves the pile the width of the lid', () => {
    expect(wideCss).toContain(
      '[data-lid-pile]{font-size:min(calc(100cqw / 110),calc(1440px / 110));height:108em}',
    )
    // The stickers go on spreading past that width: the pile is not held to it.
    expect(css).not.toContain('max-width:1440px')
    expect(css).not.toContain('margin-inline')
  })

  it('is a plain stylesheet: no markup and no style attributes', () => {
    expect(css).not.toMatch(/<|style=/)
  })

  it('says where a sticker is and nothing of when it lands: the page’s script gives each its turn', () => {
    expect(css).not.toContain('--i')
    expect(css).not.toMatch(/animation|delay/)
  })

  it('gives one sticker a rule of its own', () => {
    const name = { name: { x: 0, y: 0, r: 0, z: 1 } }
    const spread = spreadPlan(name, { spans: { name: 100 }, underLanding: [], board: BOARD })
    const single = toCss({ order: ['name'], wide: name, spread, desktop: name, phone: name }, FRAME)

    expect(single).toContain('[data-sticker="name"]{left:0em;top:0em;rotate:0deg;z-index:1}')
  })

  it('fails loudly when a sticker of the wide board has no place in the spread', () => {
    const place = {
      name: { x: 0, y: 0, w: 10, r: 0, z: 1 },
      pill: { x: 0, y: 0, w: 10, r: 0, z: 1 },
    }
    const spread = spreadPlan({ name: place.name }, { spans: {}, underLanding: [], board: BOARD })
    const layouts = { order: ['name', 'pill'], wide: place, spread, desktop: place, phone: place }

    expect(() => toCss(layouts, FRAME)).toThrow(/pill/)
  })

  it.each(['wide', 'desktop', 'phone'] as const)(
    'fails loudly when a sticker in the order has no placement: %s',
    (missing) => {
      const place = { name: { x: 0, y: 0, r: 0, z: 1 }, pill: { x: 0, y: 0, r: 0, z: 1 } }
      const spread = spreadPlan(place, {
        spans: { name: 100, pill: 100 },
        underLanding: [],
        board: BOARD,
      })
      const broken = { order: ['name', 'pill'], wide: place, spread, desktop: place, phone: place }

      expect(() => toCss({ ...broken, [missing]: { name: place.name } }, FRAME)).toThrow(/pill/)
    },
  )
})
