import { expect, type Page, test } from '@playwright/test'

import { content, stats } from '../src/content'
import { MAX_WIDTH_PX, MIN_TEXT_PX, NARROW_PHONE_PX } from '../src/features/lid/placement/artboards'
import { flattenStickers, linksOf } from '../src/features/lid/stickerSpecs'
import { lidStickers, STICKER_IDS } from '../src/features/lid/stickers'
import { diffScreenshots } from './pixelDiff'
import { collectRequests, lidLinks, openLid } from './support'

const WIDTHS = [1280, 728, 390] as const
const MIN_TARGET_PX = 24
const MIN_OUTLINE_PX = 2
const WEB_FONTS = ['Bowlby One', 'Bricolage Grotesque', 'Permanent Marker'] as const

const stickers = flattenStickers(lidStickers(content, stats))
const hrefs = stickers.flatMap(linksOf)

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
      const missed = await links.evaluateAll((elements) =>
        elements.flatMap((link) => {
          link.scrollIntoView({ block: 'center' })
          const box = link.getBoundingClientRect()
          const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
          return link.contains(hit) ? [] : [link.getAttribute('href')]
        }),
      )
      expect(missed).toEqual([])
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
    while (visited.length < hrefs.length) {
      await page.keyboard.press('Tab')
      visited.push(await page.evaluate(() => (document.activeElement as HTMLAnchorElement).href))
    }

    expect(visited).toEqual(hrefs.map((href) => resolved(href, baseURL)))
    expect(visited.slice(0, 5).map((href) => new URL(href).hash)).toEqual([
      '#organized',
      '#wins',
      '#talks',
      '#projects',
      '',
    ])
  })

  test('focus ring is visible on every link, in a colour that shows', async ({ page }) => {
    await openLid(page, 728)

    for (const href of hrefs) {
      await page.keyboard.press('Tab')
      const focused = page.locator(':focus')
      const outline = await focused.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          width: Number.parseFloat(style.outlineWidth),
          style: style.outlineStyle,
          colour: style.outlineColor,
          lid: getComputedStyle(element.closest('[data-lid]') ?? element).backgroundColor,
        }
      })
      expect(outline.width, href).toBeGreaterThanOrEqual(MIN_OUTLINE_PX)
      expect(outline.style, href).toBe('solid')
      expect(outline.colour, href).not.toBe(outline.lid)
      await expect(focused, href).toBeInViewport()
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

  test('all content is present with JavaScript disabled', async ({ browser, page }) => {
    await openLid(page, 728)
    const withScripts = await page.screenshot({ fullPage: true, animations: 'disabled' })

    const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' })
    const plain = await context.newPage()
    await plain.setViewportSize({ width: 728, height: 900 })
    await plain.goto('/')

    await expect(plain.getByRole('heading', { level: 1 })).toHaveText(content.profile.name)
    await expect(plain.locator('[data-sticker]')).toHaveCount(STICKER_IDS.length)
    await expect(plain.getByRole('main').getByRole('link')).toHaveCount(hrefs.length)
    await expect(plain.getByText(content.profile.role.title)).toBeVisible()
    await expect(plain.getByRole('img', { name: /smiling/ })).toBeVisible()

    const withoutScripts = await plain.screenshot({ fullPage: true, animations: 'disabled' })
    const { ratio } = await diffScreenshots(page, withScripts, withoutScripts)
    expect(ratio).toBe(0)
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

  test('makes zero script requests and no third-party requests', async ({ page, baseURL }) => {
    const requests = collectRequests(page)

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const origin = new URL(baseURL ?? '').origin
    const scripts = requests().filter((request) => request.resourceType() === 'script')
    const foreign = requests().filter((request) => new URL(request.url()).origin !== origin)
    expect(scripts.map((request) => request.url())).toEqual([])
    expect(foreign.map((request) => request.url())).toEqual([])
    await expect(page.locator('script:not([type="application/ld+json"])')).toHaveCount(0)
    await expect(page.locator('[style]')).toHaveCount(0)
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
