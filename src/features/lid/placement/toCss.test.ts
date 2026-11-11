import { describe, expect, it } from 'vitest'

import { HIDDEN } from './schema'
import { toCss } from './toCss'

const FRAME = {
  containerName: 'lid',
  phoneMaxWidthPx: 560,
  maxWidthPx: 1001,
  desktop: { width: 728, height: 1300 },
  phone: { width: 390, height: 1870 },
}

const ORDER = ['name', 'pill', 'bolt'] as const

const css = toCss(
  {
    order: ORDER,
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

const QUERY = '@container lid (max-width:560px)'
const [desktopCss = '', phoneCss = ''] = css.split(QUERY)

function rulesFor(sheet: string, id: string): readonly string[] {
  return sheet.split('\n').filter((line) => line.includes(`[data-sticker="${id}"]{`))
}

describe('toCss', () => {
  it('emits one rule per sticker on each layout', () => {
    for (const id of ORDER) {
      expect(rulesFor(desktopCss, id)).toHaveLength(1)
      expect(rulesFor(phoneCss, id)).toHaveLength(1)
    }
  })

  it('phone rules sit inside the container query', () => {
    expect(css.split(QUERY)).toHaveLength(2)
    expect(phoneCss.trimStart().startsWith('{')).toBe(true)
    expect(css.trimEnd().endsWith('}')).toBe(true)
    expect(desktopCss).not.toContain('34.4em')
    expect(rulesFor(phoneCss, 'name')).toEqual([
      '[data-sticker="name"]{left:0.6em;top:2.2em;width:34.4em;rotate:-4deg;z-index:6}',
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
  })

  it('lands a late sticker after all the others, without moving when they land', () => {
    const place = { x: 0, y: 0, r: 0, z: 1 }
    const withLate = toCss(
      {
        order: [...ORDER, 'button'],
        desktop: {
          name: place,
          pill: place,
          bolt: place,
          button: place,
        },
        phone: { name: place, pill: place, bolt: place, button: place },
        late: ['button'],
      },
      FRAME,
    )
    const steps = [...ORDER, 'button'].map(
      (id) => new RegExp(`\\[data-sticker="${id}"\\]\\{[^}]*--i:(\\d+)`).exec(withLate)?.[1],
    )

    expect(steps).toEqual(['0', '10', '20', '20'])
  })

  it('makes the lid a named container and tells the desk its maximum width', () => {
    expect(desktopCss).toContain('[data-lid]{container:lid / inline-size}')
    expect(desktopCss).toContain('[data-lid-desk]{--lid-max-width:1001px}')
  })

  it('sizes the stage from the artboards: one em is ten units at any width', () => {
    expect(desktopCss).toContain('[data-lid-stage]{font-size:calc(100cqw / 72.8);height:130em}')
    expect(phoneCss).toContain('[data-lid-stage]{font-size:calc(100cqw / 39);height:187em}')
  })

  it('is a plain stylesheet: no markup and no style attributes', () => {
    expect(css).not.toMatch(/<|style=/)
  })

  it('gives one sticker a rule with no stagger to divide by', () => {
    const single = toCss(
      {
        order: ['name'],
        desktop: { name: { x: 0, y: 0, r: 0, z: 1 } },
        phone: { name: { x: 0, y: 0, r: 0, z: 1 } },
      },
      FRAME,
    )

    expect(single).toContain('[data-sticker="name"]{left:0em;top:0em;rotate:0deg;z-index:1;--i:0}')
  })

  it('fails loudly when a sticker in the order has no placement', () => {
    const broken = { order: ['name', 'pill'], desktop: {}, phone: {} }

    expect(() => toCss(broken, FRAME)).toThrow(/name/)
  })
})
