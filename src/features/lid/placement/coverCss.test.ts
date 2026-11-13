import { describe, expect, it } from 'vitest'

import type { Frame } from './artboards'
import { coverCss } from './coverCss'
import type { CoverLayout } from './schema'

const FRAME: Frame = {
  containerName: 'lid',
  phoneMaxWidthPx: 560,
  wideMinWidthPx: 1100,
  maxArtboardWidthPx: 1440,
  portraitMaxAspect: '9/10',
  gutters: { wide: 50, desktop: 30, phone: 16 },
  wide: { width: 1100, height: 800 },
  desktop: { width: 728, height: 1200 },
  phone: { width: 390, height: 2000 },
  covers: {
    wide: { board: 'wide', height: 620, floorPx: 10, capPx: 14.4 },
    landscape: { board: 'desktop', height: 546, floorPx: 10 },
    portrait: { board: 'desktop', height: 880, floorPx: 10 },
    phone: { board: 'phone', height: 693, floorPx: 9.2308, trail: 988 },
  },
}

const ORDER = ['name', 'badge', 'cue'] as const

const landscape: CoverLayout = {
  name: { from: 'left', against: 'middle', x: 4, y: -246, w: 590, r: -4, z: 6 },
  badge: { from: 'right', against: 'top', x: -12, y: -150, w: 260, r: 0, z: 9 },
  cue: { from: 'right', against: 'bottom', x: 276, y: 34, w: 176, r: -3, z: 4 },
}
const upright: CoverLayout = {
  name: { from: 'left', against: 'top', x: -6, y: 12, w: 370, r: -4, z: 6 },
  badge: { from: 'right', against: 'top', x: -12, y: 90, w: 260, r: 0, z: 9 },
  cue: { from: 'left', against: 'bottom', x: 2, y: 26, r: -4, z: 4 },
}

const css = coverCss(
  {
    order: ORDER,
    layouts: { wide: landscape, landscape, portrait: upright, phone: upright },
  },
  FRAME,
)

const PHONE = '@container lid (max-width:560px){'
const TABLET = '@container lid (not (max-width:560px)) and (not (min-width:1100px)){'
const WIDE = '@container lid (min-width:1100px){'
const PORTRAIT = '@media (max-aspect-ratio:9/10){'
const LANDSCAPE = '@media not all and (max-aspect-ratio:9/10){'

/** The stylesheet between one opening line and the next. */
function between(from: string, to: string | null): string {
  const start = css.indexOf(from)
  const end = to === null ? css.length : css.indexOf(to)
  if (start < 0 || end < 0) {
    throw new Error(`The stylesheet has no "${from}"`)
  }
  return css.slice(start, end)
}

const phoneCss = between(PHONE, TABLET)
const portraitCss = between(PORTRAIT, LANDSCAPE)
const landscapeCss = between(LANDSCAPE, WIDE)
const wideCss = between(WIDE, null)

