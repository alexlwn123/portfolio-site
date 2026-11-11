import type { Page, Request } from '@playwright/test'

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
