import { afterEach, describe, expect, it, vi } from 'vitest'

import { lidFixture } from '../../../test/lidFixture'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('the home page’s script', () => {
  it('enhances the lid it finds, with what this browser can do', async () => {
    const { lid, control } = lidFixture()
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: () => undefined }))

    await import('./lid.client')

    expect(lid).toHaveAttribute('data-enhanced')
    expect(control('sound')).not.toHaveAttribute('hidden')
    expect(control('tidy')).not.toHaveAttribute('hidden')
  })

  it('leaves the lid as it was in a browser it cannot work in, and throws nothing', async () => {
    const { lid, control } = lidFixture()
    vi.stubGlobal('matchMedia', undefined)

    await expect(import('./lid.client')).resolves.toBeDefined()

    expect(lid).not.toHaveAttribute('data-enhanced')
    expect(control('tidy')).toHaveAttribute('hidden')
  })
})
