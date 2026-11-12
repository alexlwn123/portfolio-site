import { expect, type Page, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { lidNotes, NOTED_IDS } from '../src/features/lid/notes'
import {
  MAX_ARTBOARD_WIDTH_PX,
  MIN_TEXT_PX,
  NARROW_PHONE_PX,
  PHONE_MAX_WIDTH_PX,
  WIDE_MIN_WIDTH_PX,
} from '../src/features/lid/placement/artboards'
import { pileAnchor } from '../src/features/lid/anchor'
import { flattenStickers, linksOf } from '../src/features/lid/stickerSpecs'
import { lidStickers, STICKER_IDS } from '../src/features/lid/stickers'
import { sectionAnchor } from '../src/features/sections/sectionIds'
import { NAME_ADVANCES } from '../src/features/stickers/geometry/nameFace'
import { diffScreenshots, type Region } from './pixelDiff'
import {
  boxOf,
  collectRequests,
  lidLinks,
  linksCoveredBy,
  linksNotUnderTheirOwnCentre,
  openCover,
  openLid,
  sticker,
} from './support'

/** One width for each arrangement: the wide artboard, the mockup's and the phone's. */
const WIDTHS = [1440, 728, 390] as const
/**
 * Where the lid is checked for spilling: the narrowest phone and the widest
 * screen, each arrangement, and both sides of both breakpoints.
 */
const EVERY_WIDTH = [
  320,
  NARROW_PHONE_PX,
  390,
  PHONE_MAX_WIDTH_PX,
  PHONE_MAX_WIDTH_PX + 1,
  728,
  WIDE_MIN_WIDTH_PX - 1,
  WIDE_MIN_WIDTH_PX,
  MAX_ARTBOARD_WIDTH_PX,
  1920,
  2560,
] as const
/** Where the wide artboard's unit is smallest, where it stops growing, and well past that. */
const WIDE_WIDTHS = [WIDE_MIN_WIDTH_PX, MAX_ARTBOARD_WIDTH_PX, 2560] as const
/** The shortest phone the cover is drawn for: there its unit comes from the height. */
const SHORT_PHONE = { width: NARROW_PHONE_PX, height: 640 } as const
const LAPTOP = { width: 1440, height: 900 } as const
const MIN_TARGET_PX = 24
const MIN_OUTLINE_PX = 2
const WEB_FONTS = ['Bowlby One', 'Bricolage Grotesque', 'Permanent Marker'] as const

/** The buttons the script shows on a desktop. "Tilt me" is for touch screens only. */
const SHOWN_CONTROLS = ['sound', 'tidy'] as const
/**
 * The last of the badge's ribbons. Each of the others is meant to lie over
 * the one below it, so only this one is held to covering no link at all.
 */
const LAST_RIBBON = `nav a[href="${sectionAnchor('patents')}"]`
/** A sticker's shadow falls this far outside its box: see e2e/lid-visual.spec.ts. */
const SHADOW = { top: 3, side: 6, bottom: 12 } as const
/** The ribbon is probed on a grid of this many points a side. */
const SAMPLES_PER_SIDE = 12

const stickers = flattenStickers(lidStickers(content, stats))
const hrefs = stickers.flatMap(linksOf)
const notes = lidNotes(content)
/** The links inside the notes. They can be reached only while their note is out. */
const noteHrefs = NOTED_IDS.flatMap((id) => notes[id].links.map(({ href }) => href))
/** Every stop of the Tab key with the script running: each link, each peeling corner, each button. */
const TAB_STOPS = hrefs.length + NOTED_IDS.length + SHOWN_CONTROLS.length

/** The address the browser reports for an href as written in the markup. */
function resolved(href: string, baseURL: string | undefined): string {
  return new URL(href, baseURL).href
}

test.describe('the lid', () => {
  test('the name is the only h1', async ({ page }) => {
    await openLid(page, 728)

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(content.profile.name)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(content.profile.name)
    await expect(page.locator('h1 a, a h1')).toHaveCount(0)
    await expect(page.getByRole('main')).toHaveCount(1)
  })

  for (const width of WIDTHS) {
    test(`every link's centre hit-tests to itself at ${String(width)} wide`, async ({ page }) => {
      await openLid(page, width)
      const links = lidLinks(page)

      await expect(links).toHaveCount(hrefs.length)
      expect(await linksNotUnderTheirOwnCentre(page)).toEqual([])
    })

    test(`the last ribbon covers no other link at ${String(width)} wide`, async ({ page }) => {
      await openLid(page, width)

      const covered = await linksCoveredBy(page, [LAST_RIBBON], SAMPLES_PER_SIDE)
      expect(covered).toEqual([])
    })
  }

  for (const width of EVERY_WIDTH) {
    test(`nothing spills out sideways at ${String(width)} wide`, async ({ page }) => {
      await openLid(page, width)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })

    test(`the lid runs from edge to edge at ${String(width)} wide`, async ({ page }) => {
      await openLid(page, width)

      const lid = await frameOf(page, '[data-lid]')
      expect(lid.left).toBe(0)
      expect(lid.top).toBe(0)
      expect(lid.width).toBe(width)
      expect(lid.radius).toBe('0px')
      expect(lid.padding).toBe('0px')
      expect(lid.margin).toBe('0px')
      expect(lid.maxWidth).toBe('none')
      // Whatever shows when the page is pulled past its top is the lid's own colour.
      expect(lid.pageColour).toBe(lid.colour)
    })
  }

  test('the lid, the strap and the first section meet with nothing between them', async ({
    page,
  }) => {
    await openLid(page, LAPTOP.width)

    const edges = await page.evaluate(() =>
      ['[data-lid]', '[data-pinned-strap]', '[data-section]'].map((selector) => {
        const { top, bottom, left, right } = document
          .querySelector(selector)
          ?.getBoundingClientRect() ?? { top: -1, bottom: -1, left: -1, right: -1 }
        return { top: top + window.scrollY, bottom: bottom + window.scrollY, left, right }
      }),
    )
    const [lid, strap, section] = edges

    expect(strap?.top).toBeCloseTo(lid?.bottom ?? -1, 1)
    expect(section?.top).toBeCloseTo(strap?.bottom ?? -1, 1)
    for (const edge of edges) {
      expect(edge.left).toBe(0)
      expect(edge.right).toBe(LAPTOP.width)
    }
  })

  test('bringing a sticker into view scrolls the page, never the lid itself', async ({ page }) => {
    for (const width of WIDTHS) {
      await openLid(page, width)
      // Stickers overhang the lid's edges, and focus or a link to one brings it into view.
      const shifted = await page.locator('[data-lid]').evaluate((lid) =>
        [...lid.querySelectorAll('[data-sticker]')].flatMap((element) => {
          element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' })
          const moved = lid.scrollTop !== 0 || lid.scrollLeft !== 0
          lid.scrollTo(0, 0)
          return moved ? [element.getAttribute('data-sticker')] : []
        }),
      )
      expect(shifted, `${String(width)}px`).toEqual([])
    }
  })

  test('tab order follows reading order', async ({ page, baseURL }) => {
    await openLid(page, 728)

    const visited: string[] = []
    while (visited.length < TAB_STOPS) {
      await page.keyboard.press('Tab')
      visited.push(
        await page.evaluate(() => {
          const stop = document.activeElement
          const name = stop?.getAttribute('aria-label') ?? stop?.textContent.trim() ?? ''
          return stop instanceof HTMLAnchorElement ? stop.href : `button: ${name}`
        }),
      )
    }
    const links = visited.filter((stop) => !stop.startsWith('button: '))

    expect(links).toEqual(hrefs.map((href) => resolved(href, baseURL)))
    // The ribbons in the order of the page, the cue down to the pile, then the plain CV and
    // the employers' tags.
    expect(links.slice(0, 9).map((href) => new URL(href).hash)).toEqual([
      '#work',
      '#wins',
      '#projects',
      '#organized',
      '#talks',
      '#patents',
      '#pile',
      '',
      '#work',
    ])
    // Each peeling corner comes straight after the face of its own sticker.
    for (const id of NOTED_IDS) {
      const corner = visited.indexOf(`button: Peel back ${notes[id].title}`)
      const face = await sticker(page, id)
        .locator('a')
        .first()
        .evaluate((link: HTMLAnchorElement) => link.href)
      expect(visited[corner - 1], id).toBe(face)
    }
    // The buttons that work the lid come last, after everything there is to read.
    expect(visited.slice(-SHOWN_CONTROLS.length)).toEqual([
      'button: Sound',
      'button: Reset stickers',
    ])
  })

  test('focus ring is visible on every link and button, in a colour that shows', async ({
    page,
  }) => {
    await openLid(page, 728)

    for (let stop = 0; stop < TAB_STOPS; stop += 1) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      const outline = await focused.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          name: element.getAttribute('href') ?? element.getAttribute('aria-label') ?? '',
          width: Number.parseFloat(style.outlineWidth),
          style: style.outlineStyle,
          colour: style.outlineColor,
          lid: getComputedStyle(element.closest('[data-lid]') ?? element).backgroundColor,
        }
      })
      expect(outline.width, outline.name).toBeGreaterThanOrEqual(MIN_OUTLINE_PX)
      expect(outline.style, outline.name).toBe('solid')
      expect(outline.colour, outline.name).not.toBe(outline.lid)
      await expect(focused, outline.name).toBeInViewport()
    }
  })

  test('keyboard focus lifts a sticker exactly as the pointer does', async ({ page }) => {
    await openLid(page, 728)
    const tag = page.locator('[data-sticker="cv"]')
    // What lifts is the sticker's face. The sticker keeps its place (see hover.spec.ts).
    const lifted = (): Promise<{ translate: string; scale: string; lift: string }> =>
      tag.evaluate((element) => {
        const face = element.querySelector(':scope > [data-sticker-face]')
        const { translate, scale } = getComputedStyle(face ?? element)
        return { translate, scale, lift: getComputedStyle(element).getPropertyValue('--lift') }
      })

    const atRest = await lifted()
    await tag.hover()
    const hovered = await lifted()
    await page.mouse.move(0, 0)
    await tag.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    const focused = await lifted()

    expect(hovered.translate).not.toBe(atRest.translate)
    expect(hovered.lift.trim()).toBe('1')
    expect(focused).toEqual(hovered)
  })

  test('is the same lid with JavaScript disabled, the two buttons aside', async ({
    browser,
    page,
  }) => {
    const screen = { width: 728, height: 900 }
    await openCover(page, screen)
    const pileHeight = Math.ceil((await boxOf(page.locator('[data-lid-pile]'))).height)
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
    const plain = await context.newPage()
    await plain.setViewportSize(screen)
    await plain.goto('/')

    await expect(plain.getByRole('heading', { level: 1 })).toHaveText(content.profile.name)
    await expect(plain.locator('[data-sticker]')).toHaveCount(STICKER_IDS.length)
    await expect(plain.locator('[data-lid]').getByText(content.profile.role.title)).toBeVisible()
    await expect(plain.getByRole('img', { name: /smiling/ })).toBeVisible()
    // Nothing that needs the script is offered without it.
    await expect(plain.getByRole('button')).toHaveCount(0)
    await expect(plain.locator('[data-lid][data-enhanced]')).toHaveCount(0)
    // The notes are in the page all the same: tucked out of sight, and read out.
    await expect(plain.locator('[data-lid]').getByRole('link')).toHaveCount(
      hrefs.length + noteHrefs.length,
    )
    await expect(plain.locator('[data-note]')).toHaveCount(NOTED_IDS.length)
    await expect(sticker(plain, 'pleb-fm').locator('[data-note]')).toContainText(
      notes['pleb-fm'].lines[0] ?? '',
    )

    // The cover is the first screen: photographed as each window shows it.
    const covers = await diffScreenshots(
      page,
      await page.screenshot({ animations: 'disabled' }),
      await plain.screenshot({ animations: 'disabled' }),
      [],
      [],
    )
    expect(covers.ratio).toBe(0)

    // The pile: each page is opened at it, in a window as tall as it is, so it fills the screen.
    const window = { width: screen.width, height: pileHeight }
    for (const each of [page, plain]) {
      await each.setViewportSize(window)
      await each.goto(pileAnchor())
    }
    await page.evaluate(() => document.fonts.ready)
    const buttons = await Promise.all(SHOWN_CONTROLS.map((id) => shadowedBox(page, id)))
    const piles = await diffScreenshots(
      page,
      await page.screenshot({ animations: 'disabled' }),
      await plain.screenshot({ animations: 'disabled' }),
      [],
      buttons,
    )
    expect(piles.height).toBe(pileHeight)
    expect(piles.ratio).toBe(0)
    expect(piles.excluded).toBeGreaterThan(0)
    await context.close()
  })

  test('without JavaScript, a note comes out when the keyboard reaches one of its links', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
    const plain = await context.newPage()
    await plain.setViewportSize({ width: 728, height: 900 })
    await plain.goto('/')
    const note = sticker(plain, 'pleb-fm').locator('[data-note]')
    const tucked = await note.boundingBox()

    await sticker(plain, 'pleb-fm').locator('a').first().focus()
    await plain.keyboard.press('Tab')

    await expect(note.locator(':focus')).toHaveCount(1)
    await expect(note).toBeInViewport()
    const out = await note.boundingBox()
    // Tucked, it is a single pixel, turned with its sticker.
    expect(tucked?.width).toBeLessThan(2)
    expect(out?.width).toBeGreaterThan(150)
    expect(out?.height).toBeGreaterThan(80)
    await expect(note.getByText(notes['pleb-fm'].title, { exact: true })).toBeVisible()
    await context.close()
  })

  test('moves when motion is welcome', async ({ page }) => {
    await page.goto('/')

    const running = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => animation.playState === 'running').length,
    )
    expect(running).toBeGreaterThan(0)
  })

  test('reduced motion leaves no running animations', async ({ page }) => {
    await openLid(page, 728)

    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)

    await page.locator('[data-sticker="latest-win"]').hover()
    const afterHover = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => animation.playState === 'running').length,
    )
    expect(afterHover).toBe(0)
  })

  for (const width of [NARROW_PHONE_PX, ...WIDE_WIDTHS]) {
    test(`no rendered text under ${String(MIN_TEXT_PX)}px at ${String(width)} wide`, async ({
      page,
    }) => {
      await openLid(page, width)

      const sizes = await smallestText(page)

      expect(sizes.length).toBeGreaterThan(stickers.length)
      expect(sizes.filter(({ px }) => px < MIN_TEXT_PX)).toEqual([])
    })
  }

  test(`no rendered text under ${String(MIN_TEXT_PX)}px on a phone as short as it is narrow`, async ({
    page,
  }) => {
    await openCover(page, SHORT_PHONE)

    const sizes = await smallestText(page)

    expect(sizes.length).toBeGreaterThan(stickers.length)
    expect(sizes.filter(({ px }) => px < MIN_TEXT_PX)).toEqual([])
  })

  test(`every link is a target of ${String(MIN_TARGET_PX)}px or more on a phone`, async ({
    page,
  }) => {
    await openLid(page, NARROW_PHONE_PX)

    const small = await lidLinks(page).evaluateAll(
      (links, minimum) =>
        links.flatMap((link) => {
          const { width, height } = link.getBoundingClientRect()
          return width < minimum || height < minimum ? [link.getAttribute('href')] : []
        }),
      MIN_TARGET_PX,
    )
    expect(small).toEqual([])
  })

  test('draws every glyph from a typeface the site ships', async ({ page }) => {
    await openLid(page, 728)

    const families = await platformFonts(page)

    expect(families.length).toBeGreaterThan(0)
    for (const family of families) {
      expect(WEB_FONTS.some((font) => family.startsWith(font))).toBe(true)
    }
  })

  test('sets each letter of the name as wide as the browser draws it', async ({ page }) => {
    await openLid(page, 1280)

    const drawn = await page.locator('h1 defs text').evaluateAll((letters) =>
      letters.map((letter) => ({
        letter: letter.textContent.trim().toUpperCase(),
        size: Number(letter.getAttribute('font-size')),
        length: (letter as SVGTextElement).getComputedTextLength(),
      })),
    )

    expect(drawn.map(({ letter }) => letter).join('')).toBe(
      content.profile.name.replaceAll(' ', '').toUpperCase(),
    )
    for (const { letter, size, length } of drawn) {
      expect(length / size, letter).toBeCloseTo(NAME_ADVANCES[letter] ?? Number.NaN, 2)
    }
  })

  test('loads one script of its own, and nothing from anyone else', async ({ page, baseURL }) => {
    const requests = collectRequests(page)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const origin = new URL(baseURL ?? '').origin
    const scripts = requests().filter((request) => request.resourceType() === 'script')
    const foreign = requests().filter((request) => new URL(request.url()).origin !== origin)
    expect(scripts).toHaveLength(1)
    expect(new URL(scripts[0]?.url() ?? '').pathname).toMatch(/^\/_astro\/.+\.js$/)
    expect(foreign.map((request) => request.url())).toEqual([])
    await expect(page.locator('script[src]')).toHaveCount(1)
    await expect(page.locator('script[src]')).toHaveAttribute('type', 'module')
    await expect(page.locator('script:not([src]):not([type="application/ld+json"])')).toHaveCount(0)
    // The markup carries no style attribute. The script writes custom properties, and only those.
    const markup = await (await page.request.get('/')).text()
    expect(markup).not.toMatch(/\sstyle=/)
    const written = await page
      .locator('[style]')
      .evaluateAll((elements) => elements.flatMap((element) => [...(element as HTMLElement).style]))
    expect(written.filter((name) => !name.startsWith('--'))).toEqual([])
  })

  test('serves the photo as AVIF or WebP, never as an inline blob', async ({ page }) => {
    await openLid(page, 728)

    const photo = page.getByRole('img', { name: /smiling/ })
    const source = await photo.evaluate((image: HTMLImageElement) => image.currentSrc)
    expect(new URL(source).pathname).toMatch(/^\/_astro\/.+\.(avif|webp)$/)
    expect(await photo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
    expect(await page.content()).not.toContain('data:image')
  })
})

