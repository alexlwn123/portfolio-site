import { describe, expect, it } from 'vitest'

import { readPage } from './dist'
import { ROUTES } from './routes'

describe('the built site', () => {
  it.each(ROUTES)('emits static HTML for every route: %s', async (route) => {
    const page = await readPage(route)
    const main = page.querySelector('main')

    expect(main, `${route} has a <main>`).not.toBeNull()
    expect(main?.textContent.trim()).not.toBe('')
  })
})