describe('coverCss', () => {
  it('has four compositions, each in a query of its own, and no rule outside one', () => {
    expect(css.startsWith(PHONE)).toBe(true)
    expect(css.match(/@container/g)).toHaveLength(3)
    expect(css.match(/@media/g)).toHaveLength(2)
    for (const sheet of [phoneCss, portraitCss, landscapeCss, wideCss]) {
      for (const id of ORDER) {
        expect(sheet.split(`[data-sticker="${id}"]{`), id).toHaveLength(2)
      }
    }
  })

  it('picks exactly one at any width: a tablet is whatever is neither a phone nor a laptop', () => {
    expect(css).toContain(TABLET)
    expect(css.indexOf(PORTRAIT)).toBeGreaterThan(css.indexOf(TABLET))
    expect(css.indexOf(LANDSCAPE)).toBeLessThan(css.indexOf(WIDE))
  })

  it('takes the cover’s unit from the smaller of the width and the height', () => {
    expect(landscapeCss).toContain(
      'font-size:min(calc(100cqw / 72.8),max(10px,calc(100svh / 54.6)))',
    )
    expect(portraitCss).toContain('font-size:min(calc(100cqw / 72.8),max(10px,calc(100svh / 88)))')
    expect(phoneCss).toContain('font-size:min(calc(100cqw / 39),max(9.23px,calc(100svh / 69.3)))')
  })

  it('stops the laptop’s unit growing at its cap', () => {
    expect(wideCss).toContain(
      'font-size:min(calc(100cqw / 110),max(10px,calc(100svh / 62)),14.4px)',
    )
  })

  it('gives a browser without the small viewport height the large one, in a query of its own', () => {
    const older = '@supports not (height:100svh){'
    const [, fallback = ''] = wideCss.split(older)
    const [rule = ''] = fallback.split('}')

    expect(css.split(older)).toHaveLength(5)
    expect(rule).toBe(
      '\n[data-lid-cover]{font-size:min(calc(100cqw / 110),max(10px,calc(100vh / 62)),14.4px)',
    )
    // Never two declarations of one property in one rule: a minifier keeps only the last.
    for (const body of css.match(/\{[^{}]*\}/g) ?? []) {
      expect(body.match(/font-size:/g) ?? []).not.toHaveLength(2)
      expect(body.match(/margin-top:/g) ?? []).not.toHaveLength(2)
    }
  })

  it('never lets the cover be shorter than its composition', () => {
    expect(wideCss).toContain('min-height:62em')
    expect(landscapeCss).toContain('min-height:54.6em')
    expect(portraitCss).toContain('min-height:88em')
    expect(phoneCss).toContain('min-height:69.3em')
  })

  it('sets the cover in the page’s column, which stops growing where the sections’ does', () => {
    expect(wideCss).toContain('[data-lid-board]{width:min(90.909cqw,1309.09px)}')
    expect(landscapeCss).toContain('[data-lid-board]{width:91.758cqw}')
    expect(portraitCss).toContain('[data-lid-board]{width:91.758cqw}')
    expect(phoneCss).toContain('[data-lid-board]{width:91.795cqw}')
  })

  it('measures a placement in from the edge of the column it names', () => {
    expect(wideCss).toContain(
      '[data-sticker="name"]{left:0.4em;top:calc(50% + -24.6em);width:59em;rotate:-4deg;z-index:6}',
    )
    expect(wideCss).toContain(
      '[data-sticker="badge"]{right:-1.2em;top:-15em;width:26em;rotate:0deg;z-index:9}',
    )
  })

  it('measures it down from the top or the middle of the screen, or up from the bottom', () => {
    expect(phoneCss).toContain('[data-sticker="name"]{left:-0.6em;top:1.2em;')
    expect(wideCss).toContain('[data-sticker="cue"]{right:27.6em;bottom:3.4em;width:17.6em;')
    expect(phoneCss).toContain('[data-sticker="cue"]{left:0.2em;bottom:2.6em;rotate:-4deg;')
  })

  it('makes the pile wait under the ribbons where the design says they trail past the screen', () => {
    const unit = 'min(calc(100cqw / 39),max(9.23px,calc(100svh / 69.3)))'

    expect(phoneCss).toContain(
      `margin-top:max(0px,min(calc(${unit} * 98.8 - 100svh),calc(${unit} * 29.5)))`,
    )
    expect(phoneCss.match(/margin-top:/g)).toHaveLength(2)
    expect(phoneCss).toContain(`calc(${unit.replace('svh', 'vh')} * 98.8 - 100vh)`)
    expect(wideCss).not.toContain('margin-top')
    expect(landscapeCss).not.toContain('[data-lid-pile]')
    expect(portraitCss).not.toContain('[data-lid-pile]')
  })

  it('is a plain stylesheet: no markup and no style attributes', () => {
    expect(css).not.toMatch(/<|style=/)
  })

  it('fails loudly when a sticker in the order has no placement', () => {
    const missing = Object.fromEntries(Object.entries(landscape).filter(([id]) => id !== 'cue'))
    const layouts = { wide: missing, landscape, portrait: upright, phone: upright }

    expect(() => coverCss({ order: ORDER, layouts }, FRAME)).toThrow(/cue/)
  })
})