interface Frame {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly radius: string
  readonly padding: string
  readonly margin: string
  readonly maxWidth: string
  readonly colour: string
  readonly pageColour: string
}

/** Where an element's box is, and everything that could put a frame round it. */
async function frameOf(page: Page, selector: string): Promise<Frame> {
  return page.locator(selector).evaluate((element) => {
    const { left, top, width } = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      left,
      top: top + window.scrollY,
      width,
      radius: style.borderRadius,
      padding: style.padding,
      margin: style.margin,
      maxWidth: style.maxWidth,
      colour: style.backgroundColor,
      pageColour: getComputedStyle(document.body).backgroundColor,
    }
  })
}

/** A sticker's box on the screen with the room its shadow takes, as a region to leave out of a picture of the screen. */
async function shadowedBox(page: Page, id: string): Promise<Region> {
  return sticker(page, id).evaluate(
    (element, { name, shadow }) => {
      const { left, top, right, bottom } = element.getBoundingClientRect()
      return {
        name,
        left: left - shadow.side,
        top: top - shadow.top,
        right: right + shadow.side,
        bottom: bottom + shadow.bottom,
      }
    },
    { name: id, shadow: SHADOW },
  )
}

/** Every piece of rendered text with the size it is actually drawn at. */
async function smallestText(page: Page): Promise<readonly { text: string; px: number }[]> {
  return page.getByRole('main').evaluate((main) => {
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT)
    const found: { text: string; px: number }[] = []
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement
      const text = node.nodeValue?.trim() ?? ''
      if (!element || text === '' || element.closest('defs')) {
        continue
      }
      // An SVG's text is sized in the drawing's own units, so scale it to the screen.
      const matrix = element instanceof SVGGraphicsElement ? element.getScreenCTM() : null
      const scale = matrix ? Math.hypot(matrix.a, matrix.b) : 1
      const rendered = element.getClientRects().length > 0
      if (rendered) {
        found.push({ text, px: Number.parseFloat(getComputedStyle(element).fontSize) * scale })
      }
    }
    return found
  })
}

