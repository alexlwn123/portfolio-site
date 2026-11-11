import { describe, expect, it } from 'vitest'

import { HIDDEN } from './schema'
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

const css = toCss(
  {
    order: ORDER,
    wide: {
      name: { x: 20, y: 18, w: 500, r: -3, z: 6 },
      pill: { x: 40, y: 700, r: 4, z: 3 },
      bolt: { x: 1012, y: 990, w: 60, r: -12, z: 8 },
    },
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
    expect(rulesFor(wideCss, 'name')).toEqual([
      '[data-sticker="name"]{left:2em;top:1.8em;width:50em;rotate:-3deg;z-index:6}',
    ])
    expect(rulesFor(wideCss, 'bolt')).toEqual([
      '[data-sticker="bolt"]{left:101.2em;top:99em;width:6em;rotate:-12deg;z-index:8}',
    ])
  })

  it('writes placements in em, ten design units to the em', () => {
    expect(rulesFor(desktopCss, 'name')).toEqual([
      '[data-sticker="name"]{left:1.4em;top:3em;width:47em;rotate:-4deg;z-index:6;--i:0}',
    ])
  })

  it('leaves the width to the sticker when its placement has none', () => {
    expect(rulesFor(desktopCss, 'pill')).toEqual([
      '[data-sticker="pill"]{left:0.8em;top:77em;rotate:-7deg;z-index:3;--i:10}',
    ])
    expect(rulesFor(phoneCss, 'pill')).toEqual([
      '[data-sticker="pill"]{left:-0.6em;top:83.85em;rotate:0deg;z-index:3}',
    ])
    expect(rulesFor(wideCss, 'pill')).toEqual([
      '[data-sticker="pill"]{left:4em;top:70em;rotate:4deg;z-index:3}',
    ])
  })

  it('takes a sticker hidden on the phone out of the page, whatever its own styles say', () => {
    expect(rulesFor(phoneCss, 'bolt')).toEqual([
      '[data-lid-stage] [data-sticker="bolt"]{display:none}',
    ])
  })

  it('staggers the slap in reading order, over the same span however many stickers there are', () => {
    const steps = ORDER.map((id) => /--i:(\d+)/.exec(rulesFor(desktopCss, id)[0] ?? '')?.[1])

    expect(steps).toEqual(['0', '10', '20'])
    expect(phoneCss).not.toContain('--i')
    expect(wideCss).not.toContain('--i')
  })

  it('lands a late sticker after all the others, without moving when they land', () => {
    const place = { x: 0, y: 0, r: 0, z: 1 }
    const all = { name: place, pill: place, bolt: place, button: place }
    const withLate = toCss(
      { order: [...ORDER, 'button'], wide: all, desktop: all, phone: all, late: ['button'] },
      FRAME,
    )
    const steps = [...ORDER, 'button'].map(
      (id) => new RegExp(`\\[data-sticker="${id}"\\]\\{[^}]*--i:(\\d+)`).exec(withLate)?.[1],
    )

    expect(steps).toEqual(['0', '10', '20', '20'])
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

  it('stops the wide artboard growing where the sections stop, and centres it on the lid', () => {
    expect(wideCss).toContain(
      '[data-lid-pile]{font-size:min(calc(100cqw / 110),calc(1440px / 110));height:108em;max-width:1440px;margin-inline:auto}',
    )
    expect(desktopCss).not.toContain('max-width')
    expect(phoneCss).not.toContain('margin-inline')
  })

  it('is a plain stylesheet: no markup and no style attributes', () => {
    expect(css).not.toMatch(/<|style=/)
  })

  it('gives one sticker a rule with no stagger to divide by', () => {
    const name = { name: { x: 0, y: 0, r: 0, z: 1 } }
    const single = toCss({ order: ['name'], wide: name, desktop: name, phone: name }, FRAME)

    expect(single).toContain('[data-sticker="name"]{left:0em;top:0em;rotate:0deg;z-index:1;--i:0}')
  })

  it.each(['wide', 'desktop', 'phone'] as const)(
    'fails loudly when a sticker in the order has no placement: %s',
    (missing) => {
      const place = { name: { x: 0, y: 0, r: 0, z: 1 }, pill: { x: 0, y: 0, r: 0, z: 1 } }
      const broken = { order: ['name', 'pill'], wide: place, desktop: place, phone: place }

      expect(() => toCss({ ...broken, [missing]: { name: place.name } }, FRAME)).toThrow(/pill/)
    },
  )
})
