import type { Locator, Page, Request } from '@playwright/test'

/** Reads what a collector has gathered so far. */
export type Collected<T> = () => readonly T[]

/** Records every request the page makes from now on. */
export function collectRequests(page: Page): Collected<Request> {
  let requests: readonly Request[] = []
  page.on('request', (request) => {
    requests = [...requests, request]
  })
  return () => requests
}

/** Records console messages and uncaught errors from now on. */
export function collectConsole(page: Page): Collected<string> {
  let output: readonly string[] = []
  const record = (line: string): void => {
    output = [...output, line]
  }
  page.on('console', (message) => {
    record(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', (error) => {
    record(`pageerror: ${error.message}`)
  })
  return () => output
}

/** Any height will do for a lid screenshot: every one is of the full page. */
const LID_VIEWPORT_HEIGHT = 900

/**
 * Opens the home page at a given width with motion reduced, so that nothing
 * is swinging when it is measured, clicked or photographed.
 */
export async function openLid(page: Page, width: number): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height: LID_VIEWPORT_HEIGHT })
  await page.goto('/')
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((image) => image.decode()))
  })
}

/** Every link on the lid, in the order the markup has them. */
export function lidLinks(page: Page): Locator {
  return page.getByRole('main').getByRole('link')
}