interface DomNode {
  readonly nodeId: number
  readonly nodeType: number
  readonly nodeName: string
  readonly nodeValue: string
  readonly children?: readonly DomNode[]
}

const TEXT_NODE = 3

/** The elements under a node that hold text of their own, by id. */
function textHolders(node: DomNode, inMain = false): readonly number[] {
  const within = inMain || node.nodeName === 'MAIN'
  const children = node.children ?? []
  const holdsText = children.some(
    (child) => child.nodeType === TEXT_NODE && child.nodeValue.trim() !== '',
  )
  return [
    ...(within && holdsText ? [node.nodeId] : []),
    ...children.flatMap((child) => textHolders(child, within)),
  ]
}

/** The font families Chromium actually used for the lid's text, system fallbacks included. */
async function platformFonts(page: Page): Promise<readonly string[]> {
  const client = await page.context().newCDPSession(page)
  await client.send('DOM.enable')
  await client.send('CSS.enable')
  const { root } = await client.send('DOM.getDocument', { depth: -1 })
  const used = await Promise.all(
    textHolders(root).map((nodeId) => client.send('CSS.getPlatformFontsForNode', { nodeId })),
  )
  return [...new Set(used.flatMap(({ fonts }) => fonts.map(({ familyName }) => familyName)))]
}
