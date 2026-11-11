import { mkdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { Locator, Page, Route } from '@playwright/test'

const ROOT = resolve(import.meta.dirname, '..')
const MOCKUP_DIR = join(ROOT, 'design/mockups')
const MODULES = join(ROOT, 'node_modules')

/** Where the review screenshots and the reference images are kept. */
export const SCREENSHOT_DIR = join(ROOT, 'design/screenshots')

export const MOCKUPS = Object.freeze({
  firstScreen: '01-first-screen.html',
  wristbands: '02-wristbands.html',
} as const)

export type MockupFile = (typeof MOCKUPS)[keyof typeof MOCKUPS]

/** Any height will do: every screenshot is of the full page. */
const VIEWPORT_HEIGHT = 900

/*
 * The mockups ask Google Fonts for their typefaces. The site ships the same
 * typefaces from Fontsource, so the reference is rendered with those files:
 * the comparison then measures the port, not two builds of a font, and it
 * needs no network.
 */
const GOOGLE_FONTS_CSS = 'https://fonts.googleapis.com/**'
const FONT_HOST = 'https://fonts.gstatic.com/local/'

interface FontSheet {
  readonly packageName: string
  readonly sheet: string
  /** The family name the mockups use, when Fontsource names it differently. */
  readonly rename?: readonly [from: string, to: string]
}

const FONT_SHEETS: readonly FontSheet[] = [
  { packageName: '@fontsource/bowlby-one', sheet: 'latin-400.css' },
  { packageName: '@fontsource/permanent-marker', sheet: 'latin-400.css' },
  {
    packageName: '@fontsource-variable/bricolage-grotesque',
    sheet: 'standard.css',
    rename: ['Bricolage Grotesque Variable', 'Bricolage Grotesque'],
  },
]

async function localFontCss({ packageName, sheet, rename }: FontSheet): Promise<string> {
  const css = await readFile(join(MODULES, packageName, sheet), 'utf8')
  const pointed = css.replaceAll('url(./files/', `url(${FONT_HOST}${packageName}/files/`)
  return rename ? pointed.replaceAll(rename[0], rename[1]) : pointed
}

async function serveFontFile(route: Route): Promise<void> {
  const path = route.request().url().slice(FONT_HOST.length)
  await route.fulfill({ path: join(MODULES, path), contentType: 'font/woff2' })
}

/** Serves the mockups' font requests from node_modules. */
async function routeFonts(page: Page): Promise<void> {
  const sheets = await Promise.all(FONT_SHEETS.map(localFontCss))
  await page.route(GOOGLE_FONTS_CSS, (route) =>
    route.fulfill({ contentType: 'text/css', body: sheets.join('\n') }),
  )
  await page.route(`${FONT_HOST}**`, serveFontFile)
}

/**
 * Opens an approved mockup at a given width, with motion reduced so that its
 * script holds the foil still and nothing is mid-animation.
 */
export async function openMockup(page: Page, file: MockupFile, width: number): Promise<void> {
  await routeFonts(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height: VIEWPORT_HEIGHT })
  await page.goto(pathToFileURL(join(MOCKUP_DIR, file)).href)
  await settle(page)
}

/** Waits for the fonts and for two frames, so the first paint is the final one. */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  })
}

/**
 * A screenshot of one part of the page with every animation stopped, also
 * written to design/screenshots/. For a part of a page too long to review whole.
 */
export async function savePartScreenshot(part: Locator, name: string): Promise<Buffer> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  return part.screenshot({ path: join(SCREENSHOT_DIR, name), animations: 'disabled' })
}

/** A full-page screenshot with every animation stopped, also written to design/screenshots/. */
export async function saveScreenshot(page: Page, name: string): Promise<Buffer> {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
  return page.screenshot({
    path: join(SCREENSHOT_DIR, name),
    fullPage: true,
    animations: 'disabled',
  })
}
