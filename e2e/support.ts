import type { Page, Request } from '@playwright/test'

/** Records every request the page makes from now on. Read it after loading. */
export function collectRequests(page: Page): readonly Request[] {
  const requests: Request[] = []
  page.on('request', (request) => requests.push(request))
  return requests
}

/** Records console messages and uncaught errors from now on. */
export function collectConsole(page: Page): readonly string[] {
  const output: string[] = []
  page.on('console', (message) => output.push(`${message.type()}: ${message.text()}`))
  page.on('pageerror', (error) => output.push(`pageerror: ${error.message}`))
  return output
}
