import { expect, type Page, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { cvSection } from '../src/features/lid/facts'
import { lidNotes, NOTED_IDS } from '../src/features/lid/notes'
import { MAX_WIDTH_PX, MIN_TEXT_PX, NARROW_PHONE_PX } from '../src/features/lid/placement/artboards'
import { flattenStickers, linksOf } from '../src/features/lid/stickerSpecs'
import { lidStickers, STICKER_IDS } from '../src/features/lid/stickers'
import { diffScreenshots, type Region } from './pixelDiff'
import {
  collectRequests,
  lidLinks,
  linksCoveredBy,
  linksNotUnderTheirOwnCentre,
  openLid,
  sticker,
} from './support'

const WIDTHS = [1280, 728, 390] as const
const MIN_TARGET_PX = 24
const MIN_OUTLINE_PX = 2
const WEB_FONTS = ['Bowlby One', 'Bricolage Grotesque', 'Permanent Marker'] as const

/**
 * What was stuck on after the mockup: two stickers, the fifth ribbon, and the
 * two buttons the page's script shows on every device.
 */
const ADDITIONS = [
  '[data-sticker="ncr-win"]',
  '[data-sticker="patents"]',
  `nav a[href="${cvSection('patents')}"]`,
  '[data-sticker="sound"]',
  '[data-sticker="tidy"]',
] as const
/** The buttons the script shows on a desktop. "Tilt me" is for touch screens only. */
const SHOWN_CONTROLS = ['sound', 'tidy'] as const
/** A sticker's shadow falls this far outside its box: see e2e/lid-visual.spec.ts. */
const SHADOW = { top: 3, side: 6, bottom: 12 } as const
/** Each addition is probed on a grid of this many points a side. */
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

    test(`the additions cover no other link at ${String(width)} wide`, async ({ page }) => {
      await openLid(page, width)

      const covered = await linksCoveredBy(page, ADDITIONS, SAMPLES_PER_SIDE)
      expect(covered).toEqual([])
    })

    test(`nothing spills out sideways at ${String(width)} wide`, async ({ page }) => {
      await openLid(page, width)

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

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
    expect(links.slice(0, 6).map((href) => new URL(href).hash)).toEqual([
      '#organized',
      '#wins',
      '#talks',
      '#projects',
      '#patents',
      '',
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
    expect(visited.slice(-SHOWN_CONTROLS.length)).toEqual(['button: Sound', 'button: Tidy the lid'])
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
    const lifted = (): Promise<{ translate: string; scale: string; lift: string }> =>
      tag.evaluate((element) => {
        const { translate, scale } = getComputedStyle(element)
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
    await openLid(page, 728)
    const withScripts = await page.screenshot({ fullPage: true, animations: 'disabled' })
    const buttons = await Promise.all(SHOWN_CONTROLS.map((id) => shadowedBox(page, id)))

    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
    const plain = await context.newPage()
    await plain.setViewportSize({ width: 728, height: 900 })
    await plain.goto('/')

    await expect(plain.getByRole('heading', { level: 1 })).toHaveText(content.profile.name)
    await expect(plain.locator('[data-sticker]')).toHaveCount(STICKER_IDS.length)
    await expect(plain.getByText(content.profile.role.title)).toBeVisible()
    await expect(plain.getByRole('img', { name: /smiling/ })).toBeVisible()
    // Nothing that needs the script is offered without it.
    await expect(plain.getByRole('button')).toHaveCount(0)
    await expect(plain.locator('[data-lid][data-enhanced]')).toHaveCount(0)
    // The notes are in the page all the same: tucked out of sight, and read out.
    await expect(plain.getByRole('main').getByRole('link')).toHaveCount(
      hrefs.length + noteHrefs.length,
    )
    await expect(plain.locator('[data-note]')).toHaveCount(NOTED_IDS.length)
    await expect(sticker(plain, 'pleb-fm').locator('[data-note]')).toContainText(
      notes['pleb-fm'].lines[0] ?? '',
    )

    const withoutScripts = await plain.screenshot({ fullPage: true, animations: 'disabled' })
    const { ratio, excluded } = await diffScreenshots(
      page,
      withScripts,
      withoutScripts,
      [],
      buttons,
    )
    expect(ratio).toBe(0)
    expect(excluded).toBeGreaterThan(0)
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

  test(`no rendered text under ${String(MIN_TEXT_PX)}px at ${String(NARROW_PHONE_PX)} wide`, async ({
    page,
  }) => {
    await openLid(page, NARROW_PHONE_PX)

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

  test('is capped and centred on a laptop', async ({ page }) => {
    await openLid(page, 1280)

    const box = await page.locator('[data-lid]').boundingBox()
    expect(box?.width).toBeCloseTo(MAX_WIDTH_PX, 0)
    expect((box?.x ?? 0) * 2 + (box?.width ?? 0)).toBeCloseTo(1280, 0)
    expect(box?.height).toBeLessThan(MAX_WIDTH_PX * 2)
  })

  test('draws every glyph from a typeface the site ships', async ({ page }) => {
    await openLid(page, 728)

    const families = await platformFonts(page)

    expect(families.length).toBeGreaterThan(0)
    for (const family of families) {
      expect(WEB_FONTS.some((font) => family.startsWith(font))).toBe(true)
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

/** A sticker's box on the page with the room its shadow takes, as a region to leave out. */
async function shadowedBox(page: Page, id: string): Promise<Region> {
  return sticker(page, id).evaluate(
    (element, { name, shadow }) => {
      const { left, top, right, bottom } = element.getBoundingClientRect()
      return {
        name,
        left: left - shadow.side,
        top: top + window.scrollY - shadow.top,
        right: right + shadow.side,
        bottom: bottom + window.scrollY + shadow.bottom,
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
